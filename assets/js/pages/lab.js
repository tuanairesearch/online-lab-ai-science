// Trang thí nghiệm: đọc URL /<môn>/<bài> → tìm bài trong catalog → import động module bài → mountLab().

import { mountLab, esc } from '../engine.js';
import { SUBJECTS, LESSONS } from '../catalog.js';

const [mon = '', bai = ''] = location.pathname.split('/').filter(Boolean);
const subject = SUBJECTS.find(s => s.id === mon);
const entry = LESSONS.find(l => l.id === bai && l.subject === mon && l.status === 'ready');
const app = document.getElementById('app');

function notFound(){
  const back = subject ? `/${esc(subject.id)}` : '/';
  app.innerHTML = `
  <div class="wrap">
    <header class="page"><a class="home-link" href="${back}">← ${subject ? esc(subject.name) : 'Trang chủ'}</a><h1>Không tìm thấy thí nghiệm</h1></header>
    <p>Thí nghiệm này không có hoặc đang soạn.</p>
    <p><a class="pbtn" href="${back}">${subject ? 'Về môn ' + esc(subject.name) : 'Về trang chủ'}</a></p>
  </div>`;
  document.title = 'Không tìm thấy · Phòng thí nghiệm KHTN';
}

if (!entry) notFound();
else {
  try {
    const { default: lesson } = await import(entry.module);
    // nút quay lại trên trang thí nghiệm dẫn về trang môn
    lesson.subject = subject.id;
    lesson.subjectName = subject.name;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && entry.desc) desc.content = entry.desc;
    mountLab(app, lesson);
  } catch (err) {
    console.error(err);
    notFound();
  }
}
