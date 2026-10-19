// Lõi dùng chung cho mọi thí nghiệm: chạy bước, câu hỏi mồi, trợ lý AI, thống kê, vẽ canvas.
// Mỗi thí nghiệm là một module trong assets/js/lessons/ (xem thau-kinh.js làm mẫu).

const CANCEL = { cancelled: true };
const STATS_KEY = 'khtn-lab-stats-v1';
const LETTERS = 'ABCD';

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const fmt = n => (Math.round(n * 10) / 10).toLocaleString('vi-VN');

/* ---------- vẽ: hàm tiện ích, truyền vào module thí nghiệm qua đối tượng g ---------- */
function makeGraphics(canvas, view){
  const ctx = canvas.getContext('2d');
  const g = { ctx, W:0, H:0, sc:10, ox:0, oy:0, C:{} };
  g.X = x => g.ox + x * g.sc;
  g.Y = y => g.oy - y * g.sc;
  g.resize = () => {
    const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
    const dpr = window.devicePixelRatio || 1;
    g.W = r.width; g.H = r.height;
    canvas.width = Math.round(g.W * dpr); canvas.height = Math.round(g.H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.sc = Math.min(g.W / view.w, g.H / view.h); g.ox = g.W * (view.ox ?? 0.5); g.oy = g.H * (view.oy ?? 0.5);
  };
  g.readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    ['stage','stage-2','stage-line','stage-ink','stage-muted','beam','glass','obj','img','screen','spec-1','spec-2','spec-3','spec-4','spec-5','spec-6','liquid','solid','gas','warm','cold','leaf','leaf-pale','starch','iodine','paper','pot','soil']
      .forEach(k => g.C[k] = cs.getPropertyValue('--' + k).trim());
  };
  g.fs = () => Math.max(11, Math.min(16, g.sc * 0.95));
  g.font = (px, w = 500, mono = false) => `${w} ${px}px ${mono ? '"JetBrains Mono", ui-monospace, monospace' : '"Be Vietnam Pro", system-ui, sans-serif'}`;
  g.rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  // chữ trên sân khấu có viền màu nền để vẫn đọc được khi tia sáng chạy ngang qua
  g.text = (t, x, y, { color = g.C['stage-ink'], size = g.fs(), weight = 500, align = 'center', base = 'middle', mono = false, halo = true } = {}) => {
    ctx.font = g.font(size, weight, mono); ctx.textAlign = align; ctx.textBaseline = base;
    if (halo){ ctx.save(); ctx.shadowBlur = 0; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = g.C.stage; ctx.strokeText(t, x, y); ctx.restore(); }
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  };
  // Vẽ một đường gấp khúc (đơn vị cm) từ tỉ lệ from tới tỉ lệ p (0..1), có mũi tên chỉ chiều truyền.
  // Tăng p: tia chạy ra; tăng from: đuôi tia chạy theo, ánh sáng "chạy đi" hết.
  g.path = (pts, p, { color = g.C.beam, width = 2.2, dash = null, alpha = 1, arrows = true, glow = true, from = 0 } = {}) => {
    if (p <= 0 || from >= p) return;
    const P = pts.map(([x, y]) => [g.X(x), g.Y(y)]);
    const L = []; let total = 0;
    for (let i = 1; i < P.length; i++){ const l = Math.hypot(P[i][0] - P[i-1][0], P[i][1] - P[i-1][1]); L.push(l); total += l; }
    const a = total * Math.max(0, from), b = total * Math.min(1, p);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    if (glow){ ctx.shadowColor = color; ctx.shadowBlur = 9; }
    ctx.beginPath();
    const heads = [];
    let acc = 0, started = false;
    for (let i = 1; i < P.length; i++){
      const l = L[i-1], s0 = acc; acc += l;
      if (l <= 0 || acc <= a) continue;
      if (s0 >= b) break;
      const t0 = Math.max(0, (a - s0) / l), t1 = Math.min(1, (b - s0) / l);
      const at = t => [P[i-1][0] + (P[i][0] - P[i-1][0]) * t, P[i-1][1] + (P[i][1] - P[i-1][1]) * t];
      if (!started){ const s = at(t0); ctx.moveTo(s[0], s[1]); started = true; }
      const e = at(t1); ctx.lineTo(e[0], e[1]);
      if (arrows && t1 > 0.6 && t0 < 0.5 && l > 34) heads.push([P[i-1], P[i]]);
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
    for (const [a, b] of heads){
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.save(); ctx.translate(mx, my); ctx.rotate(ang); ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4.5); ctx.lineTo(-4, 4.5); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  };
  // Mũi tên thẳng đứng (vật, ảnh) từ y0 tới y1 tại hoành độ x (cm)
  g.arrowV = (x, y0, y1, color, { width = 3, dash = null, alpha = 1, glow = true } = {}) => {
    const px = g.X(x), a = g.Y(y0), b = g.Y(y1), dir = Math.sign(y1 - y0) || 1;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    if (glow){ ctx.shadowColor = color; ctx.shadowBlur = 10; }
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(px, a); ctx.lineTo(px, b + dir * 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(px, b); ctx.lineTo(px - 6, b + dir * 10); ctx.lineTo(px + 6, b + dir * 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  return g;
}

/* ---------- khung trang ---------- */
const ICON_ORB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 2.5l1.9 5.6 5.6 1.9-5.6 1.9L11 17.5l-1.9-5.6L3.5 10l5.6-1.9z"/><path d="M18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>';
function template(L){
  return `
<div class="wrap">
  <header class="page">
    <a class="home-link" href="/">← Tất cả thí nghiệm</a>
    <span class="eyebrow">${esc(L.grade)} · ${esc(L.chapter)} · ${esc(L.lesson)}</span>
    <h1>${esc(L.title)}</h1>
    <p class="lead">${esc(L.intro)}</p>
    <span class="net" data-el="net"></span>
  </header>
  <div class="layout">
    <section class="lab" data-el="lab" aria-label="Mô phỏng thí nghiệm">
      <div class="stage">
        <canvas class="bench" data-el="bench" role="img" aria-label="${esc(L.canvasLabel || 'Mô phỏng thí nghiệm')}"></canvas>
        <div class="readout" data-el="readout" aria-live="polite"></div>
        <div class="orb-note" data-el="orbNote"></div>
        ${L.free ? '<button class="fs-panel-btn" data-el="fsPanelBtn" type="button" hidden aria-expanded="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h7M13 4h1M2 12h1M7 12h7"/><circle cx="11" cy="4" r="2"/><circle cx="5" cy="12" r="2"/></svg>Bảng điều chỉnh</button>' : ''}
        <div class="bubble" data-el="bubble" hidden role="dialog" aria-label="Trợ lý AI">
          <div class="panel" data-el="bPanel" tabindex="-1"></div>
          <div class="panel" data-el="chatPanel" hidden>
            <div class="b-head"><span class="b-ai"><i></i>Hỏi trợ lý AI</span><button class="b-x" data-el="chatClose" type="button" aria-label="Đóng">×</button></div>
            <button class="linkbtn" data-el="chatBack" type="button" hidden>← Quay lại câu hỏi</button>
            <div class="chat-log" data-el="chatLog" aria-live="polite"></div>
            <div class="chips" data-el="chips"></div>
            <form class="chat-form" data-el="chatForm"><input data-el="chatInput" autocomplete="off" maxlength="500" placeholder="Em muốn hỏi gì về thí nghiệm?" aria-label="Câu hỏi cho trợ lý AI"><button class="bbtn primary" type="submit">Gửi</button></form>
            <p class="b-tip">Trợ lý biết em đang ở bước nào của thí nghiệm. Hỏi tự do cần có mạng; khi mất mạng, các câu gợi ý vẫn có câu trả lời soạn sẵn.</p>
          </div>
        </div>
        <button class="orb" data-el="orb" type="button" aria-label="Trợ lý AI: hỏi về thí nghiệm">${ICON_ORB}<span class="badge" data-el="badge" hidden>?</span></button>
      </div>
      <div class="caption" aria-live="polite">
        <div class="cap-top"><span class="cap-step" data-el="capStep"></span><span class="cap-title" data-el="capTitle"></span></div>
        <div class="cap-text" data-el="capText"></div>
      </div>
      <div class="controls">
        ${L.free ? `<div class="mode-seg" role="group" aria-label="Chế độ thí nghiệm"><button type="button" data-mode="steps" aria-pressed="true">Theo bước SGK</button><button type="button" data-mode="free" aria-pressed="false">Tự do</button></div>` : ''}
        <button class="cbtn primary" data-el="btnPlay" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path data-el="playIcon" d="M4 2.5v11l9-5.5z"/></svg><span data-el="playLabel">Chạy 1 lượt</span></button>
        <button class="cbtn" data-el="btnPrev" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h2v10H3zM13 3v10L6 8z"/></svg>Bước trước</button>
        <button class="cbtn" data-el="btnNext" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 3h2v10h-2zM3 3v10l7-5z"/></svg>Bước tiếp</button>
        <button class="cbtn" data-el="btnReset" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 1 1-5.6 3.9l1.8.7A4 4 0 1 0 8 4v2L4.5 3 8 0z"/></svg>Làm lại</button>
        <span class="spacer"></span>
        <label class="switch" data-el="askWrap"><input type="checkbox" data-el="askToggle" checked><span></span>Câu hỏi mồi</label>
        <button class="cbtn" data-el="btnFull" type="button" aria-label="Toàn màn hình" title="Toàn màn hình"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h5v2H4v3H2zM14 2v5h-2V4H9V2zM2 14V9h2v3h3v2zM14 14H9v-2h3V9h2z"/></svg></button>
      </div>
    </section>
    <aside class="steps">
      <div class="side-box" data-el="stepsBox">
        <h2>Các bước thí nghiệm</h2>
        <p class="note">Bấm vào một bước để chạy lại bước đó. Bước có dấu <span style="color:var(--accent);font-family:var(--f-mono)">AI hỏi</span> sẽ có câu hỏi mồi.</p>
        <ol data-el="stepList"></ol>
      </div>
      ${L.free ? `<div class="side-box" data-el="freeBox" hidden>
        <div class="fp-head"><h2>Bảng điều chỉnh</h2><button class="fp-all" type="button" data-el="freeAll">Thu gọn hết</button></div>
        <p class="note">${esc(L.free.hint || 'Kéo các dụng cụ ngay trên giá, hoặc chỉnh ở bảng này.')}</p>
        <div class="fp-groups" data-el="freeCtl"></div>
        <div class="row-btns" data-el="freeActs"></div>
        <p class="free-msg" data-el="freeMsg" aria-live="polite"></p>
      </div>` : ''}
    </aside>
  </div>
  <div class="teacher">
    <section class="card" aria-labelledby="statsHead">
      <h2 id="statsHead">Số liệu câu hỏi mồi (lưu trên máy này)</h2>
      <div class="table-wrap"><table class="stats">
        <thead><tr><th scope="col">Câu</th><th scope="col">Nội dung</th><th scope="col">Số lượt hỏi</th><th scope="col">Đúng ngay lần đầu</th><th scope="col">Hay chọn sai nhất</th></tr></thead>
        <tbody data-el="statsBody"></tbody>
      </table></div>
      <p class="sum" data-el="statsSum"></p>
      <div class="row-btns"><button class="pbtn" data-el="btnCsv" type="button">Tải số liệu (CSV)</button><button class="pbtn danger" data-el="btnClear" type="button">Xóa số liệu</button></div>
    </section>
    <section class="card" aria-labelledby="howHead">
      <h2 id="howHead">Dùng trên lớp</h2>
      <ul class="howto">
        <li>Chiếu lên tivi. <b>Chạy 1 lượt</b> sẽ dừng ở mỗi câu hỏi mồi; tắt <b>Câu hỏi mồi</b> khi muốn chiếu nhanh.</li>
        <li>Dùng bút trình chiếu hoặc phím <kbd>←</kbd> <kbd>→</kbd> để chuyển bước.</li>
        <li>Cả lớp giơ tay chọn đáp án, thầy cô bấm phím <kbd>A</kbd>–<kbd>D</kbd> theo đáp án được nhiều bạn chọn nhất.</li>
        ${L.free ? '<li>Chế độ <b>Tự do</b>: học sinh tự kéo dụng cụ trên giá và chỉnh thông số. Trợ lý AI biết các thông số đang đặt.</li>' : ''}
        <li>Cần có mạng để mở trang. Nếu mất mạng giữa giờ, mô phỏng và câu hỏi mồi vẫn chạy tiếp (đừng tải lại trang); chỉ ô hỏi tự do tạm tắt.</li>
      </ul>
    </section>
  </div>
  <footer class="page">${esc(L.footer || 'Mô phỏng phục vụ dạy học. Các bước bám theo SGK Khoa học tự nhiên (Kết nối tri thức).')}</footer>
</div>`;
}

/* ---------- gắn thí nghiệm vào trang ---------- */
export function mountLab(root, L){
  root.innerHTML = template(L);
  const el = name => root.querySelector(`[data-el="${name}"]`);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = reduce ? 0.15 : 1;
  document.title = `${L.shortTitle || L.title} · Phòng thí nghiệm KHTN`;

  /* trạng thái cảnh */
  const S = {};
  const Q = Object.fromEntries(L.questions.map(q => [q.id, q]));

  /* hoạt ảnh */
  let runId = 0;
  const raf = () => new Promise(r => requestAnimationFrame(r));
  const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
  async function anim(ms, fn, id){
    ms *= SPEED; const t0 = performance.now();
    for (;;){
      if (id !== runId) throw CANCEL;
      const t = ms <= 0 ? 1 : Math.min(1, (performance.now() - t0) / ms);
      fn(ease(t)); if (t >= 1) return; await raf();
    }
  }
  async function tw(props, ms, id){
    const from = {}; for (const k in props) from[k] = S[k];
    await anim(ms, t => { for (const k in props) S[k] = from[k] + (props[k] - from[k]) * t; }, id);
  }
  async function wait(ms, id){
    ms *= SPEED; const t0 = performance.now();
    while (performance.now() - t0 < ms){ if (id !== runId) throw CANCEL; await raf(); }
  }

  /* canvas */
  const canvas = el('bench');
  const g = makeGraphics(canvas, L.view);
  g.readColors();
  if ('ResizeObserver' in window) new ResizeObserver(() => g.resize()).observe(canvas);
  window.addEventListener('resize', g.resize);
  g.resize();
  let lastReadout = '';
  function frame(){
    if (!g.W) g.resize();
    if (g.W){
      g.ctx.clearRect(0, 0, g.W, g.H);
      g.ctx.fillStyle = g.C.stage; g.ctx.fillRect(0, 0, g.W, g.H);
      L.draw(g, S);
      const t = L.readout ? L.readout(S) : '';
      if (t !== lastReadout){ el('readout').textContent = t; lastReadout = t; }
    }
    requestAnimationFrame(frame);
  }

  /* chú thích + danh sách bước */
  let cur = -1, playing = false, askOn = true;
  const done = new Set();
  function setCaption(i, mode){
    if (i < 0){
      el('capStep').textContent = 'Sẵn sàng';
      el('capTitle').textContent = L.readyTitle || 'Dụng cụ đã sẵn sàng';
      el('capText').innerHTML = 'Bấm <span class="k">Chạy 1 lượt</span> để xem cả thí nghiệm, hoặc <span class="k">Bước tiếp</span> để làm từng bước. Trợ lý AI sẽ hỏi em giữa chừng.';
      return;
    }
    const st = L.steps[i];
    el('capStep').textContent = `Bước ${i + 1}/${L.steps.length}`;
    el('capTitle').textContent = st.title;
    el('capText').innerHTML = mode === 'obs'
      ? (st.html ? st.html : '<span class="k">Quan sát:</span> ' + esc(st.note))
      : '<span class="k">Thực hiện:</span> ' + esc(st.sgk);
  }
  function renderSteps(){
    const ol = el('stepList'); ol.innerHTML = '';
    L.steps.forEach((st, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'step' + (i === cur ? ' cur' : '') + (done.has(i) ? ' done' : '');
      if (i === cur) b.setAttribute('aria-current', 'step');
      const hasQ = !!st.q;
      b.innerHTML = `<span class="n">${done.has(i) ? '✓' : i + 1}</span><span><span class="t">${esc(st.title)}${hasQ ? '<span class="q">AI hỏi</span>' : ''}</span><span class="s">${esc(st.sgk)}</span></span>`;
      b.addEventListener('click', () => { playing = false; goTo(i); });
      li.appendChild(b); ol.appendChild(li);
    });
  }
  function updateNav(){
    el('playLabel').textContent = playing ? 'Dừng' : (done.size === L.steps.length ? 'Chạy lại từ đầu' : 'Chạy 1 lượt');
    el('playIcon').setAttribute('d', playing ? 'M4 3h3v10H4zM9 3h3v10H9z' : 'M4 2.5v11l9-5.5z');
    el('btnPrev').disabled = cur <= 0;
    el('btnNext').disabled = cur >= L.steps.length - 1;
  }

  /* bong bóng trợ lý */
  const bubble = el('bubble'), bPanel = el('bPanel'), chatPanel = el('chatPanel'), orb = el('orb');
  let bTok = 0, mode = 'q', interactive = null, pending = null, lastAnswer = null, pendingQ = null;
  const setBadge = on => { el('badge').hidden = !on; orb.classList.toggle('has-q', on); };
  const setOrbNote = t => { el('orbNote').textContent = t; };
  function openBubble(){ bTok++; bubble.hidden = false; void bubble.offsetWidth; bubble.classList.add('open'); setBadge(false); }
  function closeBubble(){ const t = ++bTok; bubble.classList.remove('open'); setBadge(!!interactive); setTimeout(() => { if (t === bTok) bubble.hidden = true; }, reduce ? 0 : 280); }
  const bubbleOpen = () => !bubble.hidden && bubble.classList.contains('open');
  function showPanel(m){ mode = m; bPanel.hidden = m === 'chat'; chatPanel.hidden = m !== 'chat'; }
  function waitFor(id){ return new Promise((res, rej) => { if (id !== runId){ rej(CANCEL); return; } pending = { res, rej }; }); }
  function resolvePending(v){ const p = pending; pending = null; if (p) p.res(v); }
  function cancelAll(){
    runId++;
    if (pending){ const p = pending; pending = null; p.rej(CANCEL); }
    interactive = null; pendingQ = null; lastAnswer = null;
    if (mode !== 'chat') closeBubble();
    setOrbNote(''); setBadge(false); el('chatBack').hidden = true;
  }
  const head = q => `<div class="b-head"><span class="b-ai"><i></i>Trợ lý AI hỏi</span><span class="b-head-right"><span class="b-tag">${esc(q.tag)}</span><button class="b-x" type="button" data-act="min" aria-label="Thu nhỏ để xem thí nghiệm" title="Thu nhỏ để xem thí nghiệm">–</button></span></div>`;
  function wireHead(){
    const m = bPanel.querySelector('[data-act="min"]'); if (m) m.addEventListener('click', () => closeBubble());
    const c = bPanel.querySelector('[data-act="chat"]'); if (c) c.addEventListener('click', () => openChat());
  }
  function renderQuestion(q){
    showPanel('q');
    bPanel.innerHTML = head(q) + `<p class="b-q">${esc(q.text)}</p><div class="opts">` +
      q.opts.map((o, i) => `<button class="opt" type="button" data-i="${i}"><b>${LETTERS[i]}</b><span>${esc(o)}</span></button>`).join('') +
      `</div><p class="b-tip">Cả lớp giơ tay chọn, thầy cô bấm đáp án được nhiều bạn chọn nhất (phím A–D).</p><button class="linkbtn" type="button" data-act="chat">Chưa hiểu? Hỏi trợ lý AI</button>`;
    bPanel.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => resolvePending(Number(b.dataset.i))));
    wireHead();
  }
  function renderFeedback(q, c, ok, tries){
    showPanel('q');
    const body = ok
      ? `<p class="verdict ok">Chính xác!</p><div class="fb-box ok">${esc(q.right)}</div><p class="ref">${esc(q.ref || '')}</p>
         <div class="b-actions"><button class="bbtn primary" type="button" data-act="go">Tiếp tục thí nghiệm</button></div>`
      : `<p class="verdict bad">Có vẻ chưa đúng lắm…</p><div class="fb-box bad">Em chọn <b>${LETTERS[c]}. ${esc(q.opts[c])}</b>. ${esc(q.wrong[c] || '')}${tries >= 2 && q.hint2 ? ' ' + esc(q.hint2) : ''}</div>
         <p class="b-tip">Em nhìn lại thí nghiệm vừa chạy rồi chọn lại nhé.</p>
         <div class="b-actions"><button class="bbtn primary" type="button" data-act="go">Chọn lại</button><button class="bbtn" type="button" data-act="why">Hỏi AI vì sao?</button></div>`;
    bPanel.innerHTML = head(q) + body;
    wireHead();
    bPanel.querySelector('[data-act="go"]').addEventListener('click', () => resolvePending('go'));
    const why = bPanel.querySelector('[data-act="why"]');
    if (why) why.addEventListener('click', () => { openChat(); sendChat(`Em chọn "${q.opts[c]}" cho câu hỏi "${q.text}" nhưng chưa đúng. Vì sao vậy?`); });
  }
  async function ask(q, h){
    const id = h.id;
    pendingQ = q;
    if (!askOn){ await q.sim(h, q.answer); pendingQ = null; return; }
    let tries = 0;
    for (;;){
      interactive = () => renderQuestion(q);
      if (mode !== 'chat' || !bubbleOpen()){ renderQuestion(q); openBubble(); } else { el('chatBack').hidden = false; }
      bPanel.focus({ preventScroll:true });
      const choice = await waitFor(id);
      tries++; record(q, choice, tries);
      interactive = null; closeBubble();
      setOrbNote('Đang thử lựa chọn ' + LETTERS[choice] + ' của em…');
      await wait(280, id);
      await q.sim(h, choice);
      setOrbNote('');
      const ok = choice === q.answer;
      lastAnswer = { q, c: choice, ok };
      interactive = () => renderFeedback(q, choice, ok, tries);
      renderFeedback(q, choice, ok, tries); openBubble();
      await waitFor(id);
      interactive = null; closeBubble();
      if (ok){ lastAnswer = null; pendingQ = null; return; }
      if (q.reset) await q.reset(h);
    }
  }
  orb.addEventListener('click', () => {
    if (bubbleOpen()){
      if (mode === 'chat' && interactive){ interactive(); el('chatBack').hidden = true; }
      else closeBubble();
      return;
    }
    if (interactive){ interactive(); openBubble(); } else openChat();
  });
  el('chatClose').addEventListener('click', () => { if (interactive) interactive(); else closeBubble(); });
  el('chatBack').addEventListener('click', () => { if (interactive){ interactive(); el('chatBack').hidden = true; } });

  /* số liệu (lưu trong trình duyệt của máy giáo viên) */
  function loadLog(){ try { return JSON.parse(localStorage.getItem(STATS_KEY) || '[]'); } catch { return []; } }
  function saveLog(a){ try { localStorage.setItem(STATS_KEY, JSON.stringify(a.slice(-5000))); } catch {} }
  let log = loadLog();
  function record(q, c, attempt){
    log.push({ t: new Date().toISOString(), lesson: L.id, q: q.id, choice: LETTERS[c], correct: c === q.answer, attempt });
    saveLog(log); renderStats();
  }
  function renderStats(){
    const tb = el('statsBody'); tb.innerHTML = '';
    let asksAll = 0, okAll = 0;
    L.questions.forEach((q, i) => {
      const rows = log.filter(e => e.lesson === L.id && e.q === q.id);
      const asks = rows.filter(e => e.attempt === 1);
      const n = asks.length, ok = asks.filter(e => e.correct).length;
      asksAll += n; okAll += ok;
      const wrongCount = {}; rows.filter(e => !e.correct).forEach(e => { wrongCount[e.choice] = (wrongCount[e.choice] || 0) + 1; });
      const top = Object.entries(wrongCount).sort((a, b) => b[1] - a[1])[0];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="num">${i + 1}</td><td>${esc(q.short || q.text)}</td><td class="num">${n || '—'}</td>` +
        `<td class="num">${n ? `${ok}/${n} (${Math.round(ok / n * 100)}%)` : '—'}</td>` +
        `<td>${top ? esc(`${top[0]}. ${q.opts[LETTERS.indexOf(top[0])]}`) + ` <span class="num">×${top[1]}</span>` : '—'}</td>`;
      tb.appendChild(tr);
    });
    el('statsSum').textContent = asksAll ? `Tổng: ${asksAll} lượt hỏi · đúng ngay lần đầu ${okAll}/${asksAll} (${Math.round(okAll / asksAll * 100)}%).` : 'Chưa có số liệu. Số liệu được ghi khi học sinh trả lời câu hỏi mồi.';
  }
  el('btnCsv').addEventListener('click', () => {
    const rows = log.filter(e => e.lesson === L.id);
    const csv = '﻿thoi_gian,bai,cau,lua_chon,dung,lan_thu\n' + rows.map(e => [e.t, e.lesson, e.q, e.choice, e.correct ? 1 : 0, e.attempt].join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `so-lieu-${L.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  let clearArmed = 0;
  el('btnClear').addEventListener('click', () => {
    const btn = el('btnClear');
    if (Date.now() - clearArmed < 4000){
      log = log.filter(e => e.lesson !== L.id); saveLog(log); renderStats(); btn.textContent = 'Đã xóa'; clearArmed = 0;
      setTimeout(() => { btn.textContent = 'Xóa số liệu'; }, 1500);
    } else { clearArmed = Date.now(); btn.textContent = 'Bấm lần nữa để xóa'; setTimeout(() => { if (Date.now() - clearArmed >= 3900) btn.textContent = 'Xóa số liệu'; }, 4000); }
  });

  /* chạy bước */
  function helpers(id, i){
    return {
      id, S,
      tw: (props, ms) => tw(props, ms, id),
      wait: ms => wait(ms, id),
      ask: qid => ask(Q[qid], helpers(id, i)),
      showObs: () => setCaption(i, 'obs')
    };
  }
  async function goTo(i){
    cancelAll(); const id = runId; cur = i;
    const st = L.steps[i];
    L.base(S); st.setup(S);
    setCaption(i, 'do'); renderSteps(); updateNav(); renderChips();
    try {
      await st.run(helpers(id, i));
      if (id !== runId) return false;
      done.add(i); setCaption(i, 'obs'); renderSteps(); updateNav(); return true;
    } catch (e){ if (e !== CANCEL) console.error(e); return false; }
  }
  async function play(){
    if (playing){ playing = false; cancelAll(); updateNav(); return; }
    playing = true;
    let i = cur < 0 ? 0 : (done.has(cur) ? cur + 1 : cur);
    if (i >= L.steps.length){ i = 0; done.clear(); }
    updateNav();
    while (playing && i < L.steps.length){
      const ok = await goTo(i);
      if (!ok || !playing) break;
      if (i < L.steps.length - 1){ try { await wait(2400, runId); } catch { break; } }
      i++;
    }
    playing = false; updateNav();
  }
  function reset(){
    playing = false; cancelAll(); cur = -1; done.clear(); L.base(S); L.rest(S);
    setCaption(-1); renderSteps(); updateNav(); renderChips();
  }
  el('btnPlay').addEventListener('click', play);
  el('btnNext').addEventListener('click', () => { playing = false; if (cur < L.steps.length - 1) goTo(cur + 1); });
  el('btnPrev').addEventListener('click', () => { playing = false; if (cur > 0) goTo(cur - 1); });
  el('btnReset').addEventListener('click', () => { if (freeOn){ Object.assign(P, FR.defaults); setParams({}); } else reset(); });
  el('askToggle').addEventListener('change', e => { askOn = e.target.checked; });
  el('btnFull').addEventListener('click', () => {
    const lab = el('lab');
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (lab.requestFullscreen) lab.requestFullscreen().catch(() => {});
    } catch {}
  });
  document.addEventListener('fullscreenchange', () => { setTimeout(g.resize, 60); placePanel(); });
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (bubbleOpen() && mode === 'q' && pending && interactive){
      const k = e.key.toLowerCase(); const a = 'abcd'.indexOf(k), n = '1234'.indexOf(k);
      const opt = a >= 0 ? a : n;
      if (opt >= 0 && bPanel.querySelector('.opt')){ e.preventDefault(); resolvePending(opt); return; }
      if (e.key === 'Enter' && bPanel.querySelector('[data-act="go"]')){ e.preventDefault(); resolvePending('go'); return; }
    }
    if (freeOn){ freeKey(e); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); el('btnNext').click(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); el('btnPrev').click(); }
  });

  /* chế độ tự do: mọi thông số nằm trong P (khai báo ở L.free.params).
     P là nguồn sự thật duy nhất cho cảnh vẽ, bảng điều chỉnh và trạng thái gửi trợ lý AI. */
  const FR = L.free || null;
  const P = FR ? { ...FR.defaults } : {};
  let freeOn = false, dragKey = null;
  const visible = p => !p.show || p.show(P);
  const paramOf = k => FR.params.find(p => p.key === k);
  function snap(p, v){
    if (p.type === 'toggle') return !!v;
    if (p.type !== 'range') return v;
    v = Math.min(p.max, Math.max(p.min, Number(v)));
    return Number((Math.round((v - p.min) / p.step) * p.step + p.min).toFixed(3));
  }
  function paramText(p){
    const v = P[p.key];
    if (v == null) return 'chưa chọn';
    if (p.type === 'range') return fmt(v) + (p.unit ? ' ' + p.unit : '');
    if (p.type === 'choice') return (p.options.find(o => o.value === v) || {}).label || String(v);
    return v ? 'bật' : 'tắt';
  }
  function freeCaption(){
    el('capStep').textContent = 'Tự do';
    el('capTitle').textContent = FR.title;
    el('capText').innerHTML = '<span class="k">Quan sát:</span> ' + esc(FR.observe(S, P));
  }
  function syncFree(){
    el('freeCtl').querySelectorAll('.fc').forEach(row => {
      const p = paramOf(row.dataset.key);
      row.hidden = !visible(p);
      if (p.type === 'range'){
        const i = row.querySelector('input'); if (Number(i.value) !== P[p.key]) i.value = P[p.key];
        row.querySelector('output').textContent = paramText(p);
      } else if (p.type === 'choice') row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === P[p.key])));
      else row.querySelector('input').checked = !!P[p.key];
    });
    // thẻ nhóm: dòng tóm tắt; ẩn cả thẻ khi không còn thông số nào dùng được
    el('freeCtl').querySelectorAll('.fgroup').forEach(d => {
      const gr = FR.groups.find(x => x.id === d.dataset.group);
      d.hidden = !FR.params.some(p => p.group === gr.id && visible(p));
      d.querySelector('.fg-sum').textContent = gr.summary ? gr.summary(P) : '';
    });
  }
  // Đổi cảnh tới trạng thái của P. Có FR.animate thì chạy hoạt ảnh (hủy được như các bước SGK);
  // trong lúc hoạt ảnh đang chạy, thay đổi chỉ gồm thanh trượt (kéo vật, màn...) thì đặt ngay hình học
  // bằng FR.place để hình theo tay mà không làm đứt hoạt ảnh.
  let freeBusy = false;
  async function runFree(){
    const id = ++runId; freeBusy = true;
    const h = { id, S, tw: (props, ms) => tw(props, ms, id), wait: ms => wait(ms, id) };
    try { await FR.animate(h, P); } catch (e){ if (e !== CANCEL) console.error(e); }
    finally { if (id === runId) freeBusy = false; }
  }
  function setParams(patch, keepMsg){
    if (!patch) return;
    let onlyRange = Object.keys(patch).length > 0;
    for (const k in patch){ const p = paramOf(k); if (!p) continue; P[k] = snap(p, patch[k]); if (p.type !== 'range') onlyRange = false; }
    if (!FR.animate) Object.assign(S, FR.target(P));
    else if (freeBusy && onlyRange && FR.place) FR.place(S, P);
    else runFree();
    syncFree(); freeCaption();
    if (!keepMsg) el('freeMsg').textContent = '';
  }
  // Bảng điều chỉnh: mỗi nhóm (FR.groups) là một thẻ gập/mở được; thẻ nào đang mở thì nhớ trên máy này.
  // Chữ trên nút dùng p.short / o.short cho gọn; trợ lý AI vẫn nhận p.label / o.label đầy đủ.
  const PANEL_KEY = 'khtn-lab-panel-v1';
  function loadOpen(){ try { return JSON.parse(localStorage.getItem(PANEL_KEY) || '{}')[L.id] || {}; } catch { return {}; } }
  function saveOpen(){
    try {
      const all = JSON.parse(localStorage.getItem(PANEL_KEY) || '{}');
      all[L.id] = Object.fromEntries([...el('freeCtl').querySelectorAll('.fgroup')].map(d => [d.dataset.group, d.open]));
      localStorage.setItem(PANEL_KEY, JSON.stringify(all));
    } catch {}
  }
  function paramRow(p){
    const row = document.createElement('div'); row.className = 'fc fc-' + p.type; row.dataset.key = p.key;
    const id = 'fc-' + p.key, name = esc(p.short || p.label);
    if (p.type === 'range'){
      row.innerHTML = `<div class="fc-head"><label for="${id}">${name}</label><output class="fc-val" for="${id}"></output></div><input type="range" id="${id}" min="${p.min}" max="${p.max}" step="${p.step}">`;
      row.querySelector('input').addEventListener('input', e => setParams({ [p.key]: e.target.value }));
    } else if (p.type === 'choice'){
      row.innerHTML = `<div class="fc-seg" role="group" aria-label="${esc(p.label)}">` +
        p.options.map(o => `<button type="button" data-v="${esc(o.value)}" title="${esc(o.label)}">${esc(o.short || o.label)}</button>`).join('') + '</div>';
      row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setParams({ [p.key]: b.dataset.v })));
    } else {
      row.innerHTML = `<label class="fc-tog" for="${id}"><span>${name}</span><input type="checkbox" role="switch" id="${id}"></label>`;
      row.querySelector('input').addEventListener('change', e => setParams({ [p.key]: e.target.checked }));
    }
    return row;
  }
  function actionBtn(a){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn fc-act'; b.textContent = a.label;
    b.addEventListener('click', () => { const r = a.run(S, P) || {}; if (r.patch) setParams(r.patch, true); el('freeMsg').textContent = r.msg || ''; });
    return b;
  }
  function updateAllBtn(){
    const anyOpen = [...el('freeCtl').querySelectorAll('.fgroup:not([hidden])')].some(d => d.open);
    el('freeAll').textContent = anyOpen ? 'Thu gọn hết' : 'Mở hết';
  }
  function buildFree(){
    const box = el('freeCtl'), saved = loadOpen();
    FR.groups = FR.groups || [];
    FR.params.filter(p => !p.group).forEach(p => box.appendChild(paramRow(p)));
    FR.groups.forEach(gr => {
      const d = document.createElement('details'); d.className = 'fgroup'; d.dataset.group = gr.id;
      d.open = gr.id in saved ? saved[gr.id] : gr.open !== false;
      d.innerHTML = `<summary class="fg-head"><span class="fg-icon" aria-hidden="true">${gr.icon || ''}</span>` +
        `<span class="fg-text"><span class="fg-title">${esc(gr.title)}</span><span class="fg-sum"></span></span>` +
        `<svg class="fg-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg></summary><div class="fg-body"></div>`;
      const body = d.querySelector('.fg-body');
      FR.params.filter(p => p.group === gr.id).forEach(p => body.appendChild(paramRow(p)));
      const acts = (FR.actions || []).filter(a => a.group === gr.id);
      acts.forEach(a => body.appendChild(actionBtn(a)));
      if (acts.length) body.appendChild(el('freeMsg'));   // lời nhắn hiện ngay dưới nút vừa bấm
      d.addEventListener('toggle', () => { saveOpen(); updateAllBtn(); });
      box.appendChild(d);
    });
    (FR.actions || []).filter(a => !a.group).forEach(a => el('freeActs').appendChild(actionBtn(a)));
    el('freeAll').addEventListener('click', () => {
      const ds = [...box.querySelectorAll('.fgroup:not([hidden])')], open = !ds.some(d => d.open);
      ds.forEach(d => { d.open = open; });
    });
    syncFree(); updateAllBtn();
  }
  function setMode(free){
    if (!FR || free === freeOn) return;
    playing = false; cancelAll(); freeOn = free; dragKey = null; freeBusy = false;
    el('lab').classList.toggle('free', free);
    el('stepsBox').hidden = free; el('freeBox').hidden = !free;
    ['btnPlay', 'btnPrev', 'btnNext', 'askWrap'].forEach(k => { el(k).hidden = free; });
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mode === 'free') === free)));
    if (free){ L.base(S); if (FR.start) FR.start(S); S.sel = selKey = null; setParams({}); } else reset();
    placePanel(); renderChips(); updateNav();
  }
  // Bàn phím / bút trình chiếu ở chế độ tự do: ←/→ (PageUp/PageDown) dịch dụng cụ đang chọn, ↑/↓ chọn dụng cụ khác
  let selKey = null;
  function freeKey(e){
    if (!FR || !FR.drag || !FR.drag.nudge) return;
    const dir = (e.key === 'ArrowRight' || e.key === 'PageDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'PageUp') ? -1 : 0;
    const cyc = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!dir && !cyc) return;
    const items = FR.drag.items(P); if (!items.length) return;
    e.preventDefault();
    let i = items.indexOf(selKey);
    if (i < 0) i = 0; else if (cyc) i = (i + cyc + items.length) % items.length;
    S.sel = selKey = items[i];
    if (dir) setParams(FR.drag.nudge(selKey, dir, P));
  }
  // Toàn màn hình chỉ còn sân khấu: bảng điều chỉnh chuyển thành bảng nổi, mở bằng nút trên sân khấu
  function placePanel(){
    if (!FR) return;
    const lab = el('lab'), stage = lab.querySelector('.stage'), box = el('freeBox'), btn = el('fsPanelBtn');
    const fs = document.fullscreenElement === lab && freeOn;
    btn.hidden = !fs;
    if (fs){
      if (box.parentElement !== stage) stage.appendChild(box);   // nằm trong sân khấu: không che dòng chú thích
      box.classList.add('float'); box.hidden = btn.getAttribute('aria-expanded') !== 'true';
    } else {
      if (box.parentElement === stage) el('stepsBox').after(box);
      box.classList.remove('float'); box.hidden = !freeOn; btn.setAttribute('aria-expanded', 'false');
    }
  }
  if (FR){
    // kéo dụng cụ trên giá: đổi tọa độ chuột sang đơn vị cảnh, module quyết định kéo cái gì
    const toScene = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left - g.ox) / g.sc, y: (g.oy - (e.clientY - r.top)) / g.sc }; };
    const tol = () => Math.max(1.2, 16 / g.sc);
    canvas.addEventListener('pointerdown', e => {
      if (!freeOn) return;
      const p = toScene(e); dragKey = FR.drag.hit(S, P, p.x, p.y, tol());
      if (!dragKey) return;
      S.sel = selKey = dragKey;   // bấm vào dụng cụ nào thì phím ←/→ dịch dụng cụ đó
      e.preventDefault(); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', e => {
      if (!freeOn) return;
      const p = toScene(e);
      if (dragKey) setParams(FR.drag.move(dragKey, p.x, p.y, S, P));
      else canvas.style.cursor = FR.drag.hit(S, P, p.x, p.y, tol()) ? 'grab' : '';
    });
    const endDrag = () => { if (dragKey){ dragKey = null; canvas.style.cursor = ''; } };
    canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
    root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode === 'free')));
    el('fsPanelBtn').addEventListener('click', () => {
      const open = el('fsPanelBtn').getAttribute('aria-expanded') !== 'true';
      el('fsPanelBtn').setAttribute('aria-expanded', String(open)); el('freeBox').hidden = !open;
    });
    buildFree();
  }

  /* trợ lý AI: gọi /api/ask (Gemini, key giữ ở máy chủ) */
  const turns = [];
  const chatLog = el('chatLog');
  function appendMsg(who, t, extraClass){
    const m = document.createElement('div'); m.className = 'msg ' + who + (extraClass ? ' ' + extraClass : '');
    m.textContent = t; chatLog.appendChild(m); chatLog.scrollTop = chatLog.scrollHeight; return m;
  }
  function setMsg(m, t, canned){
    m.classList.remove('thinking'); m.textContent = t;
    if (canned){ const s = document.createElement('span'); s.className = 'canned'; s.textContent = '(Câu trả lời soạn sẵn, dùng khi mất mạng)'; m.appendChild(s); }
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  appendMsg('ai', 'Chào em! Em có thắc mắc gì về thí nghiệm thì hỏi mình nhé. Mình biết em đang ở bước nào.');
  function currentChips(){ return freeOn ? (FR.chips || []) : cur >= 0 ? (L.steps[cur].chips || []) : (L.startChips || []); }
  function renderChips(){
    const box = el('chips'); box.innerHTML = '';
    currentChips().forEach(c => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c.q;
      b.addEventListener('click', () => sendChat(c.q, c.a)); box.appendChild(b);
    });
  }
  function openChat(){
    showPanel('chat'); el('chatBack').hidden = !interactive; renderChips(); openBubble();
    if (window.matchMedia('(pointer:fine)').matches) setTimeout(() => el('chatInput').focus({ preventScroll:true }), 120);
  }
  function describeState(){
    const lines = [];
    if (freeOn){
      lines.push('Học sinh đang ở chế độ TỰ DO: tự lắp và chỉnh thí nghiệm, không theo các bước SGK.');
      lines.push('Thông số đang đặt: ' + FR.params.filter(visible).map(p => `${p.label}: ${paramText(p)}`).join('; ') + '.');
      lines.push(...(L.describe ? L.describe(FR.target(P)) : []));   // trạng thái đích, không phải khung hình giữa hoạt ảnh
      lines.push('Điều đang quan sát được: ' + FR.observe(S, P));
      return lines.join('\n');
    }
    const st = cur >= 0 ? L.steps[cur] : null;
    lines.push(st ? `Bước ${cur + 1}/${L.steps.length}: ${st.title}. Hướng dẫn: ${st.sgk}` : 'Thí nghiệm chưa bắt đầu.');
    if (done.size) lines.push('Các bước đã làm xong: ' + [...done].sort((a, b) => a - b).map(i => i + 1).join(', ') + '.');
    if (st && done.has(cur)) lines.push('Điều vừa quan sát được: ' + st.note);
    lines.push(...(L.describe ? L.describe(S) : []));
    if (pendingQ) lines.push(`Câu hỏi trợ lý đang hỏi học sinh: "${pendingQ.text}" Các lựa chọn: ${pendingQ.opts.map((o, i) => LETTERS[i] + '. ' + o).join('; ')}.`);
    if (lastAnswer) lines.push(`Học sinh vừa chọn "${lastAnswer.q.opts[lastAnswer.c]}" và ${lastAnswer.ok ? 'đã đúng' : 'chưa đúng (đừng nói thẳng đáp án đúng)'}.`);
    return lines.join('\n');
  }
  let inflight = null;
  async function sendChat(text, canned){
    text = String(text || '').trim().slice(0, 500); if (!text) return;
    turns.push({ role:'user', content:text }); appendMsg('user', text);
    const m = appendMsg('ai', 'Đang suy nghĩ…', 'thinking');
    if (!navigator.onLine){
      setMsg(m, canned || 'Đang mất mạng nên mình chưa trả lời câu hỏi tự do được. Em thử bấm các câu gợi ý, hoặc hỏi thầy cô nhé.', !!canned);
      if (canned) turns.push({ role:'assistant', content:canned });
      return;
    }
    if (inflight) inflight.abort();
    const ctl = new AbortController(); inflight = ctl;
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch('/api/ask', {
        method:'POST', headers:{ 'Content-Type':'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ lesson: L.id, lessonTitle: `${L.grade} – ${L.lesson}: ${L.title}`, state: describeState(), messages: turns.slice(-10) })
      });
      if (r.status === 429){ setMsg(m, 'Đang có nhiều câu hỏi quá, em đợi một chút rồi hỏi lại nhé.'); return; }
      if (!r.ok) throw new Error('http ' + r.status);
      const data = await r.json();
      setMsg(m, data.text); turns.push({ role:'assistant', content:data.text });
    } catch (e){
      if (canned){ setMsg(m, canned, true); turns.push({ role:'assistant', content:canned }); }
      else setMsg(m, 'Mình chưa kết nối được tới máy chủ. Em thử hỏi lại sau, hoặc bấm các câu gợi ý nhé.');
    } finally { clearTimeout(timer); if (inflight === ctl) inflight = null; }
  }
  el('chatForm').addEventListener('submit', e => { e.preventDefault(); const v = el('chatInput').value; el('chatInput').value = ''; sendChat(v); });

  /* trạng thái mạng */
  const net = el('net');
  function updateNet(){
    const on = navigator.onLine; net.dataset.online = String(on);
    net.textContent = on ? 'Đang có mạng · trợ lý AI sẵn sàng' : 'Đang mất mạng · mô phỏng vẫn chạy, hỏi tự do tạm tắt';
  }
  window.addEventListener('online', updateNet); window.addEventListener('offline', updateNet); updateNet();

  /* khởi động */
  L.base(S); L.rest(S);
  setCaption(-1); renderSteps(); renderStats(); updateNav(); renderChips();
  requestAnimationFrame(frame);
}
