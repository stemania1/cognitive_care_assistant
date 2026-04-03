const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'codebase-copyright-deposit.pdf');
const LINES_PER_PAGE = 52;
const PAGES_FIRST = 25;
const PAGES_LAST = 25;

function getFiles(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
      out.push(...getFiles(path.join(dir, e.name), rel));
    } else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
      out.push(rel);
    }
  }
  return out.sort();
}

const files = getFiles(SRC);
const lines = [];
for (const rel of files) {
  const content = fs.readFileSync(path.join(SRC, rel), 'utf8').split(/\r?\n/);
  lines.push('', '// ========== src/' + rel + ' ==========', '');
  lines.push(...content);
}

const n = lines.length;
const takeFirst = PAGES_FIRST * LINES_PER_PAGE;
const takeLast = PAGES_LAST * LINES_PER_PAGE;
let first = lines.slice(0, takeFirst);
let last = n > takeFirst + takeLast ? lines.slice(-takeLast) : [];
const middle = n > takeFirst + takeLast ? ['', '... [ ' + (n - takeFirst - takeLast) + ' lines omitted ] ...', ''] : [];
const all = [...first, ...middle, ...last];

const doc = new PDFDocument({ margin: 50, size: 'letter' });
doc.pipe(fs.createWriteStream(OUT));
doc.font('Courier').fontSize(9);

let count = 0;
for (const line of all) {
  if (count >= LINES_PER_PAGE) {
    doc.addPage();
    count = 0;
  }
  doc.text(line || ' ', { lineBreak: false });
  doc.text(' ', { lineBreak: true });
  count++;
}

doc.end();
console.log('Saved:', OUT);
