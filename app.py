#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مسار المعلم | WSGI Production Server for Cloud Hosting (Render, Railway, Heroku)
Serves static frontend, assets, API endpoints, and health check.
"""
import os
from flask import Flask, send_from_directory, jsonify

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'masar_almoallem',
        'platform': 'Moallem Pro 4.0'
    }), 200

@app.route('/<path:path>')
def serve_file(path):
    # Security: do not serve sensitive files
    forbidden = ['.git', '.env', 'server_bot.log', '.system_generated', 'scratch']
    if any(path.startswith(f) for f in forbidden):
        return 'Forbidden', 403

    target_file = os.path.join(BASE_DIR, path)
    if os.path.exists(target_file) and os.path.isfile(target_file):
        return send_from_directory(BASE_DIR, path)
    # SPA fallback to index.html
    return send_from_directory(BASE_DIR, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
