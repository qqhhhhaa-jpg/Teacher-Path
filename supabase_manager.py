"""
Supabase Management & Integration Module for Masar Al-Moallem Pro 2026
Provides Auth verification, JWT validation, and central sync with Supabase.
Securely loads credentials from environment or local gitignored supabase_secrets.json.
"""
import os
import json
import urllib.request
import urllib.error
from datetime import datetime

# Load local gitignored secrets if present
_secrets_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "supabase_secrets.json")
_local_secrets = {}
if os.path.exists(_secrets_file):
    try:
        with open(_secrets_file, "r", encoding="utf-8") as f:
            _local_secrets = json.load(f)
    except Exception:
        pass

SUPABASE_URL = os.environ.get("SUPABASE_URL", _local_secrets.get("SUPABASE_URL", "https://wnzmmkhoplcmelqzjskz.supabase.co")).rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", _local_secrets.get("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_qY2-rsMI9NwR6Q2AKF4h_Q_pz-UBlVp"))
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", _local_secrets.get("SUPABASE_SECRET_KEY", ""))

def get_public_config():
    """Return safe configuration for public frontend (NEVER expose secret key)"""
    return {
        "url": SUPABASE_URL,
        "publishableKey": SUPABASE_PUBLISHABLE_KEY,
        "connected": bool(SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY)
    }

def check_connection():
    """Check connectivity to Supabase Auth & REST services"""
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/auth/v1/settings",
            headers={"apikey": SUPABASE_PUBLISHABLE_KEY}
        )
        res = urllib.request.urlopen(req, timeout=5)
        auth_ok = (res.status == 200)
    except Exception:
        auth_ok = False

    rest_ok = False
    if SUPABASE_SECRET_KEY:
        try:
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/",
                headers={
                    "apikey": SUPABASE_SECRET_KEY,
                    "Authorization": f"Bearer {SUPABASE_SECRET_KEY}"
                }
            )
            res = urllib.request.urlopen(req, timeout=5)
            rest_ok = (res.status == 200)
        except Exception:
            rest_ok = False
    else:
        rest_ok = auth_ok

    return {
        "auth": auth_ok,
        "rest": rest_ok,
        "connected": (auth_ok and rest_ok),
        "url": SUPABASE_URL,
        "timestamp": datetime.now().isoformat()
    }

def verify_jwt_token(token):
    """
    Verify Supabase JWT token by calling Supabase Auth endpoint /auth/v1/user.
    Returns user dict if valid, None if invalid.
    """
    if not token:
        return None
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_PUBLISHABLE_KEY,
                "Authorization": f"Bearer {token}"
            }
        )
        res = urllib.request.urlopen(req, timeout=6)
        if res.status == 200:
            user_data = json.loads(res.read().decode())
            return user_data
    except Exception:
        return None
    return None

def create_or_sync_supabase_user(email, password, role="teacher", user_metadata=None):
    """
    Create or update a user in Supabase Auth using Admin API (Secret Key).
    Places security-critical roles in app_metadata to avoid user tampering.
    """
    if not email:
        return None, "Email is required"
    if not SUPABASE_SECRET_KEY:
        return None, "Server Secret Key is not configured"

    clean_pwd = password or "Masar@2026!Secure"
    if len(clean_pwd) < 6 or clean_pwd.startswith('pbkdf2_'):
        clean_pwd = f"{clean_pwd}#2026" if len(clean_pwd) >= 3 else "Masar@2026!Secure"
    if len(clean_pwd) < 6:
        clean_pwd = "Masar@2026!Secure"

    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "email": email,
        "password": clean_pwd,
        "email_confirm": True,
        "app_metadata": {
            "role": role,
            "provider": "email"
        },
        "user_metadata": user_metadata or {}
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        res = urllib.request.urlopen(req, timeout=8)
        user_info = json.loads(res.read().decode())
        return user_info, None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        return None, err_msg
    except Exception as e:
        return None, str(e)

if __name__ == "__main__":
    status = check_connection()
    print("Supabase status check:", status)
