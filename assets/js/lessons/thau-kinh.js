// Thí nghiệm: Thấu kính hội tụ và thấu kính phân kì (KHTN 9 – Bài 8, Kết nối tri thức)
// Đơn vị trong cảnh: cm. Thấu kính đặt ở x = 0, trục chính là y = 0.
//
// Cấu trúc một module thí nghiệm (dùng file này làm mẫu khi thêm bài mới):
//   view      – vùng nhìn (cm) để lõi tính tỉ lệ vẽ
//   base(S)   – đặt lại toàn bộ biến của cảnh về mặc định
//   rest(S)   – cảnh lúc trang vừa mở
//   draw(g,S) – vẽ cảnh mỗi khung hình (g: công cụ vẽ của lõi)
//   readout(S), describe(S) – chữ hiển thị góc trái và mô tả gửi cho trợ lý AI
//   steps     – các bước theo SGK; run(h) dùng h.tw / h.wait / h.ask('id') / h.showObs()
//   questions – câu hỏi mồi; sim(h, lựa chọn) chạy thí nghiệm theo đúng lựa chọn của học sinh
//   free      – (không bắt buộc) chế độ tự do: params là "cấu hình" thông số, apply(S, P) đặt cảnh theo P,
//               observe(S, P) nêu điều quan sát được, drag kéo dụng cụ trên giá

import { fmt } from '../engine.js';

const F0 = 10, H0 = 3, LH = 7;   // tiêu cự, chiều cao vật mặc định (cm); nửa chiều cao thấu kính
const LENS_NAME = { conv:'thấu kính hội tụ (rìa mỏng)', div:'thấu kính phân kì (rìa dày)', plate:'tấm kính phẳng', mirror:'gương phẳng', none:'chưa đặt dụng cụ' };
const LENS_LABEL = { conv:'Thấu kính hội tụ', div:'Thấu kính phân kì', plate:'Tấm kính phẳng', mirror:'Gương phẳng', none:'' };
const INSET_NAME = { reflect:'Phản xạ ánh sáng', refract:'Khúc xạ ánh sáng', tir:'Phản xạ toàn phần', disperse:'Tán sắc ánh sáng' };

/* ---------- quang học ---------- */
const lensF = S => S.lens === 'div' ? -S.f : S.f;
// độ rộng vệt sáng của chùm tia song song (rộng 8 cm) trên màn đặt cách thấu kính S.s
const beamWidth = S => S.lens === 'none' ? 8 : 8 * Math.abs(1 - S.s / lensF(S));
function imageInfo(S){
  if (S.lens !== 'conv' && S.lens !== 'div') return null;
  const fL = lensF(S), d = S.d;
  if (Math.abs(d - fL) < 0.05) return { atInfinity:true };
  const dp = d * fL / (d - fL), hp = -S.h * dp / d, ratio = Math.abs(hp) / S.h;
  return { dp, hp, real: dp > 0, orient: hp < 0 ? 'ngược chiều' : 'cùng chiều',
    // so sánh gần như tuyệt đối: chỉ vật đúng 2f mới "bằng vật" (sai số lớn sẽ mâu thuẫn với vị trí vật khi chỉnh lẻ 0,5 cm)
    size: ratio > 1 + 1e-6 ? 'lớn hơn vật' : ratio < 1 - 1e-6 ? 'nhỏ hơn vật' : 'bằng vật', far: Math.abs(dp) > 150 };
}
// gương phẳng (mặt phản xạ quay về phía vật): ảnh ảo, cùng chiều, bằng vật, đối xứng với vật qua gương.
// Khác quy ước dấu của thấu kính: dp > 0 ở đây là nằm SAU gương (x = +d), chỉ dùng để vẽ và mô tả.
const mirrorImage = S => ({ dp: S.d, hp: S.h });
/* ---------- dò đường tia ----------
   Tia ló chạy tới mép khung nhìn; nếu gặp màn chắn (trong chiều cao màn) thì dừng ở màn,
   còn đi phía trên/dưới màn thì chạy tiếp ra ngoài. */
const EDGE_X = 40, EDGE_Y = 21, SCREEN_H = 8;   // mép khung nhìn; nửa chiều cao màn chắn (cm)
function exitPoint(x0, y0, k){
  let x = EDGE_X, y = y0 + k * (x - x0);
  if (y > EDGE_Y){ y = EDGE_Y; x = x0 + (y - y0) / k; }
  else if (y < -EDGE_Y){ y = -EDGE_Y; x = x0 + (y - y0) / k; }
  return [x, y];
}
// pts: các điểm đã biết của tia; k: hệ số góc của đoạn cuối (sau thấu kính)
function trace(S, pts, k){
  const [xa, ya] = pts[pts.length - 1];
  const all = [...pts, exitPoint(xa, ya, k)];
  if (S.screenA <= 0.5) return all;
  for (let i = 1; i < all.length; i++){
    const [x0, y0] = all[i - 1], [x1, y1] = all[i];
    if (x0 < S.s && x1 >= S.s){
      const y = y0 + (y1 - y0) * (S.s - x0) / (x1 - x0);
      return Math.abs(y) <= SCREEN_H ? [...all.slice(0, i), [S.s, y]] : all;
    }
  }
  return all;
}
function onScreen(S){
  const im = imageInfo(S); if (!im || im.atInfinity) return { sharp:false };
  return { sharp: im.real && Math.abs(S.s - im.dp) < 0.35, im };
}

/* ---------- vẽ ---------- */
let g, S;
function drawGrid(){
  const { ctx, X, Y, C, W, H } = g;
  ctx.save(); ctx.strokeStyle = C['stage-line']; ctx.globalAlpha = .35; ctx.lineWidth = 1;
  for (let x = -40; x <= 40; x += 5){ ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); }
  for (let y = -20; y <= 20; y += 5){ ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); }
  ctx.restore();
}
function drawRuler(){
  const { ctx, X, Y, C } = g, y = -12.5, small = Math.max(10, g.fs() - 3);
  ctx.save(); ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(X(-37), Y(y)); ctx.lineTo(X(37), Y(y)); ctx.stroke();
  for (let x = -36; x <= 36; x++){
    const major = x % 5 === 0; ctx.globalAlpha = major ? 1 : .5;
    ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x), Y(y - (major ? 0.9 : 0.4))); ctx.stroke();
    if (x % 10 === 0) g.text(String(Math.abs(x)), X(x), Y(y - 1.9), { color: C['stage-muted'], size: small, mono: true });
  }
  ctx.globalAlpha = 1;
  g.text('cm', X(36.6), Y(y - 1.9), { color: C['stage-muted'], size: small, mono: true, align: 'right' });
  ctx.restore();
}
function drawAxis(){
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.strokeStyle = C['stage-muted']; ctx.globalAlpha = .7; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(X(-38), Y(0)); ctx.lineTo(X(38), Y(0)); ctx.stroke(); ctx.restore();
}
function drawLamp(){
  if (S.lampA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g, x = S.lampX;
  ctx.save(); ctx.globalAlpha = S.lampA;
  g.rr(X(x - 3.6), Y(5.5), 3.7 * sc, 11 * sc, 6); ctx.fillStyle = C['stage-2']; ctx.fill(); ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = C.beam; ctx.lineWidth = 3; ctx.shadowColor = C.beam; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(X(x), Y(4.6)); ctx.lineTo(X(x), Y(-4.6)); ctx.stroke(); ctx.shadowBlur = 0;
  g.text('Đèn', X(x - 1.8), Y(-7.3), { color: C['stage-muted'], size: g.fs() - 1 });
  ctx.restore();
}
function drawBeam(){
  if (S.beam <= 0 || S.lampA <= 0.01) return;
  const x0 = S.lampX, f = S.f, fL = lensF(S);
  for (const y0 of [-4, -2, 0, 2, 4]){
    let pts;
    switch (S.lens){
      case 'conv': case 'div': pts = trace(S, [[x0, y0], [0, y0]], -y0 / fL); break;   // tia ló đi qua (hoặc kéo dài qua) tiêu điểm
      case 'plate': pts = trace(S, [[x0, y0]], 0); break;
      case 'mirror': pts = [[x0, y0], [-0.25, y0], [x0, y0 + 0.55]]; break;
      // chưa đặt dụng cụ: tự do thì ánh sáng truyền thẳng; bước SGK thì dừng ở chỗ trống trên giá
      default: pts = S.handles ? trace(S, [[x0, y0]], 0) : [[x0, y0], [-1.4, y0]];
    }
    g.path(pts, S.beam, { alpha: S.lampA, from: S.beamTail });
    if (S.lens === 'div' && S.beam > 0.62 && y0 !== 0)
      g.path([[0, y0], [-f, 0]], Math.min(1, (S.beam - 0.62) / 0.3), { dash:[5, 6], alpha:.6 * S.lampA * (1 - S.beamTail), arrows:false, glow:false, width:1.6 });
  }
}
function drawLens(){
  if (S.lensA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g, t = S.lens;
  ctx.save(); ctx.globalAlpha = S.lensA;
  ctx.fillStyle = C.glass; ctx.strokeStyle = C.glass; ctx.lineWidth = 1.8;
  const fillStroke = () => { ctx.globalAlpha = S.lensA * .28; ctx.fill(); ctx.globalAlpha = S.lensA; ctx.stroke(); };
  if (t === 'conv'){
    const w = 1.15; ctx.beginPath(); ctx.moveTo(X(0), Y(LH));
    ctx.quadraticCurveTo(X(2 * w), Y(0), X(0), Y(-LH)); ctx.quadraticCurveTo(X(-2 * w), Y(0), X(0), Y(LH)); ctx.closePath(); fillStroke();
  } else if (t === 'div'){
    const e = 1.0, c = 0.25, k = 2 * c - e; ctx.beginPath(); ctx.moveTo(X(-e), Y(LH)); ctx.lineTo(X(e), Y(LH));
    ctx.quadraticCurveTo(X(k), Y(0), X(e), Y(-LH)); ctx.lineTo(X(-e), Y(-LH)); ctx.quadraticCurveTo(X(-k), Y(0), X(-e), Y(LH)); ctx.closePath(); fillStroke();
  } else if (t === 'plate'){
    ctx.beginPath(); ctx.rect(X(-0.6), Y(LH), 1.2 * sc, 2 * LH * sc); fillStroke();
  } else if (t === 'mirror'){
    ctx.fillStyle = C.screen; ctx.fillRect(X(-0.18), Y(LH), 0.36 * sc, 2 * LH * sc);
    ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.2;
    for (let y = -LH; y < LH; y += 1){ ctx.beginPath(); ctx.moveTo(X(0.18), Y(y)); ctx.lineTo(X(0.9), Y(y - 0.7)); ctx.stroke(); }
  } else {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C['stage-muted']; g.rr(X(-1.2), Y(LH), 2.4 * sc, 2 * LH * sc, 8); ctx.stroke(); ctx.setLineDash([]);
    g.text('?', X(0), Y(0), { color: C['stage-muted'], size: g.fs() * 2, weight: 700 });
  }
  if (LENS_LABEL[t]) g.text(LENS_LABEL[t], X(0), Y(-LH - 1.4), { color: C.glass, size: g.fs() - 1, weight: 600 });
  ctx.restore();
}
function drawFoci(){
  if ((S.lens !== 'conv' && S.lens !== 'div') || S.fociA <= 0.01) return;
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.globalAlpha = S.fociA * S.lensA;
  for (const [x, lab] of [[-S.f, 'F'], [S.f, "F'"]]){
    ctx.fillStyle = C['stage-ink']; ctx.beginPath(); ctx.arc(X(x), Y(0), 3.6, 0, Math.PI * 2); ctx.fill();
    g.text(lab, X(x), Y(-1.4), { weight: 700 });
  }
  g.text('O', X(-0.9), Y(-1.2), { size: g.fs() - 1, weight: 700, color: C['stage-muted'] });
  ctx.restore();
}
function drawObject(){
  if (S.objA <= 0.01) return;
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.globalAlpha = S.objA;
  g.arrowV(-S.d, 0, S.h, C.obj, { width: 3.4 });
  g.text('A', X(-S.d) - 10, Y(-0.9), { size: g.fs() - 2, color: C['stage-muted'], weight: 700 });
  g.text('B', X(-S.d) - 11, Y(S.h), { size: g.fs() - 2, color: C.obj, weight: 700 });
  g.text('Vật', X(-S.d), Y(S.h + 1.5), { size: g.fs() - 1, color: C.obj, weight: 600 });
  ctx.restore();
}
function drawImageRays(){
  if (S.objA <= 0.01 || S.img <= 0) return;
  const { ctx } = g, h = S.h, d = S.d, from = S.imgTail;
  ctx.save(); ctx.globalAlpha = S.objA;
  if (S.lens === 'none'){   // chưa có thấu kính: ánh sáng từ điểm B truyền thẳng theo nhiều hướng
    for (const k of [-0.12, 0, 0.12]) g.path(trace(S, [[-d, h]], k), S.img, { from });
    ctx.restore(); return;
  }
  if (S.lens === 'mirror'){ drawMirrorRays(); ctx.restore(); return; }
  if (S.lens !== 'conv' && S.lens !== 'div'){ ctx.restore(); return; }
  const fL = lensF(S), im = imageInfo(S), virt = im && !im.atInfinity && !im.real && S.virtA > 0.01;
  const ext = { dash:[5, 6], alpha:.7 * S.virtA, arrows:false, glow:false, width:1.6 };
  const aim = { dash:[5, 6], alpha:.5, arrows:false, glow:false, width:1.4, from };
  // mỗi tia có tiến độ riêng (S.rayPar, S.rayO, S.rayF: 0..1) để bật/tắt thì tia chạy ra/thu về
  if (S.rayPar > 0){   // tia song song trục chính: ló ra đi qua F' (hội tụ) / có đường kéo dài qua F (phân kì)
    g.path(trace(S, [[-d, h], [0, h]], -h / fL), S.img * S.rayPar, { from });
    if (virt) g.path([[0, h], [im.dp, im.hp]], 1, { ...ext, alpha: ext.alpha * S.rayPar });
  }
  if (S.rayO > 0){     // tia qua quang tâm O: truyền thẳng
    g.path(trace(S, [[-d, h], [0, 0]], -h / d), S.img * S.rayO, { from });
    if (virt) g.path([[0, 0], [im.dp, im.hp]], 1, { ...ext, alpha: ext.alpha * S.rayO });
  }
  // tia tới đi qua F (hội tụ) / hướng tới F' (phân kì): ló ra song song với trục chính.
  // Cả hai trường hợp, đường tia tới đi qua điểm x = -fL trên trục chính.
  if (S.rayF > 0 && Math.abs(d - fL) > 0.05){
    const yh = -h * fL / (d - fL);
    if (Math.abs(yh) <= LH){
      g.path(trace(S, [[-d, h], [0, yh]], 0), S.img * S.rayF, { from });
      if (S.lens === 'div' || d < fL) g.path(S.lens === 'div' ? [[0, yh], [-fL, 0]] : [[-fL, 0], [-d, h]], S.img * S.rayF, aim);
      if (virt) g.path([[0, yh], [im.dp, im.hp]], 1, { ...ext, alpha: ext.alpha * S.rayF });
    }
  }
  ctx.restore();
}
// hai tia từ B tới gương rồi hắt ngược lại (góc phản xạ bằng góc tới);
// đường kéo dài của tia phản xạ ra sau gương (nét đứt) gặp nhau tại B'
function drawMirrorRays(){
  const h = S.h, d = S.d, from = S.imgTail, lim = LH - 0.5;
  const ext = { dash:[5, 6], alpha:.7 * S.virtA, arrows:false, glow:false, width:1.6 };
  for (const ym of [Math.min(lim, h + 1.5), Math.max(-lim, h - 3.5)]){
    const k = (ym - h) / d;   // tia phản xạ: mỗi cm đi sang trái thì y đổi thêm k
    let x = -EDGE_X, y = ym + k * EDGE_X;
    if (Math.abs(y) > EDGE_Y){ y = Math.sign(y) * EDGE_Y; x = -(y - ym) / k; }
    g.path([[-d, h], [0, ym], [x, y]], S.img, { from });
    if (S.virtA > 0.01) g.path([[0, ym], [d, h]], 1, ext);
  }
}
function drawScreen(){
  if (S.screenA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g, x = X(S.s);
  ctx.save(); ctx.globalAlpha = S.screenA;
  ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, Y(-8)); ctx.lineTo(x, Y(-12.5)); ctx.stroke();
  ctx.fillStyle = C.screen; ctx.globalAlpha = S.screenA * .9; ctx.fillRect(x - 3, Y(8), 6, 16 * sc); ctx.globalAlpha = S.screenA;
  g.text('Màn chắn', x, Y(9.2), { size: g.fs() - 1, color: C['stage-muted'], weight: 600 });
  if (S.objA <= 0.5 && S.beam > 0.97 && S.beamTail < 0.03 && S.lampA > 0.5 && (S.lens === 'conv' || S.lens === 'div' || S.lens === 'none')){
    const w = beamWidth(S), half = Math.min(8, Math.max(0.15, w / 2));
    ctx.fillStyle = C.beam; ctx.shadowColor = C.beam; ctx.shadowBlur = 12;
    ctx.fillRect(x - 3, Y(half), 6, 2 * half * sc); ctx.shadowBlur = 0;
    g.text(w < 0.35 ? 'Điểm sáng' : 'Vệt sáng', x + 8, Y(Math.min(half + 0.6, 6.5)), { size: g.fs() - 1, color: C.beam, weight: 700, align: 'left' });   // không đè chữ "Màn chắn"
  }
  if (S.objA > 0.5 && S.img > 0.97 && (S.lens === 'conv' || S.lens === 'div')){
    const o = onScreen(S);
    if (S.imgTail > 0.03){ /* ánh sáng đang chạy đi: không vẽ ảnh */ }
    else if (o.sharp){
      g.arrowV(S.s, 0, o.im.hp, C.img, { width: 3.6 });
      g.text('Ảnh rõ nét', x + 8, Y(o.im.hp < 0 ? o.im.hp - 1.4 : o.im.hp + 1.4), { size: g.fs() - 1, color: C.img, weight: 700, align: 'left' });
    } else {
      const fL = lensF(S), y1 = S.h * (1 - S.s / fL), y2 = -S.h * S.s / S.d;
      const top = Math.min(8, Math.max(0, y1, y2) + .5), bot = Math.max(-8, Math.min(0, y1, y2) - .5);
      const grad = ctx.createLinearGradient(0, Y(top), 0, Y(bot));
      grad.addColorStop(0, 'transparent'); grad.addColorStop(.5, C.beam); grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = S.screenA * .45; ctx.fillStyle = grad; ctx.fillRect(x - 5, Y(top), 10, (top - bot) * sc);
      ctx.globalAlpha = S.screenA;
      g.text('Vệt sáng mờ', x + 8, Y(Math.max(top, 2) + 0.2), { size: g.fs() - 1, color: C['stage-muted'], weight: 600, align: 'left' });
    }
  }
  ctx.restore();
}
function drawVirtual(){
  if (S.virtA <= 0.01 || S.objA <= 0.01) return;
  const im = S.lens === 'mirror' ? mirrorImage(S) : imageInfo(S); if (!im || im.atInfinity || im.real) return;
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.globalAlpha = S.virtA;
  g.arrowV(im.dp, 0, im.hp, C.img, { width: 2.6, dash: [6, 5], glow: false });
  g.text('Ảnh ảo', X(im.dp), Y(im.hp + 1.5), { size: g.fs() - 1, color: C.img, weight: 700 });
  ctx.restore();
}
// chế độ tự do, không đặt màn: vẽ ảnh thật A'B' tại chỗ các tia ló gặp nhau (như hình vẽ trong SGK)
function drawRealImage(){
  if (!S.handles || S.objA <= 0.5 || S.img < 0.97 || S.imgTail > 0.03) return;
  const a = 1 - S.screenA; if (a <= 0.01) return;
  const im = imageInfo(S); if (!im || im.atInfinity || !im.real || im.dp > EDGE_X) return;
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.globalAlpha = a;
  g.arrowV(im.dp, 0, im.hp, C.img, { width: 3 });
  g.text("Ảnh thật A'B'", X(im.dp) + 8, Y(im.hp < 0 ? im.hp - 1.2 : im.hp + 1.2), { size: g.fs() - 1, color: C.img, weight: 700, align: 'left' });
  ctx.restore();
}
function drawEye(){
  if (S.eyeA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g, cx = X(27), cy = Y(0), w = 2.2 * sc, h = 1.2 * sc;
  ctx.save(); ctx.globalAlpha = S.eyeA; ctx.strokeStyle = C['stage-ink']; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - w, cy); ctx.quadraticCurveTo(cx, cy - h * 1.6, cx + w, cy); ctx.quadraticCurveTo(cx, cy + h * 1.6, cx - w, cy); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = C.glass; ctx.beginPath(); ctx.arc(cx - w * .35, cy, h * .55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.stage; ctx.beginPath(); ctx.arc(cx - w * .42, cy, h * .25, 0, Math.PI * 2); ctx.fill();
  g.text('Mắt nhìn qua thấu kính', cx, cy + h * 2.6, { size: g.fs() - 1, color: C['stage-muted'], weight: 600 });
  ctx.restore();
}
// nút ◂ ▸ dưới các dụng cụ kéo được (chỉ ở chế độ tự do)
// nút ◂ ▸ của dụng cụ đang chọn (S.sel, chọn bằng chuột hoặc phím ↑/↓) thì sáng lên
function drawHandles(){
  if (!S.handles) return;
  const items = [];
  if (S.objA > 0.5) items.push(['object', -S.d]);
  if (S.screenA > 0.5) items.push(['screen', S.s]);
  if (S.lampA > 0.5) items.push(['lamp', S.lampX - 1.8]);
  const { ctx, X, Y, C, sc } = g, w = 3.2 * sc, h = Math.max(14, 1.3 * sc);
  for (const [key, x] of items){
    const sel = S.sel === key;
    g.rr(X(x) - w / 2, Y(-10.4) - h / 2, w, h, h / 2);
    ctx.fillStyle = C['stage-2']; ctx.fill();
    ctx.strokeStyle = sel ? C.glass : C['stage-muted']; ctx.lineWidth = sel ? 2.4 : 1.2; ctx.stroke();
    g.text('◂ ▸', X(x), Y(-10.4), { size: Math.max(10, g.fs() - 3), color: sel ? C.glass : C['stage-ink'], weight: 700 });
  }
}
function drawInset(){
  if (!S.inset || S.insetP <= 0) return;
  const { ctx, X, Y, C, sc } = g;
  const x0 = X(-37), y0 = Math.max(Y(18.2), 48), w = 25 * sc, h = Math.max(70, Y(7.6) - y0);
  ctx.save(); ctx.globalAlpha = Math.min(1, S.insetP * 3);
  g.rr(x0, y0, w, h, 10); ctx.fillStyle = C['stage-2']; ctx.fill(); ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save(); g.rr(x0, y0, w, h, 10); ctx.clip();
  g.text('Phóng to mặt thấu kính · nếu là: ' + INSET_NAME[S.inset], x0 + 12, y0 + 16, { size: Math.max(11, g.fs() - 2), color: C['stage-muted'], align: 'left', weight: 600 });
  const cx = x0 + w / 2, cy = y0 + h * 0.6, R = Math.min(w * 0.42, h * 0.5), glassLeft = S.inset === 'tir';
  ctx.fillStyle = C.glass; ctx.globalAlpha = .16;
  if (glassLeft) ctx.fillRect(x0, y0 + 26, w / 2, h); else ctx.fillRect(cx, y0 + 26, w / 2, h);
  ctx.globalAlpha = 1;
  const small = Math.max(10, g.fs() - 3);
  g.text(glassLeft ? 'Thủy tinh' : 'Không khí', cx - w * .25, y0 + 40, { size: small, color: C['stage-muted'] });
  g.text(glassLeft ? 'Không khí' : 'Thủy tinh', cx + w * .25, y0 + 40, { size: small, color: C['stage-muted'] });
  ctx.strokeStyle = C.glass; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, y0 + 28); ctx.lineTo(cx, y0 + h); ctx.stroke();
  ctx.strokeStyle = C['stage-muted']; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke(); ctx.setLineDash([]);
  const p1 = Math.min(1, S.insetP * 2), p2 = Math.max(0, S.insetP * 2 - 1), deg = a => a * Math.PI / 180;
  const seg = (ax, ay, bx, by, p, color = C.beam, width = 2.4) => {
    if (p <= 0) return; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); ctx.stroke(); ctx.shadowBlur = 0;
  };
  if (S.inset === 'tir'){
    const a = deg(52);
    seg(cx - R * Math.cos(a), cy + R * Math.sin(a), cx, cy, p1); seg(cx, cy, cx - R * Math.cos(a), cy - R * Math.sin(a), p2);
  } else {
    const a = deg(40);
    seg(cx - R * Math.cos(a), cy - R * Math.sin(a), cx, cy, p1);
    if (S.inset === 'refract'){ const b = deg(25); seg(cx, cy, cx + R * Math.cos(b), cy + R * Math.sin(b), p2); }
    else if (S.inset === 'reflect') seg(cx, cy, cx - R * Math.cos(a), cy + R * Math.sin(a), p2);
    else if (S.inset === 'disperse')
      ['spec-1','spec-2','spec-3','spec-4','spec-5','spec-6'].forEach((k, i) => { const b = deg(20 + i * 2.6); seg(cx, cy, cx + R * Math.cos(b), cy + R * Math.sin(b), p2, C[k], 2); });
  }
  ctx.restore(); ctx.restore();
}

/* ---------- câu hỏi mồi ---------- */
const REF8 = 'SGK KHTN 9 · Bài 8 Thấu kính, tr. 40';
const questions = [
  { id:'q1', short:'Vì sao tia sáng đổi hướng qua thấu kính?', tag:'Ôn bài cũ · Bài 5–7',
    text:'Tia sáng bị đổi hướng khi đi qua thấu kính. Theo em, đó là do hiện tượng nào em đã học?',
    opts:['Phản xạ ánh sáng','Khúc xạ ánh sáng','Phản xạ toàn phần','Tán sắc ánh sáng'], answer:1,
    modes:['reflect','refract','tir','disperse'],
    async sim(h, c){ h.S.inset = this.modes[c]; h.S.insetP = 0; await h.tw({ insetP:1 }, 1500); await h.wait(500); },
    async reset(h){ await h.tw({ insetP:0 }, 300); },
    wrong:[
      'Nếu là phản xạ thì tia sáng phải bật ngược lại như gặp gương. Nhưng trong thí nghiệm, ánh sáng vẫn đi xuyên qua thấu kính.',
      null,
      'Phản xạ toàn phần xảy ra khi ánh sáng đi từ thủy tinh ra không khí với góc tới lớn, và khi đó không có tia nào ló ra. Nhưng ở đây ánh sáng vẫn ló ra sau thấu kính.',
      'Tán sắc (Bài 7) là khi ánh sáng trắng bị tách thành nhiều màu. Ở đây chùm sáng chỉ có một màu mà vẫn bị lệch hướng. Vậy hiện tượng gốc làm tia đổi hướng là gì?'
    ],
    hint2:'Gợi ý: nhớ lại Bài 5. Khi ánh sáng đi từ không khí vào thủy tinh, tia sáng bị gãy khúc ngay tại mặt phân cách.',
    right:'Ánh sáng bị khúc xạ hai lần: khi đi từ không khí vào thủy tinh và khi từ thủy tinh ra không khí. Mặt thấu kính cong nên mỗi tia lệch một góc khác nhau, nhờ vậy cả chùm tia gom về một điểm.',
    ref:'SGK KHTN 9 · Bài 5 Khúc xạ ánh sáng, tr. 25' },
  { id:'q2', short:'Chọn dụng cụ để chùm tia loe ra', tag:'Hội tụ hay phân kì?',
    text:'Thầy muốn chùm tia ló LOE RỘNG RA thay vì gom lại. Em chọn dụng cụ nào đặt vào giá?',
    opts:['Thấu kính rìa mỏng (như lúc nãy)','Thấu kính rìa dày','Tấm kính phẳng','Gương phẳng'], answer:1,
    kinds:['conv','div','plate','mirror'],
    async sim(h, c){ const S = h.S; S.beam = 0; S.lens = this.kinds[c]; S.lensA = 0; S.fociA = 0; await h.tw({ lensA:1 }, 400); await h.tw({ beam:1 }, 1600); await h.wait(600); },
    async reset(h){ await h.tw({ beam:0, lensA:0 }, 350); h.S.lens = 'none'; h.S.lensA = 1; },
    wrong:[
      "Thấu kính rìa mỏng gom chùm tia lại tại tiêu điểm F', ngược với điều thầy muốn.",
      null,
      'Tấm kính phẳng để chùm tia đi thẳng qua. Chùm tia không loe ra.',
      'Gương phẳng hắt ánh sáng ngược trở lại (phản xạ). Chùm tia không đi qua được.'
    ],
    hint2:'Gợi ý: thấu kính rìa mỏng thì gom tia sáng lại. Còn loại có hình dạng ngược lại thì sao?',
    right:'Thấu kính rìa dày là thấu kính phân kì. Chùm tia ló loe rộng ra; kéo dài các tia ló về phía sau (nét đứt) thì chúng gặp nhau tại tiêu điểm F.',
    ref: REF8 },
  { id:'q3', short:'Đặt vật ở đâu để ảnh to hơn vật?', tag:'Ảnh qua thấu kính hội tụ',
    text:'Muốn hứng được ảnh trên màn TO HƠN vật, em đặt vật cách thấu kính bao nhiêu?',
    opts:['30 cm (giữ nguyên)','20 cm','15 cm','5 cm (sát thấu kính)'], answer:2, ds:[30, 20, 15, 5],
    async sim(h, c){
      const d = this.ds[c]; await h.tw({ d }, 900);
      if (d > F0) await h.tw({ s: d * F0 / (d - F0) }, 1400);
      else { await h.tw({ s:36 }, 1400); await h.tw({ s:13 }, 1400); }
      await h.wait(700);
    },
    async reset(h){ await h.tw({ d:30, s:15 }, 700); },
    wrong:[
      'Vật vẫn ở xa (hơn 2f) nên ảnh nhỏ hơn vật. Em thử dời vật lại gần thấu kính xem.',
      'Ở 20 cm (đúng bằng 2f) ảnh chỉ bằng vật, chưa to hơn. Dời gần thêm một chút, nhưng đừng vượt qua tiêu điểm.',
      null,
      'Dịch màn khắp nơi mà không hứng được ảnh nào! Khi vật nằm trong khoảng tiêu cự, ảnh là ảnh ảo nên màn không hứng được.'
    ],
    hint2:'Gợi ý: ảnh thật lớn hơn vật khi vật nằm giữa f và 2f, tức là cách thấu kính từ 10 cm đến 20 cm.',
    right:'Vật nằm giữa f và 2f (10–20 cm) cho ảnh thật, ngược chiều, lớn hơn vật. Ở đây ảnh cao gấp 2 lần vật, và màn phải lùi ra 30 cm mới thấy rõ.',
    ref: REF8 },
  { id:'q4', short:'Thấu kính phân kì: hứng ảnh ở đâu?', tag:'Thấu kính phân kì',
    text:'Đã thay bằng thấu kính phân kì, vật vẫn cách 30 cm. Dịch màn tới đâu thì hứng được ảnh rõ nét?',
    opts:['Sát thấu kính (5 cm)','Ở 15 cm như lúc nãy','Ra xa (30 cm)','Không có vị trí nào hứng được'], answer:3, ss:[5, 15, 30],
    async sim(h, c){
      if (c < 3){ await h.tw({ s:this.ss[c] }, 1100); await h.wait(800); }
      else { await h.tw({ s:5 }, 600); await h.tw({ s:35 }, 1900); await h.tw({ screenA:.35 }, 400); await h.tw({ virtA:1 }, 800); await h.wait(400); }
    },
    async reset(h){ await h.tw({ s:15, screenA:1, virtA:0 }, 500); },
    wrong:[
      'Sát thấu kính chỉ thấy một vệt sáng mờ, không có ảnh.',
      'Ở 15 cm vẫn chỉ là vệt sáng loang. Thấu kính phân kì làm chùm tia loe ra, vậy các tia có gặp nhau trên màn được không?',
      'Càng ra xa, vệt sáng càng loang rộng và mờ hơn.',
      null
    ],
    hint2:'Gợi ý: ảnh tạo bởi thấu kính phân kì là ảnh thật hay ảnh ảo? Ảnh ảo có hứng được trên màn không?',
    right:'Thấu kính phân kì luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật, nằm cùng phía với vật (nét đứt). Màn chắn không hứng được, chỉ thấy khi nhìn qua thấu kính.',
    ref: REF8 }
];

/* ---------- các bước theo SGK ---------- */
const CONCLUSION = `<div class="concl-wrap"><table class="concl"><thead><tr><th></th><th>Thấu kính hội tụ</th><th>Thấu kính phân kì</th></tr></thead><tbody>
<tr><th>Hình dạng</th><td>Rìa mỏng hơn phần giữa</td><td>Rìa dày hơn phần giữa</td></tr>
<tr><th>Chùm tia song song</th><td>Hội tụ tại tiêu điểm F'</td><td>Loe ra, đường kéo dài qua F</td></tr>
<tr><th>Vật ngoài khoảng tiêu cự</th><td>Ảnh thật, ngược chiều</td><td rowspan="2">Luôn là ảnh ảo, cùng chiều, nhỏ hơn vật</td></tr>
<tr><th>Vật trong khoảng tiêu cự</th><td>Ảnh ảo, cùng chiều, lớn hơn vật</td></tr></tbody></table></div>`;

const steps = [
  { title:'Chuẩn bị dụng cụ',
    sgk:'Đặt đèn chiếu chùm sáng song song và thấu kính rìa mỏng (tiêu cự 10 cm) lên giá quang học. Thấu kính đặt ở vạch 0.',
    note:'Thấu kính rìa mỏng là thấu kính hội tụ. Điểm O ở giữa thấu kính là quang tâm; đường nét đứt đi qua O là trục chính.',
    chips:[
      { q:'Thấu kính là gì?', a:'Thấu kính là một khối trong suốt (thường bằng thủy tinh hoặc nhựa) có hai mặt cong, hoặc một mặt cong một mặt phẳng. Ánh sáng đi qua thấu kính sẽ bị đổi hướng.' },
      { q:'Trục chính là gì?', a:'Trục chính là đường thẳng đi qua quang tâm O và vuông góc với thấu kính. Trong mô phỏng, đó là đường nét đứt nằm ngang.' } ],
    setup(S){ S.lensA = 0; S.fociA = 0; },
    async run(h){ await h.tw({ lampA:1 }, 500); await h.tw({ lensA:1 }, 600); await h.tw({ fociA:1 }, 500); } },
  { title:'Chiếu chùm sáng song song', q:true,
    sgk:'Bật đèn, chiếu chùm tia sáng song song với trục chính tới thấu kính. Quan sát chùm tia ló.',
    note:"Chùm tia ló hội tụ tại một điểm sau thấu kính: đó là tiêu điểm F'. Khoảng cách OF' = 10 cm là tiêu cự f.",
    chips:[
      { q:'Vì sao chùm tia lại gom về một điểm?', a:'Vì ánh sáng bị khúc xạ khi đi qua thủy tinh. Phần rìa thấu kính nghiêng nhiều hơn phần giữa nên tia ở rìa bị lệch nhiều hơn, cả chùm gom về tiêu điểm F\'.' },
      { q:'Tiêu cự là gì?', a:"Tiêu cự là khoảng cách từ quang tâm O đến tiêu điểm F'. Trong thí nghiệm này tiêu cự là 10 cm." } ],
    setup(S){ S.lampA = 1; },
    async run(h){ await h.tw({ beam:1 }, 1900); h.showObs(); await h.wait(900); await h.ask('q1'); } },
  { title:'Đổi dụng cụ để chùm tia ló loe ra', q:true,
    sgk:'Thay thấu kính bằng một dụng cụ khác sao cho chùm tia ló loe rộng ra. Quan sát chùm tia ló.',
    note:'Thấu kính rìa dày là thấu kính phân kì: chùm tia ló loe rộng ra. Kéo dài các tia ló về phía sau (nét đứt), chúng gặp nhau tại tiêu điểm F.',
    chips:[
      { q:'Vì sao rìa dày lại làm tia loe ra?', a:'Thấu kính rìa dày có hai mặt lõm. Khi khúc xạ qua hai mặt lõm, tia sáng bị lệch ra xa trục chính nên cả chùm loe rộng ra.' },
      { q:'Thấu kính phân kì dùng để làm gì?', a:'Thấu kính phân kì được dùng làm kính cận để giúp người cận thị nhìn rõ vật ở xa.' } ],
    setup(S){ S.lampA = 1; S.lens = 'none'; S.fociA = 0; },
    async run(h){ await h.wait(500); await h.ask('q2'); h.S.fociA = 0; await h.tw({ fociA:1 }, 500); } },
  { title:'Tạo ảnh qua thấu kính hội tụ',
    sgk:'Lắp lại thấu kính hội tụ. Đặt vật sáng AB cách thấu kính 30 cm, dịch màn chắn đến khi hứng được ảnh rõ nét.',
    note:'Vật ở xa (d = 30 cm, lớn hơn 2f): ảnh thật, ngược chiều, nhỏ hơn vật. Màn cách thấu kính 15 cm thì ảnh rõ nét nhất.',
    chips:[
      { q:'Ảnh thật khác ảnh ảo thế nào?', a:'Ảnh thật hứng được trên màn chắn. Ảnh ảo không hứng được trên màn, chỉ nhìn thấy khi nhìn qua thấu kính.' },
      { q:'Vì sao ảnh bị ngược chiều?', a:'Các tia sáng từ đỉnh B của vật sau khi qua thấu kính hội tụ cắt nhau ở phía dưới trục chính, nên ảnh của B nằm ở dưới, tức là ảnh bị lộn ngược.' } ],
    setup(S){ S.s = 30; },
    async run(h){ await h.tw({ objA:1 }, 600); await h.tw({ screenA:1 }, 500); await h.tw({ img:1 }, 1500); await h.tw({ s:15 }, 1700); } },
  { title:'Dời vật lại gần thấu kính', q:true,
    sgk:'Dời vật lại gần thấu kính, dịch màn để tìm ảnh rõ nét. So sánh độ lớn của ảnh với vật.',
    note:'Vật nằm giữa f và 2f (d = 15 cm): ảnh thật, ngược chiều, lớn hơn vật. Màn phải lùi ra 30 cm mới hứng được ảnh rõ.',
    chips:[
      { q:'2f nghĩa là gì?', a:'2f là hai lần tiêu cự. Tiêu cự ở đây là 10 cm nên 2f = 20 cm.' },
      { q:'Vì sao vật gần hơn thì ảnh to hơn?', a:'Khi vật tiến lại gần tiêu điểm, các tia ló gặp nhau ở xa thấu kính hơn, nên ảnh hiện ra xa hơn và lớn hơn.' } ],
    setup(S){ S.objA = 1; S.screenA = 1; S.img = 1; },
    async run(h){ await h.wait(400); await h.ask('q3'); } },
  { title:'Đặt vật trong khoảng tiêu cự',
    sgk:'Dời vật vào trong khoảng tiêu cự (d = 5 cm). Dịch màn để tìm ảnh, sau đó nhìn qua thấu kính.',
    note:'Màn không hứng được ảnh. Nhìn qua thấu kính thấy ảnh ảo, cùng chiều, lớn hơn vật. Kính lúp hoạt động theo đúng cách này (Bài 10).',
    chips:[
      { q:'Vì sao màn không hứng được ảnh?', a:'Khi vật nằm trong khoảng tiêu cự, các tia ló loe ra và không cắt nhau phía sau thấu kính. Chỉ đường kéo dài của chúng gặp nhau ở phía trước, tạo ảnh ảo.' },
      { q:'Kính lúp hoạt động thế nào?', a:'Kính lúp là thấu kính hội tụ có tiêu cự ngắn. Đặt vật trong khoảng tiêu cự thì nhìn qua kính thấy ảnh ảo, cùng chiều và lớn hơn vật.' } ],
    setup(S){ S.objA = 1; S.screenA = 1; S.img = 1; S.d = 15; S.s = 30; },
    async run(h){ await h.tw({ d:5 }, 1000); await h.tw({ s:36 }, 1200); await h.tw({ s:13 }, 1400); await h.wait(500); await h.tw({ screenA:0 }, 500); await h.tw({ eyeA:1, virtA:1 }, 900); } },
  { title:'Tạo ảnh qua thấu kính phân kì', q:true,
    sgk:'Thay bằng thấu kính phân kì. Giữ vật cách thấu kính 30 cm, dịch màn để tìm ảnh.',
    note:'Thấu kính phân kì luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật, nằm cùng phía với vật. Màn chắn không hứng được.',
    chips:[
      { q:'Vì sao thấu kính phân kì không cho ảnh thật?', a:'Thấu kính phân kì luôn làm chùm tia ló loe ra, nên các tia ló không bao giờ cắt nhau phía sau thấu kính. Vì vậy không có ảnh thật.' },
      { q:'Ảnh ảo nằm ở đâu?', a:'Ảnh ảo nằm cùng phía với vật, gần thấu kính hơn vật. Trong mô phỏng là mũi tên nét đứt.' } ],
    setup(S){ S.lens = 'div'; S.objA = 1; S.screenA = 1; S.img = 1; },
    async run(h){ h.S.lensA = 0; await h.tw({ lensA:1 }, 500); await h.wait(400); await h.ask('q4'); } },
  { title:'Kết luận',
    sgk:'Rút ra đặc điểm của thấu kính hội tụ và thấu kính phân kì.',
    note:"Thấu kính hội tụ (rìa mỏng): chùm tia song song hội tụ tại F'; vật ngoài khoảng tiêu cự cho ảnh thật ngược chiều, trong khoảng tiêu cự cho ảnh ảo cùng chiều lớn hơn vật. Thấu kính phân kì (rìa dày): chùm tia song song loe ra; luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật.",
    html: CONCLUSION,
    chips:[
      { q:'Làm sao phân biệt 2 loại thấu kính bằng tay?', a:'Sờ vào thấu kính: rìa mỏng hơn phần giữa là thấu kính hội tụ, rìa dày hơn phần giữa là thấu kính phân kì.' },
      { q:'Tóm tắt giúp em bài này', a:"Thấu kính hội tụ gom chùm sáng song song về tiêu điểm F', cho ảnh thật hoặc ảnh ảo tùy vị trí vật. Thấu kính phân kì làm chùm sáng loe ra và luôn cho ảnh ảo, cùng chiều, nhỏ hơn vật." } ],
    setup(S){ S.lens = 'div'; S.objA = 1; S.img = 1; S.screenA = .35; S.s = 35; S.virtA = 1; },
    async run(h){ await h.wait(200); } }
];

/* ---------- chế độ tự do ----------
   params là "cấu hình" của thí nghiệm: mỗi thông số học sinh chỉnh được khai báo một lần ở đây.
   Lõi dựng bảng điều chỉnh từ params, giữ giá trị trong P và gửi P (kèm describe, observe) cho trợ lý AI. */
const objMode = P => P.source === 'object';
const hasLens = P => P.lens !== 'none';                        // có dụng cụ trên giá (thấu kính hoặc gương)
const isLens = P => P.lens === 'conv' || P.lens === 'div';
const free = {
  title: 'Em tự lắp thí nghiệm',
  hint: 'Kéo vật, đèn, màn chắn ngay trên giá (nút ◂ ▸) hoặc chỉnh ở đây. Bút trình chiếu: ←/→ dịch dụng cụ đang chọn, ↑/↓ chọn dụng cụ khác.',
  // các thẻ gập/mở của bảng điều chỉnh; summary là dòng tóm tắt hiện cả khi thẻ đang gập
  groups: [
    { id:'lens', title:'Dụng cụ', open:true,
      icon:'<svg viewBox="0 0 24 24"><path d="M12 3Q16.5 12 12 21Q7.5 12 12 3Z" fill="var(--glass)" fill-opacity=".35" stroke="var(--glass)" stroke-width="1.6"/></svg>',
      summary: P => !hasLens(P) ? 'Không đặt' : P.lens === 'mirror' ? 'Gương phẳng' : `${P.lens === 'conv' ? 'Hội tụ' : 'Phân kì'} · f = ${fmt(P.f)} cm` },
    { id:'source', title:'Nguồn sáng', open:true,
      icon:'<svg viewBox="0 0 24 24"><path d="M7 20V7" stroke="var(--obj)" stroke-width="2.4" stroke-linecap="round"/><path d="M3.5 9.5L7 5l3.5 4.5" fill="none" stroke="var(--obj)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 8h8M13 12h8M13 16h8" stroke="var(--beam)" stroke-width="1.8" stroke-linecap="round"/></svg>',
      summary: P => objMode(P) ? `Vật AB · d = ${fmt(P.d)} cm` : P.source === 'beam' ? `Đèn chiếu · ${fmt(P.lampD)} cm` : 'Không có' },
    { id:'screen', title:'Màn chắn', open:true,
      icon:'<svg viewBox="0 0 24 24"><rect x="10" y="2.5" width="4" height="15" rx="1" fill="var(--screen)"/><path d="M12 17.5v4M8 21.5h8" stroke="var(--stage-muted)" stroke-width="1.8" stroke-linecap="round"/></svg>',
      summary: P => P.screen ? `Cách ${fmt(P.s)} cm` : 'Đang tắt' },
    { id:'rays', title:'Tia sáng đặc biệt', open:false,
      icon:'<svg viewBox="0 0 24 24"><path d="M3 6.5h9l9 11M3 12h18M3 17.5h9l9-11" fill="none" stroke="var(--beam)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      summary: P => `${[P.rayPar, P.rayO, P.rayF].filter(Boolean).length}/3 tia` }
  ],
  // label: tên đầy đủ (gửi trợ lý AI); short: chữ ngắn hiện trên bảng
  params: [
    { key:'lens', group:'lens', label:'Dụng cụ trên giá', type:'choice', options:[{ value:'conv', label:'Thấu kính hội tụ (rìa mỏng)', short:'Hội tụ' }, { value:'div', label:'Thấu kính phân kì (rìa dày)', short:'Phân kì' }, { value:'mirror', label:'Gương phẳng', short:'Gương' }, { value:'none', label:'Không đặt' }] },
    { key:'f', group:'lens', label:'Tiêu cự f', type:'range', min:5, max:15, step:1, unit:'cm', show: isLens },
    { key:'foci', group:'lens', label:"Hiện tiêu điểm F và F'", short:"Hiện tiêu điểm F, F'", type:'toggle', show: isLens },
    { key:'source', group:'source', label:'Nguồn sáng', type:'choice', options:[{ value:'object', label:'Vật sáng AB', short:'Vật AB' }, { value:'beam', label:'Đèn chiếu chùm song song', short:'Đèn chiếu' }, { value:'none', label:'Không có' }] },
    { key:'d', group:'source', label:'Vật cách thấu kính (hoặc gương) d', short:'Khoảng cách d', type:'range', min:2, max:36, step:0.5, unit:'cm', show: objMode },
    { key:'h', group:'source', label:'Chiều cao vật h', short:'Chiều cao h', type:'range', min:1, max:6, step:0.5, unit:'cm', show: objMode },
    { key:'lampD', group:'source', label:'Đèn cách thấu kính (hoặc gương)', short:'Khoảng cách đèn', type:'range', min:6, max:32, step:0.5, unit:'cm', show: P => P.source === 'beam' },
    { key:'screen', group:'screen', label:'Đặt màn chắn', type:'toggle' },
    { key:'s', group:'screen', label:'Màn cách thấu kính (hoặc gương)', short:'Khoảng cách màn', type:'range', min:1, max:36, step:0.5, unit:'cm', show: P => P.screen },
    { key:'rayPar', group:'rays', label:'Tia song song với trục chính', short:'Song song với trục chính', type:'toggle', show: P => objMode(P) && isLens(P) },
    { key:'rayO', group:'rays', label:'Tia qua quang tâm O', short:'Qua quang tâm O', type:'toggle', show: P => objMode(P) && isLens(P) },
    { key:'rayF', group:'rays', label:'Tia qua tiêu điểm', short:'Qua tiêu điểm', type:'toggle', show: P => objMode(P) && isLens(P) }
  ],
  // giá trống: vào chế độ tự do hoặc bấm Làm lại thì học sinh tự lắp từng dụng cụ
  defaults: { lens:'none', f:F0, source:'none', d:30, h:H0, lampD:32, screen:false, s:15, foci:true, rayPar:true, rayO:true, rayF:false },
  // cảnh "đứng yên" ứng với P (đích của hoạt ảnh; cũng là thứ gửi cho trợ lý AI)
  target(P){
    const obj = objMode(P), beam = P.source === 'beam', lens = hasLens(P);
    const T = {
      lens: P.lens, f: P.f, lensA: lens ? 1 : 0, fociA: isLens(P) && P.foci ? 1 : 0, src: P.source,
      lampA: beam ? 1 : 0, beam: beam ? 1 : 0, beamTail: 0, lampX: -P.lampD,
      objA: obj ? 1 : 0, img: obj ? 1 : 0, imgTail: 0, d: P.d, h: P.h,
      screenA: P.screen ? 1 : 0, s: P.s,
      rayPar: P.rayPar ? 1 : 0, rayO: P.rayO ? 1 : 0, rayF: P.rayF ? 1 : 0,
      eyeA: 0, inset: null, insetP: 0, handles: 1
    };
    const im = imageInfo(T);
    T.virtA = obj && (P.lens === 'mirror' || (im && !im.atInfinity && !im.real)) ? 1 : 0;
    return T;
  },
  // vào chế độ tự do: giá trống, rồi animate() lắp dần từng món
  start(S){ Object.assign(S, { lens:'none', lensA:0, fociA:0, src:'none', lampA:0, beam:0, beamTail:0, objA:0, img:0, imgTail:0, screenA:0, virtA:0, eyeA:0, inset:null, insetP:0, handles:1 }); },
  // hình học (thanh trượt, kéo) đổi ngay, không cần hoạt ảnh
  place(S, P){ Object.assign(S, { f: P.f, d: P.d, h: P.h, s: P.s, lampX: -P.lampD, handles: 1 }); },
  // đi từ cảnh hiện tại tới target(P). Bị hủy giữa chừng thì lần gọi sau đi tiếp từ chỗ đang dở.
  async animate(h, P){
    const S = h.S;
    free.place(S, P);
    let T = free.target(P);
    // ánh sáng đang "chạy đi" dở: cho chạy hết rồi xóa
    if (S.beamTail > 0 || S.imgTail > 0){
      await h.tw({ beamTail: S.beam, imgTail: S.img }, 250);
      Object.assign(S, { beam:0, beamTail:0, img:0, imgTail:0 });
    }
    const lensChange = S.lens !== T.lens, srcChange = S.src !== T.src;
    // đổi thấu kính hoặc nguồn sáng: ánh sáng cũ chạy đi hết khỏi giá
    if ((lensChange || srcChange) && (S.beam > 0 || S.img > 0)){
      await h.tw({ beamTail: S.beam, imgTail: S.img, virtA: 0 }, 650);
      Object.assign(S, { beam:0, beamTail:0, img:0, imgTail:0 });
    }
    // thấu kính cũ mờ đi, thấu kính mới hiện dần
    if (lensChange){
      if (S.lensA > 0.01) await h.tw({ lensA:0, fociA:0 }, 280);
      Object.assign(S, { lens: T.lens, lensA: 0, fociA: 0 });
    }
    if (S.lensA !== T.lensA || S.fociA !== T.fociA) await h.tw({ lensA: T.lensA, fociA: T.fociA }, 420);
    // nguồn sáng cũ tắt, nguồn mới hiện dần; màn chắn hiện/ẩn cùng lúc
    if (srcChange){
      if (S.lampA > 0.01 || S.objA > 0.01) await h.tw({ lampA:0, objA:0 }, 280);
      S.src = T.src;
    }
    const fade = {};
    for (const k of ['lampA', 'objA', 'screenA']) if (S[k] !== T[k]) fade[k] = T[k];
    if (Object.keys(fade).length) await h.tw(fade, 420);
    // ánh sáng chạy ra từ nguồn, đi theo thấu kính đang đặt; tia đặc biệt bật/tắt thì chạy ra/thu về
    const run = {};
    for (const k of ['beam', 'img', 'rayPar', 'rayO', 'rayF']) if (S[k] !== T[k]) run[k] = T[k];
    if (Object.keys(run).length) await h.tw(run, 'beam' in run || 'img' in run ? 1300 : 650);
    // ảnh ảo hiện dần; kiểm tra lại vài lần vì vật có thể vừa bị kéo qua tiêu điểm
    for (let i = 0; i < 3; i++){
      T = free.target(P);
      if (S.virtA === T.virtA) break;
      await h.tw({ virtA: T.virtA }, 420);
    }
  },
  // điều quan sát được, tính từ công thức thấu kính cho cảnh đích (dùng cho dòng chú thích và gửi trợ lý AI)
  observe(_S, P){
    const S = free.target(P);
    const out = [], f = S.f, d = S.d, conv = P.lens === 'conv', eq = (a, b) => Math.abs(a - b) < 0.01;
    if (P.source === 'none')
      return hasLens(P) ? `Đã đặt ${LENS_NAME[P.lens]}${isLens(P) ? `, tiêu cự ${fmt(f)} cm` : ''}, nhưng chưa có nguồn sáng. Em chọn vật sáng AB hoặc đèn chiếu ở bảng điều chỉnh.`
        : 'Giá quang học đang trống. Em chọn thấu kính và nguồn sáng ở bảng điều chỉnh.';
    if (!hasLens(P)){
      if (objMode(P)) return 'Chưa đặt thấu kính: ánh sáng từ vật truyền thẳng nên không tạo được ảnh. Em đặt thấu kính vào giá để tạo ảnh.';
      out.push('Chưa đặt thấu kính: chùm tia sáng song song truyền thẳng, không bị đổi hướng.');
      if (P.screen) out.push(`Màn ở ${fmt(S.s)} cm: vệt sáng rộng khoảng ${fmt(beamWidth(S))} cm, bằng bề rộng chùm sáng.`);
      return out.join(' ');
    }
    if (P.lens === 'mirror'){
      if (!objMode(P)){
        out.push('Chùm tia sáng song song chiếu tới gương phẳng thì bị hắt ngược trở lại (phản xạ ánh sáng), không đi xuyên qua gương.');
        if (P.screen) out.push(`Màn đặt sau gương (cách gương ${fmt(S.s)} cm) nên không nhận được ánh sáng nào.`);
        return out.join(' ');
      }
      out.push(`Gương phẳng cho ảnh ảo, cùng chiều, bằng vật (cao ${fmt(S.h)} cm).`);
      out.push(`Ảnh nằm sau gương, cách gương ${fmt(d)} cm, bằng khoảng cách từ vật tới gương.`);
      out.push('Màn chắn không hứng được ảnh ảo, phải nhìn vào gương mới thấy.');
      return out.join(' ');
    }
    if (!objMode(P)){
      out.push(conv
        ? `Chùm tia song song với trục chính đi qua thấu kính hội tụ thì gặp nhau tại tiêu điểm F', cách thấu kính ${fmt(f)} cm.`
        : `Chùm tia song song với trục chính đi qua thấu kính phân kì thì loe rộng ra. Kéo dài các tia ló về phía trước (nét đứt) thì gặp nhau tại tiêu điểm F, cách thấu kính ${fmt(f)} cm.`);
      if (P.screen){
        const w = beamWidth(S);
        out.push(w < 0.35 ? `Màn ở ${fmt(S.s)} cm: vệt sáng thu lại thành một điểm, màn đang ở đúng tiêu điểm F'.` : `Màn ở ${fmt(S.s)} cm: vệt sáng rộng khoảng ${fmt(w)} cm.`);
      }
      return out.join(' ');
    }
    const where = !conv ? 'Thấu kính phân kì'
      : d > 2 * f && !eq(d, 2 * f) ? 'Vật ở ngoài khoảng 2f'
      : eq(d, 2 * f) ? 'Vật cách thấu kính đúng bằng 2f'
      : d > f && !eq(d, f) ? 'Vật nằm giữa f và 2f'
      : eq(d, f) ? 'Vật đặt đúng tại tiêu điểm F'
      : 'Vật nằm trong khoảng tiêu cự';
    const im = imageInfo(S);
    if (im.atInfinity) return `${where}: các tia ló song song với nhau nên không tạo được ảnh.`;
    out.push(`${where} (d = ${fmt(d)} cm, f = ${fmt(f)} cm): ảnh ${im.real ? 'thật' : 'ảo'}, ${im.orient}, ${im.size}.`);
    out.push(im.far ? 'Ảnh ở rất xa thấu kính.'
      : `Ảnh cách thấu kính ${fmt(Math.abs(im.dp))} cm, cao ${fmt(Math.abs(im.hp))} cm, ${im.real ? 'ở phía sau thấu kính' : 'cùng phía với vật'}${Math.abs(im.dp) > 37 ? ' (nằm ngoài khung hình)' : ''}.`);
    if (!im.real) out.push('Màn chắn không hứng được ảnh ảo, phải nhìn qua thấu kính mới thấy.');
    else if (!P.screen) out.push('Muốn hứng ảnh này, em bật màn chắn và đặt màn đúng chỗ ảnh.');
    else if (P.screen) out.push(onScreen(S).sharp ? `Màn ở ${fmt(S.s)} cm: hứng được ảnh rõ nét.` : `Màn ở ${fmt(S.s)} cm: chỉ thấy vệt sáng mờ. Dịch màn để tìm ảnh rõ nét.`);
    return out.join(' ');
  },
  actions: [
    { label: 'Tìm ảnh rõ nét trên màn', group: 'screen', run(_S, P){
      if (P.source === 'none') return { msg: 'Chưa có nguồn sáng. Em chọn vật sáng AB hoặc đèn chiếu trước nhé.' };
      if (!hasLens(P)) return { msg: 'Chưa đặt thấu kính: ánh sáng truyền thẳng nên không có ảnh hay điểm sáng để hứng.' };
      if (P.lens === 'mirror') return { msg: objMode(P) ? 'Gương phẳng cho ảnh ảo nên màn không hứng được. Nhìn vào gương mới thấy ảnh.' : 'Gương hắt ánh sáng ngược trở lại, nên màn đặt sau gương không nhận được ánh sáng.' };
      if (!objMode(P)){
        if (P.lens === 'div') return { msg: 'Chùm tia ló loe rộng ra, không gặp nhau sau thấu kính, nên màn không thu được điểm sáng.' };
        return { patch: { screen: true, s: P.f }, msg: "Đã đưa màn tới tiêu điểm F'." };
      }
      const im = imageInfo(free.target(P));
      if (!im || im.atInfinity) return { msg: 'Vật đang ở đúng tiêu điểm: các tia ló song song, không tạo ảnh để hứng.' };
      if (!im.real) return { msg: 'Ảnh là ảnh ảo nên màn không hứng được. Nhìn qua thấu kính mới thấy ảnh.' };
      if (im.dp > 36) return { msg: `Ảnh cách thấu kính ${fmt(im.dp)} cm, xa hơn giá quang học. Em dời vật ra xa thấu kính hơn nhé.` };
      return { patch: { screen: true, s: im.dp }, msg: 'Đã dịch màn tới chỗ ảnh rõ nét.' };
    } }
  ],
  // kéo dụng cụ trên giá: hit() cho biết đang chạm vào gì, move() trả về thông số mới (lõi tự làm tròn, giới hạn)
  drag: {
    hit(S, P, x, y, tol){
      if (P.screen && Math.abs(x - S.s) < tol && y > -12.5 && y < 9.5) return 'screen';
      if (objMode(P) && Math.abs(x + S.d) < tol && y > -11.5 && y < S.h + 2) return 'object';
      if (P.source === 'beam' && x > S.lampX - 3.6 - tol && x < S.lampX + tol && y > -11.5 && y < 6) return 'lamp';
      return null;
    },
    move(key, x){ return key === 'screen' ? { s: x } : key === 'object' ? { d: -x } : { lampD: -x }; },
    // dịch bằng bàn phím / bút trình chiếu: items() là các dụng cụ đang có trên giá (theo thứ tự ↑/↓),
    // nudge() dịch dụng cụ đó 0,5 cm sang phải (dir = 1) hoặc trái (dir = -1)
    items(P){ return [objMode(P) && 'object', P.source === 'beam' && 'lamp', P.screen && 'screen'].filter(Boolean); },
    nudge(key, dir, P){ return key === 'screen' ? { s: P.s + dir * 0.5 } : key === 'object' ? { d: P.d - dir * 0.5 } : { lampD: P.lampD - dir * 0.5 }; }
  },
  chips: [
    { q:'Làm sao để ảnh to hơn vật?', a:'Với thấu kính hội tụ: đặt vật nằm giữa f và 2f thì được ảnh thật, ngược chiều, lớn hơn vật. Đặt vật trong khoảng tiêu cự thì được ảnh ảo, cùng chiều, lớn hơn vật. Thấu kính phân kì thì ảnh luôn nhỏ hơn vật.' },
    { q:'Vì sao màn không hứng được ảnh?', a:'Màn chỉ hứng được ảnh thật. Nếu ảnh là ảnh ảo (vật trong khoảng tiêu cự của thấu kính hội tụ, hoặc dùng thấu kính phân kì) thì màn không hứng được. Nếu là ảnh thật, em phải dịch màn tới đúng chỗ ảnh thì ảnh mới rõ nét.' } ]
};

export default {
  id: 'thau-kinh',
  grade: 'KHTN 9', chapter: 'Chương II Ánh sáng', lesson: 'Bài 8',
  title: 'Thấu kính hội tụ và thấu kính phân kì', shortTitle: 'Thấu kính',
  intro: 'Thí nghiệm trên giá quang học, chạy theo từng bước SGK. Giữa chừng, trợ lý AI ở góc phải sẽ hỏi em. Chọn sai thì thí nghiệm chạy đúng theo lựa chọn của em, để em tự thấy kết quả.',
  canvasLabel: 'Giá quang học với đèn, thấu kính, vật và màn chắn',
  readyTitle: 'Giá quang học đã lắp xong',
  view: { w: 78, h: 37, ox: 0.5, oy: 0.53 },
  startChips: [
    { q:'Thí nghiệm này để làm gì?', a:'Thí nghiệm giúp em thấy thấu kính hội tụ và thấu kính phân kì làm đổi hướng ánh sáng thế nào, và tạo ra ảnh ra sao.' },
    { q:'Thấu kính là gì?', a:'Thấu kính là một khối trong suốt có hai mặt cong, hoặc một mặt cong một mặt phẳng. Ánh sáng đi qua thấu kính sẽ bị đổi hướng.' } ],
  base(S){ Object.assign(S, { lens:'conv', f:F0, h:H0, lensA:1, lampA:0, lampX:-32.4, beam:0, beamTail:0, imgTail:0, fociA:1, objA:0, d:30, screenA:0, s:15, img:0, virtA:0, eyeA:0, inset:null, insetP:0, rayPar:1, rayO:1, rayF:0, handles:0 }); },
  rest(S){ S.lampA = 1; },
  draw(_g, _S){
    g = _g; S = _S;
    drawGrid(); drawRuler(); drawAxis(); drawLamp(); drawBeam(); drawImageRays();
    drawLens(); drawFoci(); drawObject(); drawScreen(); drawVirtual(); drawRealImage(); drawEye(); drawHandles(); drawInset();
  },
  readout(S){
    const lensOk = S.lens === 'conv' || S.lens === 'div';
    if (S.objA > 0.5 && lensOk){
      let t = 'Vật cách thấu kính ' + fmt(S.d) + ' cm';
      if (S.screenA > 0.5) t += ' · Màn: ' + fmt(S.s) + ' cm';
      const im = imageInfo(S);
      if (im && !im.atInfinity && S.img > 0.97) t += im.far ? ' · Ảnh ở rất xa' : ` · Ảnh ${im.real ? 'thật' : 'ảo'}, ${im.orient}, ${im.size}`;
      return t;
    }
    if (S.objA > 0.5 && S.lens === 'mirror')
      return 'Vật cách gương ' + fmt(S.d) + ' cm' + (S.img > 0.97 ? ` · Ảnh ảo, cùng chiều, bằng vật, sau gương ${fmt(S.d)} cm` : '');
    if (lensOk && S.lensA > 0.5 && S.fociA > 0.5) return 'Tiêu cự f = ' + fmt(S.f) + ' cm' + (S.screenA > 0.5 && S.beam > 0.5 ? ' · Màn: ' + fmt(S.s) + ' cm' : '');
    return '';
  },
  describe(S){
    const L = [], lensOk = S.lens === 'conv' || S.lens === 'div';
    L.push('Dụng cụ đang đặt trên giá: ' + LENS_NAME[S.lens] + (lensOk ? `, tiêu cự ${fmt(S.f)} cm.` : '.'));
    if (S.beam > 0.5 && S.lampA > 0.5){
      L.push(`Đèn đặt cách dụng cụ ${fmt(-S.lampX)} cm, đang chiếu chùm tia sáng song song với trục chính vào dụng cụ.`);
      if ((lensOk || S.lens === 'none') && S.screenA > 0.5){
        const w = beamWidth(S);
        L.push(`Màn chắn cách thấu kính ${fmt(S.s)} cm; trên màn ${w < 0.35 ? "là một điểm sáng nhỏ (màn đang ở tiêu điểm F')" : `là vệt sáng rộng khoảng ${fmt(w)} cm`}.`);
      }
      if (S.lens === 'mirror') L.push('Chùm sáng bị gương hắt ngược trở lại về phía đèn' + (S.screenA > 0.5 ? `; màn chắn đặt sau gương ${fmt(S.s)} cm, không nhận được ánh sáng.` : '.'));
    }
    if (S.objA > 0.5 && S.lens === 'mirror'){
      L.push(`Vật sáng AB cao ${fmt(S.h)} cm, đặt trước gương phẳng, cách gương ${fmt(S.d)} cm.`);
      L.push(`Ảnh tạo bởi gương phẳng: ảnh ảo, cùng chiều, bằng vật, nằm sau gương, cách gương ${fmt(S.d)} cm (đối xứng với vật qua gương).`);
      if (S.screenA > 0.5) L.push(`Màn chắn đặt sau gương, cách gương ${fmt(S.s)} cm; màn không hứng được ảnh.`);
      if (S.img > 0.5) L.push('Trên hình đang vẽ: hai tia sáng từ B tới gương, phản xạ ngược lại; đường kéo dài của tia phản xạ (nét đứt) gặp nhau tại ảnh B\'.');
    } else if (S.objA > 0.5){
      L.push(`Vật sáng AB cao ${fmt(S.h)} cm, đặt trước thấu kính, cách thấu kính ${fmt(S.d)} cm.`);
      const im = imageInfo(S);
      if (im && !im.atInfinity) L.push(`Ảnh tạo bởi thấu kính: ảnh ${im.real ? 'thật' : 'ảo'}, ${im.orient}, ${im.size} (cao khoảng ${fmt(Math.abs(im.hp))} cm), cách thấu kính ${fmt(Math.abs(im.dp))} cm, ${im.real ? 'ở phía sau thấu kính' : 'cùng phía với vật'}.`);
      else if (im && im.atInfinity) L.push('Vật đặt đúng tại tiêu điểm: các tia ló song song với nhau, không tạo ảnh.');
      if (S.screenA > 0.5 && lensOk){ const o = onScreen(S); L.push(`Màn chắn cách thấu kính ${fmt(S.s)} cm; ${o.sharp ? 'màn đang hứng được ảnh rõ nét' : 'trên màn chỉ có vệt sáng mờ, không có ảnh rõ'}.`); }
      if (!lensOk) L.push('Chưa đặt thấu kính nên ánh sáng từ vật truyền thẳng, không tạo ảnh.');
      const rays = [S.rayPar && 'tia song song với trục chính', S.rayO && 'tia qua quang tâm O', S.rayF && (S.lens === 'div' ? "tia hướng tới tiêu điểm F'" : 'tia qua tiêu điểm F')].filter(Boolean);
      if (S.img > 0.5 && rays.length && lensOk) L.push('Trên hình đang vẽ: ' + rays.join(', ') + '.');
    }
    if (S.handles && S.objA <= 0.5 && S.lampA <= 0.5) L.push('Chưa có nguồn sáng trên giá.');
    return L;
  },
  steps, questions, free
};
