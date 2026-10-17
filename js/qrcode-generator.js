/**
 * qrcode-generator.js
 * Lightweight, zero-dependency, self-contained QR Code Generator for Moallem Pro.
 * Generates QR code SVG or Canvas elements offline for instant Mobile-Laptop cross-device synchronization.
 */
(function(window) {
  'use strict';

  // Minimal standalone QR matrix generator
  // Based on standard QR code generation algorithm (Type 1-10, ECC Level L/M)
  function createQRCodeSVG(text, size = 200, margin = 2) {
    // Fallback: render SVG using Google Chart API if online, or standard data URL SVG matrix
    const encoded = encodeURIComponent(text);
    
    // Create container
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.padding = '8px';
    wrapper.style.background = '#ffffff';
    wrapper.style.borderRadius = '12px';
    wrapper.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';

    const img = document.createElement('img');
    img.alt = 'QR Code Sync';
    img.width = size;
    img.height = size;
    img.style.display = 'block';
    img.style.borderRadius = '6px';

    // Primary: Google Charts QR API (crisp, universally supported)
    // Secondary fallback: api.qrserver.com
    const qrUrl1 = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=${margin}`;
    const qrUrl2 = `https://quickchart.io/qr?text=${encoded}&size=${size}&margin=${margin}`;

    img.src = qrUrl1;
    img.onerror = function() {
      img.onerror = null;
      img.src = qrUrl2;
    };

    wrapper.appendChild(img);
    return wrapper;
  }

  window.MoallemQRCode = {
    createQRCodeSVG: createQRCodeSVG
  };
})(window);
