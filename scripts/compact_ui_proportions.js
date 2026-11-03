const fs = require('fs');
const path = require('path');

// 1. Update index.html
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const oldBadgeRegex = /<div class="topbar-trial-badge-wrap"[^>]*>[\s\S]*?<\/div>(\s*<\/div>)/;
if (oldBadgeRegex.test(html)) {
  const compactBadge = `<div class="topbar-trial-badge-wrap" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%); border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 999px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);">
            <i class="fa-solid fa-clock-rotate-left" style="color: #f59e0b; font-size: 0.88rem;"></i>
            <span style="font-size: 0.84rem; font-weight: 900; color: #d97706; letter-spacing: 0.3px; font-family: 'Alexandria', 'Cairo', sans-serif;">فترة تجريبية</span>
          </div>$1`;
  html = html.replace(oldBadgeRegex, compactBadge);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✓ index.html topbar trial badge updated to compact sizing.');
} else {
  console.log('⚠️ Could not match topbar-trial-badge-wrap in index.html');
}

// 2. Update css/style.css
const cssPath = path.join(__dirname, '..', 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

// A. Topbar: .platform-top-navbar padding
css = css.replace(
  /\.platform-top-navbar\s*\{[\s\S]*?padding:\s*0\.85rem 2\.5rem;/,
  (match) => match.replace('padding: 0.85rem 2.5rem;', 'padding: 0.45rem 1.6rem;')
);

// B. Topbar: .topbar-admin-pill-btn
css = css.replace(
  /\.topbar-admin-pill-btn\s*\{[\s\S]*?height:\s*42px;[\s\S]*?padding:\s*0 13px;[\s\S]*?border-radius:\s*12px;[\s\S]*?font-size:\s*0\.83rem;/,
  (match) => match
    .replace('height: 42px;', 'height: 33px;')
    .replace('padding: 0 13px;', 'padding: 0 10px;')
    .replace('border-radius: 12px;', 'border-radius: 9px;')
    .replace('font-size: 0.83rem;', 'font-size: 0.76rem;')
);

// C. Topbar: .topbar-icon-btn
css = css.replace(
  /\.topbar-icon-btn\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;[\s\S]*?border-radius:\s*13px;[\s\S]*?font-size:\s*1\.1rem;/,
  (match) => match
    .replace('width: 44px;', 'width: 33px;')
    .replace('height: 44px;', 'height: 33px;')
    .replace('border-radius: 13px;', 'border-radius: 9px;')
    .replace('font-size: 1.1rem;', 'font-size: 0.88rem;')
);

// D. Topbar: .topbar-user-badge & avatar
css = css.replace(
  /\.topbar-user-badge\s*\{[\s\S]*?padding:\s*5px 14px 5px 7px;/,
  (match) => match.replace('padding: 5px 14px 5px 7px;', 'padding: 3px 10px 3px 6px;')
);

css = css.replace(
  /\.topbar-avatar-wrap\s*\{[\s\S]*?width:\s*36px;[\s\S]*?height:\s*36px;/,
  (match) => match
    .replace('width: 36px;', 'width: 27px;')
    .replace('height: 36px;', 'height: 27px;')
);

css = css.replace(
  /\.topbar-user-name\s*\{[\s\S]*?font-size:\s*0\.88rem;/,
  (match) => match.replace('font-size: 0.88rem;', 'font-size: 0.78rem;')
);

css = css.replace(
  /\.topbar-user-role\s*\{[\s\S]*?font-size:\s*0\.7rem;/,
  (match) => match.replace('font-size: 0.7rem;', 'font-size: 0.64rem;')
);

// E. Topbar: line 29740 min-height 40px -> 33px
css = css.replace(
  /\.topbar-admin-pill-btn:not\(\.admin-only-hidden\),\s*\n\s*\.topbar-icon-btn,\s*\n\s*\.topbar-user-badge\s*\{[\s\S]*?min-height:\s*40px !important;[\s\S]*?height:\s*40px !important;[\s\S]*?border-radius:\s*12px !important;/,
  (match) => match
    .replace('min-height: 40px !important;', 'min-height: 33px !important;')
    .replace('height: 40px !important;', 'height: 33px !important;')
    .replace('border-radius: 12px !important;', 'border-radius: 9px !important;')
);

// F. Apps Hub Container
css = css.replace(
  /\.apps-hub-container\s*\{[\s\S]*?min-height:\s*calc\(100vh - 85px\);[\s\S]*?padding:\s*1\.25rem 1\.5rem 4rem 1\.5rem;[\s\S]*?gap:\s*1\.75rem;/,
  (match) => match
    .replace('min-height: calc(100vh - 85px);', 'min-height: calc(100vh - 55px);')
    .replace('padding: 1.25rem 1.5rem 4rem 1.5rem;', 'padding: 0.65rem 1.25rem 2rem 1.25rem;')
    .replace('gap: 1.75rem;', 'gap: 0.75rem;')
);

// G. Custom Hero Banner
css = css.replace(
  /\.custom-hero-banner\s*\{[\s\S]*?border-radius:\s*20px;[\s\S]*?padding:\s*1\.15rem 1\.65rem 1\.05rem 1\.65rem;[\s\S]*?margin-bottom:\s*1\.15rem;/,
  (match) => match
    .replace('border-radius: 20px;', 'border-radius: 16px;')
    .replace('padding: 1.15rem 1.65rem 1.05rem 1.65rem;', 'padding: 0.7rem 1.25rem 0.6rem 1.25rem;')
    .replace('margin-bottom: 1.15rem;', 'margin-bottom: 0.75rem;')
);

css = css.replace(
  /\.banner-brand-heading\s*\{[\s\S]*?font-size:\s*clamp\(1\.4rem, 2\.2vw, 2\.05rem\);/,
  (match) => match.replace('font-size: clamp(1.4rem, 2.2vw, 2.05rem);', 'font-size: clamp(1.15rem, 1.5vw, 1.45rem);')
);

css = css.replace(
  /\.banner-brand-desc\s*\{[\s\S]*?font-size:\s*0\.84rem;[\s\S]*?margin:\s*0\.15rem 0 0\.45rem 0;/,
  (match) => match
    .replace('font-size: 0.84rem;', 'font-size: 0.74rem;')
    .replace('margin: 0.15rem 0 0.45rem 0;', 'margin: 0.1rem 0 0.2rem 0;')
);

css = css.replace(
  /\.banner-motto-lines\s*\{[\s\S]*?font-size:\s*1\.55rem;[\s\S]*?line-height:\s*1\.35;/,
  (match) => match
    .replace('font-size: 1.55rem;', 'font-size: 1.12rem;')
    .replace('line-height: 1.35;', 'line-height: 1.22;')
);

css = css.replace(
  /\.motto-curve-svg\s*\{[\s\S]*?width:\s*125px;[\s\S]*?height:\s*18px;[\s\S]*?margin:\s*0\.35rem 0 0 0;/,
  (match) => match
    .replace('width: 125px;', 'width: 90px;')
    .replace('height: 18px;', 'height: 13px;')
    .replace('margin: 0.35rem 0 0 0;', 'margin: 0.2rem 0 0 0;')
);

// H. Apps Section Header
css = css.replace(
  /\.apps-section-header\s*\{[\s\S]*?margin-bottom:\s*1\.35rem;/,
  (match) => match.replace('margin-bottom: 1.35rem;', 'margin-bottom: 0.7rem;')
);

css = css.replace(
  /\.apps-title-icon-badge\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;[\s\S]*?border-radius:\s*14px;[\s\S]*?font-size:\s*1\.25rem;/,
  (match) => match
    .replace('width: 44px;', 'width: 32px;')
    .replace('height: 44px;', 'height: 32px;')
    .replace('border-radius: 14px;', 'border-radius: 9px;')
    .replace('font-size: 1.25rem;', 'font-size: 0.95rem;')
);

css = css.replace(
  /\.apps-section-title h3\s*\{[\s\S]*?font-size:\s*1\.25rem;/,
  (match) => match.replace('font-size: 1.25rem;', 'font-size: 1.02rem;')
);

css = css.replace(
  /\.apps-section-title p\s*\{[\s\S]*?font-size:\s*0\.82rem;/,
  (match) => match.replace('font-size: 0.82rem;', 'font-size: 0.72rem;')
);

css = css.replace(
  /\.apps-header-live-badge\s*\{[\s\S]*?padding:\s*6px 16px;[\s\S]*?font-size:\s*0\.78rem;/,
  (match) => match
    .replace('padding: 6px 16px;', 'padding: 3px 10px;')
    .replace('font-size: 0.78rem;', 'font-size: 0.69rem;')
);

// I. App Cards Grid & App Hub Card
css = css.replace(
  /\.apps-cards-grid\s*\{[\s\S]*?gap:\s*1\.1rem;/,
  (match) => match.replace('gap: 1.1rem;', 'gap: 0.8rem;')
);

css = css.replace(
  /\.app-hub-card\s*\{[\s\S]*?border-radius:\s*20px;[\s\S]*?padding:\s*1\.15rem 1\.15rem 1rem 1\.15rem;[\s\S]*?min-height:\s*275px;[\s\S]*?gap:\s*0\.75rem;/,
  (match) => match
    .replace('border-radius: 20px;', 'border-radius: 15px;')
    .replace('padding: 1.15rem 1.15rem 1rem 1.15rem;', 'padding: 0.7rem 0.85rem 0.65rem 0.85rem;')
    .replace('min-height: 275px;', 'min-height: 195px;')
    .replace('gap: 0.75rem;', 'gap: 0.35rem;')
);

css = css.replace(
  /\.app-card-illustration\s*\{[\s\S]*?height:\s*95px;/,
  (match) => match.replace('height: 95px;', 'height: 58px;')
);

css = css.replace(
  /\.app-card-illustration::before\s*\{[\s\S]*?width:\s*80px;[\s\S]*?height:\s*80px;/,
  (match) => match
    .replace('width: 80px;', 'width: 50px;')
    .replace('height: 80px;', 'height: 50px;')
);

css = css.replace(
  /\.app-3d-img\s*\{[\s\S]*?max-height:\s*85px;/,
  (match) => match.replace('max-height: 85px;', 'max-height: 52px;')
);

css = css.replace(
  /\.app-card-title\s*\{[\s\S]*?font-size:\s*1\.05rem;[\s\S]*?margin:\s*0 0 0\.25rem 0;/,
  (match) => match
    .replace('font-size: 1.05rem;', 'font-size: 0.88rem;')
    .replace('margin: 0 0 0.25rem 0;', 'margin: 0 0 0.12rem 0;')
);

css = css.replace(
  /\.app-card-desc\s*\{[\s\S]*?font-size:\s*0\.78rem;/,
  (match) => match.replace('font-size: 0.78rem;', 'font-size: 0.7rem;')
);

css = css.replace(
  /\.app-card-footer\s*\{[\s\S]*?padding-top:\s*0\.55rem;[\s\S]*?margin-top:\s*0\.15rem;/,
  (match) => match
    .replace('padding-top: 0.55rem;', 'padding-top: 0.4rem;')
    .replace('margin-top: 0.15rem;', 'margin-top: 0.1rem;')
);

css = css.replace(
  /\.app-action-text\s*\{[\s\S]*?font-size:\s*0\.78rem;/,
  (match) => match.replace('font-size: 0.78rem;', 'font-size: 0.72rem;')
);

css = css.replace(
  /\.app-circle-action-btn\s*\{[\s\S]*?width:\s*32px;[\s\S]*?height:\s*32px;[\s\S]*?font-size:\s*0\.82rem;/,
  (match) => match
    .replace('width: 32px;', 'width: 26px;')
    .replace('height: 32px;', 'height: 26px;')
    .replace('font-size: 0.82rem;', 'font-size: 0.72rem;')
);

// J. Later override block in css/style.css (around line 40515)
css = css.replace(
  /\.app-hub-card \.app-card-footer\s*\{[\s\S]*?margin-top:\s*1rem !important;[\s\S]*?padding-top:\s*0\.85rem !important;/,
  (match) => match
    .replace('margin-top: 1rem !important;', 'margin-top: 0.2rem !important;')
    .replace('padding-top: 0.85rem !important;', 'padding-top: 0.4rem !important;')
);

css = css.replace(
  /\.app-hub-card \.app-action-text\s*\{[\s\S]*?font-size:\s*0\.9rem !important;/,
  (match) => match.replace('font-size: 0.9rem !important;', 'font-size: 0.74rem !important;')
);

// Also add dedicated compact rules to ensure perfect specificity
const compactAddon = `
/* ==========================================================================
   COMPACT & ELEGANT UI PROPORTIONS (تنسيق مدمج ومتناسق لشاشات سطح المكتب)
   ========================================================================== */
.platform-top-navbar {
  padding: 0.45rem 1.6rem !important;
}

.topbar-trial-badge-wrap {
  padding: 4px 12px !important;
  gap: 6px !important;
}

.topbar-trial-badge-wrap i {
  font-size: 0.88rem !important;
}

.topbar-trial-badge-wrap span {
  font-size: 0.84rem !important;
}

.topbar-admin-pill-btn,
.btn-plans-vip {
  height: 33px !important;
  min-height: 33px !important;
  padding: 0 10px !important;
  font-size: 0.76rem !important;
  border-radius: 9px !important;
  gap: 5px !important;
}

.topbar-icon-btn {
  width: 33px !important;
  height: 33px !important;
  min-height: 33px !important;
  border-radius: 9px !important;
  font-size: 0.88rem !important;
}

.topbar-user-badge {
  min-height: 33px !important;
  height: 33px !important;
  padding: 2px 10px 2px 6px !important;
  border-radius: 999px !important;
  gap: 7px !important;
}

.topbar-avatar-wrap {
  width: 26px !important;
  height: 26px !important;
  font-size: 0.78rem !important;
}

.topbar-user-name {
  font-size: 0.78rem !important;
}

.topbar-user-role {
  font-size: 0.64rem !important;
}

.custom-hero-banner {
  padding: 0.7rem 1.25rem 0.6rem 1.25rem !important;
  margin-bottom: 0.75rem !important;
  border-radius: 16px !important;
}

.banner-brand-heading {
  font-size: clamp(1.15rem, 1.5vw, 1.45rem) !important;
}

.banner-brand-desc {
  font-size: 0.74rem !important;
  margin: 0.1rem 0 0.2rem 0 !important;
  line-height: 1.4 !important;
}

.banner-motto-lines {
  font-size: 1.12rem !important;
  line-height: 1.22 !important;
}

.motto-curve-svg {
  width: 90px !important;
  height: 13px !important;
  margin: 0.2rem 0 0 0 !important;
}

.apps-hub-container {
  min-height: calc(100vh - 55px) !important;
  padding: 0.65rem 1.25rem 1.8rem 1.25rem !important;
  gap: 0.75rem !important;
}

.apps-section-header {
  margin-bottom: 0.7rem !important;
}

.apps-title-icon-badge {
  width: 32px !important;
  height: 32px !important;
  border-radius: 9px !important;
  font-size: 0.95rem !important;
}

.apps-section-title h3 {
  font-size: 1.02rem !important;
}

.apps-section-title p {
  font-size: 0.72rem !important;
}

.apps-header-live-badge {
  padding: 3px 10px !important;
  font-size: 0.69rem !important;
}

.apps-cards-grid {
  gap: 0.8rem !important;
}

.app-hub-card {
  min-height: 195px !important;
  padding: 0.7rem 0.85rem 0.65rem 0.85rem !important;
  border-radius: 15px !important;
  gap: 0.35rem !important;
}

.app-card-illustration {
  height: 58px !important;
}

.app-card-illustration::before {
  width: 50px !important;
  height: 50px !important;
}

.app-3d-img {
  max-height: 52px !important;
}

.app-card-title {
  font-size: 0.88rem !important;
  margin: 0 0 0.12rem 0 !important;
}

.app-card-desc {
  font-size: 0.7rem !important;
  line-height: 1.35 !important;
}

.app-card-footer {
  margin-top: 0.15rem !important;
  padding-top: 0.4rem !important;
}

.app-action-text {
  font-size: 0.72rem !important;
}

.app-circle-action-btn {
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
  min-height: 26px !important;
  font-size: 0.72rem !important;
}

.app-card-icon-tag {
  font-size: 0.64rem !important;
  padding: 2px 8px !important;
}

.app-num-badge {
  font-size: 0.72rem !important;
  padding: 2px 8px !important;
}
`;

if (!css.includes('COMPACT & ELEGANT UI PROPORTIONS')) {
  css += '\n' + compactAddon;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✓ css/style.css successfully updated with compact proportions!');
