// Trang một môn (/vat-li, /hoa-hoc, /sinh-hoc): danh sách bài theo lớp 6–9, dựng từ catalog.
// Tab đang chọn ghi trên URL (#lop-7) để tải lại trang vẫn giữ đúng lớp.

import { esc } from '../engine.js';
import { SUBJECTS, LESSONS } from '../catalog.js';
import { SUBJECT_ART, LESSON_ART, animateOnHover } from '../art.js';

const GRADES = [6, 7, 8, 9];
const TABS = [...GRADES, 0];   // 0 = Tất cả
const SITE = 'Phòng thí nghiệm KHTN';

const app = document.getElementById('app');
const slug = location.pathname.split('/').filter(Boolean)[0] || '';
const subject = SUBJECTS.find(s => s.id === slug);

const lessonNo = l => parseInt(String(l.lesson).replace(/\D+/g, ''), 10) || 0;

function notFound(){
  document.title = `Không tìm thấy môn học · ${SITE}`;
  app.innerHTML = `
<div class="wrap">
  <header class="page">
    <a class="home-link" href="/">← Trang chủ</a>
    <h1>Không tìm thấy môn học</h1>
    <p class="lead">Đường dẫn này không ứng với môn nào. Em quay lại trang chủ để chọn Vật lí, Hóa học hoặc Sinh học nhé.</p>
  </header>
  <p><a class="pbtn" href="/">Về trang chủ</a></p>
</div>`;
}

function lessonCard(l){
  const ready = l.status === 'ready';
  const tags = (ready && l.ai ? '<span class="tag ai"><i></i>Có câu hỏi AI</span>' : '') +
               (ready ? '' : '<span class="tag soon">Đang soạn</span>');
  const art = LESSON_ART[l.id] ? `<div class="subj-art lcard-art">${LESSON_ART[l.id]}</div>` : '';
  const inner = art + `<span class="meta">KHTN ${esc(l.grade)} · ${esc(l.lesson)}</span><h3>${esc(l.title)}</h3>` +
    (l.desc ? `<p>${esc(l.desc)}</p>` : '') + (tags ? `<span class="tags">${tags}</span>` : '');
  return ready
    ? `<li><a class="lcard" href="${esc(l.href)}">${inner}</a></li>`
    : `<li><div class="lcard planned" aria-disabled="true">${inner}</div></li>`;
}
const grid = list => `<ul class="lgrid">${list.map(lessonCard).join('')}</ul>`;

function mount(){
  const lessons = LESSONS.filter(l => l.subject === subject.id)
    .sort((a, b) => a.grade - b.grade || lessonNo(a) - lessonNo(b));
  const nReady = lessons.filter(l => l.status === 'ready').length;
  const countIn = g => g ? lessons.filter(l => l.grade === g).length : lessons.length;

  document.title = `${subject.name} · ${SITE}`;
  app.innerHTML = `
<div class="wrap" data-subject="${esc(subject.id)}">
  <nav class="crumbs" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span aria-hidden="true">›</span><span aria-current="page">${esc(subject.name)}</span></nav>
  <header class="subj-hero">
    <div class="hero-text">
      <span class="eyebrow">Khoa học tự nhiên THCS · Kết nối tri thức</span>
      <h1>${esc(subject.name)}</h1>
      <p class="hero-topic">${esc(subject.topic)}</p>
      <p class="hero-count">${nReady ? `<b>${nReady}</b> thí nghiệm sẵn sàng` : 'Đang soạn thí nghiệm'}</p>
    </div>
    <div class="subj-art hero-art live">${SUBJECT_ART[subject.id] || ''}</div>
  </header>
  <div class="grade-tabs" role="tablist" aria-label="Chọn lớp">
    ${TABS.map(g => `<button class="gtab" type="button" role="tab" id="tab-${g}" aria-controls="panel" data-g="${g}">${g ? 'Lớp ' + g : 'Tất cả'}<span class="n">${countIn(g)}</span></button>`).join('')}
  </div>
  <div class="tab-panel" id="panel" role="tabpanel" tabindex="0"></div>
  <footer class="page">Mô phỏng phục vụ dạy học. Nội dung các bước bám theo SGK Khoa học tự nhiên (Kết nối tri thức).</footer>
</div>`;

  const tabs = [...app.querySelectorAll('.gtab')];
  const panel = app.querySelector('#panel');

  function currentGrade(){
    const m = /^#lop-(\d)$/.exec(location.hash);
    const g = m ? Number(m[1]) : 0;
    return GRADES.includes(g) ? g : 0;
  }
  function render(){
    const g = currentGrade();
    tabs.forEach(t => {
      const on = Number(t.dataset.g) === g;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'tab-' + g);
    const list = g ? lessons.filter(l => l.grade === g) : lessons;
    if (!list.length){
      panel.innerHTML = `<p class="empty-note">${g ? `Môn ${esc(subject.name)} chưa có thí nghiệm lớp ${g}.` : `Môn ${esc(subject.name)} chưa có thí nghiệm nào.`} Các bài mới sẽ được thêm dần.</p>`;
    } else if (g){
      panel.innerHTML = grid(list);
    } else {
      panel.innerHTML = GRADES.filter(x => list.some(l => l.grade === x))
        .map(x => `<section class="lgroup" aria-label="Lớp ${x}"><h2>Lớp ${x}</h2>${grid(list.filter(l => l.grade === x))}</section>`).join('');
    }
    animateOnHover([...panel.querySelectorAll('a.lcard')]);
  }
  function select(g, focus){
    history.replaceState(null, '', g ? '#lop-' + g : location.pathname);
    render();
    if (focus) app.querySelector(`#tab-${g}`).focus();
  }

  tabs.forEach(t => t.addEventListener('click', () => select(Number(t.dataset.g))));
  // ←/→ (hoặc bút trình chiếu) để chuyển lớp
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.altKey || e.ctrlKey || e.metaKey) return;
    const step = (e.key === 'ArrowRight' || e.key === 'PageDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'PageUp') ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = TABS.indexOf(currentGrade());
    select(TABS[(i + step + TABS.length) % TABS.length], tabs.includes(document.activeElement));
  });
  window.addEventListener('hashchange', render);
  render();
}

if (subject) mount(); else notFound();
