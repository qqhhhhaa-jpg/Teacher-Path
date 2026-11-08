const fs = require('fs');
const path = require('path');

// 1. Restore css/style.css to clean original base before applying proportional laptop engine
const cssPath = path.join(__dirname, '..', 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Remove previous LAPTOP ADAPTIVE DISPLAY ENGINE block if present
const marker = '/* ==========================================================================\n   LAPTOP ADAPTIVE DISPLAY ENGINE';
const markerCRLF = '/* ==========================================================================\r\n   LAPTOP ADAPTIVE DISPLAY ENGINE';
if (css.includes(marker)) {
  css = css.substring(0, css.indexOf(marker)).trimEnd() + '\r\n';
} else if (css.includes(markerCRLF)) {
  css = css.substring(0, css.indexOf(markerCRLF)).trimEnd() + '\r\n';
}

const proportionalLaptopCSS = `
/* ==========================================================================
   LAPTOP ADAPTIVE DISPLAY ENGINE (تناسق نسبي مثالي لكافة مقاسات شاشات اللابتوب)
   يحافظ على الشكل والأبعاد الأساسية الأصلية 100% مع مواءمة تلقائية لأي شاشة لابتوب
   ========================================================================== */

/* المستوى الأول: شاشات اللابتوب القياسية والعريضة (1440px - 1600px أو ارتفاع نافذة <= 860px) */
@media screen and (min-width: 901px) and (max-width: 1600px),
       screen and (min-width: 901px) and (max-height: 860px) {
  html {
    font-size: 14.5px;
  }

  .platform-top-navbar {
    padding: 0.55rem 1.75rem !important;
  }

  .topbar-admin-pill-btn:not(.admin-only-hidden),
  .btn-plans-vip,
  .topbar-icon-btn,
  .topbar-user-badge {
    min-height: 36px !important;
    height: 36px !important;
    border-radius: 10px !important;
  }

  .topbar-user-badge {
    border-radius: 999px !important;
    padding: 3px 12px 3px 8px !important;
  }

  .topbar-icon-btn {
    width: 36px !important;
    font-size: 0.95rem !important;
  }

  .topbar-admin-pill-btn {
    padding: 0 11px !important;
    font-size: 0.78rem !important;
    gap: 6px !important;
  }

  .topbar-trial-badge-wrap {
    padding: 5px 15px !important;
    gap: 7px !important;
  }

  .topbar-trial-badge-wrap i {
    font-size: 1.05rem !important;
  }

  .topbar-trial-badge-wrap span {
    font-size: 1rem !important;
  }

  .apps-hub-container {
    max-width: 1320px !important;
    padding: 0.85rem 1.35rem 2.2rem 1.35rem !important;
    gap: 0.95rem !important;
  }

  .custom-hero-banner {
    padding: 0.95rem 1.5rem 0.85rem 1.5rem !important;
    margin-bottom: 0.75rem !important;
    border-radius: 18px !important;
  }

  .apps-section-header {
    margin-bottom: 0.75rem !important;
  }

  .apps-title-icon-badge {
    width: 38px !important;
    height: 38px !important;
    border-radius: 11px !important;
    font-size: 1.1rem !important;
  }

  .app-hub-card {
    min-height: 225px !important;
    padding: 0.95rem 1rem 0.85rem 1rem !important;
    gap: 0.5rem !important;
  }

  .app-card-illustration {
    height: 74px !important;
  }

  .app-card-illustration::before {
    width: 64px !important;
    height: 64px !important;
  }

  .app-3d-img {
    max-height: 66px !important;
  }

  .app-hub-card .app-card-footer {
    margin-top: 0.35rem !important;
    padding-top: 0.55rem !important;
  }

  .app-circle-action-btn {
    width: 29px !important;
    height: 29px !important;
  }
}

/* المستوى الثاني: شاشات اللابتوب المتوسطة والمدمجة (1280px - 1380px أو ارتفاع نافذة المتصفح <= 720px) */
@media screen and (min-width: 901px) and (max-width: 1380px),
       screen and (min-width: 901px) and (max-height: 720px) {
  html {
    font-size: 13.75px;
  }

  .platform-top-navbar {
    padding: 0.45rem 1.5rem !important;
  }

  .topbar-admin-pill-btn:not(.admin-only-hidden),
  .btn-plans-vip,
  .topbar-icon-btn,
  .topbar-user-badge {
    min-height: 34px !important;
    height: 34px !important;
  }

  .topbar-icon-btn {
    width: 34px !important;
  }

  .topbar-trial-badge-wrap {
    padding: 4px 13px !important;
    gap: 6px !important;
  }

  .topbar-trial-badge-wrap i {
    font-size: 0.96rem !important;
  }

  .topbar-trial-badge-wrap span {
    font-size: 0.92rem !important;
  }

  .apps-hub-container {
    padding: 0.7rem 1.25rem 1.8rem 1.25rem !important;
    gap: 0.75rem !important;
  }

  .custom-hero-banner {
    padding: 0.75rem 1.35rem 0.7rem 1.35rem !important;
    margin-bottom: 0.55rem !important;
  }

  .apps-section-header {
    margin-bottom: 0.6rem !important;
  }

  .app-hub-card {
    min-height: 205px !important;
    padding: 0.8rem 0.95rem 0.7rem 0.95rem !important;
    gap: 0.4rem !important;
  }

  .app-card-illustration {
    height: 64px !important;
  }

  .app-card-illustration::before {
    width: 56px !important;
    height: 56px !important;
  }

  .app-3d-img {
    max-height: 58px !important;
  }

  .app-hub-card .app-card-footer {
    margin-top: 0.25rem !important;
    padding-top: 0.45rem !important;
  }
}
`;

css += '\r\n' + proportionalLaptopCSS.replace(/\n/g, '\r\n');
fs.writeFileSync(cssPath, css, 'utf8');
console.log('✓ Updated css/style.css with proportional laptop engine');

// 2. Update index.html cache-busting query string and remove desktop-only script tag
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
  /href="css\/style\.css\?v=[^"]*"/,
  'href="css/style.css?v=2026.11.08.laptop_perfect"'
);

html = html.replace(
  /\s*<!-- Desktop Silent Auto-Updater \(GitHub Releases\) -->\s*<script src="js\/desktop-updater\.js\?v=[^"]*"><\/script>/,
  ''
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Updated index.html cache version and cleaned desktop script tag');
