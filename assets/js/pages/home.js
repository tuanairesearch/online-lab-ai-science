// Trang chủ: 3 thẻ môn Vật lí / Hóa học / Sinh học, dựng từ catalog.

import { esc } from '../engine.js';
import { SUBJECTS, LESSONS } from '../catalog.js';
import { SUBJECT_ART, animateOnHover } from '../art.js';

const MAX_FEATURED = 3;

function subjectCard(s){
  const ready = LESSONS.filter(l => l.subject === s.id && l.status === 'ready');
  const featured = ready.slice(0, MAX_FEATURED).map(l => `
      <li><a href="${esc(l.href)}"><span class="meta">KHTN ${esc(l.grade)} · ${esc(l.lesson)}</span><span class="t">${esc(l.title)}</span></a></li>`).join('');
  const count = ready.length
    ? `<p class="subj-count"><b>${ready.length}</b> thí nghiệm sẵn sàng</p>`
    : `<p class="subj-count empty">Đang soạn thí nghiệm</p>`;
  return `
  <article class="subj" data-subject="${esc(s.id)}">
    <div class="subj-art">${SUBJECT_ART[s.id] || ''}</div>
    <div class="subj-body">
      <h2><a class="subj-link" href="/${esc(s.id)}">${esc(s.name)}</a></h2>
      <p class="subj-tag">${esc(s.topic)}</p>
      ${count}
      ${featured ? `<ul class="subj-lessons" aria-label="Thí nghiệm tiêu biểu">${featured}</ul>` : ''}
      <span class="subj-go" aria-hidden="true">Vào môn ${esc(s.name)} →</span>
    </div>
  </article>`;
}

document.getElementById('subjects').innerHTML = SUBJECTS.map(subjectCard).join('');

// hình minh họa chuyển động khi rê chuột / chọn bằng phím / thẻ hiện trên màn hình cảm ứng
animateOnHover([...document.querySelectorAll('.subj')]);
