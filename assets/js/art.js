// Hình minh họa SVG cho từng môn (thẻ môn ở trang chủ, đầu trang môn).
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
    <g clip-path="url(#viewClip)"><g class="v-cells" fill="none" stroke="var(--img)" stroke-width="1.3">${viewCells()}</g></g>
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
