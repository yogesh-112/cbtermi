const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const docs = [
  { file: '01-master-product-document.html', out: '01-Master-Product-Document.pdf' },
  { file: '02-marketing-sales-document.html', out: '02-Marketing-Sales-Playbook.pdf' },
  { file: '03-end-user-guide.html',           out: '03-End-User-Guide.pdf' },
  { file: '04-qa-testing-process.html',       out: '04-QA-Testing-Process.pdf' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const doc of docs) {
    const filePath = 'file:///' + path.join(__dirname, doc.file).replace(/\\/g, '/');
    const outPath  = path.join(__dirname, doc.out);

    console.log(`Generating: ${doc.out} ...`);
    const page = await browser.newPage();
    await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 60000 });

    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
    });

    await page.close();
    console.log(`  ✓ Saved: ${doc.out}`);
  }

  await browser.close();
  console.log('\nAll 3 PDFs generated in E:\\cbv1\\docs\\');
})();
