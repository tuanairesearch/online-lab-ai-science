// Thí nghiệm: Tốc độ phản ứng và chất xúc tác (KHTN 8 – Bài 7, Kết nối tri thức, tr. 31–34)
// Đặc tả: docs/lessons/hoa-hoc/toc-do-phan-ung.md
// Bám 4 hoạt động trong SGK, mỗi hoạt động so sánh hai ống (hai cốc) chỉ khác nhau một yếu tố:
//   HĐ1 Nồng độ:          đinh sắt (≈ 0,2 g) + 5 mL HCl 0,1 M / 1 M     Fe + 2HCl → FeCl₂ + H₂↑
//   HĐ2 Nhiệt độ:         viên C sủi trong cốc nước lạnh / nước nóng   (viên sủi tan, giải phóng khí CO₂)
//   HĐ3 Diện tích bề mặt: 1 g đá vôi viên / bột + 3 mL HCl 0,1 M        CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O
//   HĐ4 Chất xúc tác:     3 mL H₂O₂ 3%, ống 2 thêm một ít bột MnO₂       2H₂O₂ → 2H₂O + O₂↑
// Xi lanh đo khí và đồ thị là phần THÊM so với SGK để so sánh bằng số.
// Lượng khí tối đa tính theo phương trình hóa học (chất hết trước quyết định), 24,79 L/mol (25 °C, 1 bar).
// Tốc độ: dξ/dt = k × [acid] × hệ số bề mặt × 2^((T − 25)/10) (× xúc tác). Các hằng số k là số MINH HỌA:
// đúng xu hướng (nhanh/chậm), không phải số đo thật. Thời gian trên màn hình được tua nhanh.

import { fmt } from '../engine.js';

const VM = 24790;                                     // mL khí / mol (25 °C, 1 bar)
const SURFACE = { vien: 1, manh: 3, bot: 10 };        // hệ số bề mặt (minh họa)
const FORM_NAME = { vien: 'viên', manh: 'mảnh nhỏ', bot: 'bột' };
const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const tf = T => Math.pow(2, (T - 25) / 10);           // hệ số nhiệt độ cho phản ứng (minh họa)
const tfv = T => Math.pow(2, (T - 25) / 20);          // viên sủi tan: ít nhạy với nhiệt độ hơn (minh họa)
const num = n => (Math.round(n * 100) / 100).toLocaleString('vi-VN');   // nồng độ: tới 2 chữ số thập phân

/* ---------- 4 hoạt động trong SGK ---------- */
// base: ống/cốc 1 (giữ nguyên); ống/cốc 2 đổi đúng một yếu tố
const EXPS = {
  'nong-do':  { name:'Nồng độ', rx:'fe',    vessel:'ống', T_END:300, YMAX:20,  ylab:'Thể tích khí H₂ (mL)',
                base:{ rx:'fe', C:0.1, vol:5, T:25 } },
  'nhiet-do': { name:'Nhiệt độ', rx:'vitc', vessel:'cốc', T_END:150, YMAX:100, ylab:'Phần viên sủi đã tan (%)',
                base:{ rx:'vitc', T:15 } },
  'be-mat':   { name:'Diện tích bề mặt', rx:'caco3', vessel:'ống', T_END:300, YMAX:5, ylab:'Thể tích khí CO₂ (mL)',
                base:{ rx:'caco3', form:'vien', C:0.1, vol:3, T:25 } },
  'xuc-tac':  { name:'Chất xúc tác', rx:'h2o2', vessel:'ống', T_END:120, YMAX:40, ylab:'Thể tích khí O₂ (mL)',
                base:{ rx:'h2o2', vol:3, cat:false, T:25 } }
};
const K = { fe: 2e-6, caco3: 7e-6, h2o2Cat: 0.035, h2o2: 1e-6, vitc: 0.00707 };   // hằng số minh họa
const FE_G = 0.2, CA_G = 1, H2O2_MOL = 3 * 0.03 / 34;   // đinh sắt 0,2 g; đá vôi 1 g; 3 mL H₂O₂ 3% (≈ 0,09 g)

/* ---------- mô phỏng: tích phân số, lưu lại đường cong của từng cấu hình ---------- */
const N = 300, cache = new Map();
function curve(f, T_END){
  const key = JSON.stringify(f) + T_END;
  if (cache.has(key)) return cache.get(key);
  const out = new Float64Array(N + 1), sub = 20, dt = T_END / N / sub;
  let x = 0, max = 0;                                  // x: mol phản ứng (hoặc phần viên sủi đã tan)
  const V = (f.vol || 5) / 1000;
  if (f.rx === 'fe')    max = Math.min(FE_G / 56, f.C * V / 2);
  if (f.rx === 'caco3') max = Math.min(CA_G / 100, f.C * V / 2);
  const nH = H2O2_MOL * (f.n2 || 1);                   // n2 = 2: rót thêm một lượng H₂O₂ 3% bằng thế
  if (f.rx === 'h2o2')  max = nH;
  if (f.rx === 'vitc')  max = 1;
  const rate = x => {
    if (f.rx === 'fe')    return f.C <= 0 ? 0 : K.fe * (f.C * V - 2 * x) / V * tf(f.T);
    if (f.rx === 'caco3'){ const n0 = CA_G / 100; return f.C <= 0 ? 0 : K.caco3 * (f.C * V - 2 * x) / V * SURFACE[f.form] * tf(f.T) * Math.cbrt(((n0 - x) / n0) ** 2); }
    if (f.rx === 'h2o2')  return (f.cat ? K.h2o2Cat : K.h2o2) * (nH - x) * tf(f.T);
    return x < 1 ? K.vitc * tfv(f.T) : 0;                // viên sủi dẹt: tan đều theo thời gian
  };
  for (let i = 1; i <= N; i++){
    for (let j = 0; j < sub; j++) x = Math.min(max, x + Math.max(0, rate(x)) * dt);
    out[i] = val(f, x);
  }
  const r = { vals: out, max: val(f, max) };
  cache.set(key, r); return r;
}
// đổi mol phản ứng thành số hiển thị: mL khí, hoặc % viên sủi đã tan
function val(f, x){
  if (f.rx === 'vitc') return 100 * x;
  if (f.rx === 'h2o2') return x / 2 * VM;              // 2 mol H₂O₂ → 1 mol O₂
  return x * VM;                                       // 1 mol Fe hoặc CaCO₃ → 1 mol khí
}
function valueAt(f, T_END, t){
  const c = curve(f, T_END).vals, p = Math.max(0, Math.min(N, t / T_END * N)), i = Math.floor(p), k = p - i;
  return i >= N ? c[N] : c[i] * (1 - k) + c[i + 1] * k;
}
const E = S => EXPS[S.exp];
const now = (S, f) => S.run ? valueAt(f, E(S).T_END, S.t) : 0;
const unit = f => f.rx === 'vitc' ? '%' : 'mL';
const show = (f, v) => f.rx === 'vitc' ? `${Math.round(v)}%` : `${fmt(v)} mL`;
// tốc độ lúc đầu, chuẩn hóa theo thang đồ thị của hoạt động (để so sánh hai ống)
const r0 = (f, e) => valueAt(f, e.T_END, 0.05 * e.T_END) / e.YMAX;
function compare(f1, f2, e = EXPS[expOf(f1)]){
  const a = r0(f1, e), b = r0(f2, e), Z = 5e-4;
  if (b < Z && a < Z) return 'both-none';
  if (b < Z) return 'none';
  return b > a * 1.05 ? 'faster' : b < a / 1.05 ? 'slower' : 'same';
}
const expOf = f => Object.keys(EXPS).find(k => EXPS[k].rx === f.rx);
const tempWord = T => T <= 5 ? 'nước đá' : T < 25 ? 'nước lạnh' : T === 25 ? 'nhiệt độ phòng' : T < 45 ? 'nước ấm' : 'nước nóng';
function condText(f){
  if (f.rx === 'fe')    return `đinh sắt ${fmt(FE_G)} g, ${f.vol} mL ${f.C > 0 ? `dung dịch HCl ${num(f.C)} M${f.vol > 5 ? ' (đã pha thêm nước)' : ''}` : 'nước cất'}, ${f.T} °C`;
  if (f.rx === 'caco3') return `${fmt(CA_G)} g đá vôi ${FORM_NAME[f.form]}, ${f.vol} mL dung dịch HCl ${num(f.C)} M, ${f.T} °C`;
  if (f.rx === 'h2o2')  return `${f.n2 ? `${3 * f.n2} mL` : f.vol === 3 ? '3 mL' : `3 mL (pha thêm ${f.vol - 3} mL nước)`} nước oxy già H₂O₂ 3%${f.cat ? ' + một ít bột MnO₂' : ''}, ${f.T} °C${f.T !== 25 ? ` (${tempWord(f.T)})` : ''}`;
  return `một viên C sủi trong ${tempWord(f.T)} (khoảng ${f.T} °C)`;
}
// ống 2 khác ống 1 ở đâu, theo chiều nào
function diffs(f1, f2){
  const out = [];
  if (f2.rx === 'fe' || f2.rx === 'caco3'){
    if (f2.C !== f1.C) out.push(f2.C <= 0 ? { text:'nước cất', why:'không có acid', up:false }
      : { text:`HCl ${num(f2.C)} M`, why: f2.C > f1.C ? 'nồng độ acid lớn hơn' : 'nồng độ acid nhỏ hơn', up: f2.C > f1.C });
    else if (f2.vol !== f1.vol) out.push({ text:`${f2.vol} mL`, why:'nhiều dung dịch hơn nhưng nồng độ không đổi', up:null });
  }
  if (f2.form && f2.form !== f1.form) out.push({ text:`đá vôi ${FORM_NAME[f2.form]}`, why: SURFACE[f2.form] > SURFACE[f1.form] ? 'diện tích bề mặt lớn hơn' : 'diện tích bề mặt nhỏ hơn', up: SURFACE[f2.form] > SURFACE[f1.form] });
  if (f2.rx === 'h2o2'){
    if (f2.cat !== f1.cat) out.push({ text: f2.cat ? 'có MnO₂' : 'không có MnO₂', why: f2.cat ? 'có chất xúc tác MnO₂' : 'không có chất xúc tác', up: !!f2.cat });
    if (f2.vol !== f1.vol) out.push({ text:'pha thêm nước', why:'dung dịch loãng hơn', up:false });
    if (f2.n2 && f2.n2 !== f1.n2) out.push({ text:`${3 * f2.n2} mL H₂O₂`, why:'nhiều dung dịch hơn nhưng nồng độ không đổi', up:null });
  }
  if (f2.T !== f1.T) out.push({ text:`${f2.T} °C`, why: f2.T > f1.T ? 'nhiệt độ cao hơn' : 'nhiệt độ thấp hơn', up: f2.T > f1.T });
  return out;
}

/* ---------- vẽ ---------- */
let g, S;
const X0 = [-29, -11], BENCH = -13, TUBE_W = 1.5, TUBE_BOT = -11, TUBE_TOP = 4;
const seed = i => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
function fitText(t, x, y, maxW, opts){
  let size = opts.size;
  g.ctx.font = g.font(size, opts.weight || 500);
  const w = g.ctx.measureText(t).width;
  if (w > maxW) size = Math.max(8, Math.floor(size * maxW / w));
  g.text(t, x, y, { ...opts, size });
}
function tubePath(cx){
  const { ctx, X, Y, sc } = g;
  ctx.beginPath(); ctx.moveTo(X(cx - TUBE_W), Y(TUBE_TOP)); ctx.lineTo(X(cx - TUBE_W), Y(TUBE_BOT + TUBE_W));
  ctx.arc(X(cx), Y(TUBE_BOT + TUBE_W), TUBE_W * sc, Math.PI, 0, true);
  ctx.lineTo(X(cx + TUBE_W), Y(TUBE_TOP));
}
const CUP = { w: 5, bot: BENCH, top: -1 };
function cupPath(cx){
  const { ctx, X, Y } = g;
  ctx.beginPath(); ctx.moveTo(X(cx - CUP.w), Y(CUP.top)); ctx.lineTo(X(cx - CUP.w + 0.4), Y(CUP.bot)); ctx.lineTo(X(cx + CUP.w - 0.4), Y(CUP.bot)); ctx.lineTo(X(cx + CUP.w), Y(CUP.top));
}
// mực chất lỏng trong ống: 1 mL ≈ 1,6 đơn vị chiều cao (chỉ để vẽ)
const levelY = f => f.rx === 'vitc' ? CUP.top - 1.6 : TUBE_BOT + Math.min(13, (f.vol || 3) * (f.n2 || 1) * 1.6) * S.liqA;
const tempCol = T => T > 25 ? g.C.warm : T < 25 ? g.C.cold : g.C.liquid;
function drawLiquid(cx, f){
  if (S.liqA <= 0.01) return;
  const { ctx, X, Y, sc } = g, top = f.rx === 'vitc' ? CUP.bot + (CUP.top - 1.6 - CUP.bot) * S.liqA : levelY(f);
  ctx.save(); ctx.globalAlpha *= .45; ctx.fillStyle = f.T !== 25 ? tempCol(f.T) : g.C.liquid;
  ctx.fillRect(X(cx - 6), Y(top), 12 * sc, (top - BENCH + 1) * sc); ctx.restore();
}
function drawSolid(cx, f){
  if (S.drop <= 0) return;
  const { ctx, X, Y, C, sc } = g;
  const yTop = f.rx === 'vitc' ? CUP.top + 3 : TUBE_TOP + 1, yBot = f.rx === 'vitc' ? CUP.bot + 0.3 : TUBE_BOT + 0.4;
  const y = yTop + (yBot - yTop) * S.drop;
  ctx.save(); ctx.lineWidth = 1;
  if (f.rx === 'fe'){        // đinh sắt nằm nghiêng trong ống
    ctx.strokeStyle = C['stage-ink']; ctx.lineWidth = Math.max(2, 0.28 * sc); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X(cx - 0.6), Y(y + 4.2)); ctx.lineTo(X(cx + 0.5), Y(y + 0.2)); ctx.stroke();
    ctx.lineWidth = Math.max(2, 0.22 * sc); ctx.beginPath(); ctx.moveTo(X(cx - 1.05), Y(y + 4.1)); ctx.lineTo(X(cx - 0.15), Y(y + 4.35)); ctx.stroke();
  } else if (f.rx === 'caco3'){
    const left = Math.max(0, 1 - now(S, f) / (CA_G / 100 * VM)), k = Math.cbrt(left);
    ctx.fillStyle = C.solid; ctx.strokeStyle = C['stage-muted'];
    const blob = (x, yy, r) => { ctx.beginPath(); ctx.arc(X(x), Y(yy + r), r * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
    if (f.form === 'vien') blob(cx, y, 0.95 * k);
    else if (f.form === 'manh') for (let i = -1; i <= 1; i++) blob(cx + i * 0.6, y + (i === 0 ? 0.5 : 0), 0.42 * k);
    else for (let i = 0; i < 40; i++) blob(cx + (seed(i) * 2 - 1) * 1.05, y + seed(i + 99) * 0.7, 0.12);
  } else if (f.rx === 'h2o2'){
    if (!f.cat) { ctx.restore(); return; }
    ctx.fillStyle = C['stage-line']; ctx.strokeStyle = C['stage-muted'];
    for (let i = 0; i < 26; i++){ ctx.beginPath(); ctx.arc(X(cx + (seed(i) * 2 - 1) * 1.05), Y(y + 0.12 + seed(i + 50) * 0.5), 0.13 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  } else {                   // viên C sủi: đĩa mỏng nhỏ dần
    const left = Math.max(0, 1 - now(S, f) / 100); if (left < 0.01){ ctx.restore(); return; }
    const w = 2.2 * Math.sqrt(left), hh = 0.55 * Math.sqrt(left) + 0.1;
    ctx.fillStyle = C.paper || C.solid; ctx.strokeStyle = C['stage-muted'];
    g.rr(X(cx - w), Y(y + hh), 2 * w * sc, hh * sc, 3); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawBubbles(cx, f){
  if (!S.run || S.drop < 1) return;
  const e = E(S), dt = e.T_END / N, a = valueAt(f, e.T_END, S.t), b = valueAt(f, e.T_END, Math.min(e.T_END, S.t + dt));
  const d = (b - a) / dt * e.T_END / e.YMAX;                 // tốc độ chuẩn hóa theo thang của hoạt động
  const n = Math.min(40, Math.round(9 * Math.sqrt(Math.max(0, d))));
  if (n <= 0) return;
  const { ctx, X, Y, C, sc } = g, cup = f.rx === 'vitc';
  const spread = cup ? 2 : TUBE_W - 0.45, bot = cup ? CUP.bot + 0.6 : TUBE_BOT + 0.6, top = levelY(f) - 0.3;
  const t = REDUCE ? 0 : performance.now() / 1000;
  ctx.save(); ctx.strokeStyle = C.gas; ctx.lineWidth = 1.2; ctx.globalAlpha = .9;
  for (let i = 0; i < n; i++){
    const s = seed(i), p = (t * (0.6 + 0.6 * seed(i + 7)) + s * 5) % 1;
    const x = cx + (s * 2 - 1) * spread + 0.15 * Math.sin(t * 3 + i);
    ctx.beginPath(); ctx.arc(X(x), Y(bot + p * (top - bot)), (0.1 + 0.12 * seed(i + 3)) * sc, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
function drawSyringe(cx, f, col){
  const { ctx, X, Y, C, sc } = g, e = E(S), V = now(S, f), sx = cx - 6, sy = 9.2;
  ctx.fillStyle = C['stage-muted']; ctx.fillRect(X(cx - 1.9), Y(TUBE_TOP + 1.2), 3.8 * sc, 1.2 * sc);   // nút cao su
  ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(X(cx), Y(TUBE_TOP + 1.2)); ctx.lineTo(X(cx), Y(6.6)); ctx.lineTo(X(sx - 1.4), Y(6.6)); ctx.lineTo(X(sx - 1.4), Y(sy)); ctx.lineTo(X(sx), Y(sy)); ctx.stroke();
  const xp = sx + 12 * Math.min(1, V / e.YMAX);
  ctx.save(); ctx.fillStyle = C.gas; ctx.globalAlpha *= .3; ctx.fillRect(X(sx), Y(sy + 0.8), (xp - sx) * sc, 1.6 * sc); ctx.restore();
  ctx.strokeStyle = C.glass; ctx.lineWidth = 1.6; ctx.strokeRect(X(sx), Y(sy + 0.8), 12 * sc, 1.6 * sc);
  ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++){ const x = X(sx + 3 * k); ctx.beginPath(); ctx.moveTo(x, Y(sy + 0.8)); ctx.lineTo(x, Y(sy + 0.3)); ctx.stroke(); }
  ctx.strokeStyle = C['stage-ink']; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(xp), Y(sy + 0.7)); ctx.lineTo(X(xp), Y(sy - 0.7)); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(xp), Y(sy)); ctx.lineTo(X(xp + 7), Y(sy)); ctx.moveTo(X(xp + 7), Y(sy + 0.8)); ctx.lineTo(X(xp + 7), Y(sy - 0.8)); ctx.stroke();
}
function drawVessel(i){
  if (S.setA <= 0.01) return;
  const cx = X0[i], f = i ? S.f2 : S.f1, e = E(S), { ctx, X, Y, C, sc } = g, col = i ? C.obj : C.glass, cup = f.rx === 'vitc';
  ctx.save(); ctx.globalAlpha = S.setA;
  if (!cup){                 // giá ống nghiệm
    ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(cx - 3.5), Y(-4)); ctx.lineTo(X(cx + 3.5), Y(-4)); ctx.moveTo(X(cx - 3), Y(-4)); ctx.lineTo(X(cx - 3), Y(BENCH)); ctx.moveTo(X(cx + 3), Y(-4)); ctx.lineTo(X(cx + 3), Y(BENCH)); ctx.stroke();
  }
  ctx.save(); (cup ? cupPath : tubePath)(cx); ctx.closePath(); ctx.clip();
  drawLiquid(cx, f); drawSolid(cx, f); drawBubbles(cx, f);
  ctx.restore();
  (cup ? cupPath : tubePath)(cx); ctx.strokeStyle = C.glass; ctx.lineWidth = 2; ctx.stroke();
  if (!cup) drawSyringe(cx, f, col);
  const V = now(S, f), name = `${e.vessel === 'cốc' ? 'Cốc' : 'Ống'} ${i + 1}`;
  g.text(name, X(cx), Y(cup ? 7.5 : 15.2), { color: col, weight: 700, size: g.fs() + 2 });
  g.text(show(f, V), X(cx), Y(cup ? 4.5 : 12.6), { color: col, weight: 700, mono: true, size: g.fs() + 5 });
  if (cup) g.text('đã tan', X(cx), Y(2.6), { color: C['stage-muted'], size: g.fs() });
  const small = g.fs() + 1, maxW = 17 * sc;
  const [l1, l2] = labels(f);
  fitText(l1, X(cx), Y(-15), maxW, { size: small });
  fitText(l2, X(cx), Y(-17), maxW, { size: small, color: f.T !== 25 || cup ? tempCol(f.T) : C['stage-ink'] });
  if (i === 1){ const d = diffs(S.f1, S.f2); if (d.length) fitText(`Khác ${e.vessel} 1: ` + d.map(x => x.text).join(', '), X(cx), Y(-19), maxW, { size: small, color: C.beam, weight: 700 }); }
  ctx.restore();
}
function labels(f){
  if (f.rx === 'fe')    return [`Đinh sắt ${fmt(FE_G)} g`, `${f.vol} mL ${f.C > 0 ? `HCl ${num(f.C)} M` : 'nước cất'} · ${f.T} °C`];
  if (f.rx === 'caco3') return [`${fmt(CA_G)} g đá vôi ${FORM_NAME[f.form]}`, `${f.vol} mL HCl ${num(f.C)} M · ${f.T} °C`];
  if (f.rx === 'h2o2')  return [`${3 * (f.n2 || 1)} mL H₂O₂ 3%${f.vol > 3 ? ` + ${f.vol - 3} mL nước` : ''}`, `${f.cat ? 'Có MnO₂' : 'Không có MnO₂'} · ${f.T} °C`];
  return ['Viên C sủi', `${tempWord(f.T).replace(/^n/, 'N')} · khoảng ${f.T} °C`];
}
const GR = { x0: 4, x1: 35, y0: -9, y1: 12 };
function drawGraph(){
  if (S.setA <= 0.01) return;
  const e = E(S), { ctx, X, Y, C } = g, small = g.fs();
  const gx = t => X(GR.x0 + (GR.x1 - GR.x0) * t / e.T_END), gy = v => Y(GR.y0 + (GR.y1 - GR.y0) * v / e.YMAX);
  ctx.save(); ctx.globalAlpha = S.setA;
  ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 1;
  const yStep = e.YMAX / 4, tStep = e.T_END / 3;
  for (let v = yStep; v <= e.YMAX + 1e-9; v += yStep){ ctx.beginPath(); ctx.moveTo(gx(0), gy(v)); ctx.lineTo(gx(e.T_END), gy(v)); ctx.stroke(); }
  ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(gx(0), gy(e.YMAX)); ctx.lineTo(gx(0), gy(0)); ctx.lineTo(gx(e.T_END), gy(0)); ctx.stroke();
  for (let v = 0; v <= e.YMAX + 1e-9; v += yStep) g.text(fmt(v), gx(0) - 6, gy(v), { size: small, color: C['stage-muted'], mono: true, align: 'right' });
  for (let t = 0; t <= e.T_END + 1e-9; t += tStep) g.text(String(Math.round(t)), gx(t), gy(0) + 14, { size: small, color: C['stage-muted'], mono: true });
  g.text(e.ylab, gx(0), gy(e.YMAX) - 16, { size: small, color: C['stage-muted'], align: 'left', weight: 600 });
  g.text('Thời gian (s, tua nhanh)', gx(e.T_END / 2), gy(0) + 34, { size: small, color: C['stage-muted'], weight: 600 });
  // lượng tối đa theo phương trình (chỉ với phản ứng có khí đo được)
  const m1 = curve(S.f1, e.T_END).max, m2 = curve(S.f2, e.T_END).max;
  if (e.rx === 'caco3' || e.rx === 'h2o2'){        // phản ứng chạy hết trong thời gian thí nghiệm
    ctx.setLineDash([6, 6]); ctx.strokeStyle = C.img;
    const lines = Math.abs(m1 - m2) < 1e-6 ? [m1] : [m1, m2];
    lines.forEach(m => { if (m <= e.YMAX){ ctx.beginPath(); ctx.moveTo(gx(0), gy(m)); ctx.lineTo(gx(e.T_END), gy(m)); ctx.stroke(); } });
    ctx.setLineDash([]);
    if (lines.length === 1 && m1 <= e.YMAX) g.text(`Tối đa ≈ ${fmt(m1)} mL`, gx(e.T_END), gy(m1) - 11, { size: small, color: C.img, align: 'right', weight: 600 });
  }
  if (S.run){
    [[S.f1, C.glass, `${e.vessel === 'cốc' ? 'Cốc' : 'Ống'} 1`], [S.f2, C.obj, `${e.vessel === 'cốc' ? 'Cốc' : 'Ống'} 2`]].forEach(([f, col, lab], i) => {
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let k = 0; k <= 90; k++){ const t = S.t * k / 90, x = gx(t), y = gy(Math.min(e.YMAX, valueAt(f, e.T_END, t))); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      const ex = gx(S.t), ey = gy(Math.min(e.YMAX, valueAt(f, e.T_END, S.t)));
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fill();
      g.text(lab, Math.min(ex + 8, gx(e.T_END) - 30), ey + (i ? 12 : -12), { size: small, color: col, weight: 700, align: 'left' });
    });
  }
  ctx.restore();
}
function drawBench(){
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X(-39), Y(BENCH)); ctx.lineTo(X(-1), Y(BENCH)); ctx.stroke(); ctx.restore();
}

/* ---------- chạy một lượt so sánh ---------- */
const REF7 = 'SGK KHTN 8 · Bài 7 Tốc độ phản ứng và chất xúc tác (tr. 31–34)';
function setExp(S, exp){ S.exp = exp; S.f1 = { ...EXPS[exp].base }; S.f2 = { ...S.f1 }; Object.assign(S, { run:0, t:0, drop:0 }); }
async function runPair(h, f2){
  const S = h.S;
  if (f2) S.f2 = { ...S.f1, ...f2 };
  Object.assign(S, { run:0, t:0, drop:0 });
  if (S.liqA < 1) await h.tw({ liqA:1 }, 600);
  await h.tw({ drop:1 }, 700);
  S.run = 1;
  await h.tw({ t: E(S).T_END }, 6500);
  await h.wait(400);
}
async function clearPair(h){ Object.assign(h.S, { run:0, t:0, drop:0 }); h.S.f2 = { ...h.S.f1 }; await h.wait(200); }

/* ---------- câu hỏi mồi: mỗi đáp án là một cách làm ống 2 ---------- */
const questions = [
  { id:'q1', short:'Dùng dung dịch nào cho ống 2?', tag:'Nồng độ',
    text:'Ống 1: đinh sắt + 5 mL dung dịch HCl 0,1 M. Em cho gì vào ống 2 (cũng một đinh sắt) để khí thoát ra nhanh hơn?',
    opts:['5 mL HCl 0,1 M (như ống 1)','5 mL nước cất','5 mL HCl 0,1 M, rồi pha thêm 5 mL nước','5 mL HCl 1 M'], answer:3,
    cfg:[{ C:0.1 }, { C:0 }, { C:0.05, vol:10 }, { C:1 }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Hai ống y hệt nhau thì khí thoát ra như nhau, hai đường trên đồ thị trùng nhau.',
      'Nước cất không phản ứng với sắt nên không có bọt khí nào, xi lanh đứng yên.',
      'Pha thêm nước làm acid loãng hơn (còn 0,05 M), bọt khí còn ra chậm hơn ống 1!',
      null
    ],
    hint2:'Gợi ý: trong cùng một thể tích, dung dịch đặc hơn có nhiều hay ít chất tham gia phản ứng hơn?',
    right:'Nồng độ HCl càng lớn thì phản ứng càng nhanh: ống HCl 1 M sủi bọt khí hydrogen nhiều hơn hẳn ống HCl 0,1 M.',
    ref: REF7 + ' · Hoạt động 1' },
  { id:'q2', short:'Thả viên sủi vào cốc nước nào?', tag:'Nhiệt độ',
    text:'Cốc 1 là nước lạnh. Em rót loại nước nào vào cốc 2 để viên C sủi tan nhanh nhất?',
    opts:['Nước lạnh (như cốc 1)','Nước đá','Nước nóng','Nước ấm'], answer:2,
    cfg:[{ T:15 }, { T:5 }, { T:70 }, { T:35 }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Hai cốc cùng nhiệt độ nên viên sủi tan như nhau.',
      'Nước đá còn lạnh hơn cốc 1, viên sủi tan chậm hơn!',
      null,
      'Nước ấm làm viên sủi tan nhanh hơn cốc 1 rồi! Nhưng còn loại nước nào làm nó tan nhanh hơn nữa không?'
    ],
    hint2:'Gợi ý: so sánh nhiệt độ của bốn loại nước, loại nào cao nhất?',
    right:'Nhiệt độ càng cao thì phản ứng càng nhanh: viên C sủi trong nước nóng sủi bọt mạnh và tan hết sớm hơn nhiều so với nước lạnh.',
    ref: REF7 + ' · Hoạt động 2' },
  { id:'q3', short:'Dạng đá vôi nào phản ứng nhanh nhất?', tag:'Diện tích bề mặt',
    text:'Ống 1: 1 g đá vôi dạng viên + 3 mL HCl 0,1 M. Ống 2 cũng 1 g đá vôi, cùng 3 mL HCl 0,1 M. Em chọn đá vôi dạng nào cho ống 2 để khí thoát ra nhanh nhất?',
    opts:['Dạng viên (như ống 1)','Đập thành vài mảnh nhỏ','Dạng bột','Dạng viên, rửa qua nước trước'], answer:2,
    cfg:[{ form:'vien' }, { form:'manh' }, { form:'bot' }, { form:'vien' }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Hai ống y hệt nhau thì khí thoát ra như nhau. Em thử đổi dạng của đá vôi xem.',
      'Nhanh hơn dạng viên rồi! Còn cách nào để acid tiếp xúc với đá vôi nhiều hơn nữa?',
      null,
      'Rửa nước không làm phần mặt ngoài của viên đá vôi lớn hơn, nên hai ống phản ứng như nhau.'
    ],
    hint2:'Gợi ý: chia đá vôi càng nhỏ thì tổng phần mặt ngoài tiếp xúc với acid nhiều hơn hay ít hơn?',
    right:'Đá vôi dạng bột có diện tích bề mặt tiếp xúc với acid lớn hơn nên phản ứng nhanh hơn. Hạt càng nhỏ, tốc độ phản ứng càng lớn.',
    ref: REF7 + ' · Hoạt động 3' },
  { id:'q4', short:'Thêm gì để H₂O₂ phân hủy nhanh?', tag:'Chất xúc tác',
    text:'Hai ống đều có 3 mL nước oxy già H₂O₂ 3%, để yên gần như không thấy bọt khí. Em làm gì với ống 2 để có nhiều bọt khí ngay?',
    opts:['Thêm 3 mL nước cất','Thêm một ít bột MnO₂','Ngâm ống 2 vào cốc nước đá','Rót thêm 3 mL H₂O₂ 3%'], answer:1,
    cfg:[{ vol:6 }, { cat:true }, { T:5 }, { n2:2 }],
    async sim(h, c){ await runPair(h, this.cfg[c]); },
    async reset(h){ await clearPair(h); },
    wrong:[
      'Thêm nước làm dung dịch loãng hơn, vẫn gần như không có bọt khí.',
      null,
      'Lạnh thì phản ứng còn chậm hơn nữa, vẫn không thấy bọt khí.',
      'Nồng độ vẫn là 3% như cũ nên vẫn gần như không có bọt khí. Cần một chất giúp phản ứng nhanh hơn.'
    ],
    hint2:'Gợi ý: trong các hóa chất chuẩn bị cho hoạt động này, có một chất bột màu đen chưa dùng tới.',
    right:'MnO₂ là chất xúc tác: ống có MnO₂ sủi bọt khí oxygen mạnh ngay. Chất xúc tác làm tăng tốc độ phản ứng nhưng không bị biến đổi sau phản ứng.',
    ref: REF7 + ' · Hoạt động 4' }
];

/* ---------- các bước ---------- */
const CONCLUSION = `<div class="concl-wrap"><table class="concl"><thead><tr><th>Yếu tố</th><th>Thay đổi</th><th>Tốc độ phản ứng</th></tr></thead><tbody>
<tr><th>Nồng độ</th><td>Nồng độ chất tham gia tăng</td><td>Tăng</td></tr>
<tr><th>Nhiệt độ</th><td>Nhiệt độ tăng</td><td>Tăng</td></tr>
<tr><th>Diện tích bề mặt tiếp xúc</th><td>Chất rắn càng nhỏ (bột)</td><td>Tăng</td></tr>
<tr><th>Chất xúc tác</th><td>Có chất xúc tác (MnO₂)</td><td>Tăng; chất xúc tác không bị biến đổi sau phản ứng</td></tr></tbody></table></div>`;

const steps = [
  { title:'Chuẩn bị, an toàn',
    sgk:'Đeo kính bảo hộ, găng tay. Mỗi hoạt động dùng hai ống nghiệm (hoặc hai cốc), chỉ khác nhau một yếu tố, cho chất vào cùng lúc rồi so sánh lượng bọt khí thoát ra.',
    note:'Tốc độ phản ứng cho biết phản ứng xảy ra nhanh hay chậm. Ở đây, bọt khí thoát ra càng nhiều, càng nhanh thì phản ứng càng nhanh. Mô phỏng nối thêm xi lanh để đo thể tích khí.',
    chips:[
      { q:'Vì sao phải đeo kính, găng tay?', a:'Dung dịch acid HCl có thể gây hại cho da và mắt. Khi làm thí nghiệm thật phải đeo kính, găng tay, không ngửi hay nếm hóa chất.' },
      { q:'Vì sao hai ống chỉ khác nhau một yếu tố?', a:'Để biết chắc yếu tố đó làm phản ứng nhanh hay chậm. Nếu hai ống khác nhau nhiều thứ cùng lúc, em sẽ không biết thứ nào gây ra sự khác biệt.' } ],
    setup(S){ setExp(S, 'nong-do'); S.setA = 0; S.liqA = 0; },
    async run(h){ await h.tw({ setA:1 }, 700); await h.tw({ liqA:1 }, 900); } },
  { title:'Ảnh hưởng của nồng độ', q:true,
    sgk:'Cho khoảng 5 mL dung dịch HCl 0,1 M vào ống 1. Ống 2 dùng một dung dịch khác. Đưa nhẹ hai đinh sắt giống nhau vào hai ống, quan sát khí thoát ra.',
    note:'Ống HCl 1 M sủi bọt nhiều hơn ống HCl 0,1 M. Khi nồng độ chất tham gia tăng, tốc độ phản ứng tăng. Phương trình: Fe + 2HCl → FeCl₂ + H₂↑.',
    chips:[
      { q:'Bọt khí là khí gì?', a:'Đó là khí hydrogen (H₂), sinh ra khi sắt phản ứng với dung dịch hydrochloric acid.' },
      { q:'HCl 1 M nghĩa là gì?', a:'Nghĩa là trong 1 lít dung dịch có 1 mol HCl. Số càng lớn thì dung dịch càng đặc.' },
      { q:'Vì sao dung dịch đặc phản ứng nhanh hơn?', a:'Dung dịch đặc hơn có nhiều chất tham gia hơn trong cùng một thể tích, nên mỗi giây có nhiều chất gặp nhau và phản ứng hơn.' } ],
    setup(S){ setExp(S, 'nong-do'); },
    async run(h){ await h.wait(400); await h.ask('q1'); } },
  { title:'Ảnh hưởng của nhiệt độ', q:true,
    sgk:'Lấy hai cốc: cốc 1 đựng nước lạnh, cốc 2 đựng loại nước khác. Cho đồng thời vào mỗi cốc một viên C sủi, quan sát.',
    note:'Viên C sủi trong nước nóng sủi bọt mạnh và tan hết sớm hơn trong nước lạnh. Khi nhiệt độ tăng, tốc độ phản ứng tăng.',
    chips:[
      { q:'Viên C sủi sủi ra khí gì?', a:'Khi gặp nước, các chất trong viên sủi phản ứng với nhau và giải phóng khí carbon dioxide (CO₂), nên em thấy sủi bọt.' },
      { q:'Trong đời sống có ví dụ nào?', a:'Thức ăn để ngoài trời nóng nhanh bị ôi thiu hơn để trong tủ lạnh, vì nhiệt độ thấp làm các quá trình biến đổi chậm lại.' } ],
    setup(S){ setExp(S, 'nhiet-do'); },
    async run(h){ await h.wait(400); await h.ask('q2'); } },
  { title:'Ảnh hưởng của diện tích bề mặt tiếp xúc', q:true,
    sgk:'Cân khoảng 1 g đá vôi dạng viên cho vào ống 1, 1 g đá vôi dạng khác cho vào ống 2. Thêm khoảng 3 mL dung dịch HCl 0,1 M vào mỗi ống, quan sát khí thoát ra.',
    note:'Ống đá vôi bột sủi bọt nhanh hơn ống đá vôi viên. Hạt càng nhỏ, diện tích bề mặt tiếp xúc càng lớn, tốc độ phản ứng càng lớn. Cuối cùng hai ống thu được cùng lượng khí vì acid ít, hết trước.',
    chips:[
      { q:'Diện tích bề mặt tiếp xúc là gì?', a:'Là phần mặt ngoài của chất rắn chạm được vào dung dịch. Đập nhỏ hay nghiền thành bột thì tổng phần mặt ngoài tăng lên, acid tiếp xúc được nhiều hơn.' },
      { q:'Vì sao hai ống cuối cùng có cùng lượng khí?', a:'Vì 3 mL HCl 0,1 M chỉ đủ phản ứng với một phần đá vôi. Acid hết trước nên lượng khí như nhau; dạng bột chỉ làm phản ứng xong sớm hơn.' } ],
    setup(S){ setExp(S, 'be-mat'); },
    async run(h){ await h.wait(400); await h.ask('q3'); } },
  { title:'Ảnh hưởng của chất xúc tác', q:true,
    sgk:'Cho khoảng 3 mL nước oxy già (H₂O₂ 3%) vào ống 1 và ống 2. Thêm một chất vào ống 2, quan sát.',
    note:'Ống có MnO₂ sủi bọt khí mạnh, ống không có MnO₂ gần như không thấy bọt. Phương trình: 2H₂O₂ → 2H₂O + O₂↑. Chất xúc tác làm tăng tốc độ phản ứng nhưng không bị biến đổi sau phản ứng.',
    chips:[
      { q:'Chất xúc tác có bị mất đi không?', a:'Không. Chất xúc tác làm phản ứng nhanh hơn nhưng sau phản ứng vẫn còn nguyên về chất và về lượng.' },
      { q:'Bọt khí trong ống có MnO₂ là khí gì?', a:'Đó là khí oxygen (O₂), sinh ra khi H₂O₂ bị phân hủy thành nước và oxygen.' } ],
    setup(S){ setExp(S, 'xuc-tac'); },
    async run(h){ await h.wait(400); await h.ask('q4'); } },
  { title:'Kết luận',
    sgk:'Rút ra các yếu tố ảnh hưởng đến tốc độ phản ứng.',
    note:'Tốc độ phản ứng tăng khi tăng nồng độ, tăng nhiệt độ, tăng diện tích bề mặt tiếp xúc, hoặc có chất xúc tác.',
    html: CONCLUSION,
    chips:[
      { q:'Tóm tắt giúp em bài này', a:'Có bốn yếu tố làm phản ứng nhanh hơn: dung dịch đặc hơn, nhiệt độ cao hơn, chất rắn nhỏ hơn (bột) và có chất xúc tác.' },
      { q:'Vì sao đun bếp lại chẻ nhỏ củi?', a:'Củi chẻ nhỏ có diện tích bề mặt tiếp xúc với không khí lớn hơn, nên cháy nhanh và đều hơn.' } ],
    setup(S){ setExp(S, 'xuc-tac'); S.f2 = { ...S.f1, cat:true }; Object.assign(S, { run:1, t:EXPS['xuc-tac'].T_END, drop:1 }); },
    async run(h){ await h.wait(200); } }
];

/* ---------- chế độ tự do: chọn hoạt động, em tự chỉnh ống 2 ---------- */
const EXP_OPTS = [
  { value:'nong-do', label:'Nồng độ: đinh sắt + HCl', short:'Nồng độ' },
  { value:'nhiet-do', label:'Nhiệt độ: viên C sủi', short:'Nhiệt độ' },
  { value:'be-mat', label:'Diện tích bề mặt: đá vôi + HCl', short:'Bề mặt' },
  { value:'xuc-tac', label:'Chất xúc tác: H₂O₂ + MnO₂', short:'Xúc tác' }
];
function f2Of(P){
  const b = EXPS[P.exp].base, f = { ...b, T: P.T };
  if (P.exp === 'nong-do') f.C = P.C;
  if (P.exp === 'be-mat') f.form = P.form;
  if (P.exp === 'xuc-tac') f.cat = P.cat;
  return f;
}
const free = {
  title: 'Em tự chỉnh ống 2',
  hint: 'Chọn một hoạt động. Ống (cốc) 1 giữ như SGK; em đổi các yếu tố của ống 2 rồi so sánh hai đường trên đồ thị.',
  groups: [
    { id:'exp', title:'Hoạt động', open:true,
      icon:'<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v13a2 2 0 0 0 4 0V3" fill="none" stroke="var(--glass)" stroke-width="1.6"/><path d="M10 11h4v5a2 2 0 0 1-4 0z" fill="var(--liquid)" fill-opacity=".5"/></svg>',
      summary: P => EXPS[P.exp].name },
    { id:'f2', title:'Ống 2', open:true,
      icon:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="var(--obj)" stroke-width="1.6"/><path d="M12 8v4l3 2" fill="none" stroke="var(--obj)" stroke-width="1.6"/></svg>',
      summary: P => [P.exp === 'nong-do' ? `HCl ${num(P.C)} M` : '', P.exp === 'be-mat' ? FORM_NAME[P.form] : '', P.exp === 'xuc-tac' ? (P.cat ? 'có MnO₂' : 'không MnO₂') : '', `${P.T} °C`].filter(Boolean).join(' · ') }
  ],
  params: [
    { key:'exp', group:'exp', label:'Hoạt động thí nghiệm', short:'Hoạt động', type:'choice', options: EXP_OPTS },
    { key:'C', group:'f2', label:'Nồng độ HCl ở ống 2', short:'Nồng độ HCl', type:'range', min:0.1, max:2, step:0.1, unit:'M', show: P => P.exp === 'nong-do' },
    { key:'form', group:'f2', label:'Dạng đá vôi ở ống 2', short:'Dạng đá vôi', type:'choice', options:[{ value:'vien', label:'Viên' }, { value:'manh', label:'Mảnh nhỏ' }, { value:'bot', label:'Bột' }], show: P => P.exp === 'be-mat' },
    { key:'cat', group:'f2', label:'Thêm bột MnO₂ vào ống 2', short:'Thêm MnO₂', type:'toggle', show: P => P.exp === 'xuc-tac' },
    { key:'T', group:'f2', label:'Nhiệt độ ống (cốc) 2', short:'Nhiệt độ', type:'range', min:5, max:80, step:5, unit:'°C' }
  ],
  defaults: { exp:'nong-do', C:1, form:'bot', cat:true, T:25 },
  target(P){ const S = {}; setExp(S, P.exp); S.f2 = f2Of(P); return Object.assign(S, { setA:1, liqA:1, run:1, t:EXPS[P.exp].T_END, drop:1 }); },
  start(S){ setExp(S, 'nong-do'); Object.assign(S, { setA:0, liqA:0 }); },
  async animate(h, P){
    const S = h.S;
    if (S.exp !== P.exp){ Object.assign(S, { run:0, t:0, drop:0 }); await h.tw({ liqA:0 }, 250); setExp(S, P.exp); }
    S.f1 = { ...EXPS[P.exp].base };
    if (S.setA < 1) await h.tw({ setA:1 }, 500);
    await runPair(h, f2Of(P));
  },
  observe(_S, P){
    const e = EXPS[P.exp], f1 = e.base, f2 = f2Of(P), d = diffs(f1, f2), cmp = compare(f1, f2), v = e.vessel;
    const end1 = show(f1, valueAt(f1, e.T_END, e.T_END)), end2 = show(f2, valueAt(f2, e.T_END, e.T_END));
    if (!d.length) return `${v[0].toUpperCase() + v.slice(1)} 2 giống hệt ${v} 1 nên phản ứng như nhau. Em đổi một yếu tố của ${v} 2 thử xem.`;
    if (cmp === 'both-none') return `Cả hai ${v} gần như không có bọt khí trong thời gian thí nghiệm. ${f2.rx === 'h2o2' ? 'Nước oxy già để yên phân hủy rất chậm; em thử thêm MnO₂ vào ống 2.' : ''}`;
    if (cmp === 'none') return `${v[0].toUpperCase() + v.slice(1)} 2 gần như không có bọt khí vì ${d.map(x => x.why).join(', ')}.`;
    const word = { faster:'nhanh hơn', slower:'chậm hơn', same:'gần như bằng' }[cmp];
    const ups = d.filter(x => x.up === true), downs = d.filter(x => x.up === false);
    const out = [];
    if (ups.length && downs.length) out.push(`${v[0].toUpperCase() + v.slice(1)} 2 có yếu tố làm nhanh hơn (${ups.map(x => x.why).join(', ')}) và yếu tố làm chậm hơn (${downs.map(x => x.why).join(', ')}); trên mô phỏng, ${v} 2 đang phản ứng ${word} ${v} 1.`);
    else out.push(`${v[0].toUpperCase() + v.slice(1)} 2 phản ứng ${word} ${v} 1 vì ${d.map(x => x.why).join(', ')}.`);
    out.push(e.rx === 'vitc' ? `Sau ${e.T_END} s (tua nhanh): ${v} 1 tan ${end1}, ${v} 2 tan ${end2}.` : `Sau ${e.T_END} s (tua nhanh): ${v} 1 thu ${end1}, ${v} 2 thu ${end2} khí.`);
    return out.join(' ');
  },
  drag: { hit: () => null, move: () => ({}), items: () => [], nudge: () => ({}) },
  chips: [
    { q:'Làm sao cho ống 2 nhanh nhất?', a:'Tăng nồng độ, tăng nhiệt độ, dùng chất rắn dạng bột hoặc thêm chất xúc tác. Mỗi yếu tố đều làm phản ứng nhanh hơn.' },
    { q:'Vì sao đồ thị chỉ là minh họa?', a:'Lượng khí tối đa được tính theo phương trình hóa học, còn nhanh hay chậm bao nhiêu chỉ là số minh họa để thấy rõ xu hướng, thời gian đã được tua nhanh.' } ]
};

export default {
  id: 'toc-do-phan-ung',
  grade: 'KHTN 8', chapter: 'Chương I Phản ứng hóa học', lesson: 'Bài 7',
  title: 'Tốc độ phản ứng và chất xúc tác', shortTitle: 'Tốc độ phản ứng',
  intro: 'Bốn hoạt động trong SGK: nồng độ, nhiệt độ, diện tích bề mặt tiếp xúc và chất xúc tác. Mỗi lần hai ống chạy cùng lúc để so sánh. Giữa chừng có câu hỏi mồi; chọn sai thì thí nghiệm chạy đúng theo lựa chọn của em.',
  canvasLabel: 'Hai ống nghiệm (hoặc hai cốc) đặt cạnh nhau, ống nghiệm nối với xi lanh đo khí, bên cạnh là đồ thị theo thời gian',
  readyTitle: 'Dụng cụ đã sẵn sàng',
  footer: 'Mô phỏng phục vụ dạy học, bám SGK KHTN 8 Kết nối tri thức (Bài 7). Xi lanh và đồ thị là phần thêm để so sánh bằng số: lượng khí tối đa tính theo phương trình hóa học, còn tốc độ chỉ để minh họa xu hướng, thời gian được tua nhanh.',
  view: { w: 80, h: 40, ox: 0.5, oy: 0.5 },
  startChips: [
    { q:'Thí nghiệm này để làm gì?', a:'Để thấy bốn yếu tố làm phản ứng hóa học nhanh hơn hay chậm hơn: nồng độ, nhiệt độ, diện tích bề mặt tiếp xúc và chất xúc tác.' },
    { q:'Tốc độ phản ứng là gì?', a:'Tốc độ phản ứng cho biết phản ứng xảy ra nhanh hay chậm. Ở đây, bọt khí thoát ra càng nhanh (xi lanh đầy càng nhanh) thì phản ứng càng nhanh.' } ],
  base(S){ setExp(S, 'nong-do'); Object.assign(S, { setA:1, liqA:1 }); },
  rest(){},
  draw(_g, _S){
    g = _g; S = _S;
    drawBench(); drawVessel(0); drawVessel(1); drawGraph();
  },
  readout(S){
    const e = E(S), V = e.vessel === 'cốc' ? 'Cốc' : 'Ống';
    if (!S.run) return S.setA > 0.5 ? `${e.name} · chưa cho chất vào` : '';
    return `t = ${Math.round(S.t)} s (tua nhanh) · ${V} 1: ${show(S.f1, now(S, S.f1))} · ${V} 2: ${show(S.f2, now(S, S.f2))}`;
  },
  describe(S){
    const e = E(S), v = e.vessel, L = [`Hoạt động đang làm: ảnh hưởng của ${e.name.toLowerCase()} (SGK KHTN 8 Bài 7). Hai ${v} đặt cạnh nhau${v === 'ống' ? ', mỗi ống nối với một xi lanh đo thể tích khí (phần thêm của mô phỏng)' : ''}; bên phải là đồ thị ${e.ylab.toLowerCase()} theo thời gian.`];
    L.push(`${v} 1: ${condText(S.f1)}.`, `${v} 2: ${condText(S.f2)}.`);
    if (!S.run){ L.push('Chưa cho chất vào hai ' + v + '.'); return L; }
    L.push(`Đã cho chất vào hai ${v} cùng lúc. Thời gian trên mô phỏng: ${Math.round(S.t)} s (tua nhanh; tốc độ chỉ để minh họa xu hướng).`);
    [S.f1, S.f2].forEach((f, i) => L.push(e.rx === 'vitc' ? `${v} ${i + 1}: viên sủi đã tan khoảng ${show(f, now(S, f))}.` : `${v} ${i + 1} đã thu được ${show(f, now(S, f))} khí.`));
    const cmp = compare(S.f1, S.f2);
    L.push({ 'both-none':`Cả hai ${v} gần như không có bọt khí.`, none:`${v} 2 gần như không có bọt khí.`, faster:`${v} 2 đang phản ứng nhanh hơn ${v} 1.`, slower:`${v} 2 đang phản ứng chậm hơn ${v} 1.`, same:`Hai ${v} phản ứng như nhau.` }[cmp]);
    if (e.rx === 'caco3' || e.rx === 'h2o2') L.push(`Lượng khí tối đa theo phương trình hóa học: ${v} 1 khoảng ${fmt(curve(S.f1, e.T_END).max)} mL, ${v} 2 khoảng ${fmt(curve(S.f2, e.T_END).max)} mL.`);
    return L;
  },
  steps, questions, free
};
