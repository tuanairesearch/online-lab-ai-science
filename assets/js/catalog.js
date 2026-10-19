// Danh mục môn và bài thí nghiệm. Trang chủ dựng từ file này.
// Thêm bài mới: thêm một dòng vào LESSONS.
//   status: 'ready' = đã có module chạy được; 'planned' = đang soạn
//   grade: số lớp (6–9), dùng để lọc theo lớp
//   ai: true nếu bài có câu hỏi mồi (hiện nhãn "Có câu hỏi AI")
//   href: /<môn>/<bài>, mở bằng lab.html (rewrites trong vercel.json, serve.json)

export const SUBJECTS = [
  { id: 'vat-li',   name: 'Vật lí',   topic: 'Năng lượng và sự biến đổi' },
  { id: 'hoa-hoc',  name: 'Hóa học',  topic: 'Chất và sự biến đổi của chất' },
  { id: 'sinh-hoc', name: 'Sinh học', topic: 'Vật sống' }
];

export const LESSONS = [
  {
    id: 'thau-kinh', subject: 'vat-li', grade: 9, lesson: 'Bài 8',
    title: 'Thấu kính hội tụ và thấu kính phân kì',
    desc: 'Đường truyền ánh sáng qua thấu kính và thí nghiệm tạo ảnh vật sáng chữ F (d > f, d < f). 8 bước theo SGK, 4 câu hỏi mồi.',
    status: 'ready', ai: true,
    href: '/vat-li/thau-kinh',
    module: '/assets/js/lessons/thau-kinh.js'
  },
  {
    id: 'toc-do-phan-ung', subject: 'hoa-hoc', grade: 8, lesson: 'Bài 7',
    title: 'Tốc độ phản ứng và chất xúc tác',
    desc: 'Bốn hoạt động SGK chạy song song hai ống: nồng độ, nhiệt độ, diện tích bề mặt, chất xúc tác. 6 bước, 4 câu hỏi mồi.',
    status: 'ready', ai: true,
    href: '/hoa-hoc/toc-do-phan-ung',
    module: '/assets/js/lessons/toc-do-phan-ung.js'
  },
  {
    id: 'quang-hop', subject: 'sinh-hoc', grade: 7, lesson: 'Bài 24',
    title: 'Chứng minh quang hợp ở cây xanh',
    desc: 'Lá khoai lang tạo tinh bột khi được chiếu sáng (thử iodine) và rong đuôi chó thải khí oxygen (que đóm). 7 bước, 5 câu hỏi mồi.',
    status: 'ready', ai: true,
    href: '/sinh-hoc/quang-hop',
    module: '/assets/js/lessons/quang-hop.js'
  }
];
