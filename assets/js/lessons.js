// Danh sách thí nghiệm hiển thị ở trang chủ.
// Thêm bài mới: thêm một dòng ở đây (xem README, mục "Thêm thí nghiệm mới").
export const LESSONS = [
  {
    id: 'thau-kinh',
    href: '/thau-kinh/',
    grade: 'KHTN 9',
    lesson: 'Bài 8',
    title: 'Thấu kính hội tụ và thấu kính phân kì',
    desc: 'Chùm sáng qua thấu kính, ảnh thật và ảnh ảo trên giá quang học. 8 bước theo SGK, 4 câu hỏi mồi.',
    thumb: `<svg class="thumb" viewBox="0 0 200 100" role="img" aria-label="Chùm tia sáng hội tụ qua thấu kính">
      <line x1="10" y1="50" x2="190" y2="50" stroke="var(--stage-muted)" stroke-dasharray="4 4"/>
      <g stroke="var(--beam)" stroke-width="2" fill="none" stroke-linecap="round">
        <path d="M20 34 L96 34 L190 62"/><path d="M20 42 L96 42 L190 56"/><path d="M20 50 L190 50"/>
        <path d="M20 58 L96 58 L190 44"/><path d="M20 66 L96 66 L190 38"/>
      </g>
      <path d="M100 18 Q112 50 100 82 Q88 50 100 18 Z" fill="var(--glass)" fill-opacity=".3" stroke="var(--glass)" stroke-width="1.5"/>
      <circle cx="148" cy="50" r="3" fill="var(--stage-ink)"/>
    </svg>`
  }
];
