const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const oldBadge = /<div class="topbar-trial-badge-wrap"[\s\S]*?<\/div>(\s*<\/div>)/;
const originalBadge = `<div class="topbar-trial-badge-wrap" style="display: inline-flex; align-items: center; gap: 9px; padding: 7px 20px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%); border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 999px; box-shadow: 0 2px 12px rgba(245, 158, 11, 0.15);">
            <i class="fa-solid fa-clock-rotate-left" style="color: #f59e0b; font-size: 1.25rem;"></i>
            <span style="font-size: 1.2rem; font-weight: 900; color: #d97706; letter-spacing: 0.4px; font-family: 'Alexandria', 'Cairo', sans-serif;">فترة تجريبية</span>
          </div>$1`;

html = html.replace(oldBadge, originalBadge);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Original topbar badge restored successfully in index.html');

