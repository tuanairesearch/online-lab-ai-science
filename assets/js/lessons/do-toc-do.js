// Thí nghiệm: Đo tốc độ (KHTN 7 – Bài 9, Kết nối tri thức, tr. 49–52)
// Đặc tả: docs/lessons/vat-li/do-toc-do.md
// Ba cách đo, mỗi cách một cảnh (S.scene):
//   'tools' – bàn dụng cụ: thước, đồng hồ bấm giây, đồng hồ đo thời gian hiện số (bước 1, 8)
//   'ramp'  – xe đồ chơi lăn xuống tấm gỗ kê sách, bấm đồng hồ bằng tay, Bảng 9.1 (bước 2–5, chế độ tự do)
//   'rail'  – viên bi lăn trên máng qua hai cổng quang điện (3), (4) (bước 6)
//   'road'  – thiết bị bắn tốc độ: camera, hai vạch mốc cách 5 m (bước 7)
// Đơn vị trong cảnh: cm (cảnh mặt đường dùng tỉ lệ riêng, 1 m = 6 đơn vị).
// Mọi số trên màn hình tính bằng công thức dưới đây. Gia tốc của xe, của bi và độ trễ bấm tay là số MINH HỌA.
// Hoạt ảnh được chiếu chậm (SLOW); đồng hồ trên màn hình vẫn chỉ thời gian của thí nghiệm.

/* ---------- số liệu, công thức ---------- */
const G = 980;                                    // cm/s²
const BOARD = 80, START = 10, FINISH = 60, BOOK = 3, BOOKS0 = 2;
const CAR_MAX = BOARD - START;                    // từ vạch xuất phát tới hết tấm gỗ: 70 cm
// xe xuất phát đứng yên, nhanh dần đều: a = 0,95 × g × h / 80 cm (hệ số 0,95 tính gần đúng ma sát, minh họa)
const aCar = books => 0.95 * G * books * BOOK / BOARD;
const tCar = (x, books = BOOKS0) => Math.sqrt(2 * x / aCar(books));
const xCar = (t, books = BOOKS0) => t <= 0 ? 0 : Math.min(CAR_MAX, 0.5 * aCar(books) * t * t);
const T50 = tCar(FINISH - START), T20 = tCar(20), T70 = tCar(CAR_MAX);
// độ trễ (bắt đầu, dừng) khi bấm tay, cố định ở chế độ theo bước SGK → 1,14 s; 1,31 s; 1,13 s
const DELAYS = [[0.18, 0.12], [0.10, 0.21], [0.22, 0.15]];
const r2 = n => Math.round(n * 100) / 100, r3 = n => Math.round(n * 1000) / 1000;
const MEAS = DELAYS.map(([d0, d1]) => r2(T50 - d0 + d1));
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;

// viên bi trên máng: nam châm điện ở 0 cm, cổng (3) ở 10 cm, cổng (4) ở 50 cm, máng dài 60 cm; a = 0,35 m/s² (minh họa)
const A_BALL = 35, RAIL = 60, GATE3 = 10, GATE4 = 50;
const tBall = x => Math.sqrt(2 * x / A_BALL);
const xBall = t => t <= 0 ? 0 : 0.5 * A_BALL * t * t;
const R3 = r3(tBall(GATE3)), R4 = r3(tBall(GATE4)), T_LEAVE = tBall(RAIL);

// thiết bị bắn tốc độ
const GAP = 5, LIMIT = 60;
const kmh = t => GAP / t * 3.6;
const over = t => Math.round(kmh(t) * 1000) / 1000 > LIMIT;   // bằng 60 km/h là không vượt

const SLOW = 2, ROAD_SLOW = 3;                    // chiếu chậm

/* ---------- định dạng số: dấu phẩy thập phân ---------- */
const nf = (n, d) => n.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
const n1 = n => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
const cms = t => Math.round((FINISH - START) / t);              // v (cm/s) từ thời gian đọc trên đồng hồ
const vText = (s, t, d = 2) => `v = ${s} cm : ${nf(t, d)} s ≈ ${Math.round(s / t)} cm/s ≈ ${nf(r2(s / t / 100), 2)} m/s`;

// lõi làm mượt mọi h.tw (chậm–nhanh–chậm); đổi ngược để thời gian thí nghiệm trôi đều theo thời gian thật
const lin = u => u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.sqrt(u / 2) : 1 - Math.sqrt((1 - u) / 2);
const tcOf = S => S.t0 + (S.t1 - S.t0) * lin(S.u);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- vẽ ---------- */
let g, S;
const FS = (m = 1) => Math.max(12, Math.min(21, g.sc * 1.55)) * m;
const SM = () => Math.max(11, Math.min(16, g.sc * 1.15));
function poly(pts){ const { ctx, X, Y } = g; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath(); }
function line(a, b, color, width = 1.5, dash = null){
  const { ctx, X, Y } = g; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke(); ctx.restore();
}
function box(x0, y0, x1, y1, { fill = g.C['stage-2'], stroke = g.C['stage-line'], r = 8, width = 1.5 } = {}){
  const { ctx, X, Y } = g; g.rr(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1), r);
  ctx.fillStyle = fill; ctx.fill(); if (stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
// tấm phẳng nghiêng (tấm gỗ, máng): d tính dọc tấm từ đầu cao, o tính vuông góc lên trên từ mặt dưới
function plank(x0, y0, th){
  const c = Math.cos(th), s = Math.sin(th);
  return { th, at: (d, o = 0) => [x0 + d * c + o * s, y0 - d * s + o * c] };
}
const TABLE = -20, PT = 3;                        // mặt bàn; bề dày tấm gỗ (mặt trước là thước)
const RX0 = -41;                                  // đầu cao của tấm gỗ
const rampOf = S => plank(RX0, TABLE + S.books * BOOK, Math.asin(S.books * BOOK / BOARD));
// tấm gỗ có thước gắn dọc mặt trước: vạch chia 1 cm, số mỗi 10 cm
function drawRuler(P, len, top){
  const { ctx, C } = g;
  poly([P.at(0), P.at(len), P.at(len, PT), P.at(0, PT)]);
  ctx.fillStyle = C['stage-2']; ctx.fill(); ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.2; ctx.stroke();
  line(P.at(0, PT), P.at(len, PT), top, 3.5);
  ctx.save();
  for (let d = 0; d <= len; d++){
    ctx.globalAlpha = d % 5 ? .55 : 1;
    line(P.at(d), P.at(d, d % 10 ? (d % 5 ? .55 : .9) : 1.25), C['stage-ink'], 1);
  }
  ctx.restore();
  for (let d = 0; d <= len; d += 10){
    const [x, y] = P.at(clamp(d, 1.2, len - 1.2), PT * .68);
    g.text(String(d), g.X(x), g.Y(y), { size: SM() - 1, mono: true, color: C['stage-ink'], halo: false });
  }
}
// đoạn tô màu đặt dọc tấm: [a, b] tính theo d
function band(P, a, b, off, color, label, alpha = 1){
  if (alpha <= 0.01 || b - a < 0.05) return;
  const { ctx } = g; ctx.save(); ctx.globalAlpha *= alpha;
  line(P.at(a, off), P.at(b, off), color, 6);
  for (const d of [a, b]) line(P.at(d, off - 1.2), P.at(d, off + 1.2), color, 2.2);
  const [x, y] = P.at((a + b) / 2, off + 2.2);
  g.text(label, g.X(x), g.Y(y), { size: SM(), color, weight: 700 });
  ctx.restore();
}

// xe đồ chơi; d: vị trí đầu xe dọc tấm gỗ (cm)
const CAR_L = 9;
function drawCar(P, d, alpha){
  if (alpha <= 0.01) return;
  const { ctx, C, sc } = g, [x, y] = P.at(d, PT);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(g.X(x), g.Y(y)); ctx.rotate(P.th);
  const k = sc;
  ctx.fillStyle = C.obj;
  g.rr(-CAR_L * k, -3.6 * k, CAR_L * k, 2.5 * k, Math.max(2, .6 * k)); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6.6 * k, -3.6 * k); ctx.lineTo(-5.6 * k, -5.4 * k); ctx.lineTo(-2.8 * k, -5.4 * k); ctx.lineTo(-1.8 * k, -3.6 * k); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.glass; ctx.globalAlpha *= .8;
  ctx.beginPath(); ctx.moveTo(-6 * k, -3.8 * k); ctx.lineTo(-5.3 * k, -5 * k); ctx.lineTo(-3 * k, -5 * k); ctx.lineTo(-2.3 * k, -3.8 * k); ctx.closePath(); ctx.fill();
  ctx.globalAlpha /= .8;
  for (const wx of [-7.2, -1.8]){
    ctx.fillStyle = C['stage-ink']; ctx.beginPath(); ctx.arc(wx * k, -1.1 * k, 1.1 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C['stage-muted']; ctx.beginPath(); ctx.arc(wx * k, -1.1 * k, .45 * k, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawBooks(n){
  const { ctx, C } = g, cols = [C['spec-5'], C['spec-1'], C['spec-4'], C['spec-6'], C['spec-2']];
  for (let i = 0; i < Math.ceil(n - 1e-6); i++){
    const y0 = TABLE + i * BOOK, y1 = Math.min(TABLE + n * BOOK, y0 + BOOK);
    box(RX0 - 8 + (i % 2) * .6, y0, RX0 + 1 + (i % 2) * .6, y1, { fill: cols[i % 5], stroke: C.stage, r: 3, width: 1 });
  }
}
function drawTable(x0 = -50, x1 = 50){ line([x0, TABLE], [x1, TABLE], g.C['stage-line'], 4); }

// đồng hồ bấm giây (hiện 2 chữ số thập phân) / đồng hồ hiện số (3 chữ số)
function drawStopwatch(cx, cy, val, { digits = 2, title = 'Đồng hồ bấm giây', on = false, alpha = 1 } = {}){
  if (alpha <= 0.01) return;
  const { ctx, C } = g; ctx.save(); ctx.globalAlpha *= alpha;
  if (digits === 2){ box(cx - 1.4, cy + 5.4, cx + 1.4, cy + 6.6, { fill: C['stage-muted'], stroke: null, r: 3 }); }
  box(cx - 9, cy - 5, cx + 9, cy + 5.6, { fill: C['stage-2'], stroke: on ? C.img : C['stage-muted'], r: 14, width: 2 });
  box(cx - 7.2, cy - 3.2, cx + 7.2, cy + 3.4, { fill: C.stage, stroke: C['stage-line'], r: 6 });
  g.text(nf(val, digits) + ' s', g.X(cx), g.Y(cy + .1), { size: FS(digits === 2 ? 1.9 : 1.6), mono: true, weight: 700, color: C.img, halo: false });
  g.text(title, g.X(cx), g.Y(cy + 7.9), { size: SM(), color: C['stage-muted'], weight: 600 });
  ctx.restore();
}
// bảng số liệu vẽ trên sân khấu
function drawGrid(x0, yTop, widths, rows, { rowH = 3.4, title = '' } = {}){
  const { C } = g, x1 = x0 + widths.reduce((a, b) => a + b, 0);
  box(x0 - .8, yTop - rowH * rows.length - .6, x1 + .8, yTop + (title ? 3.2 : .6), { r: 10 });
  if (title) g.text(title, g.X(x0), g.Y(yTop + 1.5), { size: SM(), color: C['stage-muted'], weight: 700, align: 'left' });
  rows.forEach((r, i) => {
    const y = yTop - rowH * (i + .5);
    if (r.hl){ g.ctx.save(); g.ctx.globalAlpha = .18 * r.hl; box(x0 - .2, yTop - rowH * (i + 1) + .2, x1 + .2, yTop - rowH * i - .2, { fill: C.beam, stroke: null, r: 4 }); g.ctx.restore(); }
    if (i) line([x0, yTop - rowH * i], [x1, yTop - rowH * i], C['stage-line'], 1);
    let x = x0;
    r.cells.forEach((t, j) => {
      g.text(t, g.X(x + widths[j] / 2), g.Y(y), { size: i ? FS() : SM(), color: i ? (r.color || C['stage-ink']) : C['stage-muted'], weight: i ? 600 : 700, mono: i > 0 && j > 0, halo: false });
      x += widths[j];
    });
  });
  return yTop - rowH * rows.length;
}

/* ---- cảnh tấm gỗ ---- */
const swRead = S => S.swOn == null ? 0 : clamp(tcOf(S) - S.swOn, 0, S.swOff - S.swOn);
function drawRamp(){
  const { C } = g, P = rampOf(S), tc = tcOf(S);
  drawTable(); drawBooks(S.books);
  if (S.boardA > 0.01){
    g.ctx.save(); g.ctx.globalAlpha = S.boardA;
    drawRuler(P, BOARD, C.pot);
    g.text('Tấm gỗ có thước gắn dọc (cm)', g.X(RX0 + 52), g.Y(TABLE - 2.6), { size: SM(), color: C['stage-muted'] });
    g.ctx.restore();
  }
  // vạch xuất phát, vạch đích
  if (S.linesA > 0.01){
    g.ctx.save(); g.ctx.globalAlpha = S.linesA;
    for (const [d, lab] of [[START, 'Vạch xuất phát'], [S.finish, 'Vạch đích']]){
      line(P.at(d, 0), P.at(d, PT + 1.4), C.beam, 3);
      line(P.at(d, PT + 1.6), P.at(d, PT + 10.6), C.beam, 1, [3, 4]);
      const [x, y] = P.at(d, PT + 12);
      g.text(lab, g.X(x), g.Y(y), { size: SM(), color: C.beam, weight: 700 });
    }
    // cổng quang điện ở hai vạch (chế độ tự do)
    if (S.method === 'cong') for (const d of [START, S.finish]) drawGateFrame(P, d, 7.5, tc >= 0 && xCar(tc, S.books) + START >= d);
    g.ctx.restore();
  }
  band(P, START, S.finish, PT + 5.5, C.glass, `Thước đo: s = ${S.finish - START} cm`, S.sA);
  if (S.hl) band(P, START + S.hl.a, START + S.hl.b, PT + 9, C.beam, S.hl.label, S.hlA);
  drawCar(P, START + xCar(tc, S.books), S.carA);
  // đồng hồ
  const cx = -3, cy = 14;
  if (S.method === 'cong'){
    const t = S.swOn == null ? 0 : r3(swRead(S));
    drawStopwatch(cx, cy, t, { digits: 3, title: 'Đồng hồ đo thời gian hiện số', alpha: S.swA, on: S.swOn != null && tc > S.swOn && tc < S.swOff });
  } else drawStopwatch(cx, cy, r2(swRead(S)), { alpha: S.swA, on: S.swOn != null && tc > S.swOn && tc < S.swOff });
  // lời nhắc lúc bấm, lúc thả
  const cue = (S.cues || []).filter(c => tc >= c.t && tc < c.t + 0.5).pop();
  if (cue) g.text(cue.text, g.X(cx), g.Y(cy - 8.6), { size: FS(1.05), color: C.obj, weight: 700 });
  drawResult(); drawDots(); drawRampTable();
}
// góc trên trái: phép tính tốc độ ứng với lựa chọn
function drawResult(){
  if (!S.res || S.resA <= 0.01) return;
  const { C, ctx } = g; ctx.save(); ctx.globalAlpha = S.resA;
  const x = -47;
  S.res.forEach((t, i) => g.text(t, g.X(x), g.Y(17.5 - i * 3.6), { size: i ? FS() : SM(), color: i ? C['stage-ink'] : C['stage-muted'], weight: i ? 700 : 600, align: 'left', mono: i > 0 }));
  ctx.restore();
}
// ba lần đo thành ba chấm trên trục thời gian; vạch giá trị đã chọn
const DOT_T0 = 1.1, DOT_T1 = 1.35, DOT_X0 = -47, DOT_X1 = -16, DOT_Y = 10;
const dotX = t => DOT_X0 + (DOT_X1 - DOT_X0) * (t - DOT_T0) / (DOT_T1 - DOT_T0);
function drawDots(){
  if (S.dotsA <= 0.01) return;
  const { C, ctx, X, Y } = g; ctx.save(); ctx.globalAlpha = S.dotsA;
  line([DOT_X0, DOT_Y], [DOT_X1, DOT_Y], C['stage-muted'], 1.4);
  for (let t = DOT_T0; t <= DOT_T1 + 1e-9; t += 0.05){
    line([dotX(t), DOT_Y - .6], [dotX(t), DOT_Y + .6], C['stage-muted'], 1.2);
    g.text(nf(t, 2), X(dotX(t)), Y(DOT_Y - 2.2), { size: SM() - 1, mono: true, color: C['stage-muted'] });
  }
  g.text('Ba lần đo (s)', X(DOT_X0), Y(DOT_Y + 7), { size: SM(), color: C['stage-muted'], weight: 600, align: 'left' });
  S.trials.forEach((t, i) => {
    ctx.fillStyle = C.glass; ctx.beginPath(); ctx.arc(X(dotX(t)), Y(DOT_Y), Math.max(5, .8 * g.sc), 0, Math.PI * 2); ctx.fill();
    g.text(`L${i + 1}`, X(dotX(t)), Y(DOT_Y + 2 + (i === 2 ? 2.2 : 0)), { size: SM() - 1, color: C.glass, weight: 700 });
  });
  if (S.pick && S.pickA > 0.01){
    ctx.globalAlpha = S.dotsA * S.pickA;
    line([dotX(S.pick.t), DOT_Y - 1.4], [dotX(S.pick.t), DOT_Y + 3.4], C.beam, 3);
  }
  ctx.restore();
}
function drawRampTable(){
  if (S.tableA <= 0.01) return;
  const { C, ctx } = g; ctx.save(); ctx.globalAlpha = S.tableA;
  const s = S.finish - START, gate = S.method === 'cong', dg = gate ? 3 : 2;
  let rows, title, x0 = 13, w = [12, 11, 12];
  if (S.free){
    title = gate ? 'Kết quả đo (cổng quang điện)' : 'Kết quả đo (bấm tay)';
    const tr = S.trials, from = Math.max(0, tr.length - 4);
    rows = [{ cells: ['Lần đo', 's (cm)', 't (s)'] }];
    for (let i = from; i < from + 4; i++) rows.push({ cells: [`Lần ${i + 1}`, tr[i] != null ? String(s) : '', tr[i] != null ? nf(tr[i], dg) : ''] });
    if (tr.length){
      const m = gate ? r3(avg(tr)) : r2(avg(tr));
      rows.push({ cells: ['Trung bình', String(s), nf(m, dg)], hl: 1 });
      const bottom = drawGrid(x0, 21, w, rows, { title });
      g.text(vText(s, m, dg).replace(/ ≈ [\d,]+ m\/s$/, ''), g.X(x0 + 17.5), g.Y(bottom - 2.4), { size: FS(), color: C.beam, weight: 700, mono: true });
      g.text(`= ${nf(r2(s / m / 100), 2)} m/s`, g.X(x0 + 17.5), g.Y(bottom - 5.6), { size: FS(), color: C.beam, weight: 700, mono: true });
    } else drawGrid(x0, 21, w, rows, { title });
    ctx.restore(); return;
  }
  rows = [{ cells: ['Lần đo', 's (cm)', 't (s)'] }];
  for (let i = 0; i < 3; i++) rows.push({ cells: [`Lần ${i + 1}`, S.trials[i] != null ? String(s) : '', S.trials[i] != null ? nf(S.trials[i], 2) : ''] });
  const pk = S.pick && S.pickA > 0.01 ? S.pick : null;
  rows.push({ cells: [pk ? pk.label : 'Trung bình', pk ? String(s) : '', pk ? nf(pk.t, 2) : ''], hl: pk ? S.pickA : 0 });
  const bottom = drawGrid(x0, 21, w, rows, { title: 'Bảng 9.1' });
  if (pk){
    ctx.globalAlpha = S.tableA * S.pickA;
    g.text(`v = ${s} : ${nf(pk.t, 2)} ≈ ${cms(pk.t)} cm/s`, g.X(x0 + 17.5), g.Y(bottom - 2.4), { size: FS(), color: C.beam, weight: 700, mono: true });
    g.text(`≈ ${nf(r2(s / pk.t / 100), 2)} m/s`, g.X(x0 + 17.5), g.Y(bottom - 5.6), { size: FS(), color: C.beam, weight: 700, mono: true });
  }
  ctx.restore();
}

/* ---- cảnh máng nghiêng, cổng quang điện ---- */
const RAIL_X0 = -40, RAIL_Y0 = -15, BALL_R = 1.3;
// độ nghiêng vẽ theo a của bi (bi lăn: a ≈ 5/7 · g · sinα), chỉ để minh họa
const railOf = () => plank(RAIL_X0, RAIL_Y0, Math.asin(A_BALL / (5 / 7 * G)));
function drawGateFrame(P, d, hgt, lit){
  const { C } = g, w = 1.8;
  line(P.at(d - w, PT), P.at(d - w, PT + hgt), C['stage-muted'], 3);
  line(P.at(d + w, PT), P.at(d + w, PT + hgt), C['stage-muted'], 3);
  line(P.at(d - w, PT + hgt), P.at(d + w, PT + hgt), C['stage-muted'], 3);
  line(P.at(d - w, PT + BALL_R), P.at(d + w, PT + BALL_R), lit ? C['spec-1'] : C['stage-line'], 1.6, [2, 2]);
  const [x, y] = P.at(d, PT + hgt - 1);
  g.ctx.save(); g.ctx.fillStyle = lit ? C.img : C['stage-line']; g.ctx.beginPath(); g.ctx.arc(g.X(x), g.Y(y), Math.max(3, .45 * g.sc), 0, Math.PI * 2); g.ctx.fill(); g.ctx.restore();
}
function ballPos(tc){
  const P = railOf();
  if (tc < T_LEAVE){ const [x, y] = P.at(xBall(tc), PT + BALL_R); return [x, y, false]; }
  // rời máng: bay ra rồi rơi vào khay hứng
  const [x, y] = P.at(RAIL, PT + BALL_R), v = A_BALL * T_LEAVE, f = tc - T_LEAVE;
  return [Math.min(x + v * Math.cos(P.th) * f, x + 4.6), Math.max(TABLE + BALL_R + .4, y - v * Math.sin(P.th) * f - .5 * G * f * f), true];
}
const AX_X0 = -46, AX_X1 = 4, AX_Y = 12.5, AX_T = 2.5;
const axX = t => AX_X0 + (AX_X1 - AX_X0) * clamp(t, 0, AX_T) / AX_T;
function drawRail(){
  const { C, ctx, X, Y } = g, P = railOf(), tc = tcOf(S);
  drawTable();
  // giá đỡ
  for (const d of [6, 54]){ const [x, y] = P.at(d); line([x, y], [x, TABLE], C['stage-muted'], 3); }
  drawRuler(P, RAIL, C['stage-muted']);
  g.text('Máng có thước gắn trên giá đỡ (cm)', X(RAIL_X0 + 22), Y(TABLE - 2.6), { size: SM(), color: C['stage-muted'] });
  // khay hứng bi
  const [ex] = P.at(RAIL); line([ex + .5, TABLE + 4], [ex + .5, TABLE], C['stage-muted'], 2); line([ex + .5, TABLE], [ex + 6.5, TABLE], C['stage-muted'], 2); line([ex + 6.5, TABLE], [ex + 6.5, TABLE + 4], C['stage-muted'], 2);
  // nam châm điện
  poly([P.at(-6.4, PT), P.at(-BALL_R, PT), P.at(-BALL_R, PT + 4), P.at(-6.4, PT + 4)]);
  ctx.fillStyle = S.magOn ? C.obj : C['stage-2']; ctx.fill(); ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.4; ctx.stroke();
  { const [x, y] = P.at(-4, PT + 7.6); g.text('Nam châm điện', X(x), Y(y), { size: SM(), color: S.magOn ? C.obj : C['stage-muted'], weight: 600 });
    const [x2, y2] = P.at(-4, PT + 5.4); g.text(S.magOn ? 'đang giữ bi' : 'đã ngắt', X(x2), Y(y2), { size: SM() - 1, color: C['stage-muted'] }); }
  // cổng quang điện
  const lit3 = tc >= R3 && S.ballA > 0.5, lit4 = tc >= R4 && S.ballA > 0.5;
  for (const [d, lab, lit] of [[GATE3, '(3)', lit3], [GATE4, '(4)', lit4]]){
    drawGateFrame(P, d, 8, lit);
    const [x, y] = P.at(d, PT + 9.8); g.text('Cổng ' + lab, X(x), Y(y), { size: SM(), color: C['stage-ink'], weight: 700 });
    const [gx, gy] = P.at(d, PT + 8); line([gx, gy], [21.5, d === GATE3 ? 17 : 11.5], C['stage-line'], 1.2, [4, 4]);
  }
  band(P, GATE3, GATE4, PT + 12.5, C.glass, 's = 40 cm (giữa hai cổng)', S.sA);
  // đoạn bi đi được trong khoảng thời gian đã chọn (câu hỏi 3)
  if (S.iv && S.ivA > 0.01){
    const [a, b] = S.iv, now = a + (b - a) * lin(S.ivP);
    band(P, Math.min(RAIL, xBall(a)), Math.min(RAIL, xBall(now)), PT + 16.5, C.beam, `Bi đi trong ${nf(r3(b - a), 3)} s`, S.ivA);
    if (S.ivP > 0 && S.ivP < 1){ const [x, y] = ballPos(now); ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = C.beam; ctx.beginPath(); ctx.arc(X(x), Y(y), BALL_R * g.sc, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  }
  // viên bi
  if (S.ballA > 0.01){ const [x, y] = ballPos(tc); ctx.save(); ctx.globalAlpha = S.ballA; ctx.fillStyle = C.screen; ctx.strokeStyle = C['stage-muted']; ctx.beginPath(); ctx.arc(X(x), Y(y), BALL_R * g.sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // đồng hồ đo thời gian hiện số: ghi thời điểm bi đi qua mỗi cổng, tính từ lúc ngắt nam châm
  box(21.5, -8, 49, 24);
  g.text('Đồng hồ đo thời gian hiện số', X(35.25), Y(21.6), { size: SM(), color: C['stage-muted'], weight: 700 });
  for (const [i, lab, val, lit] of [[0, 'Cổng (3)', R3, lit3], [1, 'Cổng (4)', R4, lit4]]){
    const y = 17 - i * 5.5;
    g.text(lab, X(23), Y(y), { size: FS(), color: C['stage-ink'], weight: 700, align: 'left', halo: false });
    box(32, y - 2, 47.8, y + 2, { fill: C.stage, stroke: C['stage-line'], r: 5 });
    g.text(lit ? nf(val, 3) + ' s' : '– – – – s', X(39.9), Y(y), { size: FS(1.25), mono: true, weight: 700, color: lit ? C.img : C['stage-muted'], halo: false });
  }
  if (S.res && S.resA > 0.01){
    ctx.save(); ctx.globalAlpha = S.resA;
    S.res.forEach((t, i) => g.text(t, X(35.25), Y(6.5 - i * 3.3), { size: i < 3 ? FS() : SM(), color: C.beam, weight: 700, mono: i < 3, halo: false }));
    ctx.restore();
  }
  // trục thời gian
  if (S.axisA > 0.01){
    ctx.save(); ctx.globalAlpha = S.axisA;
    g.text('Thời gian (s), tính từ lúc ngắt nam châm', X(AX_X0), Y(AX_Y + 4.4), { size: SM(), color: C['stage-muted'], weight: 600, align: 'left' });
    line([AX_X0, AX_Y], [AX_X1, AX_Y], C['stage-muted'], 1.4);
    for (let t = 0; t <= AX_T + 1e-9; t += 0.5){ line([axX(t), AX_Y - .6], [axX(t), AX_Y + .6], C['stage-muted'], 1.2); g.text(nf(t, 1).replace(/,0$/, ''), X(axX(t)), Y(AX_Y - 2.3), { size: SM() - 1, mono: true, color: C['stage-muted'] }); }
    if (S.iv && S.ivA > 0.01){ const [a, b] = S.iv; ctx.globalAlpha = S.axisA * S.ivA; line([axX(a), AX_Y], [axX(a + (b - a) * lin(S.ivP)), AX_Y], C.beam, 6); ctx.globalAlpha = S.axisA; }
    for (const [t, lit, lab] of [[R3, lit3, '(3)'], [R4, lit4, '(4)']]) if (lit){ line([axX(t), AX_Y - 1], [axX(t), AX_Y + 1.8], C.img, 2.4); g.text(lab, X(axX(t)), Y(AX_Y + 3), { size: SM() - 1, color: C.img, weight: 700 }); }
    if (S.ballA > 0.5 && tc > 0 && tc < AX_T && !(S.u >= 1)){ ctx.fillStyle = C.screen; ctx.beginPath(); ctx.arc(X(axX(tc)), Y(AX_Y), 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}

/* ---- cảnh mặt đường, thiết bị bắn tốc độ ---- */
const RS = 6, MARK0 = -15, ROAD_Y = -8;           // 1 m = 6 đơn vị; vạch mốc 1 ở x = -15, vạch mốc 2 ở x = +15
const roadX = m => MARK0 + m * RS;
function drawRoadCar(xFront, y, k = 1, col = g.C.obj){
  const { ctx, C, X, Y, sc } = g, L = 4.2 * RS * k, H = 1.4 * RS * k;
  ctx.save(); ctx.fillStyle = col;
  g.rr(X(xFront - L), Y(y + H * .62), L * sc, H * .45 * sc, 6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(X(xFront - L * .78), Y(y + H * .6)); ctx.lineTo(X(xFront - L * .64), Y(y + H)); ctx.lineTo(X(xFront - L * .3), Y(y + H)); ctx.lineTo(X(xFront - L * .16), Y(y + H * .6)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.glass; ctx.globalAlpha = .8;
  ctx.beginPath(); ctx.moveTo(X(xFront - L * .72), Y(y + H * .64)); ctx.lineTo(X(xFront - L * .62), Y(y + H * .92)); ctx.lineTo(X(xFront - L * .32), Y(y + H * .92)); ctx.lineTo(X(xFront - L * .22), Y(y + H * .64)); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  for (const f of [.2, .8]){ ctx.fillStyle = C['stage-ink']; ctx.beginPath(); ctx.arc(X(xFront - L * f), Y(y + H * .17), H * .17 * sc, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function drawRoad(){
  const { C, ctx, X, Y } = g, tc = tcOf(S), t = S.tRoad, v = t ? GAP / t : 0;
  box(-52, ROAD_Y - 6, 52, ROAD_Y, { fill: C['stage-2'], stroke: null, r: 0 });
  for (let x = -50; x < 50; x += 8) line([x, ROAD_Y - 3], [x + 4, ROAD_Y - 3], C['stage-muted'], 2);
  // hai vạch mốc
  for (const [m, lab] of [[0, 'Vạch mốc 1'], [GAP, 'Vạch mốc 2']]){
    line([roadX(m), ROAD_Y - 6], [roadX(m), ROAD_Y], C.screen, 4);
    g.text(lab, X(roadX(m)), Y(ROAD_Y - 8), { size: SM(), color: C.screen, weight: 700 });
  }
  line([roadX(0), ROAD_Y - 11.5], [roadX(GAP), ROAD_Y - 11.5], C.glass, 2);
  for (const m of [0, GAP]) line([roadX(m), ROAD_Y - 10.5], [roadX(m), ROAD_Y - 12.5], C.glass, 2);
  g.text(`${GAP} m`, X(0), Y(ROAD_Y - 13.4), { size: SM(), color: C.glass, weight: 700 });
  // biển báo tốc độ tối đa
  line([-28, ROAD_Y], [-28, -1], C['stage-muted'], 2.4);
  ctx.save(); ctx.fillStyle = C.screen; ctx.strokeStyle = C['spec-1']; ctx.lineWidth = Math.max(3, .7 * g.sc);
  ctx.beginPath(); ctx.arc(X(-28), Y(1.6), 3 * g.sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  g.text(String(LIMIT), X(-28), Y(1.6), { size: FS(1.1), color: C.stage, weight: 700, halo: false });
  // camera trên cột
  line([-44, ROAD_Y], [-44, 6], C['stage-muted'], 3);
  box(-46.5, 6, -39, 9.6, { fill: C['stage-muted'], stroke: null, r: 4 });
  ctx.save(); ctx.fillStyle = C.glass; ctx.beginPath(); ctx.arc(X(-39), Y(7.8), .9 * g.sc, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  g.text('Camera', X(-42.7), Y(11.4), { size: SM(), color: C['stage-muted'], weight: 600 });
  line([-39, 7.8], [roadX(0), ROAD_Y], C.glass, 1, [3, 5]); line([-39, 7.8], [roadX(GAP), ROAD_Y], C.glass, 1, [3, 5]);
  // xe
  if (t && S.u > 0) drawRoadCar(roadX(v * tc), ROAD_Y);
  // máy tính nhỏ: hiện t, v, so với giới hạn
  box(12.5, 4, 49, 24);
  g.text('Máy tính nhỏ', X(30.75), Y(21.6), { size: SM(), color: C['stage-muted'], weight: 700 });
  g.text(`Giới hạn: ${LIMIT} km/h`, X(14), Y(18.2), { size: FS(), color: C['stage-ink'], weight: 600, align: 'left', halo: false });
  if (t && S.u > 0 && tc >= t){
    const ov = over(t);
    g.text(`t = ${nf(t, 2)} s`, X(14), Y(14.8), { size: FS(), color: C.img, weight: 700, mono: true, align: 'left', halo: false });
    g.text(`v = ${GAP} : ${nf(t, 2)} ≈ ${n1(v)} m/s`, X(14), Y(11.4), { size: FS(), color: C.img, weight: 700, mono: true, align: 'left', halo: false });
    g.text(`≈ ${n1(kmh(t))} km/h`, X(14), Y(8), { size: FS(1.2), color: C.img, weight: 700, mono: true, align: 'left', halo: false });
    g.text(ov ? 'Vượt tốc độ: chụp ảnh' : 'Không vượt', X(46.5), Y(8), { size: FS(), color: ov ? C['spec-1'] : C.img, weight: 700, align: 'right', halo: false });
    // ảnh chụp tốc độ kèm biển số
    if (ov){
      box(-11, 6, 10.5, 23.5, { fill: C['stage-2'], stroke: C.beam, r: 6, width: 2 });
      g.text('Ảnh chụp tốc độ', X(-.25), Y(21.3), { size: SM(), color: C.beam, weight: 700 });
      g.text(`${n1(kmh(t))} km/h`, X(-.25), Y(17.6), { size: FS(), color: C['spec-1'], weight: 700, mono: true });
      drawRoadCar(6.5, 10, .5);
      g.text('Biển số: 12A-345.67', X(-.25), Y(7.9), { size: SM() - 1, color: C['stage-ink'], weight: 600 });
      const f = (tc - t) / 0.08;
      if (f < 1){ ctx.save(); ctx.globalAlpha = .6 * (1 - f); ctx.fillStyle = C.gas; ctx.fillRect(0, 0, g.W, g.H); ctx.restore(); }
    }
  } else if (t && S.u > 0 && tc >= 0){
    g.text('Đang đo thời gian…', X(14), Y(14.8), { size: FS(), color: C['stage-muted'], weight: 600, align: 'left', halo: false });
  }
  if (S.roadNote) g.text(S.roadNote, X(-18), Y(-24), { size: SM(), color: C['stage-muted'], weight: 600 });
}

/* ---- bàn dụng cụ ---- */
function drawTools(){
  const { C, ctx, X, Y } = g;
  drawTable();
  if (S.tA0 > 0.01){
    ctx.save(); ctx.globalAlpha = S.tA0;
    drawRuler(plank(-46, TABLE + .2, 0), 50, C['stage-muted']);
    g.text('Thước: đo quãng đường s', X(-21), Y(TABLE + 6), { size: SM(), color: C['stage-ink'], weight: 600 });
    ctx.restore();
  }
  drawStopwatch(15, -7, 0, { alpha: S.tA1, title: 'Đồng hồ bấm giây: 0,01 s' });
  drawStopwatch(37, -7, 0, { digits: 3, alpha: S.tA2, title: 'Đồng hồ hiện số: 0,001 s' });
  if (S.formA > 0.01){
    ctx.save(); ctx.globalAlpha = S.formA;
    g.text('v = s / t', X(0), Y(15), { size: FS(3), color: C.beam, weight: 700 });
    g.text('Tốc độ = quãng đường : thời gian', X(0), Y(8), { size: FS(1.1), color: C['stage-ink'], weight: 600 });
    ctx.restore();
  }
}

/* ---------- câu hỏi mồi ---------- */
const REF9 = 'SGK KHTN 7 · Bài 9 Đo tốc độ';
function resetCar(S){ Object.assign(S, { u: 0, t0: 0, t1: 0, swOn: null, swOff: null, cues: [] }); }
// xe chạy hết tấm gỗ; đồng hồ chạy từ on tới off (thời gian thí nghiệm, s; thả xe lúc 0)
async function runCar(h, { on, off, cues = [], tEnd = T70 }){
  const S = h.S;
  Object.assign(S, { swOn: on, swOff: off, cues, t0: Math.min(0, on) - 0.3, t1: Math.max(tEnd, off) + 0.25, u: 0 });
  await h.tw({ u: 1 }, (S.t1 - S.t0) * SLOW * 1000);
}
// lần đo i ở chế độ theo bước SGK (độ trễ bấm tay cố định)
const trialRun = i => ({ on: DELAYS[i][0], off: T50 + DELAYS[i][1], cues: [{ t: 0, text: 'Thả xe' }, { t: DELAYS[i][0], text: 'Bấm đồng hồ' }, { t: T50, text: 'Xe tới vạch đích' }, { t: T50 + DELAYS[i][1], text: 'Dừng đồng hồ' }] });
const [D0, D1] = DELAYS[0];
// câu 1: mỗi đáp án là một cặp (lúc bấm, lúc dừng); cả bốn đều có độ trễ tay của lần 1
const Q1 = [
  { on: T20 + D0, off: T50 + D1, a: 20, b: 50, cues: [{ t: 0, text: 'Thả xe' }, { t: T20, text: 'Xe đã chạy 20 cm: bấm' }, { t: T50 + D1, text: 'Dừng đồng hồ' }] },
  { on: D0, off: T50 + D1, a: 0, b: 50, cues: trialRun(0).cues },
  { on: D0, off: T70 + D1, a: 0, b: CAR_MAX, cues: [{ t: 0, text: 'Thả xe' }, { t: D0, text: 'Bấm đồng hồ' }, { t: T70, text: 'Xe chạy hết tấm gỗ' }, { t: T70 + D1, text: 'Dừng đồng hồ' }] },
  { on: -1.5 + D0, off: T50 + D1, a: 0, b: 50, idle: 1.5, cues: [{ t: -1.5 + D0, text: 'Bấm đồng hồ' }, { t: -1.0, text: 'Đếm: 1, 2, 3…' }, { t: 0, text: 'Thả xe' }, { t: T50 + D1, text: 'Dừng đồng hồ' }] }
];
const Q2 = [
  { label: 'Lần nhỏ nhất', t: Math.min(...MEAS) },
  { label: 'Lần lớn nhất', t: Math.max(...MEAS) },
  { label: 'Trung bình', t: r2(avg(MEAS)) },
  { label: 'Lần đầu tiên', t: MEAS[0] }
];
const Q3 = [[0, R3], [0, R4], [R3, R4], [0, r3(R4 + R3)]];
const Q4 = [0.40, 0.35, 0.30, 0.25];
const questions = [
  { id: 'q1', short: 'Bấm và dừng đồng hồ lúc nào?', tag: 'Bấm giờ',
    text: `Thước đo quãng đường s = ${FINISH - START} cm, từ vạch xuất phát tới vạch đích. Em bấm và dừng đồng hồ lúc nào để đo đúng thời gian xe đi hết ${FINISH - START} cm đó?`,
    opts: ['Bấm khi xe đã chạy được một đoạn (20 cm), dừng khi xe tới vạch đích', 'Bấm đúng lúc thả xe ở vạch xuất phát, dừng khi xe tới vạch đích', 'Bấm lúc thả xe, dừng khi xe chạy hết tấm gỗ', 'Bấm đồng hồ, đếm "1, 2, 3" rồi mới thả xe; dừng khi xe tới vạch đích'], answer: 1,
    async sim(h, c){
      const S = h.S, o = Q1[c], s = FINISH - START;
      resetCar(S); Object.assign(S, { hlA: 0, resA: 0, carA: 1 });
      await h.wait(250);
      await runCar(h, o);
      S.hl = { a: o.a, b: o.b, label: `Đoạn được bấm giờ: ${o.b - o.a} cm${o.idle ? ` + ${n1(o.idle)} s xe đứng yên` : ''}` };
      await h.tw({ hlA: 1 }, 600);
      const t = r2(o.off - o.on);
      S.res = ['Tính tốc độ theo lần bấm này', `Đồng hồ chỉ: ${nf(t, 2)} s`, `v = ${s} cm : ${nf(t, 2)} s`, `  ≈ ${cms(t)} cm/s ≈ ${nf(r2(s / t / 100), 2)} m/s`];
      await h.tw({ resA: 1 }, 400); await h.wait(500);
    },
    async reset(h){ await h.tw({ hlA: 0, resA: 0, carA: 0 }, 300); resetCar(h.S); await h.tw({ carA: 1 }, 250); },
    wrong: [
      'Em bắt đầu bấm khi xe đã chạy rồi. Nhìn đoạn tô màu: đồng hồ chỉ đo đoạn ngắn hơn 50 cm, nhưng em lại chia cho 50 cm.',
      null,
      'Đồng hồ vẫn chạy khi xe đã qua vạch đích. Đoạn tô màu dài hơn đoạn thước đo.',
      'Lúc em đếm, xe còn đứng yên mà đồng hồ đã chạy. Thời gian đo bị cộng thêm phần xe chưa chuyển động.'
    ],
    hint2: 'Gợi ý: thời gian phải ứng đúng với quãng đường đã đo: bắt đầu ở vạch nào, kết thúc ở vạch nào?',
    right: 'Thả xe ở vạch xuất phát thì bấm, xe tới vạch đích thì dừng. Như vậy thời gian t ứng đúng với quãng đường s = 50 cm.',
    ref: REF9 + ' · Mục I, hoạt động tr. 50' },
  { id: 'q2', short: 'Lấy thời gian nào để tính tốc độ?', tag: 'Bảng 9.1',
    text: `Ba lần đo được ${MEAS.map(t => nf(t, 2) + ' s').join('; ')}. Em lấy thời gian nào để tính tốc độ của xe?`,
    opts: [`Lần nhỏ nhất, ${nf(Q2[0].t, 2)} s`, `Lần lớn nhất, ${nf(Q2[1].t, 2)} s`, 'Trung bình cộng của ba lần đo', `Lần đầu tiên, ${nf(Q2[3].t, 2)} s`], answer: 2,
    async sim(h, c){
      const S = h.S; S.pickA = 0;
      if (S.dotsA < 1) await h.tw({ dotsA: 1 }, 500);
      S.pick = Q2[c]; await h.tw({ pickA: 1 }, 700); await h.wait(700);
    },
    async reset(h){ await h.tw({ pickA: 0 }, 300); h.S.pick = null; },
    wrong: [
      'Một lần đo có thể bấm hơi sớm hoặc hơi muộn. Nhìn ba chấm: giá trị em chọn nằm ở mép, không đại diện cho cả ba lần.',
      'Một lần đo có thể bấm hơi sớm hoặc hơi muộn. Nhìn ba chấm: giá trị em chọn nằm ở mép, không đại diện cho cả ba lần.',
      null,
      'Em mới dùng một lần đo, hai lần đo sau bị bỏ phí.'
    ],
    hint2: 'Gợi ý: vì sao SGK dặn đo 3 lần? Ba lần đo được dùng thế nào?',
    right: 'Mỗi lần bấm tay có thể sớm hoặc muộn một chút. Lấy trung bình ba lần thì các sai lệch bù trừ cho nhau, kết quả đáng tin hơn.',
    ref: REF9 + ' · Mục I, hoạt động tr. 50' },
  { id: 'q3', short: 'Đọc đồng hồ đo thời gian hiện số', tag: 'Cổng quang điện',
    text: `Đồng hồ chỉ: bi qua cổng (3) lúc ${nf(R3, 3)} s, qua cổng (4) lúc ${nf(R4, 3)} s. Thời gian bi đi quãng đường s = 40 cm giữa hai cổng là bao nhiêu?`,
    opts: [`${nf(R3, 3)} s`, `${nf(R4, 3)} s`, `${nf(R4, 3)} − ${nf(R3, 3)} = ${nf(r3(R4 - R3), 3)} s`, `${nf(R4, 3)} + ${nf(R3, 3)} = ${nf(r3(R4 + R3), 3)} s`], answer: 2,
    async sim(h, c){
      const S = h.S, [a, b] = Q3[c], t = r3(b - a);
      Object.assign(S, { iv: [a, b], ivP: 0, ivA: 1, resA: 0 });
      await h.tw({ ivP: 1 }, Math.max(900, (Math.min(b, T_LEAVE + .3) - a) * SLOW * 1000));
      S.res = [`t = ${nf(t, 3)} s`, `v = 0,40 m : ${nf(t, 3)} s`, `  ≈ ${nf(r2(0.4 / t), 2)} m/s`];
      if (b > T_LEAVE) S.res.push(`Bi đã rời máng lúc ${nf(r3(T_LEAVE), 3)} s`);
      await h.tw({ resA: 1 }, 400); await h.wait(600);
    },
    async reset(h){ await h.tw({ ivA: 0, resA: 0 }, 300); h.S.iv = null; },
    wrong: [
      `${nf(R3, 3)} s là lúc bi mới tới cổng (3). Đoạn tô màu cho thấy đó là thời gian bi đi từ nam châm tới cổng (3).`,
      'Số này tính từ lúc ngắt nam châm, nên gồm cả đoạn trước cổng (3).',
      null,
      'Cộng hai số chỉ thì được một khoảng thời gian dài hơn cả lúc bi lăn trên máng.'
    ],
    hint2: 'Gợi ý: bi đi từ cổng (3) tới cổng (4) mất bao lâu, nếu đồng hồ tính từ lúc ngắt nam châm?',
    right: 'Thời gian bi đi giữa hai cổng = số chỉ ở cổng (4) − số chỉ ở cổng (3). Đồng hồ hiện số đo tới phần nghìn giây và không phụ thuộc tay người bấm.',
    ref: REF9 + ' · Mục II, Hình 9.3, hoạt động tr. 51' },
  { id: 'q4', short: 'Xe nào bị chụp ảnh vượt tốc độ?', tag: 'Bắn tốc độ',
    text: `Đoạn đường giới hạn ${LIMIT} km/h, hai vạch mốc cách nhau ${GAP} m. Camera đo được thời gian xe đi giữa hai vạch. Xe nào bị chụp ảnh vì vượt tốc độ?`,
    opts: Q4.map(t => `Xe đi hết ${nf(t, 2)} s`), answer: 3,
    async sim(h, c){ await drive(h, Q4[c]); await h.wait(900); },
    async reset(h){ Object.assign(h.S, { u: 0, tRoad: 0 }); await h.wait(150); },
    wrong: [
      'Đổi ra km/h rồi so với 60 km/h. Xe này đi giữa hai vạch còn khá lâu.',
      'Đổi ra km/h rồi so với 60 km/h. Xe này đi giữa hai vạch còn khá lâu.',
      'Xe này chạy đúng bằng 60 km/h, chưa vượt quá.',
      null
    ],
    hint2: 'Gợi ý: thời gian đi hết 5 m càng ngắn thì tốc độ càng lớn hay càng nhỏ? 1 m/s bằng 3,6 km/h.',
    right: `v = 5 m : 0,25 s = 20 m/s = 72 km/h, lớn hơn 60 km/h. Camera đo thời gian giữa hai vạch, máy tính nhỏ tính tốc độ và so với giới hạn.`,
    ref: REF9 + ' · Mục III, Hình 9.4, câu hỏi tr. 52' }
];
// xe chạy đều qua hai vạch mốc trong đúng thời gian t
async function drive(h, t){
  const S = h.S, v = GAP / t;
  Object.assign(S, { tRoad: t, t0: -3 / v, t1: 15.5 / v, u: 0 });
  await h.tw({ u: 1 }, (S.t1 - S.t0) * ROAD_SLOW * 1000);
}

/* ---------- các bước ---------- */
const CONCLUSION = `<div class="concl-wrap"><table class="concl"><thead><tr><th>Cách đo</th><th>Đo quãng đường</th><th>Đo thời gian</th><th>Ghi chú</th></tr></thead><tbody>
<tr><th>Đồng hồ bấm giây</th><td>Thước</td><td>Người bấm tay, tới 0,01 s</td><td>Đo 3 lần, lấy trung bình; sai số do bấm sớm, muộn</td></tr>
<tr><th>Cổng quang điện và đồng hồ hiện số</th><td>Thước gắn giá đỡ</td><td>Tự động, tới 0,001 s</td><td>t = số chỉ cổng (4) − số chỉ cổng (3)</td></tr>
<tr><th>Thiết bị bắn tốc độ</th><td>Hai vạch mốc cách 5–10 m</td><td>Camera</td><td>Máy tính so với tốc độ giới hạn; vượt thì chụp biển số</td></tr></tbody></table>
<p style="margin:8px 0 0">Cả ba cách: đo quãng đường s và thời gian t, rồi tính <b>v = s/t</b>.</p></div>`;
const rampReady = S => Object.assign(S, { scene: 'ramp', boardA: 1, linesA: 1, sA: 1, carA: 1, swA: 1, tableA: 1 });
const steps = [
  { title: 'Cần đo những gì?',
    sgk: 'Để xác định tốc độ, phải đo quãng đường s và thời gian t, rồi tính v = s/t. Dụng cụ đo độ dài: thước. Dụng cụ đo thời gian: đồng hồ bấm giây, đồng hồ đo thời gian hiện số.',
    note: 'Tốc độ không đo trực tiếp mà tính từ s và t. Có hai cách dùng đồng hồ bấm giây: chọn quãng đường s trước rồi đo thời gian t (thí nghiệm này), hoặc chọn thời gian t trước rồi đo quãng đường s.',
    chips: [{ q: 'Sao không có dụng cụ đo thẳng tốc độ?', a: 'Trong phòng thực hành, mình đo quãng đường bằng thước và thời gian bằng đồng hồ, rồi tính v = s/t. Xe máy, ô tô thì có tốc kế đo trực tiếp.' }],
    setup(S){ Object.assign(S, { scene: 'tools', tA0: 0, tA1: 0, tA2: 0, formA: 0 }); },
    async run(h){
      for (const k of ['tA0', 'tA1', 'tA2']) await h.tw({ [k]: 1 }, 500);
      await h.tw({ formA: 1 }, 700);
    } },
  { title: 'Tạo mặt dốc',
    sgk: 'Kê tấm gỗ dài 80 cm lên vài cuốn sách. Vẽ vạch xuất phát và vạch đích cách nhau 50 cm (SGK: 50 cm hoặc 60 cm).',
    note: 'Tấm gỗ kê lên 2 cuốn sách thành mặt dốc. Hai vạch cách nhau 50 cm: thước chỉ quãng đường s = 50 cm.',
    chips: [],
    setup(S){ Object.assign(S, { scene: 'ramp', books: 0, boardA: 1, carA: 0, swA: 0, tableA: 0 }); },
    async run(h){ await h.tw({ books: BOOKS0 }, 1200); await h.tw({ linesA: 1 }, 600); await h.tw({ sA: 1 }, 700); await h.tw({ carA: 1, swA: 1 }, 500); } },
  { title: 'Thả xe, bấm giờ (lần 1)', q: true,
    sgk: 'Giữ ô tô ở vạch xuất phát rồi thả xe. Dùng đồng hồ bấm giây đo thời gian xe đi hết quãng đường s = 50 cm, ghi vào Bảng 9.1.',
    note: `Xe lăn nhanh dần xuống dốc. Đồng hồ bấm giây chỉ ${nf(MEAS[0], 2)} s. Ghi vào Bảng 9.1 (lần 1).`,
    chips: [{ q: 'Vì sao xe chạy nhanh dần?', a: 'Xe lăn xuống dốc nên càng xuống càng nhanh. Vì vậy v = s/t ở đây cho biết trung bình mỗi giây xe đi được bao nhiêu trên cả đoạn 50 cm.' }],
    setup(S){ rampReady(S); S.tableA = 1; },
    async run(h){ await h.wait(400); await h.ask('q1'); const S = h.S; await h.wait(300); S.trials = [MEAS[0]]; await h.wait(500); } },
  { title: 'Đo thêm 2 lần', q: true,
    sgk: 'Lặp lại thêm hai lần, ghi kết quả vào Bảng 9.1.',
    note: `Ba lần đo: ${MEAS.map(t => nf(t, 2) + ' s').join('; ')}. Ba số khác nhau vì người bấm đồng hồ có lúc nhanh, lúc chậm.`,
    chips: [{ q: 'Sao ba lần đo không bằng nhau?', a: 'Mỗi lần bấm tay, em có thể bấm sớm hoặc muộn một chút. Vì vậy cần đo nhiều lần rồi lấy trung bình.' }],
    setup(S){ rampReady(S); S.trials = [MEAS[0]]; },
    async run(h){
      const S = h.S;
      for (const i of [1, 2]){
        if (S.u > 0){ await h.tw({ carA: 0 }, 250); resetCar(S); await h.tw({ carA: 1 }, 250); }
        await h.wait(300); await runCar(h, trialRun(i));
        S.trials = [...S.trials, MEAS[i]]; await h.wait(600);
      }
      await h.ask('q2');
    } },
  { title: 'Tính tốc độ, nhận xét',
    sgk: 'Từ số liệu trong Bảng 9.1, tính tốc độ v = s/t của xe và nhận xét kết quả.',
    note: `t trung bình = (${MEAS.map(t => nf(t, 2)).join(' + ')}) : 3 ≈ ${nf(Q2[2].t, 2)} s. v = 50 cm : ${nf(Q2[2].t, 2)} s ≈ ${cms(Q2[2].t)} cm/s ≈ ${nf(r2(50 / Q2[2].t / 100), 2)} m/s.`,
    chips: [{ q: 'Đổi 42 cm/s ra m/s thế nào?', a: '100 cm = 1 m, nên 42 cm/s = 0,42 m/s.' }],
    setup(S){ rampReady(S); S.trials = [...MEAS]; S.dotsA = 1; S.pick = null; },
    async run(h){ const S = h.S; await h.wait(400); S.pick = Q2[2]; await h.tw({ pickA: 1 }, 900); await h.wait(300); } },
  { title: 'Cổng quang điện và đồng hồ hiện số', q: true,
    sgk: 'Đo khoảng cách giữa hai cổng quang điện (3) và (4): s = 40 cm. Ngắt nam châm điện để viên bi lăn xuống. Đồng hồ ghi thời điểm bi đi qua mỗi cổng.',
    note: `Đồng hồ chỉ: cổng (3) ${nf(R3, 3)} s; cổng (4) ${nf(R4, 3)} s. t = ${nf(R4, 3)} − ${nf(R3, 3)} = ${nf(r3(R4 - R3), 3)} s; v = 0,40 m : ${nf(r3(R4 - R3), 3)} s ≈ ${nf(r2(0.4 / r3(R4 - R3)), 2)} m/s.`,
    chips: [{ q: 'Cổng quang điện hoạt động thế nào?', a: 'Mỗi cổng có một chùm tia sáng. Khi bi chắn tia sáng, đồng hồ ghi lại thời điểm. Không cần tay người bấm nên chính xác hơn.' }],
    setup(S){ Object.assign(S, { scene: 'rail', magOn: true, ballA: 1, sA: 0, axisA: 0, u: 0, t0: 0, t1: 0 }); },
    async run(h){
      const S = h.S;
      await h.tw({ sA: 1, axisA: 1 }, 700); await h.wait(400);
      S.magOn = false; Object.assign(S, { t0: -0.2, t1: T_LEAVE + 0.5, u: 0 });
      await h.tw({ u: 1 }, (S.t1 - S.t0) * SLOW * 1000);
      await h.wait(500); await h.ask('q3');
    } },
  { title: 'Thiết bị bắn tốc độ', q: true,
    sgk: 'Camera đo thời gian xe đi giữa hai vạch mốc cách nhau 5 m; máy tính nhỏ tính tốc độ, so với tốc độ giới hạn; vượt thì chụp ảnh tốc độ kèm biển số, gửi về trạm kiểm soát giao thông.',
    note: `Ví dụ SGK: t = 0,35 s, v = 5 m : 0,35 s ≈ ${n1(GAP / 0.35)} m/s ≈ ${n1(kmh(0.35))} km/h, nhỏ hơn 60 km/h: không vượt.`,
    chips: [{ q: 'Vì sao hai vạch mốc cách nhau xa vài mét?', a: 'Quãng đường dài hơn thì thời gian đo được dài hơn, phép đo đỡ sai hơn. SGK nói hai vạch cách nhau khoảng 5–10 m tùy cung đường.' }],
    setup(S){ Object.assign(S, { scene: 'road', tRoad: 0, u: 0, roadNote: '' }); },
    async run(h){
      const S = h.S;
      await h.wait(500); await h.ask('q4');
      Object.assign(S, { u: 0, tRoad: 0, roadNote: 'Ví dụ trong SGK: xe đi giữa hai vạch mốc hết 0,35 s' });
      await h.wait(500); await drive(h, 0.35); await h.wait(300);
    } },
  { title: 'Kết luận',
    sgk: 'So sánh ba cách đo tốc độ.',
    note: 'Cả ba cách đều đo quãng đường s và thời gian t, rồi tính v = s/t.',
    html: CONCLUSION,
    chips: [{ q: 'Tóm tắt giúp em bài này', a: 'Cả ba cách đều đo quãng đường s và thời gian t rồi tính v = s/t. Đồng hồ bấm giây: bấm tay, đo 3 lần lấy trung bình. Cổng quang điện và đồng hồ hiện số: đo tự động tới 0,001 s. Thiết bị bắn tốc độ: camera đo thời gian xe đi giữa hai vạch mốc, máy tính so với tốc độ giới hạn.' }],
    setup(S){ Object.assign(S, { scene: 'tools', tA0: 1, tA1: 1, tA2: 1, formA: 1 }); },
    async run(h){ await h.wait(200); } }
];

/* ---------- chế độ tự do: em tự lắp thí nghiệm 1 ---------- */
// các lần đo của cấu hình đang đặt; đổi số sách, quãng đường hay cách đo thì bảng xóa.
// Mỗi lần bấm "Đo thêm một lần", kết quả được tính ngay (để chú thích và trợ lý AI biết), hoạt ảnh chạy sau.
const FT = { key: '', base: 0, cleared: 0, trials: [], shown: 0 };
const cfgKey = P => `${P.books}|${P.s}|${P.method}`;
const rnd = () => 0.10 + Math.random() * 0.15;     // độ trễ bấm tay ngẫu nhiên 0,10–0,25 s
function freeSync(P){
  if (FT.key !== cfgKey(P) || P.runN < FT.base || P.clearN !== FT.cleared) Object.assign(FT, { key: cfgKey(P), base: P.runN, cleared: P.clearN, trials: [], shown: 0 });
  while (FT.trials.length < P.runN - FT.base){
    const tt = tCar(P.s, P.books);
    if (P.method === 'cong') FT.trials.push({ val: r3(tt), on: 0, off: tt });
    else { const d0 = rnd(), d1 = rnd(); FT.trials.push({ val: r2(tt - d0 + d1), on: d0, off: tt + d1 }); }
  }
}
const vals = () => FT.trials.map(x => x.val);
const methodName = m => m === 'cong' ? 'cổng quang điện và đồng hồ hiện số' : 'đồng hồ bấm giây (bấm tay)';
const free = {
  title: 'Em tự lắp thí nghiệm đo tốc độ xe',
  hint: 'Chọn số cuốn sách kê dốc, kéo vạch đích ngay trên tấm gỗ (hoặc chỉnh ở đây), chọn cách đo rồi bấm "Đo thêm một lần".',
  groups: [
    { id: 'setup', title: 'Mặt dốc', open: true,
      icon: '<svg viewBox="0 0 24 24"><path d="M3 18L21 11" stroke="var(--pot)" stroke-width="2.4" stroke-linecap="round"/><rect x="2" y="18" width="6" height="3" fill="var(--spec-5)"/><circle cx="12" cy="13" r="1.6" fill="var(--obj)"/></svg>',
      summary: P => `${P.books} cuốn sách · s = ${P.s} cm` },
    { id: 'measure', title: 'Đo thời gian', open: true,
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5" fill="none" stroke="var(--img)" stroke-width="1.8"/><path d="M12 13V8.5M10 3h4" stroke="var(--img)" stroke-width="1.8" stroke-linecap="round"/></svg>',
      summary: P => (P.method === 'cong' ? 'Cổng quang điện' : 'Bấm tay') + (FT.key === cfgKey(P) && FT.trials.length ? ` · ${FT.trials.length} lần` : '') }
  ],
  params: [
    { key: 'books', group: 'setup', label: 'Số cuốn sách kê dốc (mỗi cuốn 3 cm)', short: 'Số cuốn sách', type: 'range', min: 1, max: 5, step: 1, unit: 'cuốn' },
    { key: 's', group: 'setup', label: 'Quãng đường s giữa vạch xuất phát và vạch đích', short: 'Quãng đường s', type: 'range', min: 20, max: CAR_MAX, step: 1, unit: 'cm' },
    { key: 'method', group: 'measure', label: 'Cách đo thời gian', type: 'choice', options: [{ value: 'tay', label: 'Đồng hồ bấm giây (bấm tay)', short: 'Bấm tay' }, { value: 'cong', label: 'Cổng quang điện và đồng hồ hiện số', short: 'Cổng quang điện' }] },
    // bộ đếm cho hai nút bên dưới (không hiện trên bảng)
    { key: 'runN', label: 'Số lần đã bấm đo', type: 'range', min: 0, max: 100000, step: 1, show: () => false },
    { key: 'clearN', label: 'Số lần đã xóa bảng', type: 'range', min: 0, max: 100000, step: 1, show: () => false }
  ],
  defaults: { books: BOOKS0, s: FINISH - START, method: 'tay', runN: 0, clearN: 0 },
  target(P){
    const S = {}; base(S); freeSync(P);
    Object.assign(S, { scene: 'ramp', free: 1, books: P.books, finish: START + P.s, method: P.method, trials: vals() }); rampReady(S);
    const last = FT.trials[FT.trials.length - 1];
    if (last) Object.assign(S, { t0: 0, t1: Math.max(tCar(CAR_MAX, P.books), last.off) + 0.3, u: 1, swOn: last.on, swOff: last.off });
    return S;
  },
  start(S){ rampReady(S); Object.assign(S, { free: 1, books: BOOKS0, finish: FINISH, method: 'tay' }); },
  async animate(h, P){
    const S = h.S; freeSync(P);
    S.free = 1; S.method = P.method; S.trials = vals().slice(0, FT.shown);
    const geo = S.books !== P.books || S.finish !== START + P.s;
    if ((geo || FT.shown < FT.trials.length) && S.u > 0){ await h.tw({ carA: 0 }, 180); resetCar(S); }
    if (!FT.trials.length && S.swOn != null) resetCar(S);
    if (geo) await h.tw({ books: P.books, finish: START + P.s, carA: 1 }, 260);
    if (S.carA < 1) await h.tw({ carA: 1 }, 180);
    while (FT.shown < FT.trials.length){
      const tr = FT.trials[FT.shown];
      const cues = P.method === 'cong' ? [{ t: 0, text: 'Thả xe' }] : [{ t: 0, text: 'Thả xe' }, { t: tr.on, text: 'Bấm đồng hồ' }, { t: tr.off, text: 'Dừng đồng hồ' }];
      await h.wait(250); await runCar(h, { on: tr.on, off: tr.off, tEnd: tCar(CAR_MAX, P.books), cues });
      FT.shown++; S.trials = vals().slice(0, FT.shown);
      if (FT.shown < FT.trials.length){ await h.wait(400); await h.tw({ carA: 0 }, 180); resetCar(S); await h.tw({ carA: 1 }, 180); }
    }
  },
  observe(_S, P){
    freeSync(P);
    const tr = vals(), gate = P.method === 'cong', dg = gate ? 3 : 2, out = [];
    out.push(`Dốc kê ${P.books} cuốn sách (đầu cao ${P.books * BOOK} cm), s = ${P.s} cm, đo bằng ${methodName(P.method)}.`);
    if (!tr.length){ out.push('Chưa đo lần nào: bấm "Đo thêm một lần".'); return out.join(' '); }
    const m = gate ? r3(avg(tr)) : r2(avg(tr));
    out.push(`Đã đo ${tr.length} lần: ${tr.map(t => nf(t, dg)).join('; ')} s.`);
    if (tr.length > 1) out.push(gate || Math.max(...tr) === Math.min(...tr) ? 'Các lần đo bằng nhau.' : `Các lần bấm tay lệch nhau tới ${nf(r2(Math.max(...tr) - Math.min(...tr)), 2)} s.`);
    out.push(`t trung bình ≈ ${nf(m, dg)} s → v = ${P.s} cm : ${nf(m, dg)} s ≈ ${Math.round(P.s / m)} cm/s ≈ ${nf(r2(P.s / m / 100), 2)} m/s.`);
    return out.join(' ');
  },
  actions: [
    { label: 'Đo thêm một lần', group: 'measure', run: (_S, P) => ({ patch: { runN: P.runN + 1 } }) },
    { label: 'Xóa bảng', group: 'measure', run: (_S, P) => ({ patch: { clearN: P.clearN + 1 }, msg: 'Đã xóa các lần đo.' }) }
  ],
  // kéo vạch đích dọc tấm gỗ
  drag: {
    hit(S, P, x, y, tol){
      const R = rampOf(S), [fx, fy] = R.at(S.finish, PT);
      return Math.abs(x - fx) < Math.max(tol, 1.5) && y > fy - 3 && y < fy + 14 ? 'finish' : null;
    },
    move(_key, x, _y, S){ const th = Math.asin(S.books * BOOK / BOARD); return { s: (x - RX0) / Math.cos(th) - START }; },
    items: () => ['finish'],
    nudge: (_key, dir, P) => ({ s: P.s + dir })
  },
  chips: [
    { q: 'Vì sao các lần bấm tay khác nhau?', a: 'Mỗi lần bấm tay, em có thể bấm sớm hoặc muộn một chút. Vì vậy cần đo nhiều lần rồi lấy trung bình.' },
    { q: 'Dốc cao hơn thì sao?', a: 'Dốc càng cao, xe lăn xuống càng nhanh: thời gian đi hết quãng đường ngắn hơn nên tốc độ lớn hơn.' }
  ]
};

/* ---------- trạng thái cảnh ---------- */
function base(S){
  Object.assign(S, {
    scene: 'tools', tA0: 1, tA1: 1, tA2: 1, formA: 1,
    books: BOOKS0, finish: FINISH, boardA: 1, linesA: 0, sA: 0, carA: 0, swA: 0, tableA: 0, method: 'tay', free: 0,
    u: 0, t0: 0, t1: 0, swOn: null, swOff: null, cues: [],
    hl: null, hlA: 0, res: null, resA: 0, trials: [], dotsA: 0, pick: null, pickA: 0,
    magOn: true, ballA: 0, axisA: 0, iv: null, ivP: 0, ivA: 0,
    tRoad: 0, roadNote: ''
  });
}
function describe(S){
  const L = [], tc = tcOf(S);
  if (S.scene === 'tools'){
    L.push('Trên bàn: thước đo độ dài, đồng hồ bấm giây (hiện tới 0,01 s), đồng hồ đo thời gian hiện số (hiện tới 0,001 s). Công thức tốc độ: v = s/t.');
    return L;
  }
  if (S.scene === 'ramp'){
    const s = S.finish - START;
    L.push(`Tấm gỗ dài 80 cm kê lên ${n1(S.books)} cuốn sách (đầu cao ${n1(S.books * BOOK)} cm), có thước gắn dọc. Vạch xuất phát cách đầu cao 10 cm, vạch đích cách đầu cao ${S.finish} cm: quãng đường s = ${s} cm.`);
    if (S.carA > 0.5){
      const x = xCar(tc, S.books);
      L.push(tc <= 0 || S.u <= 0 ? 'Ô tô đồ chơi đang đứng ở vạch xuất phát.' : x >= CAR_MAX - 0.01 ? 'Ô tô đã lăn tới cuối tấm gỗ.' : 'Ô tô đang lăn nhanh dần xuống dốc.');
    }
    if (S.swA > 0.5) L.push(S.method === 'cong' ? `Hai cổng quang điện đặt ở vạch xuất phát và vạch đích; đồng hồ đo thời gian hiện số đang chỉ ${nf(r3(swRead(S)), 3)} s.` : `Đồng hồ bấm giây đang chỉ ${nf(r2(swRead(S)), 2)} s.`);
    if (S.hl && S.hlA > 0.5) L.push(`Trên tấm gỗ đang tô màu hai đoạn: đoạn đo bằng thước s = ${s} cm, và ${S.hl.label.toLowerCase()} theo cách bấm đồng hồ học sinh vừa chọn.`);
    if (S.res && S.resA > 0.5) L.push('Phép tính đang hiện: ' + S.res.slice(1).join(', ').replace(/\s+/g, ' ') + '.');
    if (S.trials.length) L.push(`${S.free ? 'Bảng kết quả' : 'Bảng 9.1'} đã ghi ${S.trials.length} lần đo: ${S.trials.map(t => nf(t, S.method === 'cong' ? 3 : 2)).join('; ')} s.`);
    if (S.pick && S.pickA > 0.5) L.push(`Dòng cuối Bảng 9.1 đang dùng: ${S.pick.label.toLowerCase()} ${nf(S.pick.t, 2)} s, nên v = ${s} : ${nf(S.pick.t, 2)} ≈ ${cms(S.pick.t)} cm/s.`);
    if (S.dotsA > 0.5) L.push('Ba lần đo được vẽ thành ba chấm trên một trục thời gian.');
    return L;
  }
  if (S.scene === 'rail'){
    L.push('Máng nghiêng dài 60 cm có thước gắn trên giá đỡ. Nam châm điện ở vạch 0 cm, cổng quang điện (3) ở 10 cm, cổng (4) ở 50 cm: quãng đường giữa hai cổng s = 40 cm. Đồng hồ đo thời gian hiện số ghi thời điểm bi qua mỗi cổng, tính từ lúc ngắt nam châm.');
    L.push(S.magOn ? 'Nam châm điện đang giữ viên bi.' : tc >= T_LEAVE ? 'Đã ngắt nam châm; viên bi đã lăn hết máng.' : 'Đã ngắt nam châm; viên bi đang lăn trên máng.');
    const shown = [tc >= R3 && `cổng (3): ${nf(R3, 3)} s`, tc >= R4 && `cổng (4): ${nf(R4, 3)} s`].filter(Boolean);
    if (shown.length) L.push('Đồng hồ đang hiện ' + shown.join('; ') + '.');
    if (S.iv && S.ivA > 0.5) L.push(`Đang tô màu đoạn máng bi đi được trong khoảng thời gian ${nf(r3(S.iv[1] - S.iv[0]), 3)} s mà học sinh vừa chọn.`);
    if (S.res && S.resA > 0.5) L.push('Phép tính đang hiện: ' + S.res.join(', ') + '.');
    return L;
  }
  L.push(`Mặt đường có hai vạch mốc cách nhau ${GAP} m, biển báo tốc độ tối đa ${LIMIT} km/h. Camera trên cột đo thời gian xe đi giữa hai vạch; máy tính nhỏ tính tốc độ, so với giới hạn.`);
  if (S.tRoad && S.u > 0 && tc >= S.tRoad){
    L.push(`Màn hình máy tính nhỏ hiện: t = ${nf(S.tRoad, 2)} s, v ≈ ${n1(GAP / S.tRoad)} m/s ≈ ${n1(kmh(S.tRoad))} km/h, ${over(S.tRoad) ? 'vượt tốc độ: camera đã chụp ảnh kèm biển số' : 'không vượt tốc độ'}.`);
  } else if (S.tRoad && S.u > 0) L.push('Xe đang chạy tới hai vạch mốc.');
  else L.push('Chưa có xe chạy qua.');
  return L;
}

export default {
  id: 'do-toc-do',
  grade: 'KHTN 7', chapter: 'Chương III Tốc độ', lesson: 'Bài 9',
  title: 'Đo tốc độ', shortTitle: 'Đo tốc độ',
  intro: 'Ba cách đo tốc độ trong SGK: đồng hồ bấm giây với xe đồ chơi trên mặt dốc, cổng quang điện với viên bi, và thiết bị bắn tốc độ trên đường. Giữa chừng có câu hỏi mồi; chọn sai thì thí nghiệm chạy đúng theo lựa chọn của em.',
  canvasLabel: 'Bàn thí nghiệm đo tốc độ: tấm gỗ kê sách với xe đồ chơi và đồng hồ bấm giây, máng nghiêng với cổng quang điện, mặt đường với camera bắn tốc độ',
  readyTitle: 'Dụng cụ đo tốc độ đã sẵn sàng',
  footer: 'Mô phỏng phục vụ dạy học, bám SGK KHTN 7 Kết nối tri thức (Bài 9). Quãng đường, thời gian và tốc độ trên màn hình đều tính bằng công thức; gia tốc của xe và viên bi, độ trễ khi bấm tay là số minh họa. Hoạt ảnh được chiếu chậm, đồng hồ vẫn chỉ thời gian của thí nghiệm.',
  view: { w: 100, h: 50, ox: 0.5, oy: 0.5 },
  startChips: [
    { q: 'Thí nghiệm này để làm gì?', a: 'Để biết cách đo tốc độ: đo quãng đường bằng thước, đo thời gian bằng đồng hồ bấm giây hoặc cổng quang điện, rồi tính v = s/t. Em cũng xem thiết bị bắn tốc độ kiểm tra xe trên đường.' },
    { q: 'Sao không có dụng cụ đo thẳng tốc độ?', a: 'Trong phòng thực hành, mình đo quãng đường bằng thước và thời gian bằng đồng hồ, rồi tính v = s/t. Xe máy, ô tô thì có tốc kế đo trực tiếp.' }
  ],
  base, rest(){},
  draw(_g, _S){
    g = _g; S = _S;
    if (S.scene === 'ramp') drawRamp();
    else if (S.scene === 'rail') drawRail();
    else if (S.scene === 'road') drawRoad();
    else drawTools();
  },
  readout(S){
    const run = S.u > 0 && S.u < 1;
    if (S.scene === 'ramp') return `${n1(S.books)} cuốn sách · s = ${S.finish - START} cm${run ? ` · chiếu chậm ${SLOW} lần` : ''}`;
    if (S.scene === 'rail') return `s = 40 cm giữa hai cổng${run || (S.ivP > 0 && S.ivP < 1) ? ` · chiếu chậm ${SLOW} lần` : ''}`;
    if (S.scene === 'road') return `Hai vạch mốc cách ${GAP} m · giới hạn ${LIMIT} km/h${run ? ` · chiếu chậm ${ROAD_SLOW} lần` : ''}`;
    return '';
  },
  describe, steps, questions, free
};
