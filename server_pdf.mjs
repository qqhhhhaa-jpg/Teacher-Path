/**
 * منصة مسار المعلم الذكية — خادم توليد وأرشفة شهادات الطلاب بدقة عالية (PDF Microservice)
 * Teacher Path — High-Capacity Batch Certificate PDF & ZIP Archiver Service
 *
 * المميزات:
 * 1. دعم حتى 2000 طالب في الدفعة الواحدة مع جدولة ذكية عبر PQueue.
 * 2. محرك Playwright / Chromium مع دعم تلقائي لمتصفح Chrome/Edge المثبت على الجهاز.
 * 3. دمج وضغط كافة شهادات الـ PDF في ملف ZIP واحد عالي الجودة عبر Archiver.
 * 4. نظام مصادقة آمن وحماية متقدمة بواسطة Helmet و Timing-Safe Authentication.
 * 5. واجهة ويب تفاعلية كاملة مع شريط تقدم مباشر 0% - 100% وإمكانية التنزيل الفوري.
 */

import express from "express";
import helmet from "helmet";
import { chromium } from "playwright";
import PQueue from "p-queue";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ZipArchive, Archiver } from "archiver";

/**
 * Universal archiver factory function supporting legacy archiver('zip', options)
 */
function archiver(format, options) {
  if (format === "zip") {
    return new ZipArchive(options);
  }
  return new Archiver(options);
}

const app = express();
const PORT = process.env.PORT || process.env.PDF_PORT || 3005;
const API_TOKEN = process.env.PDF_API_TOKEN || "teacher-path-secure-token-2026";

// Security & Parsing Middleware
app.use(
  helmet({
    contentSecurityPolicy: false // Allows inline scripts for web UI dashboard
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// In-Memory Job Store and Processing Queue
const jobs = new Map();
const queue = new PQueue({ concurrency: 1 });
let browserPromise = null;

/**
 * Launch Chromium with intelligent fallback to local Chrome or Edge
 */
async function getBrowser() {
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    try {
      return await chromium.launch({ headless: true });
    } catch (err1) {
      console.warn("Standard Playwright Chromium binary not found, attempting local Chrome channel...");
      try {
        return await chromium.launch({ channel: "chrome", headless: true });
      } catch (err2) {
        console.warn("Local Chrome channel not available, attempting local Edge channel...");
        try {
          return await chromium.launch({ channel: "msedge", headless: true });
        } catch (err3) {
          console.error("No compatible Chromium browser found on system:", err3);
          throw err3;
        }
      }
    }
  })();

  return browserPromise;
}

/**
 * Constant-time Timing-Safe Authentication Middleware
 * Supports both HTTP Authorization header ('Bearer <token>') and '?token=' query parameter.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  // Query parameter fallback for standard browser downloads
  if (!token && req.query && typeof req.query.token === "string") {
    token = req.query.token.trim();
  }

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: Missing authentication token",
      hint: "Provide 'Authorization: Bearer <token>' header or '?token=<token>' query parameter"
    });
  }

  const expected = Buffer.from(API_TOKEN);
  const supplied = Buffer.from(token);

  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    return res.status(401).json({ error: "Unauthorized: Invalid authentication token" });
  }

  next();
}

/**
 * HTML Character Escaping Helper
 */
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/**
 * Certificate HTML Template Builder (A4 Landscape Royal Iraqi Design)
 */
function certificateHtml(student) {
  const studentName = escapeHtml(student.name || "الطالب");
  const gradeText = escapeHtml(student.grade || student.gradeOrRank || "المتفوقين");
  const totalScore = escapeHtml(String(student.total ?? student.score ?? "100%"));
  const schoolName = escapeHtml(student.schoolName || "إدارة المدرسة الموقرة");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 landscape;
    margin: 0;
  }
  *, *::before, *::after {
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 297mm;
    height: 209mm;
    background: #ffffff;
    font-family: 'Cairo', 'Alexandria', Arial, sans-serif;
    color: #1e293b;
    direction: rtl;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .cert-container {
    width: 285mm;
    height: 198mm;
    border: 5px solid #d97706;
    padding: 6px;
    border-radius: 12px;
    background: #ffffff;
    box-sizing: border-box;
  }
  .cert-inner {
    width: 100%;
    height: 100%;
    border: 2px solid #b45309;
    border-radius: 8px;
    padding: 10mm 15mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    background: radial-gradient(circle at center, #ffffff 60%, #fffbeb 100%);
    box-sizing: border-box;
  }
  .cert-header {
    border-bottom: 2px solid rgba(245, 158, 11, 0.4);
    padding-bottom: 6px;
  }
  .gov-title {
    font-size: 20px;
    font-weight: 800;
    color: #92400e;
    margin: 0;
  }
  .sub-title {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0;
  }
  .main-title {
    font-size: 30px;
    font-weight: 900;
    color: #1e293b;
    margin: 8px 0 2px;
  }
  .tribute-text {
    font-size: 16px;
    color: #334155;
    line-height: 1.8;
    margin: 6px 0;
  }
  .student-name-box {
    margin: 8px 0;
    padding: 6px 20px;
    display: inline-block;
  }
  .student-name {
    font-size: 34px;
    font-weight: 900;
    color: #b45309;
    margin: 0;
    text-shadow: 0 1px 2px rgba(180, 83, 9, 0.15);
  }
  .details-box {
    display: flex;
    justify-content: space-around;
    background: rgba(245, 158, 11, 0.08);
    border: 1.5px solid rgba(245, 158, 11, 0.35);
    border-radius: 10px;
    padding: 10px 24px;
    margin: 6px auto;
    width: 82%;
    font-size: 17px;
    font-weight: 700;
    color: #1e293b;
  }
  .details-item span {
    color: #b45309;
    font-weight: 800;
  }
  .footer-signatures {
    display: flex;
    justify-content: space-between;
    padding: 0 35px;
    margin-top: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #475569;
  }
  .sig-line {
    margin-top: 18px;
    border-top: 1px dashed #94a3b8;
    width: 140px;
  }
</style>
</head>
<body>
  <main class="cert-container">
    <div class="cert-inner">
      <div class="cert-header">
        <h1 class="gov-title">جمهورية العراق — وزارة التربية والتعليم</h1>
        <p class="sub-title">منصة مسار المعلم الذكية | ${schoolName}</p>
        <h2 class="main-title">شهادة شكر وتقدير وتفوق</h2>
      </div>

      <p class="tribute-text">
        تقديراً للمستوى العلمي الباهر والمواظبة العالية والأخلاق الحميدة، يسر إدارة المدرسة تكريم الطالب / الطالبة:
      </p>

      <div class="student-name-box">
        <h3 class="student-name">${studentName}</h3>
      </div>

      <div class="details-box">
        <div class="details-item">الصف الدراسي: <span>${gradeText}</span></div>
        <div class="details-item">الدرجة / المجموع: <span>${totalScore}</span></div>
      </div>

      <p class="tribute-text" style="font-size: 15px; margin-top: 2px;">
        مع أصدق التمنيات القلبية بدوام التميز والإبداع في المسيرة التعليمية القادمة.
      </p>

      <div class="footer-signatures">
        <div>
          <span>ختم المدرسة وإدارتها</span>
          <div class="sig-line"></div>
        </div>
        <div>
          <span>توقيع الأستاذ / المعلم</span>
          <div class="sig-line"></div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`;
}

/**
 * Render a single student certificate to PDF using Screen-Media fidelity
 */
async function renderPdf(student, outputPath) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 1123, height: 794 });

    await page.setContent(certificateHtml(student), {
      waitUntil: "load",
      timeout: 25000
    });

    // Generates a PDF with 'screen' media type (faithful background gradients and borders)
    if (page.emulateMedia) {
      await page.emulateMedia({ media: "screen" });
    } else if (page.emulateMediaType) {
      await page.emulateMediaType("screen");
    }

    await page.pdf({
      path: outputPath,
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await page.close();
  }
}

/**
 * Generate a safe file name for each certificate in the ZIP archive
 */
function safeFilename(index, student) {
  const cleanName = student?.name
    ? `_${student.name.replace(/[/\\?%*:|"<>]/g, "_").trim()}`
    : "";
  return `certificate_${String(index).padStart(4, "0")}${cleanName}.pdf`;
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * POST /api/jobs
 * Create and queue a new batch certificate PDF & ZIP generation job
 */
app.post("/api/jobs", authenticate, async (req, res) => {
  const students = req.body?.students;

  if (
    !Array.isArray(students) ||
    students.length < 1 ||
    students.length > 2000 ||
    !students.every(
      (s) =>
        s &&
        typeof s.name === "string" &&
        s.name.trim().length > 0 &&
        (typeof s.grade === "string" || typeof s.gradeOrRank === "string" || s.grade === undefined)
    )
  ) {
    return res.status(400).json({
      error: "Invalid students data: Must be an array of 1 to 2000 student objects with 'name' and 'grade' properties"
    });
  }

  const id = crypto.randomUUID();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "teacher-path-"));

  const job = {
    id,
    dir,
    total: students.length,
    completed: 0,
    status: "queued",
    error: null,
    file: null,
    createdAt: new Date().toISOString()
  };

  jobs.set(id, job);

  res.status(202).json({
    id: job.id,
    status: job.status,
    total: job.total,
    message: `Job ${id} queued successfully for ${job.total} certificates.`
  });

  // Background queue processing
  queue.add(async () => {
    job.status = "processing";
    console.log(`[Job ${id}] Started processing ${students.length} certificates...`);

    try {
      const archivePath = path.join(dir, "teacher-path-certificates.zip");
      const output = fs.createWriteStream(archivePath);
      const archive = archiver("zip", { zlib: { level: 1 } });

      const finished = new Promise((resolve, reject) => {
        output.on("close", resolve);
        output.on("error", reject);
        archive.on("error", reject);
      });

      archive.pipe(output);

      for (let i = 0; i < students.length; i++) {
        if (job.status === "cancelled") {
          console.log(`[Job ${id}] Cancelled by user. Aborting...`);
          archive.abort();
          return;
        }

        const fileName = safeFilename(i + 1, students[i]);
        const filePath = path.join(dir, fileName);

        await renderPdf(students[i], filePath);

        archive.file(filePath, { name: fileName });
        job.completed = i + 1;

        // Yield to event loop periodically
        if ((i + 1) % 10 === 0) {
          await new Promise((resolve) => setImmediate(resolve));
        }
      }

      await archive.finalize();
      await finished;

      if (job.status !== "cancelled") {
        job.file = archivePath;
        job.status = "completed";
        console.log(`[Job ${id}] Successfully created ZIP archive: ${archivePath}`);
      }
    } catch (error) {
      job.error = error.message || "PDF generation failed";
      job.status = "failed";
      console.error(`[Job ${id}] Failed:`, error);
    }
  }).catch((error) => {
    job.error = error.message || "Queue worker error";
    job.status = "failed";
    console.error(`[Job ${id}] Queue error:`, error);
  });
});

/**
 * GET /api/jobs/:id
 * Query current job status, completed count, and percentage
 */
app.get("/api/jobs/:id", authenticate, (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const percent = job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0;

  res.json({
    id: job.id,
    status: job.status,
    completed: job.completed,
    total: job.total,
    percent: percent,
    error: job.error,
    createdAt: job.createdAt
  });
});

/**
 * GET /api/jobs/:id/download
 * Download the generated ZIP archive containing all certificates
 */
app.get("/api/jobs/:id/download", authenticate, (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job || job.status !== "completed" || !job.file || !fs.existsSync(job.file)) {
    return res.status(409).json({
      error: "Archive is not ready or has expired",
      status: job ? job.status : "not_found"
    });
  }

  res.download(job.file, "teacher-path-certificates.zip");
});

/**
 * DELETE /api/jobs/:id
 * Cancel an active or queued job
 */
app.delete("/api/jobs/:id", authenticate, (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status === "queued" || job.status === "processing") {
    job.status = "cancelled";
  }

  res.json({ id: job.id, status: job.status });
});

/**
 * GET /
 * Interactive High-Definition Management Dashboard for Teachers and Administrators
 */
app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>مسار المعلم — خادم تصدير الشهادات المجمعة PDF & ZIP</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Cairo', sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 30px 15px;
      direction: rtl;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      background: #1e293b;
      padding: 32px 30px;
      border-radius: 20px;
      border: 1.5px solid rgba(245, 158, 11, 0.35);
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 12px;
    }
    h1 { margin: 0 0 8px; font-size: 1.6rem; font-weight: 800; color: #ffffff; }
    p.desc { margin: 0 0 22px; color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
    label { display: block; font-weight: 700; margin-bottom: 6px; font-size: 0.9rem; color: #cbd5e1; }
    input[type="text"], textarea {
      width: 100%;
      background: #0f172a;
      border: 1.5px solid #334155;
      color: #f8fafc;
      border-radius: 12px;
      padding: 12px 14px;
      font-family: 'Cairo', monospace;
      font-size: 0.92rem;
      margin-bottom: 18px;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, textarea:focus {
      outline: none;
      border-color: #f59e0b;
    }
    .btn-submit {
      width: 100%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 14px 20px;
      font-size: 1.05rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .progress-section {
      margin-top: 24px;
      padding: 18px;
      background: #0f172a;
      border-radius: 14px;
      border: 1px solid #334155;
      display: none;
    }
    .progress-bar-wrap {
      background: #1e293b;
      height: 12px;
      border-radius: 999px;
      overflow: hidden;
      margin: 12px 0;
      position: relative;
    }
    .progress-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #10b981);
      transition: width 0.3s ease;
      border-radius: 999px;
    }
    .status-text {
      font-size: 0.92rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #94a3b8;
    }
    .btn-download {
      display: none;
      margin-top: 14px;
      background: #10b981;
      color: #ffffff;
      text-decoration: none;
      border-radius: 12px;
      padding: 12px 20px;
      text-align: center;
      font-weight: 800;
      font-size: 1rem;
      transition: background 0.2s;
    }
    .btn-download:hover { background: #059669; }
    .btn-cancel {
      display: none;
      margin-top: 10px;
      background: transparent;
      border: 1px solid #ef4444;
      color: #ef4444;
      border-radius: 10px;
      padding: 8px 14px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-badge"><i class="fa-solid fa-bolt"></i> خادم التصدير والأرشفة السحابية الذكي</div>
    <h1>تصدير شهادات مسار المعلم (PDF & ZIP)</h1>
    <p class="desc">توليد حتى 2000 شهادة تقديرية وتجميعها تلقائياً في ملف أرشيف ZIP فائق الجودة بدقة وسائط الشاشة.</p>

    <label for="token">رمز المصادقة الأمني (API Bearer Token):</label>
    <input type="text" id="token" value="${API_TOKEN}">

    <label for="data">قائمة بيانات الطلاب (JSON):</label>
    <textarea id="data" rows="8">[
  { "name": "أحمد علي حسين الكعبي", "grade": "السادس العلمي", "total": "98%" },
  { "name": "مريم حسن عبد الزهرة", "grade": "السادس الأدبي", "total": "96%" },
  { "name": "كرار حيدر جاسم التميمي", "grade": "الثالث المتوسط", "total": "95%" }
]</textarea>

    <button id="export" class="btn-submit" type="button">
      <i class="fa-solid fa-file-zipper"></i> بدء إنشاء أرشيف الشهادات (ZIP)
    </button>

    <div id="progressSection" class="progress-section">
      <div class="status-text">
        <span id="statusMessage"><i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب للخادم...</span>
        <span id="percentLabel">0%</span>
      </div>
      <div class="progress-bar-wrap">
        <div id="progressBar" class="progress-bar-fill"></div>
      </div>
      <a id="downloadLink" href="#" class="btn-download" target="_blank">
        <i class="fa-solid fa-download"></i> تنزيل ملف الأرشيف الكامل (ZIP)
      </a>
      <button id="cancelBtn" class="btn-cancel" type="button">إلغاء العملية</button>
    </div>
  </div>

  <script>
    const exportBtn = document.getElementById("export");
    const progressSection = document.getElementById("progressSection");
    const statusMessage = document.getElementById("statusMessage");
    const percentLabel = document.getElementById("percentLabel");
    const progressBar = document.getElementById("progressBar");
    const downloadLink = document.getElementById("downloadLink");
    const cancelBtn = document.getElementById("cancelBtn");
    const tokenInput = document.getElementById("token");
    const dataInput = document.getElementById("data");

    let currentJobId = null;
    let pollInterval = null;

    exportBtn.onclick = async () => {
      const token = tokenInput.value.trim();
      let students = [];

      try {
        students = JSON.parse(dataInput.value.trim());
        if (!Array.isArray(students) || students.length === 0) {
          throw new Error("يجب أن يكون الإدخال مصفوفة طلاب تحتوي على الأقل اسماً واحداً.");
        }
      } catch (err) {
        alert("خطأ في تنسيق بيانات الـ JSON: " + err.message);
        return;
      }

      exportBtn.disabled = true;
      progressSection.style.display = "block";
      downloadLink.style.display = "none";
      cancelBtn.style.display = "block";
      progressBar.style.width = "2%";
      percentLabel.textContent = "0%";
      statusMessage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري بدء مهمة المعالجة...';

      try {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({ students })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "فشل إنشاء المهمة في الخادم");
        }

        currentJobId = data.id;
        statusMessage.textContent = 'تم إدراج المهمة بنجاح، جاري توليد الشهادات...';

        // Poll job status
        pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch('/api/jobs/' + currentJobId, {
              headers: { "Authorization": "Bearer " + token }
            });
            const job = await pollRes.json();

            if (!pollRes.ok) {
              clearInterval(pollInterval);
              statusMessage.textContent = 'خطأ: ' + (job.error || 'فشل الاستعلام');
              exportBtn.disabled = false;
              cancelBtn.style.display = 'none';
              return;
            }

            const p = job.percent || 0;
            progressBar.style.width = p + '%';
            percentLabel.textContent = p + '%';
            statusMessage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> تم إنجاز ' + job.completed + ' من ' + job.total + ' شهادة...';

            if (job.status === "completed") {
              clearInterval(pollInterval);
              progressBar.style.width = '100%';
              percentLabel.textContent = '100%';
              statusMessage.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> تم إنشاء أرشيف الشهادات بنجاح! جاهز للتنزيل.';
              downloadLink.href = '/api/jobs/' + currentJobId + '/download?token=' + encodeURIComponent(token);
              downloadLink.style.display = 'block';
              cancelBtn.style.display = 'none';
              exportBtn.disabled = false;
            } else if (job.status === "failed" || job.status === "cancelled") {
              clearInterval(pollInterval);
              statusMessage.textContent = 'توقفت المهمة: ' + (job.error || job.status);
              cancelBtn.style.display = 'none';
              exportBtn.disabled = false;
            }
          } catch (pollErr) {
            console.error("Poll error:", pollErr);
          }
        }, 800);

      } catch (err) {
        statusMessage.textContent = 'خطأ: ' + err.message;
        exportBtn.disabled = false;
        cancelBtn.style.display = 'none';
      }
    };

    cancelBtn.onclick = async () => {
      if (!currentJobId) return;
      const token = tokenInput.value.trim();
      try {
        await fetch('/api/jobs/' + currentJobId, {
          method: "DELETE",
          headers: { "Authorization": "Bearer " + token }
        });
        statusMessage.textContent = "تم إلغاء المهمة.";
        clearInterval(pollInterval);
        cancelBtn.style.display = "none";
        exportBtn.disabled = false;
      } catch (e) {
        console.error("Cancel failed:", e);
      }
    };
  </script>
</body>
</html>`);
});

// ============================================================================
// Server Startup & Graceful Shutdown
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Masar Almoallem PDF & ZIP Archiver Microservice`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔑 Bearer API Token: ${API_TOKEN}`);
  console.log(`=======================================================`);
});

async function shutdown() {
  console.log("\nInitiating graceful shutdown...");
  server.close();
  await queue.onIdle();

  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    console.log("Browser instance closed.");
  }

  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
