// Thí nghiệm: Chứng minh quang hợp tạo ra tinh bột (KHTN 7 – Bài 24, Kết nối tri thức)
// Đặc tả: docs/lessons/sinh-hoc/quang-hop.md (bản nháp, giáo viên đang duyệt).
// Đơn vị cảnh: ô vẽ, không theo tỉ lệ thật. Lượng tinh bột trong lá là số MINH HỌA, từ 0 (không có) tới 1 (nhiều):
//   để trong tối 2 ngày: tinh bột cũ giảm về 0; chiếu sáng t giờ: phần lá được chiếu tăng thêm min(1, t/4).
//   Sau khi nhỏ iodine: có tinh bột → xanh tím; không có → vàng nâu (màu của dung dịch iodine).
//   Lá chưa tẩy diệp lục thì màu xanh lục che gần hết màu thuốc thử.

import { fmt } from '../engine.js';

const LIGHT_H = 5;                                   // giờ chiếu sáng trên mô phỏng (SGK: 4–6 giờ)
const gainOf = hrs => Math.min(1, hrs / 4);          // tinh bột tạo thêm khi chiếu sáng (minh họa)
const DEF = { pre:'dark', strip:true, covered:true, hours:LIGHT_H, solvent:'alcohol', reagent:'iodine' };
const PRE_NAME = { dark:'trong chỗ tối', sun:'ngoài nắng', water:'ở chỗ sáng và tưới thật nhiều nước', none:'' };
const SOLVENT_NAME = { alcohol:'cồn 90°', water:'nước lã', salt:'nước muối', none:'' };
const REAGENT_NAME = { iodine:'dung dịch iodine', lime:'nước vôi trong', alcohol:'cồn 90°', water:'nước cất' };
// bên trái: chỗ đun cách thủy và đĩa petri (hộp thoại AI bung ở bên phải nên không che kết quả); bên phải: chậu cây
const AT = { plant:{ lx:31, ly:3, ls:10 }, bath:{ lx:-20, ly:-7, ls:8 }, dish:{ lx:-20, ly:-3.7, ls:16 } };
const BAND = [0.36, 0.62];                           // phần lá bị bịt giấy đen (theo chiều cao lá)
const BENCH = -13;
const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- sinh học ---------- */
const starch0 = S => S.pre === 'dark' ? 1 - S.preT : 1;                    // tinh bột có sẵn trước khi chiếu sáng
const lit = (S, region) => region === 'open' || !S.strip || !S.covered;     // phần lá này có nhận ánh sáng không
const starch = (S, region) => Math.min(1, starch0(S) + (lit(S, region) ? gainOf(S.hours) * S.lightT : 0));
const chloro = S => S.solvent === 'alcohol' ? 1 - S.boil : 1;              // diệp lục còn lại trong lá
const hoursText = h => h < 1 ? `${Math.round(h * 60)} phút` : `${fmt(h)} giờ`;
// màu của một phần lá, nói bằng lời (cho chú thích và trợ lý AI)
function colorWord(S, region){
  if (S.drop < 0.5) return null;
  if (S.reagent !== 'iodine') return 'không đổi màu';
  if (chloro(S) > 0.5) return 'vẫn xanh lục sẫm, khó nhìn ra màu của iodine';
  const s = starch(S, region);
  return s > 0.5 ? 'xanh tím (có tinh bột)' : s > 0.05 ? 'xanh tím nhạt (ít tinh bột)' : 'vàng nâu, không có màu xanh tím (không có tinh bột)';
}
function shortWord(S, region){
  const w = colorWord(S, region); if (!w) return '';
  return w.startsWith('xanh tím nhạt') ? 'xanh tím nhạt' : w.startsWith('xanh tím') ? 'xanh tím' : w.startsWith('vàng nâu') ? 'vàng nâu' : w.startsWith('vẫn xanh lục') ? 'xanh lục sẫm' : w;
}

/* ---------- vẽ ---------- */
let g, S;
const rgbCache = {};
const rgb = c => {
  if (Array.isArray(c)) return c;
  if (!rgbCache[c]){ const h = c.replace('#', ''); const f = h.length === 3 ? h.split('').map(x => x + x).join('') : h; rgbCache[c] = [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); }
  return rgbCache[c];
};
const mix = (a, b, t) => { a = rgb(a); b = rgb(b); t = Math.max(0, Math.min(1, t)); return a.map((v, i) => v + (b[i] - v) * t); };
const css = (a, alpha = 1) => `rgba(${a.map(Math.round).join(',')},${alpha})`;
function leafColor(region){
  const C = g.C, c = chloro(S);
  let col = mix(C['leaf-pale'], C.leaf, c);
  if (S.drop <= 0) return col;
  const see = 1 - 0.8 * c;   // màu xanh lục che màu thuốc thử
  if (S.reagent === 'iodine'){
    const s = starch(S, region);
    col = mix(col, C.iodine, 0.6 * S.drop * (1 - s) * see);
    col = mix(col, C.starch, 0.92 * S.drop * s * see);
  }
  return col;
}
// chữ thu nhỏ cho vừa chỗ (màn hình điện thoại hẹp)
function fitText(t, x, y, maxW, opts){
  let size = opts.size;
  g.ctx.font = g.font(size, opts.weight || 500);
  const w = g.ctx.measureText(t).width;
  if (w > maxW) size = Math.max(8, Math.floor(size * maxW / w));
  g.text(t, x, y, { ...opts, size });
}
// lá khoai lang hình tim: gốc cuống ở (cx, cy), cao s đơn vị; tọa độ trong lá: x −0,6…0,6, y −0,35 (cuống)…1 (chóp lá)
function leafPath(cx, cy, s){
  const { ctx, X, Y } = g, P = (x, y) => [X(cx + x * s), Y(cy + y * s)];
  ctx.beginPath(); ctx.moveTo(...P(0, 0.08));
  ctx.bezierCurveTo(...P(-0.15, -0.14), ...P(-0.62, -0.12), ...P(-0.6, 0.32));
  ctx.bezierCurveTo(...P(-0.58, 0.66), ...P(-0.22, 0.84), ...P(0, 1));
  ctx.bezierCurveTo(...P(0.22, 0.84), ...P(0.58, 0.66), ...P(0.6, 0.32));
  ctx.bezierCurveTo(...P(0.62, -0.12), ...P(0.15, -0.14), ...P(0, 0.08));
  ctx.closePath();
}
function drawLeaf(cx, cy, s, colOpen, colBand, coverA){
  const { ctx, X, Y, C, sc } = g, P = (x, y) => [X(cx + x * s), Y(cy + y * s)];
  const vein = css(mix(colOpen, C.stage, 0.35), 0.55);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = css(mix(colOpen, C.stage, 0.2)); ctx.lineWidth = Math.max(1.5, s * sc * 0.035);
  ctx.beginPath(); ctx.moveTo(...P(0, 0.08)); ctx.lineTo(...P(0, -0.35)); ctx.stroke();
  leafPath(cx, cy, s); ctx.fillStyle = css(colOpen); ctx.fill();
  ctx.save(); ctx.clip();
  if (colBand){ ctx.fillStyle = css(colBand); ctx.fillRect(X(cx - 0.8 * s), Y(cy + BAND[1] * s), 1.6 * s * sc, (BAND[1] - BAND[0]) * s * sc); }
  ctx.strokeStyle = vein; ctx.lineWidth = Math.max(1, s * sc * 0.014);
  ctx.beginPath(); ctx.moveTo(...P(0, 0.08)); ctx.lineTo(...P(0, 0.95));
  for (const y of [0.24, 0.44, 0.64]){ ctx.moveTo(...P(0, y)); ctx.lineTo(...P(-0.42, y + 0.16)); ctx.moveTo(...P(0, y)); ctx.lineTo(...P(0.42, y + 0.16)); }
  ctx.moveTo(...P(0, 0.08)); ctx.lineTo(...P(-0.45, 0.04)); ctx.moveTo(...P(0, 0.08)); ctx.lineTo(...P(0.45, 0.04));
  ctx.stroke(); ctx.restore();
  leafPath(cx, cy, s); ctx.strokeStyle = css(mix(colOpen, C.stage, 0.45)); ctx.lineWidth = 1.4; ctx.stroke();
  if (coverA > 0.01){
    ctx.globalAlpha = coverA; ctx.fillStyle = C.paper; ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.2;
    ctx.fillRect(X(cx - 0.72 * s), Y(cy + BAND[1] * s), 1.44 * s * sc, (BAND[1] - BAND[0]) * s * sc);
    ctx.strokeRect(X(cx - 0.72 * s), Y(cy + BAND[1] * s), 1.44 * s * sc, (BAND[1] - BAND[0]) * s * sc);
  }
  ctx.restore();
}
const OTHER_LEAVES = [[15, 1, 7], [19.5, 7.5, 6], [25.5, -4.5, 5], [13, -6, 5]];
function drawPlant(){
  const { ctx, X, Y, C, sc } = g;
  ctx.save(); ctx.lineCap = 'round';
  // thân bò từ gốc tới cuống từng lá
  ctx.strokeStyle = css(mix(C.leaf, C.stage, 0.25)); ctx.lineWidth = Math.max(2, sc * 0.35);
  const stems = OTHER_LEAVES.map(([x, y, s]) => [x, y - 0.35 * s]);
  if (S.attached) stems.push([AT.plant.lx, AT.plant.ly - 0.35 * AT.plant.ls]);
  for (const [x, y] of stems){ ctx.beginPath(); ctx.moveTo(X(22), Y(-9)); ctx.quadraticCurveTo(X(22), Y((y - 9) / 2), X(x), Y(y)); ctx.stroke(); }
  for (const [x, y, s] of OTHER_LEAVES) drawLeaf(x, y, s, rgb(C.leaf), null, 0);
  // chậu, đất
  ctx.fillStyle = C.pot; ctx.beginPath();
  ctx.moveTo(X(16), Y(-9)); ctx.lineTo(X(28), Y(-9)); ctx.lineTo(X(26.5), Y(BENCH)); ctx.lineTo(X(17.5), Y(BENCH)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.soil; ctx.beginPath(); ctx.ellipse(X(22), Y(-9), 6 * sc, 0.6 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  g.text('Chậu cây khoai lang', X(22), Y(-15), { color: C['stage-muted'], size: g.fs() });
}
// chỗ tối (tủ kín) và ánh nắng phủ lên chậu cây
function drawEnv(){
  const { ctx, X, Y, C, sc } = g;
  if (S.darkA > 0.01){
    ctx.save(); ctx.globalAlpha = S.darkA * 0.82; ctx.fillStyle = C.stage;
    g.rr(X(6), Y(15), 33 * sc, 28 * sc, 10); ctx.fill();
    ctx.globalAlpha = S.darkA; ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = S.darkA; g.text('Chỗ tối', X(22.5), Y(13.4), { color: C['stage-muted'], weight: 700, size: g.fs() + 1 }); ctx.restore();
  }
  if (S.sunA > 0.01){
    const now = REDUCE ? 0 : performance.now() / 1000, cx = 9, cy = 16;
    ctx.save(); ctx.globalAlpha = S.sunA; ctx.fillStyle = C.beam; ctx.shadowColor = C.beam; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(X(cx), Y(cy), 2 * sc, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = C.beam; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4 + now * 0.3; ctx.beginPath(); ctx.moveTo(X(cx + Math.cos(a) * 2.8), Y(cy + Math.sin(a) * 2.8)); ctx.lineTo(X(cx + Math.cos(a) * 3.8), Y(cy + Math.sin(a) * 3.8)); ctx.stroke(); }
    // tia nắng chiếu xuống chậu cây
    ctx.globalAlpha = S.sunA * 0.35; ctx.setLineDash([3, 7]); ctx.lineDashOffset = -now * 20;
    for (const [x, y] of [[15, 4], [23, 8], [31, 8], [27, 0]]){ ctx.beginPath(); ctx.moveTo(X(cx + 2), Y(cy - 2)); ctx.lineTo(X(x), Y(y)); ctx.stroke(); }
    ctx.restore();
  }
}
function drawDish(){
  if (S.dishA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g;
  ctx.save(); ctx.globalAlpha = S.dishA;
  ctx.fillStyle = C['stage-2']; ctx.strokeStyle = C.glass; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(X(-20), Y(1.5), 13 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = S.dishA * 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X(-20), Y(1.5), 12.2 * sc, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function bathLiquid(){
  const C = g.C;
  return S.solvent === 'alcohol' ? mix(C.gas, C.leaf, 0.75 * S.boil) : rgb(C.liquid);
}
function drawBathBack(){
  if (S.bathA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g;
  ctx.save(); ctx.globalAlpha = S.bathA;
  // đèn cồn dưới nồi
  ctx.fillStyle = C['stage-muted']; ctx.fillRect(X(-22.5), Y(-12.2), 5 * sc, 0.8 * sc);
  ctx.fillStyle = C.warm; ctx.beginPath(); ctx.moveTo(X(-20.8), Y(-12.2)); ctx.quadraticCurveTo(X(-20), Y(-10.6), X(-20), Y(-11)); ctx.quadraticCurveTo(X(-20), Y(-10.6), X(-19.2), Y(-12.2)); ctx.closePath(); ctx.fill();
  // nồi nước nóng
  ctx.fillStyle = C.liquid; ctx.globalAlpha = S.bathA * 0.22; ctx.fillRect(X(-32), Y(-3), 24 * sc, 8 * sc); ctx.globalAlpha = S.bathA;
  ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 2.4; ctx.beginPath();
  ctx.moveTo(X(-32), Y(-1)); ctx.lineTo(X(-32), Y(-11)); ctx.lineTo(X(-8), Y(-11)); ctx.lineTo(X(-8), Y(-1)); ctx.stroke();
  ctx.restore();
}
function drawBathFront(){
  if (S.bathA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g;
  ctx.save(); ctx.globalAlpha = S.bathA;
  ctx.fillStyle = css(bathLiquid(), 0.35); ctx.fillRect(X(-26), Y(1.5), 12 * sc, 11.5 * sc);
  ctx.strokeStyle = C.glass; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(X(-26), Y(3)); ctx.lineTo(X(-26), Y(-10)); ctx.lineTo(X(-14), Y(-10)); ctx.lineTo(X(-14), Y(3)); ctx.stroke();
  fitText(`${SOLVENT_NAME[S.solvent]} · đun cách thủy`.replace(/^./, c => c.toUpperCase()), X(-20), Y(5), 24 * sc, { size: g.fs() + 1, weight: 700, color: C.glass });
  ctx.restore();
}
const DROP_AT = [[0, 0.82], [-0.25, 0.5], [0.25, 0.5], [0, 0.25], [0, 0.55]];
function reagentColor(){ const C = g.C; return { iodine: C.iodine, lime: C.gas, alcohol: C.gas, water: C.liquid }[S.reagent]; }
function drawDropper(){
  if (S.dropperA <= 0.01) return;
  const { ctx, X, Y, C, sc } = g, col = reagentColor(), tip = [-13, 14];
  ctx.save(); ctx.globalAlpha = S.dropperA;
  ctx.fillStyle = C.obj; ctx.beginPath(); ctx.ellipse(X(-13), Y(18.3), 1.1 * sc, 1.4 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.globalAlpha = S.dropperA * 0.7; ctx.fillRect(X(-13.4), Y(16.6), 0.8 * sc, 2.4 * sc); ctx.globalAlpha = S.dropperA;
  ctx.strokeStyle = C.glass; ctx.lineWidth = 1.4; ctx.strokeRect(X(-13.4), Y(16.9), 0.8 * sc, 2.9 * sc);
  fitText(REAGENT_NAME[S.reagent].replace(/^./, c => c.toUpperCase()), X(-11.4), Y(17.6), 16 * sc, { size: g.fs(), weight: 700, color: col, align: 'left' });
  // các giọt rơi lần lượt xuống lá
  ctx.fillStyle = col;
  DROP_AT.forEach(([lx, ly], i) => {
    const p = Math.max(0, Math.min(1, S.drop * DROP_AT.length - i)); if (p <= 0 || p >= 1) return;
    const tx = S.lx + lx * S.ls, ty = S.ly + ly * S.ls;
    ctx.beginPath(); ctx.arc(X(tip[0] + (tx - tip[0]) * p), Y(tip[1] + (ty - tip[1]) * p), 0.4 * sc, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}
// chú thích hai phần lá khi lá nằm trên đĩa
function drawLabels(){
  if (S.attached || S.dishA < 0.5 || S.bathA > 0.05 || !S.strip) return;
  const { ctx, X, Y, C, sc } = g, maxW = 10.5 * sc, small = g.fs();
  ctx.save(); ctx.globalAlpha = Math.min(1, (S.dishA - 0.5) * 2);
  const rows = [['band', 'Phần bịt giấy đen', S.ly + 0.49 * S.ls, S.lx + 0.56 * S.ls], ['open', 'Phần không bịt', S.ly + 0.18 * S.ls, S.lx + 0.58 * S.ls]];
  for (const [region, name, y, edge] of rows){
    ctx.strokeStyle = C['stage-muted']; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(-5.6), Y(y)); ctx.lineTo(X(edge), Y(y)); ctx.stroke();
    fitText(name, X(-5), Y(y) - small * 0.6, maxW, { size: small, weight: 700, align: 'left' });
    const w = shortWord(S, region);
    if (w) fitText(w.replace(/^./, c => c.toUpperCase()), X(-5), Y(y) + small * 0.75, maxW, { size: small, weight: 700, align: 'left', color: w.startsWith('xanh tím') ? C['spec-6'] : C['stage-muted'] });
  }
  ctx.restore();
}
function drawBench(){
  const { ctx, X, Y, C } = g;
  ctx.save(); ctx.strokeStyle = C['stage-line']; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X(-39), Y(BENCH)); ctx.lineTo(X(39), Y(BENCH)); ctx.stroke(); ctx.restore();
}

/* ---------- các giai đoạn thí nghiệm (k: hệ số thời gian, nhỏ hơn 1 = tua nhanh) ---------- */
async function phPre(h, k){
  const S = h.S;
  if (S.pre === 'none'){ S.preT = 1; return; }
  await h.tw(S.pre === 'dark' ? { darkA:1 } : { sunA:1 }, 500 * k);
  await h.tw({ preT:1 }, 2600 * k);
  await h.tw({ darkA:0, sunA:0 }, 500 * k);
}
async function phCover(h, k){ if (h.S.strip) await h.tw({ cover:1 }, 800 * k); }
async function phLight(h, k){
  const S = h.S;
  if (!S.covered && S.cover > 0) await h.tw({ cover:0 }, 500 * k);
  await h.tw(S.hours > 0 ? { sunA:1 } : { darkA:1 }, 400 * k);
  await h.tw({ lightT:1 }, 2600 * k);
  await h.tw({ sunA:0, darkA:0 }, 400 * k);
}
async function phPick(h, k){
  const S = h.S;
  S.attached = 0;
  if (S.cover > 0) await h.tw({ cover:0 }, 500 * k);
  await h.tw({ ...AT.dish, dishA:1 }, 1200 * k);
}
async function phBoil(h, k){
  const S = h.S;
  if (S.solvent === 'none'){ S.boil = 1; return; }
  await h.tw({ ...AT.bath, bathA:1, dishA:0 }, 1000 * k);
  await h.tw({ boil:1 }, 2400 * k);
  S.rinse = 1; await h.tw({ ...AT.dish, bathA:0, dishA:1 }, 1000 * k);
  await h.wait(600 * k); S.rinse = 0;
}
async function phDrop(h, k){
  await h.tw({ dropperA:1 }, 400 * k);
  await h.tw({ drop:1 }, 1800 * k);
  await h.tw({ dropperA:0 }, 400 * k);
}
const CHAIN = [phPre, phCover, phLight, phPick, phBoil, phDrop];
// tua nhanh phần còn lại của thí nghiệm (các bước sau làm đúng) để thấy hậu quả của lựa chọn
async function finish(h, from){ h.S.ff = 1; for (let i = from; i < CHAIN.length; i++) await CHAIN[i](h, 0.35); }
// trạng thái cảnh sau khi xong p giai đoạn đầu của CHAIN
function stateAfter(p, cfg = DEF){
  const s = { ...DEF, ...cfg, preT:0, cover:0, lightT:0, attached:1, ...AT.plant, dishA:0, bathA:0, boil:0, rinse:0, drop:0, dropperA:0, darkA:0, sunA:0, ff:0 };
  if (p >= 1) s.preT = 1;
  if (p >= 2 && s.strip) s.cover = 1;
  if (p >= 3){ s.lightT = 1; if (!s.covered) s.cover = 0; }
  if (p >= 4) Object.assign(s, { attached:0, cover:0, dishA:1, ...AT.dish });
  if (p >= 5) s.boil = 1;
  if (p >= 6) s.drop = 1;
  return s;
}
const DONE_AT = [0, 1, 3, 5, 6];   // số giai đoạn đã xong khi bắt đầu mỗi bước SGK

/* ---------- câu hỏi mồi ---------- */
const REF24 = 'SGK KHTN 7 · Bài 24 Thực hành: Chứng minh quang hợp ở cây xanh';
const questions = [
  { id:'q1', short:'Để cây ở đâu 2 ngày trước thí nghiệm?', tag:'Chuẩn bị cây',
    text:'Trước khi bịt lá, cần để chậu cây khoai lang ở đâu trong 2 ngày?',
    opts:['Ngoài nắng','Trong chỗ tối','Ở chỗ sáng, tưới thật nhiều nước','Không cần, làm thí nghiệm ngay'], answer:1,
    cfg:['sun', 'dark', 'water', 'none'],
    async sim(h, c){
      h.S.pre = this.cfg[c];
      if (c === this.answer){ await phPre(h, 1); return; }
      await phPre(h, 0.6); await finish(h, 1);
    },
    async reset(h){ Object.assign(h.S, stateAfter(0)); await h.wait(200); },
    wrong:[
      'Để ngoài nắng thì lá đã có sẵn tinh bột từ trước. Nhìn kết quả: cả phần bịt giấy đen cũng xanh tím, nên không biết tinh bột nào mới được tạo ra.',
      null,
      'Tưới nước không làm mất tinh bột có sẵn trong lá. Kết quả: cả lá đều xanh tím, kể cả phần bịt giấy đen.',
      'Lá đang có sẵn tinh bột tạo ra từ những ngày trước, nên cả lá đều xanh tím. Cần làm gì để lá dùng hết tinh bột cũ?'
    ],
    hint2:'Gợi ý: khi không có ánh sáng, lá có tạo thêm tinh bột được không? Tinh bột cũ trong lá sẽ được dùng dần đi.',
    right:'Để cây trong tối 2 ngày thì lá không tạo thêm tinh bột, tinh bột có sẵn được chuyển đi và dùng hết. Nhờ vậy, tinh bột tìm thấy sau thí nghiệm chắc chắn là do lá mới tạo ra.',
    ref: REF24 },
  { id:'q2', short:'Bịt lá xong, đưa cây đi đâu?', tag:'Ánh sáng',
    text:'Một phần lá đã được bịt kín hai mặt bằng băng giấy đen. Tiếp theo, em làm gì với chậu cây?',
    opts:['Để tiếp trong chỗ tối 4–6 giờ','Đem ra chỗ nắng 5 phút','Bỏ băng giấy đen, rồi đem ra chỗ nắng 4–6 giờ','Giữ băng giấy đen, đem ra chỗ nắng 4–6 giờ'], answer:3,
    cfg:[{ hours:0 }, { hours:5 / 60 }, { hours:LIGHT_H, covered:false }, { hours:LIGHT_H }],
    async sim(h, c){
      Object.assign(h.S, this.cfg[c]);
      await phLight(h, 1);
      if (c !== this.answer) await finish(h, 3);
    },
    async reset(h){ Object.assign(h.S, stateAfter(2)); await h.wait(200); },
    wrong:[
      'Không có ánh sáng thì lá không quang hợp, cả lá không có tinh bột. Hai phần lá giống nhau nên không so sánh được.',
      '5 phút quá ngắn, lá chưa kịp tạo ra đủ tinh bột nên gần như không thấy màu xanh tím.',
      'Bỏ băng giấy đen thì cả lá đều được chiếu sáng, cả lá đều xanh tím. Không còn phần nào để so sánh.',
      null
    ],
    hint2:'Gợi ý: muốn biết lá có cần ánh sáng không, em cần một phần lá có ánh sáng và một phần lá không có ánh sáng, trên cùng một chiếc lá.',
    right:'Phần lá không bịt nhận được ánh sáng, phần bịt giấy đen thì không. Hai phần cùng một chiếc lá, chỉ khác nhau ở ánh sáng, nên so sánh được.',
    ref: REF24 },
  { id:'q3', short:'Đun lá trong chất gì để tẩy màu xanh?', tag:'Tẩy diệp lục',
    text:'Lá đang có màu xanh lục của chất diệp lục. Trước khi thử tinh bột, em đun cách thủy lá trong chất nào?',
    opts:['Nước lã','Nước muối','Cồn 90°','Không cần đun, nhỏ thuốc thử luôn'], answer:2,
    cfg:['water', 'salt', 'alcohol', 'none'],
    async sim(h, c){
      h.S.solvent = this.cfg[c];
      await phBoil(h, 1);
      if (c !== this.answer) await finish(h, 5);
    },
    async reset(h){ Object.assign(h.S, stateAfter(4)); await h.wait(200); },
    wrong:[
      'Đun trong nước, lá vẫn còn xanh lục vì chất diệp lục không tan trong nước. Màu xanh lục che mất màu của thuốc thử, khó phân biệt hai phần lá.',
      'Nước muối cũng không hòa tan được chất diệp lục, lá vẫn xanh lục. Sau khi nhỏ thuốc thử, rất khó nhìn ra màu.',
      null,
      'Lá còn nguyên màu xanh lục nên sau khi nhỏ thuốc thử, hai phần lá gần như cùng một màu sẫm.'
    ],
    hint2:'Gợi ý: cần một chất hòa tan được chất diệp lục. Chất đó dễ cháy nên phải đun cách thủy, không đun trực tiếp trên lửa.',
    right:'Cồn 90° hòa tan chất diệp lục: lá bạc màu, cồn chuyển sang màu xanh lục. Cồn dễ cháy nên phải đun cách thủy. Sau đó rửa lá trong nước ấm.',
    ref: REF24 },
  { id:'q4', short:'Thuốc thử nào nhận biết tinh bột?', tag:'Thử tinh bột',
    text:'Nhỏ vài giọt chất nào lên lá để biết chỗ nào có tinh bột?',
    opts:['Dung dịch iodine','Nước vôi trong','Cồn 90°','Nước cất'], answer:0,
    cfg:['iodine', 'lime', 'alcohol', 'water'],
    async sim(h, c){ h.S.reagent = this.cfg[c]; await phDrop(h, 1); },
    async reset(h){ Object.assign(h.S, stateAfter(5)); await h.wait(200); },
    wrong:[
      null,
      'Nước vôi trong dùng để nhận biết khí carbon dioxide, không làm tinh bột đổi màu. Lá không đổi màu.',
      'Cồn đã dùng để tẩy diệp lục, không làm tinh bột đổi màu. Lá vẫn bạc màu như cũ.',
      'Nước cất không làm lá đổi màu, nên không biết được chỗ nào có tinh bột.'
    ],
    hint2:'Gợi ý: có một dung dịch màu vàng nâu, gặp tinh bột thì chuyển sang màu xanh tím.',
    right:'Dung dịch iodine làm tinh bột chuyển màu xanh tím. Phần lá không bịt có màu xanh tím: có tinh bột. Phần bịt giấy đen không có màu xanh tím: không có tinh bột.',
    ref: REF24 }
];

/* ---------- các bước ---------- */
const CONCLUSION = `<div class="concl-wrap"><table class="concl"><thead><tr><th>Phần lá</th><th>Ánh sáng</th><th>Nhỏ iodine</th><th>Tinh bột</th></tr></thead><tbody>
<tr><th>Không bịt</th><td>Có</td><td>Xanh tím</td><td>Có</td></tr>
<tr><th>Bịt giấy đen</th><td>Không</td><td>Không có màu xanh tím</td><td>Không</td></tr></tbody></table>
<p>Lá cây chỉ tạo ra tinh bột khi được chiếu sáng.</p></div>`;

const steps = [
  { title:'Chuẩn bị cây', q:true,
    sgk:'Chuẩn bị một chậu cây khoai lang. Trước khi thí nghiệm, cần đặt chậu cây ở một nơi trong 2 ngày để lá không còn tinh bột cũ.',
    note:'Để cây trong chỗ tối 2 ngày: lá không quang hợp được, tinh bột có sẵn trong lá được chuyển đi và dùng hết.',
    chips:[
      { q:'Vì sao chọn cây khoai lang?', a:'Lá khoai lang to, mỏng, dễ trồng trong chậu và dễ kiếm ở mọi nơi. Lá to giúp dễ bịt giấy và dễ quan sát màu.' },
      { q:'Quang hợp là gì?', a:'Quang hợp là quá trình lá cây dùng nước, khí carbon dioxide và năng lượng ánh sáng để tạo ra chất hữu cơ (như tinh bột) và thải ra khí oxygen.' } ],
    setup(S){ Object.assign(S, stateAfter(DONE_AT[0])); },
    async run(h){ await h.wait(400); await h.ask('q1'); } },
  { title:'Bịt lá, chiếu sáng', q:true,
    sgk:'Dùng băng giấy đen bịt kín một phần lá ở cả hai mặt. Sau đó đặt chậu cây ở một nơi trong 4–6 giờ.',
    note:'Đem cây ra chỗ có nắng (hoặc chiếu đèn) 4–6 giờ. Phần lá không bịt nhận được ánh sáng; phần bịt giấy đen không nhận được ánh sáng.',
    chips:[
      { q:'Vì sao phải bịt cả hai mặt lá?', a:'Ánh sáng có thể chiếu vào lá từ cả hai mặt. Bịt kín hai mặt thì phần lá đó hoàn toàn không nhận được ánh sáng.' },
      { q:'Không có nắng thì làm thế nào?', a:'Có thể chiếu sáng bằng bóng đèn điện thay cho ánh nắng.' } ],
    setup(S){ Object.assign(S, stateAfter(DONE_AT[1])); },
    async run(h){ await phCover(h, 1); await h.wait(300); await h.ask('q2'); } },
  { title:'Tẩy màu lá', q:true,
    sgk:'Ngắt chiếc lá thí nghiệm, bỏ băng giấy đen. Cho lá vào một chất lỏng, đun cách thủy để tẩy hết màu xanh của chất diệp lục. Rửa sạch lá trong cốc nước ấm.',
    note:'Cồn 90° hòa tan chất diệp lục: lá bạc màu, cồn chuyển xanh lục. Lá bạc màu giúp nhìn rõ màu của thuốc thử ở bước sau.',
    chips:[
      { q:'Đun cách thủy là gì?', a:'Là đặt cốc cồn vào trong một nồi nước rồi đun nồi nước, không đặt cốc cồn trực tiếp lên lửa. Cồn dễ cháy nên phải đun cách thủy cho an toàn.' },
      { q:'Vì sao cồn chuyển màu xanh?', a:'Chất diệp lục màu xanh lục tan vào cồn, nên lá bạc màu còn cồn thì chuyển sang màu xanh lục.' } ],
    setup(S){ Object.assign(S, stateAfter(DONE_AT[2])); },
    async run(h){ await phPick(h, 1); await h.wait(300); await h.ask('q3'); } },
  { title:'Thử tinh bột', q:true,
    sgk:'Cho lá vào đĩa petri, nhỏ vài giọt thuốc thử tinh bột lên lá. Quan sát màu của phần lá bịt giấy đen và phần lá không bịt.',
    note:'Phần lá không bịt có màu xanh tím: có tinh bột. Phần bịt giấy đen không có màu xanh tím: không có tinh bột.',
    chips:[
      { q:'Vì sao phần bịt không có tinh bột?', a:'Phần bịt giấy đen không nhận được ánh sáng nên không quang hợp, không tạo ra tinh bột. Tinh bột cũ thì đã hết từ khi để cây trong tối 2 ngày.' },
      { q:'Iodine gặp tinh bột thì sao?', a:'Dung dịch iodine màu vàng nâu, gặp tinh bột thì chuyển sang màu xanh tím. Vì vậy iodine dùng để nhận biết tinh bột.' } ],
    setup(S){ Object.assign(S, stateAfter(DONE_AT[3])); },
    async run(h){ await h.wait(400); await h.ask('q4'); } },
  { title:'Kết luận',
    sgk:'So sánh màu hai phần lá, rút ra kết luận về vai trò của ánh sáng.',
    note:'Lá cây chỉ tạo ra tinh bột khi được chiếu sáng.',
    html: CONCLUSION,
    chips:[
      { q:'Tóm tắt giúp em bài này', a:'Để cây trong tối 2 ngày cho hết tinh bột cũ, bịt một phần lá bằng giấy đen rồi chiếu sáng. Tẩy diệp lục bằng cồn, nhỏ iodine: chỉ phần lá được chiếu sáng có màu xanh tím. Vậy lá chỉ tạo tinh bột khi có ánh sáng.' },
      { q:'Vì sao trồng cây cần đủ ánh sáng?', a:'Cây cần ánh sáng để quang hợp, tạo ra chất hữu cơ nuôi cây. Thiếu ánh sáng thì cây tạo ít chất hữu cơ, phát triển kém.' } ],
    setup(S){ Object.assign(S, stateAfter(DONE_AT[4])); },
    async run(h){ await h.wait(200); } }
];

/* ---------- chế độ tự do: thí nghiệm rẽ nhánh, em tự chọn cách làm ở từng bước ----------
   Mỗi bước là một thông số kiểu choice, lúc đầu chưa chọn (null). Chọn xong bước nào thì thí nghiệm chạy tới hết bước đó
   và mở bước tiếp theo. Đổi lựa chọn ở bước trước thì chạy lại (tua nhanh) từ bước đó với các lựa chọn đang có. */
const LEAF_ICON = '<svg viewBox="0 0 24 24"><path d="M12 20V9M12 9C9 4 4 6 4 11c0 4 4 7 8 9 4-2 8-5 8-9 0-5-5-7-8-2z" fill="var(--leaf)" fill-opacity=".5" stroke="var(--leaf)" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const DISH_ICON = '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="none" stroke="var(--glass)" stroke-width="1.6"/><circle cx="12" cy="13" r="4" fill="var(--starch)"/><path d="M17 2v5" stroke="var(--iodine)" stroke-width="2" stroke-linecap="round"/></svg>';
// to: số giai đoạn của CHAIN đã xong sau bước này
const STAGES = [
  { key:'pre', title:'Bước 1 · Để cây 2 ngày ở đâu?', label:'Trước thí nghiệm, để chậu cây 2 ngày ở', icon:LEAF_ICON, to:1, phases:[phPre],
    options:[{ value:'dark', label:'Chỗ tối' }, { value:'sun', label:'Ngoài nắng' }, { value:'none', label:'Không chuẩn bị, làm ngay', short:'Làm ngay' }] },
  { key:'strip', title:'Bước 2 · Bịt lá', label:'Bịt lá thí nghiệm', icon:LEAF_ICON, to:2, phases:[phCover],
    options:[{ value:'cover', label:'Bịt kín hai mặt một phần lá bằng băng giấy đen', short:'Bịt giấy đen' }, { value:'none', label:'Không bịt lá', short:'Không bịt' }] },
  { key:'light', title:'Bước 3 · Chiếu sáng', label:'Sau khi bịt lá, đặt chậu cây', icon:LEAF_ICON, to:3, phases:[phLight],
    options:[{ value:'long', label:'Ra chỗ nắng 4–6 giờ', short:'Nắng 4–6 giờ' }, { value:'short', label:'Ra chỗ nắng 5 phút', short:'Nắng 5 phút' }, { value:'dark', label:'Để tiếp trong chỗ tối', short:'Trong tối' }] },
  { key:'solvent', title:'Bước 4 · Ngắt lá, tẩy màu', label:'Ngắt lá, bỏ băng giấy, rồi đun cách thủy lá trong', icon:DISH_ICON, to:5, phases:[phPick, phBoil],
    options:[{ value:'alcohol', label:'Cồn 90°' }, { value:'water', label:'Nước lã' }, { value:'none', label:'Không tẩy màu', short:'Không tẩy' }] },
  { key:'reagent', title:'Bước 5 · Nhỏ thuốc thử', label:'Nhỏ lên lá vài giọt', icon:DISH_ICON, to:6, phases:[phDrop],
    options:[{ value:'iodine', label:'Dung dịch iodine', short:'Iodine' }, { value:'lime', label:'Nước vôi trong', short:'Nước vôi' }, { value:'water', label:'Nước cất' }] }
];
const LIGHT_OF = { long: LIGHT_H, short: 5 / 60, dark: 0 };
const chosen = P => { let n = 0; while (n < STAGES.length && P[STAGES[n].key] != null) n++; return n; };
const cfgOf = P => ({ pre: P.pre || 'dark', strip: P.strip !== 'none', covered: P.strip !== 'none', hours: P.light ? LIGHT_OF[P.light] : LIGHT_H, solvent: P.solvent || 'alcohol', reagent: P.reagent || 'iodine' });
const optOf = (st, v) => st.options.find(o => o.value === v) || {};
// điều xảy ra ở từng bước, theo lựa chọn
const STAGE_TEXT = {
  pre: { dark:'Cây ở chỗ tối 2 ngày: lá không quang hợp, tinh bột cũ trong lá được chuyển đi và dùng hết.',
         sun:'Cây ở ngoài nắng 2 ngày: lá vẫn quang hợp, trong lá còn nhiều tinh bột.',
         none:'Cây không được chuẩn bị: trong lá còn tinh bột tạo ra từ những ngày trước.' },
  strip: { cover:'Một phần lá được bịt kín hai mặt bằng băng giấy đen; phần đó sẽ không nhận được ánh sáng.',
           none:'Lá không được bịt: cả lá sẽ nhận ánh sáng như nhau, không có phần nào để so sánh.' },
  light: { long: P => (P.strip === 'cover' ? 'Cây được chiếu nắng 4–6 giờ: phần lá không bịt quang hợp, tạo ra tinh bột; phần bịt giấy đen thì không.' : 'Cây được chiếu nắng 4–6 giờ: cả lá quang hợp, tạo ra tinh bột.') + ' Mắt thường chưa thấy tinh bột, phải thử ở bước 5.',
           short:'Cây chỉ được chiếu nắng 5 phút: quá ngắn, lá tạo ra rất ít tinh bột.',
           dark:'Cây vẫn ở trong tối: lá không quang hợp, không tạo thêm tinh bột.' },
  solvent: { alcohol:'Lá được đun cách thủy trong cồn 90°: lá bạc màu, cồn chuyển xanh lục.',
             water:'Lá được đun cách thủy trong nước lã: lá vẫn xanh lục vì chất diệp lục không tan trong nước.',
             none:'Lá không được tẩy màu, vẫn còn xanh lục.' }
};
function resultText(P){
  const T = stateAfter(6, cfgOf(P)), out = [`Phần lá không bịt: ${colorWord(T, 'open')}.`];
  if (P.strip === 'cover') out.push(`Phần bịt giấy đen: ${colorWord(T, 'band')}.`);
  if (P.reagent !== 'iodine') out.push(`${optOf(STAGES[4], P.reagent).label} không làm tinh bột đổi màu, nên không biết được lá có tinh bột hay không.`);
  else if (P.solvent !== 'alcohol') out.push('Màu xanh lục của lá che màu của iodine, rất khó kết luận.');
  else if (P.pre === 'dark' && P.strip === 'cover' && P.light === 'long') out.push('Đây là cách làm theo SGK: chỉ phần lá được chiếu sáng mới có tinh bột. Vậy lá chỉ tạo ra tinh bột khi có ánh sáng.');
  else if (P.pre !== 'dark') out.push('Cả lá đều còn tinh bột cũ, nên không biết tinh bột nào do ánh sáng tạo ra.');
  else if (P.light === 'dark') out.push('Cả lá không có tinh bột vì cây không được chiếu sáng.');
  else if (P.light === 'short') out.push('Chiếu sáng quá ngắn nên gần như chưa thấy tinh bột.');
  else out.push('Không có phần lá nào được che, nên không so sánh được lá có và không có ánh sáng.');
  return out.join(' ');
}
const free = {
  title: 'Em tự làm từng bước',
  hint: 'Chọn cách làm ở bước 1, thí nghiệm chạy tới đó rồi mở bước tiếp theo. Mỗi hướng đi cho một kết quả khác. Đổi lựa chọn ở bước trước thì thí nghiệm chạy lại theo hướng mới.',
  groups: STAGES.map(st => ({ id: st.key, title: st.title, open: true, icon: st.icon,
    summary: P => P[st.key] != null ? (optOf(st, P[st.key]).short || optOf(st, P[st.key]).label) : 'Chưa chọn' })),
  params: STAGES.map((st, i) => ({ key: st.key, group: st.key, label: st.label, type:'choice', options: st.options,
    show: P => i === 0 || P[STAGES[i - 1].key] != null })),
  defaults: { pre:null, strip:null, light:null, solvent:null, reagent:null },
  target(P){ const n = chosen(P); return stateAfter(n ? STAGES[n - 1].to : 0, cfgOf(P)); },
  start(S){ Object.assign(S, stateAfter(0)); S.fdone = []; },
  // S.fdone: lựa chọn của các bước đã chạy xong; chạy tiếp từ bước đầu tiên khác với lựa chọn hiện tại
  async animate(h, P){
    const S = h.S, n = chosen(P), prev = S.fdone || [];
    let i = 0; while (i < n && i < prev.length && prev[i] === P[STAGES[i].key]) i++;
    Object.assign(S, stateAfter(i ? STAGES[i - 1].to : 0, cfgOf(P)));
    S.fdone = prev.slice(0, i);
    for (let j = i; j < n; j++){
      const last = j === n - 1; S.ff = last ? 0 : 1;   // các bước làm lại thì tua nhanh, bước vừa chọn chạy bình thường
      for (const ph of STAGES[j].phases) await ph(h, last ? 1 : 0.35);
      S.fdone.push(P[STAGES[j].key]);
    }
    S.ff = 0;
  },
  observe(_S, P){
    const n = chosen(P);
    if (!n) return 'Bắt đầu ở bước 1: chọn nơi để chậu cây khoai lang trong 2 ngày.';
    if (n === STAGES.length) return resultText(P);
    const st = STAGES[n - 1], t = STAGE_TEXT[st.key][P[st.key]];
    return `${typeof t === 'function' ? t(P) : t} Tiếp theo: ${STAGES[n].title.replace(/^Bước \d+ · /, '').toLowerCase()}.`;
  },
  drag: { hit: () => null, move: () => ({}), items: () => [], nudge: () => ({}) },
  chips: [
    { q:'Bỏ bước để trong tối thì sao?', a:'Lá còn tinh bột cũ tạo ra từ những ngày trước, nên cả lá đều xanh tím khi nhỏ iodine. Khi đó không biết tinh bột nào do lá mới tạo ra.' },
    { q:'Vì sao phải tẩy màu lá?', a:'Màu xanh lục của chất diệp lục che màu xanh tím của iodine. Đun lá trong cồn 90° (cách thủy) để tẩy diệp lục thì nhìn rõ màu hơn.' } ]
};

export default {
  id: 'quang-hop',
  grade: 'KHTN 7', chapter: 'Chương VII Trao đổi chất và chuyển hóa năng lượng ở sinh vật', lesson: 'Bài 24',
  title: 'Chứng minh quang hợp tạo ra tinh bột', shortTitle: 'Quang hợp tạo tinh bột',
  intro: 'Bịt một phần lá khoai lang bằng giấy đen, chiếu sáng, rồi thử tinh bột bằng iodine. Giữa chừng, trợ lý AI ở góc phải sẽ hỏi em. Chọn sai thì thí nghiệm chạy đúng theo lựa chọn của em, để em tự thấy kết quả.',
  canvasLabel: 'Chậu cây khoai lang có một chiếc lá được chọn làm thí nghiệm; bên phải là chỗ đun cách thủy và đĩa petri để thử tinh bột',
  readyTitle: 'Chậu cây đã sẵn sàng',
  footer: 'Mô phỏng phục vụ dạy học. Thời gian được tua nhanh; đậm nhạt của màu chỉ để minh họa, không phải số đo thật.',
  view: { w: 80, h: 40, ox: 0.5, oy: 0.5 },
  startChips: [
    { q:'Thí nghiệm này để làm gì?', a:'Thí nghiệm chứng minh lá cây tạo ra tinh bột khi quang hợp, và chỉ tạo ra tinh bột khi được chiếu sáng.' },
    { q:'Làm sao biết lá có tinh bột?', a:'Nhỏ dung dịch iodine lên lá. Chỗ nào có tinh bột sẽ chuyển sang màu xanh tím.' } ],
  base(S){ Object.assign(S, stateAfter(0)); },
  rest(){},
  draw(_g, _S){
    g = _g; S = _S;
    const { C } = g;
    drawBench(); drawDish(); drawBathBack();
    if (!S.attached) drawLeaf(S.lx, S.ly, S.ls, leafColor('open'), S.strip ? leafColor('band') : null, 0);
    drawBathFront(); drawPlant();
    if (S.attached) drawLeaf(S.lx, S.ly, S.ls, leafColor('open'), null, S.cover);
    drawEnv(); drawDropper(); drawLabels();
    if (S.rinse) g.text('Rửa lá trong cốc nước ấm', g.X(-20), g.Y(-15), { color: C.glass, weight: 700 });
    if (S.ff) g.text('Tua nhanh tới kết quả', g.X(0), g.Y(18.4), { color: C.beam, weight: 700, size: g.fs() + 1 });
  },
  readout(S){
    const tail = ' (tua nhanh)';
    if (S.drop > 0) return `Đã nhỏ ${REAGENT_NAME[S.reagent]} lên lá`;
    if (S.boil > 0 && S.solvent !== 'none') return S.boil < 1 ? `Đun cách thủy lá trong ${SOLVENT_NAME[S.solvent]}` : `Đã đun lá trong ${SOLVENT_NAME[S.solvent]}, rửa nước ấm`;
    if (!S.attached) return 'Đã ngắt lá, bỏ băng giấy đen';
    if (S.lightT > 0) return S.hours > 0 ? `Chiếu sáng: ${hoursText(S.hours * S.lightT)}${tail}` : `Để tiếp trong tối: ${fmt(LIGHT_H * S.lightT)} giờ${tail}`;
    if (S.preT > 0 && S.pre !== 'none') return `Để ${PRE_NAME[S.pre]}: ${fmt(2 * S.preT)} ngày${tail}`;
    return '';
  },
  describe(S){
    const L = ['Chậu cây khoai lang, một chiếc lá được chọn làm thí nghiệm. Bên phải có nồi đun cách thủy và đĩa petri.'];
    if (S.preT >= 1) L.push(S.pre === 'none' ? 'Cây không được để trong tối trước khi thí nghiệm.' : `Cây đã được để ${PRE_NAME[S.pre]} 2 ngày.`);
    else if (S.preT > 0) L.push(`Cây đang được để ${PRE_NAME[S.pre]}.`);
    if (S.strip && (S.cover > 0.5 || S.lightT > 0)) L.push('Một phần lá được bịt kín hai mặt bằng băng giấy đen' + (S.covered ? '.' : ', nhưng băng giấy đã được bỏ ra trước khi chiếu sáng.'));
    if (S.lightT > 0) L.push(S.hours > 0
      ? `Cây được chiếu sáng ${hoursText(S.hours)}${S.strip && S.covered ? '; phần lá bịt giấy đen không nhận được ánh sáng' : '; cả lá đều nhận được ánh sáng'}.`
      : 'Cây được để tiếp trong tối, không được chiếu sáng.');
    if (!S.attached) L.push('Lá đã được ngắt khỏi cây, bỏ băng giấy đen.');
    if (S.boil > 0) L.push(S.solvent === 'none' ? 'Lá không được đun tẩy màu, vẫn còn xanh lục.'
      : `Lá được đun cách thủy trong ${SOLVENT_NAME[S.solvent]}. ` + (S.solvent === 'alcohol' ? 'Lá bạc màu, cồn chuyển xanh lục.' : 'Lá vẫn còn màu xanh lục.'));
    if (S.drop >= 0.5){
      L.push(`Đã nhỏ ${REAGENT_NAME[S.reagent]} lên lá.`);
      L.push(`Phần lá không bịt: ${colorWord(S, 'open')}.`);
      if (S.strip) L.push(`Phần lá bịt giấy đen: ${colorWord(S, 'band')}.`);
    }
    return L;
  },
  steps, questions, free
};
