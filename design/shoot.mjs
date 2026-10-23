// 목업(mockups.html)의 화면마다 PNG를 찍고, 요약 자료(summary.html)를 PDF로 만든다.
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('design');
let browser;
for (const channel of ['chrome', 'msedge']) {
  try { browser = await chromium.launch({ channel, headless: true }); break; } catch {}
}
if (!browser) browser = await chromium.launch({ headless: true });

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(pathToFileURL(path.join(root, 'mockups.html')).href);
for (const id of ['SCR-01', 'SCR-02', 'SCR-03', 'SCR-04', 'SCR-05', 'SCR-06', 'SCR-07']) {
  await page.locator('#' + id).screenshot({ path: path.join(root, 'images', id + '.png') });
}

if (process.argv.includes('--pdf')) {
  const pdfPage = await browser.newPage();
  await pdfPage.goto(pathToFileURL(path.resolve('summary.html')).href, { waitUntil: 'load' });
  await pdfPage.pdf({ path: path.resolve('CodeCoach-화면설계-요약.pdf'), format: 'A4', landscape: true, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
}
await browser.close();
console.log('ok');
