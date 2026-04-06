/**
 * U.S. Copyright Office software deposit helper (ARTS Act–style excerpt).
 * Generates print-ready HTML: cover + first 25 pages + last 25 pages of source
 * (or full code if total printable pages ≤ 50).
 *
 * Print: open the HTML in Chrome → Print → Save as PDF (Letter, default margins).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "copyright-deposit");
const OUT_HTML = path.join(OUT_DIR, "Cognitive-Care-Assistant-Copyright-Deposit.html");

const LINES_PER_PAGE = 54;
const PAGES_FIRST = 25;
const PAGES_LAST = 25;
const MAX_FULL_PAGES = PAGES_FIRST + PAGES_LAST;

const EXCLUDE_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "mcps",
  ".cursor",
  "coverage",
  "dist",
  "build",
]);

const EXCLUDE_FILE_RE =
  /\.(map|lock|pdf|png|jpg|jpeg|gif|webp|ico|svg|woff2?|ttf|eot|mp4|webm|zip)$/i;

const EXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs|css)$/i;

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shouldSkipFile(relPath, name) {
  if (EXCLUDE_FILE_RE.test(name)) return true;
  if (name.endsWith(".d.ts") && name.includes("next-env")) return false;
  if (relPath.includes("node_modules")) return true;
  return false;
}

function walkDir(absDir, relBase, acc) {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const name = e.name;
    if (e.isDirectory()) {
      if (EXCLUDE_DIR_NAMES.has(name)) continue;
      walkDir(path.join(absDir, name), relBase ? `${relBase}/${name}` : name, acc);
      continue;
    }
    if (!e.isFile()) continue;
    const rel = relBase ? `${relBase}/${name}` : name;
    if (shouldSkipFile(rel, name)) continue;
    if (!EXT_RE.test(name)) continue;
    acc.push({ abs: path.join(absDir, name), rel });
  }
}

function collectFiles() {
  const ordered = [];

  const rootConfigs = ["package.json", "tsconfig.json", "next.config.ts", "next-env.d.ts"];
  for (const f of rootConfigs) {
    const abs = path.join(ROOT, f);
    if (fs.existsSync(abs)) ordered.push({ abs, rel: f });
  }

  const srcRoot = path.join(ROOT, "src");
  const fromSrc = [];
  if (fs.existsSync(srcRoot)) walkDir(srcRoot, "src", fromSrc);
  fromSrc.sort((a, b) => a.rel.localeCompare(b.rel, "en"));
  ordered.push(...fromSrc);

  const rootJs = [];
  for (const name of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!name.isFile()) continue;
    if (!/\.(js|mjs|cjs)$/i.test(name.name)) continue;
    rootJs.push({ abs: path.join(ROOT, name.name), rel: name.name });
  }
  rootJs.sort((a, b) => a.rel.localeCompare(b.rel, "en"));
  ordered.push(...rootJs);

  const sensorRoot = path.join(ROOT, "sensor code");
  const sensors = [];
  if (fs.existsSync(sensorRoot)) walkDir(sensorRoot, "sensor code", sensors);
  sensors.sort((a, b) => a.rel.localeCompare(b.rel, "en"));
  ordered.push(...sensors);

  return ordered;
}

function fileToLines(file) {
  const rel = file.rel.replace(/\\/g, "/");
  const name = path.basename(rel);
  const header = [
    "",
    "================================================================================",
    `FILE PATH: ${rel}`,
    `FILE NAME: ${name}`,
    "================================================================================",
    "",
  ];
  let body;
  try {
    body = fs.readFileSync(file.abs, "utf8");
  } catch {
    body = "[unreadable file]";
  }
  const contentLines = body.split(/\r?\n/);
  return [...header, ...contentLines];
}

function buildAllLines(files) {
  const lines = [];
  for (const f of files) {
    lines.push(...fileToLines(f));
  }
  return lines;
}

function applyDepositRule(lines) {
  const n = lines.length;
  const maxLinesFull = MAX_FULL_PAGES * LINES_PER_PAGE;
  const firstN = PAGES_FIRST * LINES_PER_PAGE;
  const lastN = PAGES_LAST * LINES_PER_PAGE;

  if (n <= maxLinesFull) {
    return {
      lines,
      truncated: false,
      omitted: 0,
      totalLines: n,
    };
  }

  const first = lines.slice(0, firstN);
  const last = lines.slice(-lastN);
  const omitted = n - firstN - lastN;
  const bridge = [
    "",
    "================================================================================",
    `[ ${omitted} LINE(S) OMITTED — middle portion excluded per first 25 + last 25 pages deposit rule ]`,
    "================================================================================",
    "",
  ];
  return {
    lines: [...first, ...bridge, ...last],
    truncated: true,
    omitted,
    totalLines: n,
  };
}

function chunkPages(lines) {
  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  return pages;
}

function main() {
  const files = collectFiles();
  const allLines = buildAllLines(files);
  const { lines, truncated, omitted, totalLines } = applyDepositRule(allLines);
  const pages = chunkPages(lines);
  const approxTotalPages = Math.ceil(totalLines / LINES_PER_PAGE);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const coverNotice = `Copyright © ${new Date().getFullYear()} Corbin Craig. All rights reserved.`;

  const metaBlock = `
    <div class="meta">
      <p><strong>Deposit contents:</strong> Application source code (TypeScript, JavaScript, CSS) and related configuration files from the Cognitive Care Assistant repository.</p>
      <p><strong>Total source lines represented (full corpus before excerpt):</strong> ${totalLines.toLocaleString()}</p>
      <p><strong>Approximate full corpus length:</strong> ~${approxTotalPages} printed pages at ${LINES_PER_PAGE} lines per page.</p>
      <p><strong>This file:</strong> ${truncated ? `First ${PAGES_FIRST} pages and last ${PAGES_LAST} pages of the concatenated listing (${omitted.toLocaleString()} lines omitted from middle).` : "Complete concatenated listing (entire corpus fits within 50 pages at this line density)."}</p>
      <p><strong>Files included:</strong> ${files.length}</p>
    </div>
  `;

  const totalPrintPages = 1 + pages.length;
  const codeSheets = pages
    .map((chunk, idx) => {
      const text = chunk.map((ln) => escHtml(ln)).join("\n");
      const meta = idx === 0 ? metaBlock : "";
      const printPage = idx + 2;
      return `<div class="sheet code-sheet">${meta}<pre class="code">${text}\n</pre><div class="sheet-footer">Page ${printPage} of ${totalPrintPages}</div></div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cognitive Care Assistant — Copyright Deposit Copy</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Courier New", Courier, monospace;
      font-size: 9pt;
      line-height: 1.2;
      color: #000;
      background: #fff;
    }
    .sheet {
      page-break-after: always;
      min-height: 10in;
      padding: 0;
    }
    .sheet.code-sheet:last-of-type { page-break-after: auto; }
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-family: Georgia, "Times New Roman", serif;
    }
    .cover h1 {
      font-size: 22pt;
      margin: 0 0 0.5in 0;
      font-weight: bold;
    }
    .cover .author {
      font-size: 14pt;
      margin: 0.25in 0;
    }
    .cover .type {
      font-size: 12pt;
      margin-top: 0.75in;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .cover .notice {
      margin-top: 1in;
      font-size: 10pt;
      max-width: 5in;
      font-family: "Courier New", Courier, monospace;
    }
    .meta {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 10pt;
      line-height: 1.35;
      margin: 0 0 0.25in 0;
      padding: 0 0.1in;
    }
    .meta p { margin: 0.35em 0; }
    pre.code {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: "Courier New", Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.15;
    }
    .sheet-footer {
      margin-top: 0.2in;
      font-size: 8pt;
      font-family: Georgia, serif;
      color: #333;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet cover">
    <h1>Cognitive Care Assistant</h1>
    <p class="author"><strong>Authors:</strong> Corbin Craig</p>
    <p class="type">Copyright Deposit Copy</p>
    <p class="notice">${escHtml(coverNotice)}</p>
    <div class="sheet-footer" style="margin-top:1.5in;font-family:Georgia,serif">Page 1 of ${1 + pages.length}</div>
  </div>
${codeSheets}
</body>
</html>`;

  fs.writeFileSync(OUT_HTML, html, "utf8");
  console.log("Wrote:", OUT_HTML);
  console.log("Files:", files.length, "| Deposit lines:", lines.length, "| Code sheets:", pages.length, "| Truncated:", truncated);
}

main();
