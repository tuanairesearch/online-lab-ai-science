// Hình minh họa SVG cho từng môn (thẻ môn ở trang chủ, đầu trang môn) và từng thí nghiệm (thẻ bài ở trang môn).
// Vẽ trên nền sân khấu tối, màu lấy từ biến CSS.
// Hình đứng yên; khi khung chứa có lớp .live thì chuyển động (xem lab.css, mục "hình minh họa môn").

// Mạch điện: dây đi từ cực + của pin (trên) → đèn → công tắc → về cực − (dưới),
// nên chấm sáng chạy theo đúng chiều quy ước của dòng điện.
const WIRE = 'M30 36 V30 H170 V86 H30 V64';

// Tế bào thấy qua kính hiển vi: các ô xếp so le, mỗi ô một nhân; nhân hiện dần từ trái sang phải.
const VIEW = { cx: 142, cy: 50, r: 39 };
function viewCells(){
  let s = '';
  for (let r = 0, y = 8; y < 94; r++, y += 12)
    for (let x = r % 2 ? 92 : 103; x < 190; x += 22)
      s += `<rect x="${x}" y="${y}" width="22" height="12" rx="2"/><circle class="nuc" cx="${x + 7 + (r * 5 + x) % 9}" cy="${y + 6}" r="2.2" style="--d:${((x - 92) / 98 * 0.5).toFixed(2)}s"/>`;
  return s;
}

// Bật lớp .live (hình chuyển động) khi rê chuột hoặc chọn thẻ bằng phím;
// máy cảm ứng không rê chuột được nên chạy khi thẻ hiện rõ trên màn hình.
const hoverable = typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches;
const io = !hoverable && 'IntersectionObserver' in globalThis
  ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.intersectionRatio >= 0.6)), { threshold: [0, 0.6] })
  : null;
export function animateOnHover(els){
  els.forEach(c => {
    const set = on => c.classList.toggle('live', on);
    c.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') set(true); });
    c.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') set(false); });
    // chỉ focus bằng phím: bấm chuột cũng focus link, và khi quay lại tab trình duyệt trả focus về link đó
    c.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) set(true); });
    c.addEventListener('focusout', () => set(false));
    if (io) io.observe(c);
  });
}

/* ---------- hình minh họa từng thí nghiệm (thẻ bài ở trang môn), theo id trong catalog ---------- */
// Thấu kính: ba tia song song từ đèn qua thấu kính hội tụ, gặp nhau tại F' rồi đi tiếp.
const lensRays = [34, 50, 66].map((y0, i) => {
  const d = `M18 ${y0} H100 L140 50 L190 ${50 + (50 - y0) * 50 / 40}`;
  return `<path class="ray-draw" d="${d}" pathLength="1" style="--d:${(i * 0.12).toFixed(2)}s"/><path class="ray-flow" d="${d}" pathLength="1"/>`;
}).join('');
// Tốc độ phản ứng: hai bình tam giác (bình 1 đá vôi viên, bình 2 đá vôi bột) nối xi lanh, đồ thị thể tích khí.
function flask(cx, col, solid, bubbles, plunger){
  return `
    <path d="M${cx - 10.8} 74 L${cx - 17} 92 H${cx + 17} L${cx + 10.8} 74 Z" fill="var(--liquid)" fill-opacity=".45"/>
    ${solid}
    <g fill="none" stroke="var(--gas)" stroke-width="1">${bubbles}</g>
    <path d="M${cx - 4} 42 V54 L${cx - 17} 92 H${cx + 17} L${cx + 4} 54 V42" fill="none" stroke="var(--glass)" stroke-width="1.8" stroke-linejoin="round"/>
    <rect x="${cx - 5.5}" y="37" width="11" height="5" rx="1" fill="var(--stage-muted)"/>
    <path d="M${cx} 37 V27 H${cx - 17} V18 H${cx - 14}" fill="none" stroke="var(--stage-muted)" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="${cx - 14}" y="14" width="26" height="8" rx="1" fill="none" stroke="var(--glass)" stroke-width="1.4"/>
    <g class="tr-plunger" style="--x:${plunger.x}px;--t:${plunger.t}s" stroke="${col}" stroke-width="2" stroke-linecap="round">
      <line x1="${cx - 12}" y1="15.5" x2="${cx - 12}" y2="20.5"/><line x1="${cx - 12}" y1="18" x2="${cx + 16}" y2="18" stroke-width="1.4"/><line x1="${cx + 16}" y1="14" x2="${cx + 16}" y2="22"/>
    </g>`;
}
const bubbleSet = (cx, n, t, spread) => Array.from({ length: n }, (_, i) =>
  `<circle class="tr-bub" cx="${(cx + (i / Math.max(1, n - 1) - 0.5) * spread).toFixed(1)}" cy="${89 - (i % 2)}" r="${1.2 + (i % 3) * 0.4}" style="--t:${t}s;--d:${(i * t / n).toFixed(2)}s"/>`).join('');
// Quang hợp: lá khoai lang hình tim (cùng hình với mô phỏng), gốc cuống ở (cx, by), cao s.
// Khi chuyển động: nắng chiếu lá (phần bịt giấy đen không nhận sáng) → panh nhúng lá đã tẩy màu vào đĩa iodine,
// màu ngấm từ mép lá vào: phần không bịt xanh tím, phần bịt vàng nâu; lá trong đĩa nảy lên, sao lấp lánh.
// Mặt trời quay, cây đung đưa liên tục trong lúc chuyển động.
function leafD(cx, by, s){
  const P = (x, y) => `${(cx + x * s).toFixed(1)} ${(by - y * s).toFixed(1)}`;
  return `M${P(0, 0.08)} C${P(-0.15, -0.14)} ${P(-0.62, -0.12)} ${P(-0.6, 0.32)} C${P(-0.58, 0.66)} ${P(-0.22, 0.84)} ${P(0, 1)} ` +
    `C${P(0.22, 0.84)} ${P(0.58, 0.66)} ${P(0.6, 0.32)} C${P(0.62, -0.12)} ${P(0.15, -0.14)} ${P(0, 0.08)} Z`;
}
const powder = cx =>Array.from({ length: 14 }, (_, i) => `<circle cx="${(cx - 11 + i * 1.7).toFixed(1)}" cy="${90 - (i * 7 % 3)}" r="1"/>`).join('');

export const LESSON_ART = {
  'thau-kinh': `<svg viewBox="0 0 200 100" role="img" aria-label="Ba tia sáng song song qua thấu kính hội tụ gặp nhau tại tiêu điểm">
    <line x1="8" y1="50" x2="196" y2="50" stroke="var(--stage-muted)" stroke-width="1" stroke-dasharray="4 4" opacity=".7"/>
    <rect x="6" y="30" width="11" height="40" rx="3" fill="var(--stage-2)" stroke="var(--stage-muted)" stroke-width="1.4"/>
    <line class="tk-lamp" x1="17" y1="34" x2="17" y2="66" stroke="var(--beam)" stroke-width="2.6" stroke-linecap="round"/>
    <g fill="none" stroke="var(--beam)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${lensRays}</g>
    <path d="M100 16 Q113 50 100 84 Q87 50 100 16 Z" fill="var(--glass)" fill-opacity=".28" stroke="var(--glass)" stroke-width="1.6"/>
    <circle cx="60" cy="50" r="2" fill="var(--stage-ink)"/>
    <circle class="tk-focus" cx="140" cy="50" r="4" fill="var(--beam)"/>
    <circle cx="140" cy="50" r="2" fill="var(--stage-ink)"/>
    <g fill="var(--stage-ink)" font-size="9" font-weight="700" text-anchor="middle" font-family="system-ui, sans-serif"><text x="60" y="62">F</text><text x="142" y="62">F'</text></g>
  </svg>`,
  'toc-do-phan-ung': `<svg viewBox="0 0 200 100" role="img" aria-label="Hai bình đá vôi với acid nối xi lanh: bình đá vôi bột sủi bọt nhanh hơn">
    <line x1="18" y1="93" x2="128" y2="93" stroke="var(--stage-line)" stroke-width="2"/>
    ${flask(40, 'var(--glass)', '<circle class="tr-rock" cx="40" cy="88" r="4" fill="var(--solid)"/>', bubbleSet(40, 2, 1.8, 4), { x: 6, t: 2.6 })}
    ${flask(100, 'var(--obj)', `<g class="tr-powder" fill="var(--solid)">${powder(100)}</g>`, bubbleSet(100, 7, 0.75, 20), { x: 19, t: 1 })}
    <path d="M140 18 V86 H194" fill="none" stroke="var(--stage-muted)" stroke-width="1.2"/>
    <line x1="140" y1="28" x2="194" y2="28" stroke="var(--img)" stroke-width="1" stroke-dasharray="3 3"/>
    <path class="tr-curve" d="M140 86 C150 40, 158 30, 194 29" pathLength="1" style="--t:1s" fill="none" stroke="var(--obj)" stroke-width="2.2" stroke-linecap="round"/>
    <path class="tr-curve" d="M140 86 C165 72, 182 54, 194 46" pathLength="1" style="--t:2.6s" fill="none" stroke="var(--glass)" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`,
  'quang-hop': `<svg viewBox="0 0 200 100" role="img" aria-label="Lá khoai lang bịt một dải giấy đen; sau khi nhúng vào dung dịch iodine, phần không bịt xanh tím, phần bịt không có màu xanh tím">
    <defs>
      <clipPath id="qh-leaf"><path d="${leafD(140, 84, 70)}"/></clipPath>
      <mask id="qh-soak"><rect width="200" height="100" fill="#000"/><circle class="qh-soak" cx="140" cy="50" r="60" fill="#fff"/></mask>
    </defs>
    <g class="qh-sun-g">
      <g class="qh-spin" stroke="var(--beam)" stroke-width="1.4" stroke-linecap="round">${
        Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
          return `<line x1="${(14 + 7 * c).toFixed(1)}" y1="${(12 + 7 * s).toFixed(1)}" x2="${(14 + 10 * c).toFixed(1)}" y2="${(12 + 10 * s).toFixed(1)}"/>`; }).join('')}</g>
      <circle class="qh-sun" cx="14" cy="12" r="5"/>
    </g>
    <g class="qh-rays" stroke="var(--beam)" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 3">
      <line x1="19" y1="16" x2="38" y2="31"/><line x1="20" y1="14" x2="44" y2="25"/><line x1="20" y1="12" x2="50" y2="20"/>
    </g>
    <path d="M18 93 H86" stroke="var(--stage-line)" stroke-width="2"/>
    <path d="M40 93 L44 76 H64 L68 93 Z" fill="var(--pot)"/>
    <g class="qh-plant">
    <path d="M54 76 Q54 70 56 66" fill="none" stroke="var(--leaf)" stroke-width="2"/>
    <path d="M56 66 V58" stroke="var(--leaf)" stroke-width="2"/>
    <path d="${leafD(56, 62, 46)}" fill="var(--leaf)" stroke="var(--stage)" stroke-width="1"/>
    <rect x="26" y="${62 - 46 * 0.62}" width="60" height="${46 * 0.26}" fill="var(--paper)" stroke="var(--stage-muted)" stroke-width="1"/>
    </g>
    <path class="qh-arrow" d="M92 50 H106 M101 45 L106 50 L101 55" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="140" cy="50" r="44" fill="var(--stage-2)" stroke="var(--glass)" stroke-width="1.4"/>
    <circle cx="140" cy="50" r="41" fill="var(--iodine)" fill-opacity=".3"/>
    <g class="qh-dip"><g class="qh-result">
    <path d="${leafD(140, 84, 70)}" fill="var(--starch)"/>
    <g clip-path="url(#qh-leaf)">
      <rect x="90" y="${84 - 70 * 0.62}" width="100" height="${70 * 0.26}" fill="var(--leaf-pale)"/>
      <rect x="90" y="${84 - 70 * 0.62}" width="100" height="${70 * 0.26}" fill="var(--iodine)" fill-opacity=".55"/>
    </g>
    <path d="${leafD(140, 84, 70)}" fill="var(--leaf-pale)" mask="url(#qh-soak)"/>
    <path d="${leafD(140, 84, 70)}" fill="none" stroke="var(--stage)" stroke-width="1"/>
    </g></g>
    <circle class="qh-ripple" cx="140" cy="50" r="36" fill="none" stroke="var(--iodine)" stroke-width="1.6"/>
    <g class="qh-spark" fill="var(--beam)">${[[104, 22, 0], [178, 30, .4], [170, 86, .8]].map(([x, y, d]) =>
      `<path d="M${x} ${y - 5} L${x + 1.3} ${y - 1.3} L${x + 5} ${y} L${x + 1.3} ${y + 1.3} L${x} ${y + 5} L${x - 1.3} ${y + 1.3} L${x - 5} ${y} L${x - 1.3} ${y - 1.3} Z" style="--d:${d}s"/>`).join('')}</g>
    <g class="qh-tongs" fill="none" stroke="var(--stage-ink)" stroke-width="1.6" stroke-linecap="round">
      <path d="M154 -6 L141 15"/><path d="M159 -4 L142.5 15.5"/>
    </g>
  </svg>`
};

export const SUBJECT_ART = {
  'vat-li': `<svg viewBox="0 0 200 100" role="img" aria-label="Mạch điện gồm pin, công tắc và bóng đèn">
    <defs><radialGradient id="bulbGlow"><stop offset="0" style="stop-color:var(--beam)"/><stop offset="1" style="stop-color:var(--beam);stop-opacity:0"/></radialGradient></defs>
    <circle class="c-glow" cx="100" cy="15" r="32" fill="url(#bulbGlow)"/>
    <path d="${WIRE}" fill="none" stroke="var(--stage-muted)" stroke-width="2" stroke-linejoin="round"/>
    <path class="c-flow" d="${WIRE}" fill="none" stroke="var(--beam)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0.1 11.9"/>
    <rect x="163" y="52" width="14" height="12" fill="var(--stage)"/>
    <circle cx="170" cy="50" r="2.6" fill="var(--stage-ink)"/><circle cx="170" cy="66" r="2.6" fill="var(--stage-ink)"/>
    <line class="c-sw" x1="170" y1="66" x2="170" y2="50" stroke="var(--stage-ink)" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="26" y="34" width="8" height="5" rx="1" fill="var(--stage-muted)"/>
    <rect x="21" y="38" width="18" height="26" rx="3" fill="var(--stage-2)" stroke="var(--stage-muted)" stroke-width="1.5"/>
    <g fill="var(--stage-ink)" font-size="10" font-weight="700" text-anchor="middle" font-family="system-ui, sans-serif">
      <text x="30" y="49">+</text><text x="30" y="60">−</text>
    </g>
    <g class="c-rays" stroke="var(--beam)" stroke-width="2" stroke-linecap="round">
      <line x1="85" y1="15" x2="79" y2="15"/><line x1="115" y1="15" x2="121" y2="15"/>
      <line x1="89" y1="5" x2="85" y2="1"/><line x1="111" y1="5" x2="115" y2="1"/>
    </g>
    <circle class="c-glass" cx="100" cy="15" r="10" stroke="var(--glass)" stroke-width="1.6"/>
    <path class="c-fil" d="M96 25 V18 L98 14 L100 18 L102 14 L104 18 V25" fill="none" stroke-width="1.3" stroke-linejoin="round"/>
    <rect x="94" y="24" width="12" height="9" rx="1.5" fill="var(--stage-muted)"/>
  </svg>`,
  'hoa-hoc': `<svg viewBox="0 0 200 100" role="img" aria-label="Bình tam giác đun trên đèn cồn">
    <line x1="40" y1="97" x2="160" y2="97" stroke="var(--stage-line)" stroke-width="2"/>
    <g stroke="var(--stage-muted)" stroke-width="2" stroke-linecap="round"><line x1="72" y1="59" x2="65" y2="96"/><line x1="128" y1="59" x2="135" y2="96"/></g>
    <rect class="h-gauze" x="68" y="57" width="64" height="2.6" rx="1"/>
    <path d="M85 42 L77.5 52 Q76.5 55 79.5 55 H120.5 Q123.5 55 122.5 52 L115 42 Z" fill="var(--glass)" fill-opacity=".3"/>
    <g fill="none" stroke="var(--stage-ink)" stroke-width="1.1">
      <circle class="boil" cx="89" cy="52" r="1.6" style="--d:0s"/>
      <circle class="boil" cx="96" cy="53" r="2" style="--d:.3s"/>
      <circle class="boil" cx="103" cy="52" r="1.4" style="--d:.15s"/>
      <circle class="boil" cx="109" cy="53" r="1.9" style="--d:.45s"/>
      <circle class="boil" cx="99" cy="50" r="1.2" style="--d:.6s"/>
    </g>
    <path d="M94 16 V30 L76.5 53 Q75 56 79 56 H121 Q125 56 123.5 53 L106 30 V16" fill="none" stroke="var(--glass)" stroke-width="2" stroke-linejoin="round"/>
    <line x1="91" y1="16" x2="109" y2="16" stroke="var(--glass)" stroke-width="2.5" stroke-linecap="round"/>
    <g fill="none" stroke="var(--stage-ink)" stroke-width="1.4" stroke-linecap="round">
      <path class="steam" d="M96 13 q-3 -3 0 -6 q3 -3 0 -6" style="--d:0s"/>
      <path class="steam" d="M100 13 q3 -3 0 -6 q-3 -3 0 -6" style="--d:.5s"/>
      <path class="steam" d="M104 13 q-3 -3 0 -6 q3 -3 0 -6" style="--d:1s"/>
    </g>
    <g class="h-flame">
      <path d="M100 74 C94.5 71 95.5 65 100 59 C104.5 65 105.5 71 100 74 Z" fill="var(--obj)"/>
      <path d="M100 74 C97.5 72 98 68.5 100 65.5 C102 68.5 102.5 72 100 74 Z" fill="var(--beam)"/>
    </g>
    <line x1="100" y1="77" x2="100" y2="74" stroke="var(--stage-ink)" stroke-width="1.6"/>
    <rect x="96" y="77" width="8" height="6" rx="1" fill="var(--stage-muted)"/>
    <path d="M84 96 Q84 82 100 82 Q116 82 116 96 Z" fill="var(--glass)" fill-opacity=".12" stroke="var(--glass)" stroke-width="1.6"/>
    <path d="M86.5 95 Q87 89 100 89 Q113 89 113.5 95 Z" fill="var(--glass)" fill-opacity=".35"/>
  </svg>`,
  'sinh-hoc': `<svg viewBox="0 0 200 100" role="img" aria-label="Kính hiển vi và các tế bào nhìn thấy qua kính">
    <defs><clipPath id="viewClip"><circle cx="${VIEW.cx}" cy="${VIEW.cy}" r="${VIEW.r}"/></clipPath></defs>
    <path d="M46 9 L106 34" stroke="var(--stage-muted)" stroke-width="1.2" stroke-dasharray="3 3" opacity=".6"/>
    <circle cx="${VIEW.cx}" cy="${VIEW.cy}" r="${VIEW.r}" fill="var(--stage-2)"/>
    <circle class="v-light" cx="${VIEW.cx}" cy="${VIEW.cy}" r="${VIEW.r}" fill="var(--stage-ink)"/>
    <g clip-path="url(#viewClip)"><g class="v-drift"><g class="v-cells" fill="none" stroke="var(--img)" stroke-width="1.3">${viewCells()}</g></g></g>
    <circle cx="${VIEW.cx}" cy="${VIEW.cy}" r="${VIEW.r}" fill="none" stroke="var(--stage-muted)" stroke-width="2.5"/>
    <rect x="20" y="90" width="52" height="6" rx="3" fill="var(--stage-2)" stroke="var(--stage-muted)" stroke-width="1.5"/>
    <path d="M64 90 V62 Q64 32 44 24" fill="none" stroke="var(--stage-muted)" stroke-width="6" stroke-linecap="round"/>
    <path class="m-beam" d="M35 70 L33 53 H43 L41 70 Z" fill="var(--beam)"/>
    <rect x="22" y="57.5" width="44" height="4" rx="1" fill="var(--stage-muted)"/>
    <rect x="28" y="55.5" width="20" height="2" fill="var(--glass)" fill-opacity=".8"/>
    <circle class="m-lamp" cx="38" cy="74" r="4.5" stroke="var(--stage-muted)" stroke-width="1.5"/>
    <g class="m-knob"><circle cx="64" cy="66" r="5" fill="var(--stage-2)" stroke="var(--stage-muted)" stroke-width="1.5"/><line x1="64" y1="66" x2="64" y2="61.5" stroke="var(--stage-ink)" stroke-width="1.5" stroke-linecap="round"/></g>
    <g class="m-tube">
      <rect x="34" y="12" width="8" height="28" fill="var(--stage-2)" stroke="var(--stage-muted)" stroke-width="1.5"/>
      <rect x="32" y="6" width="12" height="6" rx="1.5" fill="var(--stage-muted)"/>
      <rect x="31" y="40" width="14" height="4" rx="1" fill="var(--stage-muted)"/>
      <rect x="35" y="44" width="6" height="7" fill="var(--stage-muted)"/>
    </g>
  </svg>`
};
