// Kiểm thử đầu-cuối bằng Playwright: node tests/e2e.mjs
// - Tự bật server tĩnh có rewrites giống serve.json / vercel.json, giả lập POST /api/ask (không gọi Gemini).
// - Bài Đo tốc độ: chạy hết các bước với câu hỏi mồi bật; mỗi câu chọn một đáp án sai (kiểm tra nhận xét), rồi chọn đúng;
//   chế độ tự do: đổi từng thông số, đo vài lần; hỏi trợ lý AI một câu.
// - Các bài cũ: mở trang, chạy bước 1.
// - Không được có lỗi console. Ảnh chụp lưu ở tests/screenshots/.
// Trình duyệt: dùng Edge hoặc Chrome có sẵn trên máy; không có thì dùng Chromium của Playwright (npx playwright install chromium).

import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'tests', 'screenshots');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const MON = ['vat-li', 'hoa-hoc', 'sinh-hoc'];

/* ---------- server tĩnh + giả lập /api/ask ---------- */
function rewrite(path){
  const p = path.split('/').filter(Boolean);
  if (p.length === 1 && MON.includes(p[0])) return '/subject.html';
  if (p.length === 2 && MON.includes(p[0]) && !extname(p[1])) return '/lab.html';
  if (path === '/') return '/index.html';
  return path;
}
const asked = [];
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/ask'){
    let body = ''; for await (const c of req) body += c;
    const data = JSON.parse(body || '{}'); asked.push(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: 'Trả lời giả lập cho kiểm thử.' })); return;
  }
  const file = normalize(join(ROOT, rewrite(decodeURIComponent(url.pathname))));
  if (!file.startsWith(ROOT)){ res.writeHead(403); res.end(); return; }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(buf);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ---------- tiện ích ---------- */
let failures = 0;
const ok = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { failures++; console.log('  ✗ ' + msg); } };
async function launch(){
  for (const channel of ['msedge', 'chrome', undefined]){
    try { return await chromium.launch(channel ? { channel } : {}); } catch {}
  }
  throw new Error('Không mở được trình duyệt. Chạy: npx playwright install chromium');
}
function watch(page){
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  return errors;
}
await mkdir(SHOTS, { recursive: true });
const shot = (page, name) => page.screenshot({ path: join(SHOTS, name + '.png') });
const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

const browser = await launch();
// giảm chuyển động: lõi chạy hoạt ảnh nhanh hơn (đường đi của bài vẫn như cũ)
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });

/* ---------- bài Đo tốc độ ---------- */
{
  console.log('Bài Đo tốc độ');
  const L = (await import(pathToFileURL(join(ROOT, 'assets/js/lessons/do-toc-do.js')).href)).default;
  const page = await ctx.newPage(), errors = watch(page);
  await page.goto(BASE + '/vat-li/do-toc-do');
  await page.waitForSelector('[data-el="bench"]');
  ok((await page.title()).includes('Đo tốc độ'), 'mở được trang bài');
  await shot(page, 'do-toc-do-1366');

  await page.click('[data-el="btnPlay"]');
  const seen = new Set();
  for (let guard = 0; guard < 12; guard++){
    // chờ câu hỏi mồi tiếp theo, hoặc chạy xong cả lượt
    const which = await Promise.race([
      page.waitForSelector('[data-el="bPanel"] .opt', { timeout: 90000 }).then(() => 'q'),
      page.waitForFunction(() => document.querySelector('[data-el="playLabel"]').textContent === 'Chạy lại từ đầu', null, { timeout: 90000 }).then(() => 'done')
    ]);
    if (which === 'done') break;
    const qText = await page.textContent('[data-el="bPanel"] .b-q');
    const q = L.questions.find(x => x.text === qText.trim());
    ok(!!q, 'câu hỏi mồi hiện ra: ' + (q ? q.id : qText));
    if (!q) break;
    seen.add(q.id);
    const wrong = q.answer === 0 ? 1 : 0;
    await page.keyboard.press('ABCD'[wrong]);
    await page.waitForSelector('[data-el="bPanel"] .verdict.bad', { timeout: 60000 });
    const fb = await page.textContent('[data-el="bPanel"] .fb-box');
    ok(fb.includes(q.wrong[wrong]), `${q.id}: chọn sai ${'ABCD'[wrong]} → hiện đúng nhận xét`);
    await shot(page, `do-toc-do-${q.id}-sai`);
    await page.click('[data-el="bPanel"] [data-act="go"]');
    await page.waitForSelector('[data-el="bPanel"] .opt', { timeout: 30000 });
    await page.keyboard.press('ABCD'[q.answer]);
    await page.waitForSelector('[data-el="bPanel"] .verdict.ok', { timeout: 60000 });
    ok((await page.textContent('[data-el="bPanel"] .fb-box')).includes(q.right), `${q.id}: chọn đúng → hiện lời giải thích`);
    await shot(page, `do-toc-do-${q.id}-dung`);
    await page.click('[data-el="bPanel"] [data-act="go"]');
  }
  ok(seen.size === L.questions.length, `gặp đủ ${L.questions.length} câu hỏi mồi (${[...seen].join(', ')})`);
  const doneSteps = await page.$$eval('[data-el="stepList"] .step.done', a => a.length);
  ok(doneSteps === L.steps.length, `chạy xong ${doneSteps}/${L.steps.length} bước`);
  await shot(page, 'do-toc-do-ket-luan');

  // số liệu câu hỏi mồi được ghi trên máy
  const statRows = await page.$$eval('[data-el="statsBody"] tr', rs => rs.map(r => r.children[2].textContent));
  ok(statRows.every(t => t === '1'), 'bảng số liệu ghi 1 lượt hỏi cho mỗi câu');

  // hỏi trợ lý AI
  await page.click('[data-el="orb"]');
  await page.fill('[data-el="chatInput"]', 'Vì sao phải đo nhiều lần?');
  await page.press('[data-el="chatInput"]', 'Enter');
  await page.waitForFunction(() => [...document.querySelectorAll('.msg.ai')].some(m => m.textContent.includes('giả lập')), null, { timeout: 15000 });
  const last = asked[asked.length - 1];
  ok(last && last.lesson === 'do-toc-do' && /Bảng|vạch|đồng hồ/.test(last.state), 'gửi /api/ask đúng hợp đồng, có mô tả trạng thái');
  await page.click('[data-el="chatClose"]');

  // từng bước bấm riêng (nhảy bước, không có lỗi)
  for (let i = 0; i < L.steps.length; i++){
    await page.click(`[data-el="stepList"] li:nth-child(${i + 1}) .step`);
    await page.waitForTimeout(250);
  }
  await page.click('[data-el="btnReset"]');

  // chế độ tự do
  await page.click('[data-mode="free"]');
  await page.waitForSelector('[data-el="freeBox"]:not([hidden])');
  const setRange = (key, v) => page.$eval(`#fc-${key}`, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const act = label => page.click(`.fc-act:text-is("${label}")`);
  const caption = () => page.textContent('[data-el="capText"]');
  await setRange('books', 4); await page.waitForTimeout(400);
  ok((await caption()).includes('4 cuốn sách'), 'đổi số cuốn sách');
  await setRange('s', 35); await page.waitForTimeout(400);
  ok((await caption()).includes('s = 35 cm'), 'đổi quãng đường s');
  await act('Đo thêm một lần'); await act('Đo thêm một lần');
  await page.waitForFunction(() => document.querySelector('[data-el="capText"]').textContent.includes('Đã đo 2 lần'), null, { timeout: 30000 });
  ok(true, 'bấm tay: đo 2 lần, bảng tự tính trung bình');
  await shot(page, 'do-toc-do-tu-do-bam-tay');
  await page.click('.fc-seg button[data-v="cong"]');
  await page.waitForTimeout(300);
  ok((await caption()).includes('cổng quang điện'), 'đổi cách đo sang cổng quang điện (bảng xóa)');
  await act('Đo thêm một lần'); await act('Đo thêm một lần');
  await page.waitForFunction(() => document.querySelector('[data-el="capText"]').textContent.includes('Các lần đo bằng nhau'), null, { timeout: 30000 });
  ok(true, 'cổng quang điện: các lần đo bằng nhau');
  await shot(page, 'do-toc-do-tu-do-cong');
  // kéo vạch đích bằng bàn phím (bút trình chiếu)
  await page.focus('body'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
  ok((await caption()).includes('s = 36 cm'), 'phím → dịch vạch đích');
  await act('Xóa bảng'); await page.waitForTimeout(300);
  ok((await caption()).includes('Chưa đo'), 'xóa bảng');
  await page.click('[data-mode="steps"]');

  ok(await noHScroll(page), 'không cuộn ngang ở 1366×768');
  ok(errors.length === 0, 'không có lỗi console' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

/* ---------- trang phần Vật lí có thẻ bài mới ---------- */
{
  console.log('Trang phần Vật lí');
  const page = await ctx.newPage(), errors = watch(page);
  await page.goto(BASE + '/vat-li');
  await page.waitForSelector('a[href="/vat-li/do-toc-do"]', { state: 'attached' });
  // thẻ bài nằm ở tab lớp 7
  const tab = await page.$('.gtab:has-text("7")'); if (tab) await tab.click();
  await page.waitForTimeout(300);
  const card = await page.$('a[href="/vat-li/do-toc-do"]');
  ok(!!card && await card.isVisible(), 'có thẻ bài Đo tốc độ');
  if (card){ await card.scrollIntoViewIfNeeded(); await card.hover(); await page.waitForTimeout(1500); }
  await shot(page, 'vat-li-1366');
  ok(errors.length === 0, 'không có lỗi console' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

/* ---------- điện thoại 390×844 ---------- */
{
  console.log('Điện thoại 390×844');
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  for (const [url, name] of [['/vat-li', 'vat-li-390'], ['/vat-li/do-toc-do', 'do-toc-do-390']]){
    const page = await phone.newPage(), errors = watch(page);
    await page.goto(BASE + url); await page.waitForTimeout(800);
    if (url.endsWith('do-toc-do')){
      await page.click('[data-el="btnNext"]'); await page.click('[data-el="btnNext"]'); await page.click('[data-el="btnNext"]');
      await page.waitForSelector('[data-el="bPanel"] .opt', { timeout: 30000 });
    }
    await shot(page, name);
    ok(await noHScroll(page), `${url}: không cuộn ngang`);
    ok(errors.length === 0, `${url}: không có lỗi console` + (errors.length ? ': ' + errors.join(' | ') : ''));
    await page.close();
  }
  await phone.close();
}

/* ---------- các bài cũ: mở trang, chạy bước 1 ---------- */
for (const href of ['/vat-li/thau-kinh', '/hoa-hoc/toc-do-phan-ung', '/sinh-hoc/quang-hop']){
  console.log('Bài ' + href);
  const page = await ctx.newPage(), errors = watch(page);
  await page.goto(BASE + href);
  await page.waitForSelector('[data-el="bench"]');
  await page.click('[data-el="askWrap"]');   // bước 1 có thể có câu hỏi mồi; tắt để chạy thẳng
  await page.click('[data-el="btnNext"]');
  await page.waitForSelector('[data-el="stepList"] li:first-child .step.done', { timeout: 30000 });
  ok(true, 'chạy xong bước 1');
  ok(errors.length === 0, 'không có lỗi console' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await page.close();
}

await browser.close(); server.close();
console.log(failures ? `\n${failures} kiểm tra KHÔNG đạt.` : '\nTất cả kiểm tra đều đạt.');
process.exit(failures ? 1 : 0);
