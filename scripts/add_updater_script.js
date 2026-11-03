const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('desktop-updater.js')) {
  html = html.replace(
    '<script src="js/gcloud-gateway.js?v=2026.10.31.clean_stable_v12"></script>',
    '<script src="js/gcloud-gateway.js?v=2026.10.31.clean_stable_v12"></script>\r\n  <!-- Desktop Silent Auto-Updater (GitHub Releases) -->\r\n  <script src="js/desktop-updater.js?v=4.0.0"></script>'
  );
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('✓ desktop-updater.js successfully added to index.html');
} else {
  console.log('Already includes desktop-updater.js');
}

