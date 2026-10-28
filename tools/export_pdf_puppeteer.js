/**
 * منصة مسار المعلم الذكية — سكريبت تصدير ملفات PDF بدقة الشاشة الكاملة عبر Puppeteer
 * Teacher Path — High-Fidelity PDF Exporter with 'screen' media emulation
 * 
 * Usage:
 *   node tools/export_pdf_puppeteer.js [url] [outputPath]
 */

const fs = require('fs');
const path = require('path');

async function exportPdfWithScreenMedia(url = 'http://localhost:3000', outputPath = 'page.pdf') {
  let puppeteer;
  try {
    puppeteer = require('puppeteer-core');
  } catch (e) {
    try {
      puppeteer = require('puppeteer');
    } catch (e2) {
      console.error('Puppeteer not installed. Run: npm install puppeteer-core or npm install puppeteer');
      process.exit(1);
    }
  }

  // Detect installed Chrome / Edge path on Windows / Linux / macOS
  const findChromePath = () => {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
      (process.env.LOCALAPPDATA || '') + '\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of winPaths) {
      if (p && fs.existsSync(p)) return p;
    }
    return undefined;
  };

  const executablePath = findChromePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Generates a PDF with 'screen' media type.
    await page.emulateMedia({ media: 'screen' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });

    console.log(`Successfully generated high-fidelity screen PDF: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const targetUrl = process.argv[2] || 'http://localhost:3000';
  const outPath = process.argv[3] || 'page.pdf';
  exportPdfWithScreenMedia(targetUrl, outPath).catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
  });
}

module.exports = { exportPdfWithScreenMedia };
