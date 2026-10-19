// Danh mục môn và bài thí nghiệm. Trang chủ dựng từ file này.
// Thêm bài mới: thêm một dòng vào LESSONS.
//   status: 'ready' = đã có module chạy được; 'planned' = đang soạn
//   grade: số lớp (6–9), dùng để lọc theo lớp
//   ai: true nếu bài có câu hỏi mồi (hiện nhãn "Có câu hỏi AI")

export const SUBJECTS = [
  { id: 'vat-li',   name: 'Vật lí',   topic: 'Năng lượng và sự biến đổi' },
  { id: 'hoa-hoc',  name: 'Hóa học',  topic: 'Chất và sự biến đổi của chất' },
  { id: 'sinh-hoc', name: 'Sinh học', topic: 'Vật sống' }
];

export const LESSONS = [
  {
    id: 'thau-kinh', subject: 'vat-li', grade: 9, lesson: 'Bài 8',
    title: 'Thấu kính hội tụ và thấu kính phân kì',
    desc: 'Chùm sáng qua thấu kính, ảnh thật và ảnh ảo trên giá quang học. 8 bước theo SGK, 4 câu hỏi mồi.',
    status: 'ready', ai: true,
    href: '/thau-kinh/',
    module: '/assets/js/lessons/thau-kinh.js'
  },
  {
    id: 'toc-do-phan-ung', subject: 'hoa-hoc', grade: 8, lesson: 'Bài 7',
    title: 'Tốc độ phản ứng: đá vôi và acid',
    desc: 'Hai bình đá vôi với acid chạy cùng lúc: diện tích bề mặt, nồng độ, nhiệt độ. 5 bước, 3 câu hỏi mồi.',
    status: 'ready', ai: true,
    href: '/toc-do-phan-ung/',
    module: '/assets/js/lessons/toc-do-phan-ung.js'
  },
  {
    id: 'quang-hop', subject: 'sinh-hoc', grade: 7, lesson: 'Bài 24',
    title: 'Chứng minh quang hợp tạo ra tinh bột',
    desc: 'Bịt lá khoai lang bằng giấy đen, chiếu sáng, tẩy diệp lục rồi thử iodine. 5 bước, 4 câu hỏi mồi.',
    status: 'ready', ai: true,
    href: '/quang-hop/',
    module: '/assets/js/lessons/quang-hop.js'
  }
];
