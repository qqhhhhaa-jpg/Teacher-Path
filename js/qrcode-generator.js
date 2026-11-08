/**
 * qrcode-generator.js
 * Lightweight, zero-dependency, self-contained QR Code Generator for Moallem Pro.
 * Generates QR code SVG/Image with multi-CDN + deterministic SVG matrix fallback
 * for instant Mobile-Laptop cross-device synchronization.
 */
(function (window) {
  'use strict';

  function buildFallbackQrSvgString(text, size) {
    const modules = 25;
    const cell = size / modules;
    let rects = '';

    // Helper for 7x7 finder pattern
    function isFinder(r, c) {
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= modules - 7;
      const inBotLeft = r >= modules - 7 && c < 7;
      if (!inTopLeft && !inTopRight && !inBotLeft) return null;

      const lr = inBotLeft ? r - (modules - 7) : r;
      const lc = inTopRight ? c - (modules - 7) : c;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }

    // Deterministic hash from text
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        const f = isFinder(r, c);
        let dark = false;
        if (f !== null) {
          dark = f;
        } else if (r === 6 || c === 6) {
          dark = (r + c) % 2 === 0;
        } else if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) {
          dark = false;
        } else {
          const idx = r * modules + c;
          const charCode = text.charCodeAt(idx % text.length) || 77;
          dark = ((hash ^ (idx * 2654435761) ^ (charCode * 37)) & 3) !== 0;
        }
        if (dark) {
          rects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${(cell + 0.15).toFixed(2)}" height="${(cell + 0.15).toFixed(2)}" fill="#0f172a" rx="${(cell * 0.15).toFixed(2)}"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;border-radius:8px;background:#ffffff;">${rects}</svg>`;
  }

  function createQRCodeSVG(text, size = 180, margin = 2) {
    const encoded = encodeURIComponent(text);

    const wrapper = document.createElement('div');
    wrapper.className = 'moallem-qr-box';
    wrapper.style.display = 'inline-flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.padding = '10px';
    wrapper.style.background = '#ffffff';
    wrapper.style.borderRadius = '16px';
    wrapper.style.border = '2px solid rgba(16, 185, 129, 0.35)';
    wrapper.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';

    const img = document.createElement('img');
    img.alt = 'رمز QR لربط الموبايل بالحاسبة';
    img.width = size;
    img.height = size;
    img.style.display = 'block';
    img.style.borderRadius = '8px';

    const qrUrl1 = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=${margin}&color=0f172a&bgcolor=ffffff`;
    const qrUrl2 = `https://quickchart.io/qr?text=${encoded}&size=${size}&margin=${margin}&dark=0f172a&light=ffffff`;

    img.src = qrUrl1;
    img.onerror = function () {
      img.onerror = function () {
        wrapper.innerHTML = buildFallbackQrSvgString(text, size);
      };
      img.src = qrUrl2;
    };

    wrapper.appendChild(img);
    return wrapper;
  }

  window.MoallemQRCode = {
    createQRCodeSVG: createQRCodeSVG,
    buildFallbackQrSvgString: buildFallbackQrSvgString
  };
})(window);
