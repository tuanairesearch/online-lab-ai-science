// Thí nghiệm: Tốc độ phản ứng – đá vôi với acid HCl (KHTN 8 – Bài 7, Kết nối tri thức)
// Đặc tả: docs/lessons/hoa-hoc/toc-do-phan-ung.md (bản nháp, giáo viên đang duyệt).
// Đơn vị cảnh: ô vẽ, không theo tỉ lệ thật. Thể tích khí và đồ thị tính bằng công thức:
//   CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O; 0,5 g CaCO₃ = 0,005 mol → 0,005 mol CO₂ ≈ 124 mL (24,79 L/mol, 25 °C, 1 bar).
//   V(t) = V_max · (1 − e^(−r·t)), r = R0 × (nồng độ / 1 M) × hệ số bề mặt × 2^((T − 25)/10).
//   R0 và hệ số bề mặt là số MINH HỌA (đúng xu hướng, không phải số đo thật). Acid luôn dư nên V_max không đổi.

import { fmt } from '../engine.js';

const MASS = 0.5, VMAX = MASS / 100 * 24790;      // g CaCO₃; mL CO₂ tối đa (≈ 124 mL)
const R0 = Math.LN2 / 120;                          // đá vôi viên, HCl 1 M, 25 °C: nửa lượng khí sau 120 s (minh họa)
const SURFACE = { vien: 1, manh: 3, bot: 10 };      // hệ số bề mặt (minh họa)
const FORM_NAME = { vien: 'đá vôi viên', manh: 'đá vôi mảnh nhỏ', bot: 'đá vôi bột' };
const T_END = 600, SYR_MAX = 150;                   // thời gian thí nghiệm (s); vạch lớn nhất của xi lanh (mL)
const STD = { form: 'vien', C: 1, T: 25, vol: 50 }; // bình chuẩn: đá vôi viên, 50 mL HCl 1 M, nhiệt độ phòng
const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- hóa học ---------- */
const rate = f => f.C <= 0 ? 0 : R0 * f.C * SURFACE[f.form] * Math.pow(2, (f.T - 25) / 10);
const gasAt = (f, t) => VMAX * (1 - Math.exp(-rate(f) * t));
const gasNow = (S, f) => S.run ? gasAt(f, S.t) : 0;
const solidLeft = (S, f) => MASS * (1 - gasNow(S, f) / VMAX);   // g đá vôi còn lại
const liquidName = f => f.C > 0 ? `HCl ${fmt(f.C)} M` : 'nước cất';
const tempName = T => T === 25 ? 'nhiệt độ phòng' : T <= 5 ? 'ngâm nước đá' : T < 25 ? 'làm lạnh' : 'ngâm nước ấm';
const condText = f => `${FORM_NAME[f.form]} ${fmt(MASS)} g, ${f.vol} mL ${f.C > 0 ? 'dung dịch ' : ''}${liquidName(f)}, ${f.T} °C (${tempName(f.T)})`;
// so sánh tốc độ bình 2 với bình 1
function compare(f1, f2){
  const r1 = rate(f1), r2 = rate(f2);
  if (r2 === 0) return 'none';
  return r2 > r1 * 1.02 ? 'faster' : r2 < r1 / 1.02 ? 'slower' : 'same';
}
// những yếu tố bình 2 khác bình 1, kèm chiều tác động
function diffs(f1, f2){
  const out = [];
  if (f2.form !== f1.form) out.push({ text: f2.form === 'bot' ? 'dạng bột' : f2.form === 'manh' ? 'mảnh nhỏ' : 'dạng viên', why: SURFACE[f2.form] > SURFACE[f1.form] ? 'diện tích bề mặt lớn hơn' : 'diện tích bề mặt nhỏ hơn', up: SURFACE[f2.form] > SURFACE[f1.form] });
  if (f2.C !== f1.C) out.push(f2.C <= 0 ? { text: 'nước cất', why: 'không có acid', up: false }
    : { text: `HCl ${fmt(f2.C)} M`, why: f2.C > f1.C ? 'acid đặc hơn' : 'acid loãng hơn', up: f2.C > f1.C });
  if (f2.T !== f1.T) out.push({ text: `${f2.T} °C`, why: f2.T > f1.T ? 'nhiệt độ cao hơn' : 'nhiệt độ thấp hơn', up: f2.T > f1.T });
  if (f2.vol !== f1.vol) out.push({ text: `${f2.vol} mL`, why: 'nhiều dung dịch hơn nhưng nồng độ không đổi', up: null });
  return out;
}

/* ---------- vẽ ---------- */
let g, S;
const FLASK_X = [-29, -11], BENCH = -13;
const halfW = y => y >= -1 ? 1.4 : 1.4 + (-1 - y) / 12 * 4.1;   // nửa bề rộng bình tam giác ở độ cao y
const levelY = f => BENCH + 3.2 * f.vol / 50 * S.acidA;          // mực chất lỏng (chỉ để minh họa)
function flaskPath(cx){
  const { ctx, X, Y } = g;
  ctx.beginPath(); ctx.moveTo(X(cx - 1.4), Y(2)); ctx.lineTo(X(cx - 1.4), Y(-1)); ctx.lineTo(X(cx - 5.5), Y(BENCH));
  ctx.lineTo(X(cx + 5.5), Y(BENCH)); ctx.lineTo(X(cx + 1.4), Y(-1)); ctx.lineTo(X(cx + 1.4), Y(2)); ctx.closePath();
}
// chữ dưới mỗi bình: thu nhỏ cho vừa bề rộng một bình (màn hình điện thoại hẹp)
function fitText(t, x, y, maxW, opts){
  let size = opts.size;
  g.ctx.font = g.font(size, opts.weight || 500);
  const w = g.ctx.measureText(t).width;
  if (w > maxW) size = Math.max(8, Math.floor(size * maxW / w));
  g.text(t, x, y, { ...opts, size });
}
const seed = i => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
function drawBath(cx, f){
  if (f.T === 25) return;
  const { ctx, X, Y, C, sc } = g, col = f.T > 25 ? C.warm : C.cold;
  ctx.save(); ctx.globalAlpha = S.setA * .22; ctx.fillStyle = col;
  g.rr(X(cx - 7.5), Y(-6), 15 * sc, 7.4 * sc, 8); ctx.fill();
  ctx.globalAlpha = S.setA * .8; ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
}
function drawSolid(cx, f){
  if (S.solidDrop <= 0) return;
  const { ctx, X, Y, C, sc } = g;
  const q = S.run ? 1 - gasNow(S, f) / VMAX : 1; if (q < 0.01) return;
  const k = Math.cbrt(q), y = 2 + (BENCH + 0.5 - 2) * S.solidDrop;
  ctx.save(); ctx.fillStyle = C.solid; ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1;
  const blob = (x, yy, r) => { ctx.beginPath(); ctx.arc(X(x), Y(yy + r), r * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  if (f.form === 'vien') blob(cx, y - 0.5, 1.3 * k);
  else if (f.form === 'manh') for (let i = -2; i <= 2; i++) blob(cx + i * 0.95, y - 0.5, 0.55 * k);
  else { const n = Math.round(60 * q); for (let i = 0; i < n; i++) blob(cx + (seed(i) * 2 - 1) * 4 * Math.min(1, S.solidDrop + .3), y - 0.5 + seed(i + 99) * 0.5, 0.17); }
  ctx.restore();
}
function drawBubbles(cx, f){
  if (!S.run || S.solidDrop < 1 || f.C <= 0) return;
  const q = 1 - gasNow(S, f) / VMAX; if (q < 0.01) return;
  const r = rate(f), dV = r * VMAX * Math.exp(-r * S.t);              // mL khí thoát ra mỗi giây (của mô phỏng)
  const n = Math.min(44, Math.round(30 * Math.sqrt(dV / 7)));
  const spread = f.form === 'vien' ? 1 : f.form === 'manh' ? 2.4 : 4, top = levelY(f), bot = BENCH + 0.6;
  const now = REDUCE ? 0 : performance.now() / 1000;
  const { ctx, X, Y, C, sc } = g;
  ctx.save(); ctx.strokeStyle = C.gas; ctx.lineWidth = 1.3; ctx.globalAlpha = .9;
  for (let i = 0; i < n; i++){
    const s = seed(i), p = (now * (0.5 + 0.5 * seed(i + 7)) + s * 5) % 1;
    const y = bot + p * (top - bot - 0.3);
    let x = cx + (s * 2 - 1) * spread + 0.25 * Math.sin(now * 3 + i);
    const lim = halfW(y) - 0.4; x = Math.max(cx - lim, Math.min(cx + lim, x));
    ctx.beginPath(); ctx.arc(X(x), Y(y), (0.14 + 0.16 * seed(i + 3)) * sc, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
function drawFlask(i){
  const cx = FLASK_X[i], f = i ? S.f2 : S.f1, { ctx, X, Y, C, sc } = g, col = i ? C.obj : C.glass;
  if (S.setA <= 0.01) return;
  ctx.save(); ctx.globalAlpha = S.setA;
  drawBath(cx, f);
  // chất lỏng, đá vôi, bọt khí nằm trong lòng bình
  ctx.save(); flaskPath(cx); ctx.clip();
  if (S.acidA > 0.01){ const ly = levelY(f); ctx.fillStyle = C.liquid; ctx.globalAlpha = S.setA * .45; ctx.fillRect(X(cx - 6), Y(ly), 12 * sc, (ly - BENCH) * sc); ctx.globalAlpha = S.setA; }
  drawSolid(cx, f); drawBubbles(cx, f);
  ctx.restore();
  flaskPath(cx); ctx.strokeStyle = C.glass; ctx.lineWidth = 2; ctx.stroke();
  // nút cao su, ống dẫn khí, xi lanh
  ctx.fillStyle = C['stage-muted']; ctx.fillRect(X(cx - 1.7), Y(3), 3.4 * sc, 1.4 * sc);
  ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(X(cx), Y(3)); ctx.lineTo(X(cx), Y(5)); ctx.lineTo(X(cx - 7.4), Y(5)); ctx.lineTo(X(cx - 7.4), Y(8)); ctx.lineTo(X(cx - 6), Y(8)); ctx.stroke();
  const V = gasNow(S, f), xp = cx - 6 + 12 * V / SYR_MAX;
  ctx.fillStyle = C.gas; ctx.globalAlpha = S.setA * .3; ctx.fillRect(X(cx - 6), Y(8.8), (xp - cx + 6) * sc, 1.6 * sc); ctx.globalAlpha = S.setA;
  ctx.strokeStyle = C.glass; ctx.lineWidth = 1.6; ctx.strokeRect(X(cx - 6), Y(8.8), 12 * sc, 1.6 * sc);
  ctx.lineWidth = 1;
  for (let v = 25; v < SYR_MAX; v += 25){ const x = X(cx - 6 + 12 * v / SYR_MAX); ctx.beginPath(); ctx.moveTo(x, Y(8.8)); ctx.lineTo(x, Y(v % 50 ? 8.4 : 8.1)); ctx.stroke(); }
  ctx.strokeStyle = C['stage-ink']; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(xp), Y(8.7)); ctx.lineTo(X(xp), Y(7.3)); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(xp), Y(8)); ctx.lineTo(X(xp + 7), Y(8)); ctx.moveTo(X(xp + 7), Y(8.8)); ctx.lineTo(X(xp + 7), Y(7.2)); ctx.stroke();
  // chữ: tên bình, thể tích khí, điều kiện
  g.text(`Bình ${i + 1}`, X(cx), Y(14.2), { color: col, weight: 700, size: g.fs() + 2 });
  g.text(`${fmt(V)} mL`, X(cx), Y(11.4), { color: col, weight: 700, mono: true, size: g.fs() + 5 });
  const small = g.fs() + 1, maxW = 17 * sc;
  fitText(FORM_NAME[f.form].replace(/^đ/, 'Đ') + ` ${fmt(MASS)} g`, X(cx), Y(-15), maxW, { size: small });
  fitText(`${f.vol} mL ${liquidName(f)} · ${f.T} °C`, X(cx), Y(-17), maxW, { size: small, color: f.T > 25 ? C.warm : f.T < 25 ? C.cold : C['stage-ink'] });
  if (i === 1){ const d = diffs(S.f1, S.f2); if (d.length) fitText('Khác bình 1: ' + d.map(x => x.text).join(', '), X(cx), Y(-19), maxW, { size: small, color: C.beam, weight: 700 }); }
  ctx.restore();
}
const GR = { x0: 4, x1: 35, y0: -9, y1: 12 };
function drawGraph(){
  if (S.setA <= 0.01) return;
  const { ctx, X, Y, C } = g, small = g.fs();
  const gx = t => X(GR.x0 + (GR.x1 - GR.x0) * t / T_END), gy = v => Y(GR.y0 + (GR.y1 - GR.y0) * v / SYR_MAX);
  ctx.save(); ctx.globalAlpha = S.setA;
  ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 1;
  for (let v = 50; v <= SYR_MAX; v += 50){ ctx.beginPath(); ctx.moveTo(gx(0), gy(v)); ctx.lineTo(gx(T_END), gy(v)); ctx.stroke(); }
  ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(gx(0), gy(SYR_MAX)); ctx.lineTo(gx(0), gy(0)); ctx.lineTo(gx(T_END), gy(0)); ctx.stroke();
  for (let v = 0; v <= SYR_MAX; v += 50) g.text(String(v), gx(0) - 6, gy(v), { size: small, color: C['stage-muted'], mono: true, align: 'right' });
  for (let t = 0; t <= T_END; t += 200) g.text(String(t), gx(t), gy(0) + 14, { size: small, color: C['stage-muted'], mono: true });
  g.text('Thể tích khí CO₂ (mL)', gx(0), gy(SYR_MAX) - 16, { size: small, color: C['stage-muted'], align: 'left', weight: 600 });
  g.text('Thời gian (s)', gx(T_END / 2), gy(0) + 34, { size: small, color: C['stage-muted'], weight: 600 });
  // lượng khí tối đa theo phương trình hóa học
  ctx.setLineDash([6, 6]); ctx.strokeStyle = C.img; ctx.beginPath(); ctx.moveTo(gx(0), gy(VMAX)); ctx.lineTo(gx(T_END), gy(VMAX)); ctx.stroke(); ctx.setLineDash([]);
  g.text(`Tối đa ≈ ${fmt(VMAX)} mL`, gx(T_END), gy(VMAX) - 11, { size: small, color: C.img, align: 'right', weight: 600 });
  if (S.run){
    [[S.f1, C.glass, 'Bình 1'], [S.f2, C.obj, 'Bình 2']].forEach(([f, col, lab], i) => {
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let k = 0; k <= 90; k++){ const t = S.t * k / 90, x = gx(t), y = gy(gasAt(f, t)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      const ex = gx(S.t), ey = gy(gasAt(f, S.t));
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fill();
      g.text(lab, ex + 8, ey + (i ? 12 : -12), { size: small, color: col, weight: 700, align: 'left' });
    });
  }
  ctx.restore();
}
function drawBench(){
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X(-39), Y(BENCH)); ctx.lineTo(X(-1), Y(BENCH)); ctx.stroke(); ctx.restore();
}

/* ---------- câu hỏi mồi ---------- */
const REF7 = 'SGK KHTN 8 · Bài 7 Tốc độ phản ứng và chất xúc tác';
// cho đá vôi vào hai bình cùng lúc rồi để phản ứng chạy hết thời gian thí nghiệm
async function runPair(h, f2){
  const S = h.S;
  if (f2) S.f2 = { ...S.f1, ...f2 };
  Object.assign(S, { run: 0, t: 0, solidDrop: 0 });
  await h.tw({ solidDrop: 1 }, 700);
  S.run = 1;
  await h.tw({ t: T_END }, 7000);
  await h.wait(500);
}
async function clearPair(h){ Object.assign(h.S, { run: 0, t: 0, solidDrop: 0 }); h.S.f2 = { ...h.S.f1 }; await h.wait(200); }
const questions = [
  { id:'q1', short:'Dạng đá vôi nào tan nhanh nhất?', tag:'Diện tích bề mặt',
    text:'Cùng 0,5 g đá vôi, cùng 50 mL HCl 1 M. Em cho đá vôi dạng nào vào bình 2 để khí thoát ra nhanh nhất?',
    opts:['Một viên to (như bình 1)','Vài mảnh nhỏ','Bột mịn','Một viên to, nhưng đổ gấp đôi acid (100 mL)'], answer:2,
    cfg:[{ form:'vien' }, { form:'manh' }, { form:'bot' }, { form:'vien', vol:100 }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Hai bình y hệt nhau thì khí ra bằng nhau, hai đường trên đồ thị trùng nhau. Em thử đổi hình dạng đá vôi xem.',
      'Nhanh hơn viên to rồi! Còn cách nào để acid chạm vào đá vôi nhiều hơn nữa?',
      null,
      'Thêm acid mà nồng độ vẫn như cũ thì bọt không ra nhanh hơn. Acid chỉ phản ứng ở chỗ chạm vào mặt ngoài viên đá vôi.'
    ],
    hint2:'Gợi ý: chia nhỏ đá vôi thì phần mặt ngoài chạm vào acid nhiều hơn hay ít hơn?',
    right:'Đá vôi càng nhỏ thì diện tích bề mặt tiếp xúc với acid càng lớn, phản ứng càng nhanh. Lượng khí cuối cùng vẫn bằng nhau vì cùng 0,5 g đá vôi.',
    ref: REF7 },
  { id:'q2', short:'Dùng acid nào để sủi nhanh hơn?', tag:'Nồng độ',
    text:'Bình 1 đang dùng HCl 0,5 M. Em chọn gì cho bình 2 để khí thoát ra nhanh hơn?',
    opts:['HCl 0,5 M (như bình 1)','HCl 0,5 M pha thêm 50 mL nước','Nước cất','HCl 2 M'], answer:3,
    cfg:[{ C:0.5 }, { C:0.25, vol:100 }, { C:0 }, { C:2 }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Cùng nồng độ nên hai bình sủi như nhau, hai đường trên đồ thị trùng nhau.',
      'Pha thêm nước làm acid loãng hơn (còn 0,25 M), bọt còn ra chậm hơn bình 1!',
      'Nước không phản ứng với đá vôi nên không có bọt khí nào, xi lanh đứng yên.',
      null
    ],
    hint2:'Gợi ý: trong cùng một thể tích, acid đặc hơn có nhiều hay ít chất phản ứng hơn?',
    right:'Nồng độ acid càng lớn thì phản ứng càng nhanh. Lượng khí cuối cùng vẫn bằng nhau vì acid đều dư, lượng đá vôi như nhau.',
    ref: REF7 },
  { id:'q3', short:'Làm sao cho phản ứng CHẬM lại?', tag:'Nhiệt độ',
    text:'Trước khi thử đun nóng, em nghĩ ngược lại: muốn bình 2 phản ứng CHẬM hơn bình 1, em làm gì?',
    opts:['Ngâm bình 2 vào nước ấm 50 °C','Ngâm bình 2 vào cốc nước đá','Nghiền đá vôi thành bột','Dùng HCl 2 M'], answer:1,
    cfg:[{ T:50 }, { T:5 }, { form:'bot' }, { C:2 }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Bình nóng sủi còn mạnh hơn! Nhiệt độ cao làm phản ứng nhanh lên.',
      null,
      'Bột có diện tích bề mặt lớn, phản ứng nhanh hơn, ngược với điều cần.',
      'Acid đặc hơn làm phản ứng nhanh hơn, ngược với điều cần.'
    ],
    hint2:'Gợi ý: vì sao nhà em cất thức ăn trong tủ lạnh?',
    right:'Nhiệt độ thấp làm phản ứng chậm lại. Vì thế người ta cất thực phẩm trong tủ lạnh để chúng lâu hỏng.',
    ref: REF7 }
];

/* ---------- các bước ---------- */
const CONCLUSION = `<div class="concl-wrap"><table class="concl"><thead><tr><th>Yếu tố</th><th>Thay đổi</th><th>Tốc độ phản ứng</th></tr></thead><tbody>
<tr><th>Diện tích bề mặt</th><td>Chất rắn càng nhỏ (bột)</td><td>Tăng</td></tr>
<tr><th>Nồng độ</th><td>Dung dịch càng đặc</td><td>Tăng</td></tr>
<tr><th>Nhiệt độ</th><td>Nhiệt độ càng cao</td><td>Tăng</td></tr></tbody></table></div>`;

const steps = [
  { title:'Chuẩn bị, an toàn',
    sgk:'Đeo kính bảo hộ và găng tay. Rót 50 mL dung dịch HCl 1 M vào mỗi bình tam giác. Mỗi bình nối với một xi lanh để đo thể tích khí.',
    note:'Khi cho đá vôi vào acid sẽ có phản ứng: CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O. Khí CO₂ thoát ra thành bọt và đẩy pít-tông xi lanh. Khí ra càng nhanh thì phản ứng càng nhanh.',
    chips:[
      { q:'Bọt khí là khí gì?', a:'Đó là khí carbon dioxide (CO₂), sinh ra khi đá vôi phản ứng với acid.' },
      { q:'Vì sao phải đeo kính, găng tay?', a:'Acid HCl ăn mòn da và mắt. Khi làm thí nghiệm thật, phải đeo kính, găng tay, không ngửi hay nếm hóa chất.' } ],
    setup(S){ S.setA = 0; S.acidA = 0; },
    async run(h){ await h.tw({ setA:1 }, 700); await h.tw({ acidA:1 }, 1200); } },
  { title:'Diện tích bề mặt', q:true,
    sgk:'Bình 1: cho 0,5 g đá vôi dạng viên. Bình 2: cũng 0,5 g đá vôi nhưng ở dạng khác, sao cho khí thoát ra nhanh nhất. Cho vào hai bình cùng lúc.',
    note:'Đá vôi dạng bột sủi bọt mạnh hơn, xi lanh đầy nhanh hơn, đá vôi hết sớm hơn. Cuối cùng hai bình thu được cùng một lượng khí (đường nét đứt) vì cùng 0,5 g đá vôi.',
    chips:[
      { q:'Diện tích bề mặt là gì?', a:'Là phần mặt ngoài của chất rắn chạm được vào dung dịch. Chia nhỏ chất rắn thì tổng phần mặt ngoài tăng lên, nên acid tiếp xúc được nhiều hơn.' },
      { q:'Vì sao hai bình cuối cùng có cùng lượng khí?', a:'Vì hai bình có cùng 0,5 g đá vôi. Diện tích bề mặt chỉ làm phản ứng nhanh hay chậm, không làm thay đổi lượng khí tạo ra.' } ],
    setup(){},
    async run(h){ await h.wait(400); await h.ask('q1'); } },
  { title:'Nồng độ', q:true,
    sgk:'Cả hai bình cho cùng 0,5 g đá vôi viên. Bình 1 dùng 50 mL HCl 0,5 M. Bình 2 dùng acid khác sao cho khí thoát ra nhanh hơn.',
    note:'Acid 2 M sủi bọt mạnh hơn, khí ra nhanh hơn acid 0,5 M. Nồng độ càng lớn, phản ứng càng nhanh. Lượng khí cuối cùng vẫn như nhau vì acid đều dư.',
    chips:[
      { q:'HCl 2 M nghĩa là gì?', a:'Nghĩa là trong 1 lít dung dịch có 2 mol HCl. Số càng lớn thì dung dịch càng đặc.' },
      { q:'Vì sao acid đặc phản ứng nhanh hơn?', a:'Acid đặc hơn có nhiều hạt HCl hơn trong cùng một thể tích, nên mỗi giây có nhiều hạt acid gặp và phản ứng với đá vôi hơn.' } ],
    setup(S){ S.f1 = { ...STD, C:0.5 }; S.f2 = { ...S.f1 }; },
    async run(h){ await h.wait(400); await h.ask('q2'); } },
  { title:'Nhiệt độ', q:true,
    sgk:'Cùng 0,5 g đá vôi viên và 50 mL HCl 1 M. Bình 1 để ở nhiệt độ phòng (25 °C). Bình 2 ngâm trong cốc nước ấm (50 °C).',
    note:'Bình ngâm nước ấm sủi bọt mạnh hơn, khí ra nhanh hơn. Nhiệt độ càng cao, phản ứng càng nhanh; ngâm nước đá thì phản ứng chậm lại.',
    chips:[
      { q:'Vì sao nóng thì phản ứng nhanh hơn?', a:'Khi nóng, các hạt chuyển động nhanh hơn, va chạm với nhau nhiều và mạnh hơn, nên phản ứng nhanh hơn.' },
      { q:'Trong đời sống có ví dụ nào?', a:'Thức ăn để ngoài trời nóng nhanh bị ôi thiu hơn để trong tủ lạnh. Nấu bằng nồi áp suất (nhiệt độ cao hơn) thì thức ăn nhanh chín hơn.' } ],
    setup(){},
    async run(h){ await h.wait(400); await h.ask('q3'); await clearPair(h); await runPair(h, { T:50 }); } },
  { title:'Kết luận',
    sgk:'Rút ra các yếu tố làm tăng tốc độ phản ứng.',
    note:'Tốc độ phản ứng tăng khi: tăng diện tích bề mặt chất rắn (nghiền nhỏ), tăng nồng độ dung dịch, tăng nhiệt độ.',
    html: CONCLUSION,
    chips:[
      { q:'Tóm tắt giúp em bài này', a:'Phản ứng xảy ra nhanh hơn khi chất rắn được nghiền nhỏ, khi dung dịch đặc hơn và khi nhiệt độ cao hơn. Lượng sản phẩm cuối cùng không đổi, chỉ đạt tới sớm hay muộn.' },
      { q:'Vì sao đun bếp lại chẻ nhỏ củi?', a:'Củi chẻ nhỏ có diện tích bề mặt tiếp xúc với không khí lớn hơn, nên cháy nhanh và đều hơn.' } ],
    setup(S){ S.f2 = { ...S.f1, form:'bot' }; Object.assign(S, { run:1, t:T_END, solidDrop:1 }); },
    async run(h){ await h.wait(200); } }
];

/* ---------- chế độ tự do: em tự chỉnh bình 2, bình 1 giữ chuẩn để so sánh ---------- */
const f2Of = P => ({ form: P.form, C: P.C, T: P.T, vol: 50 });
const free = {
  title: 'Em tự chỉnh bình 2',
  hint: 'Bình 1 luôn giữ chuẩn: đá vôi viên, HCl 1 M, 25 °C. Đổi một hay nhiều yếu tố của bình 2 rồi so sánh hai đường trên đồ thị.',
  groups: [
    { id:'f2', title:'Bình 2', open:true,
      icon:'<svg viewBox="0 0 24 24"><path d="M9.5 3h5M10.5 3v6L5 20h14L13.5 9V3" fill="none" stroke="var(--glass)" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.4 15h9.2L19 20H5z" fill="var(--liquid)" fill-opacity=".5"/></svg>',
      summary: P => `${{ vien:'Viên', manh:'Mảnh', bot:'Bột' }[P.form]} · ${fmt(P.C)} M · ${P.T} °C` }
  ],
  params: [
    { key:'form', group:'f2', label:'Dạng đá vôi ở bình 2', short:'Dạng đá vôi', type:'choice', options:[{ value:'vien', label:'Viên' }, { value:'manh', label:'Mảnh nhỏ' }, { value:'bot', label:'Bột' }] },
    { key:'C', group:'f2', label:'Nồng độ HCl ở bình 2', short:'Nồng độ HCl', type:'range', min:0.5, max:2, step:0.25, unit:'M' },
    { key:'T', group:'f2', label:'Nhiệt độ bình 2', short:'Nhiệt độ', type:'range', min:5, max:60, step:5, unit:'°C' }
  ],
  defaults: { form:'vien', C:1, T:25 },
  target(P){ return { setA:1, acidA:1, f1:{ ...STD }, f2:f2Of(P), run:1, t:T_END, solidDrop:1 }; },
  start(S){ Object.assign(S, { setA:0, acidA:0, run:0, t:0, solidDrop:0 }); },
  // mỗi lần đổi thông số: rót lại acid mới, cho đá vôi vào hai bình cùng lúc, chạy lại từ đầu
  async animate(h, P){
    const S = h.S;
    S.f1 = { ...STD }; S.f2 = f2Of(P);
    if (S.setA < 1 || S.acidA < 1) await h.tw({ setA:1, acidA:1 }, 700);
    await runPair(h);
  },
  observe(_S, P){
    const f1 = STD, f2 = f2Of(P), d = diffs(f1, f2), cmp = compare(f1, f2);
    if (!d.length) return `Bình 2 giống hệt bình 1 nên hai bình phản ứng như nhau. Cả hai thu được khoảng ${fmt(VMAX)} mL khí CO₂. Em đổi dạng đá vôi, nồng độ hoặc nhiệt độ của bình 2 thử xem.`;
    const out = [];
    const ups = d.filter(x => x.up === true), downs = d.filter(x => x.up === false);
    const word = { faster:'nhanh hơn', slower:'chậm hơn', same:'gần như bằng' }[cmp];
    if (ups.length && downs.length){
      out.push(`Bình 2 có yếu tố làm nhanh hơn (${ups.map(x => x.why).join(', ')}) và yếu tố làm chậm hơn (${downs.map(x => x.why).join(', ')}).`);
      out.push(`Trên mô phỏng, bình 2 đang phản ứng ${word} bình 1, nhưng ngoài thực tế kết quả còn tùy mức thay đổi của từng yếu tố.`);
    } else {
      out.push(`Bình 2 phản ứng ${word} bình 1 vì ${d.map(x => x.why).join(', ')}.`);
    }
    out.push(`Lượng khí cuối cùng của hai bình như nhau (khoảng ${fmt(VMAX)} mL) vì cùng ${fmt(MASS)} g đá vôi và acid đều dư.`);
    return out.join(' ');
  },
  drag: { hit: () => null, move: () => ({}), items: () => [], nudge: () => ({}) },
  chips: [
    { q:'Làm sao cho bình 2 nhanh nhất?', a:'Dùng đá vôi bột, acid đặc nhất và nhiệt độ cao nhất. Cả ba yếu tố đều làm phản ứng nhanh hơn.' },
    { q:'Vì sao lượng khí cuối cùng không đổi?', a:'Lượng khí CO₂ phụ thuộc vào lượng đá vôi (0,5 g) vì acid luôn dư. Các yếu tố chỉ làm phản ứng nhanh hay chậm, không làm thay đổi lượng khí tạo ra.' } ]
};

export default {
  id: 'toc-do-phan-ung',
  grade: 'KHTN 8', chapter: 'Chương I Phản ứng hóa học', lesson: 'Bài 7',
  title: 'Tốc độ phản ứng: đá vôi và acid', shortTitle: 'Tốc độ phản ứng',
  intro: 'Hai bình đá vôi với acid chạy cùng lúc để so sánh nhanh hay chậm. Giữa chừng, trợ lý AI ở góc phải sẽ hỏi em. Chọn sai thì thí nghiệm chạy đúng theo lựa chọn của em, để em tự thấy kết quả.',
  canvasLabel: 'Hai bình tam giác chứa acid, mỗi bình nối với một xi lanh đo khí, bên cạnh là đồ thị thể tích khí theo thời gian',
  readyTitle: 'Hai bình đã sẵn sàng',
  footer: 'Mô phỏng phục vụ dạy học. Thời gian trên mô phỏng được tua nhanh; tốc độ phản ứng chỉ để minh họa xu hướng, lượng khí tính theo phương trình hóa học.',
  view: { w: 80, h: 40, ox: 0.5, oy: 0.5 },
  startChips: [
    { q:'Thí nghiệm này để làm gì?', a:'Thí nghiệm giúp em thấy những yếu tố nào làm phản ứng hóa học xảy ra nhanh hơn hay chậm hơn: diện tích bề mặt, nồng độ và nhiệt độ.' },
    { q:'Tốc độ phản ứng là gì?', a:'Tốc độ phản ứng cho biết phản ứng xảy ra nhanh hay chậm. Ở đây, khí CO₂ thoát ra càng nhanh (xi lanh đầy càng nhanh) thì phản ứng càng nhanh.' } ],
  base(S){ Object.assign(S, { setA:1, acidA:1, run:0, t:0, solidDrop:0, f1:{ ...STD }, f2:{ ...STD } }); },
  rest(){},
  draw(_g, _S){
    g = _g; S = _S;
    drawBench(); drawFlask(0); drawFlask(1); drawGraph();
  },
  readout(S){
    if (!S.run) return S.setA > 0.5 ? 'Chưa cho đá vôi vào' : '';
    return `t = ${Math.round(S.t)} s (tua nhanh) · Bình 1: ${fmt(gasNow(S, S.f1))} mL · Bình 2: ${fmt(gasNow(S, S.f2))} mL`;
  },
  describe(S){
    const L = ['Hai bình tam giác, mỗi bình nối với một xi lanh đo thể tích khí CO₂. Bên phải là đồ thị thể tích khí theo thời gian.'];
    L.push(`Bình 1: ${condText(S.f1)}.`, `Bình 2: ${condText(S.f2)}.`);
    if (!S.run){ L.push('Chưa cho đá vôi vào hai bình.'); return L; }
    L.push(`Đã cho đá vôi vào cả hai bình cùng lúc. Thời gian trên mô phỏng: ${Math.round(S.t)} s (tua nhanh; tốc độ chỉ để minh họa xu hướng).`);
    [S.f1, S.f2].forEach((f, i) => L.push(`Bình ${i + 1} đã thu được ${fmt(gasNow(S, f))} mL khí CO₂, đá vôi còn khoảng ${(Math.round(solidLeft(S, f) * 100) / 100).toLocaleString('vi-VN')} g.`));
    const cmp = compare(S.f1, S.f2);
    L.push(cmp === 'none' ? 'Bình 2 là nước cất nên không có phản ứng, không có bọt khí.'
      : `Bình 2 đang phản ứng ${{ faster:'nhanh hơn', slower:'chậm hơn', same:'như' }[cmp]} bình 1.`);
    L.push(`Lượng khí tối đa mỗi bình (theo phương trình hóa học, acid dư): khoảng ${fmt(VMAX)} mL.`);
    return L;
  },
  steps, questions, free
};
