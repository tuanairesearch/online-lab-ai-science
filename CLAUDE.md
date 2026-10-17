# CLAUDE.md – Phòng thí nghiệm KHTN

File này mô tả dự án cho Claude Code. Đọc kỹ trước khi sửa code.

## 1. Dự án là gì
Web mô phỏng thí nghiệm môn **Khoa học tự nhiên THCS** (bộ SGK *Kết nối tri thức*, lớp 6–9), gồm 3 mạch: **Vật lí, Hóa học, Sinh học**.
- Người dùng chính: một giáo viên KHTN ở **trường vùng sâu gần biên giới**, thiếu thiết bị thí nghiệm. Giáo viên **chiếu web lên tivi** trong giờ học; học sinh có thể tự xem lại ở nhà.
- Mỗi thí nghiệm chạy **theo từng bước SGK** ("Chạy 1 lượt" hoặc "Bước tiếp").
- Điểm đặc trưng: **trợ lý AI hỏi mồi** giữa thí nghiệm (câu trắc nghiệm 4 đáp án, hộp thoại bung ra từ vòng tròn AI ở góc phải). **Chọn sai thì thí nghiệm chạy đúng theo lựa chọn sai**, AI nói "Có vẻ chưa đúng lắm…" và cho chọn lại. Vòng tròn AI cũng là nút **hỏi AI tự do** (Gemini, qua `/api/ask`).
- Sản phẩm dự thi "Giải thưởng Tiên phong Ứng dụng AI trong Giáo dục 2026" (Bộ GD&ĐT + RMIT). Tiêu chí: thực tiễn, sáng tạo, tác động có số liệu, nhân rộng, trình bày.

## 2. Nguyên tắc bắt buộc
1. **Không build step, không framework.** HTML + CSS + JavaScript ES modules thuần. Không thêm thư viện npm vào phía trình duyệt. Deploy tĩnh trên Vercel + 1 hàm serverless `api/ask.js`.
2. **Chính xác khoa học là số 1.** Nội dung bước, hiện tượng, số liệu, câu hỏi lấy từ file đặc tả `docs/lessons/<mon>/<bai>.md`. **Không tự bịa kiến thức.** Chỗ nào đặc tả thiếu hoặc mâu thuẫn với kiến thức chuẩn thì **dừng lại và hỏi**, không tự đoán.
3. **Toàn bộ chữ giao diện bằng tiếng Việt**, câu ngắn, dễ hiểu với học sinh THCS. Tên biến, hàm bằng tiếng Anh.
4. **Chạy offline**: mô phỏng + câu hỏi mồi không được phụ thuộc mạng. Chỉ `/api/ask` cần mạng. Mỗi khi thêm/sửa file tĩnh: cập nhật `SHELL` và **tăng `CACHE`** trong `sw.js`.
5. **API key Gemini chỉ nằm ở server** (`process.env.GEMINI_API_KEY`). Không bao giờ đưa key xuống trình duyệt, không commit `.env*`.
6. **Hợp chiếu tivi**: chữ to, tương phản cao, sân khấu thí nghiệm luôn nền tối; điều khiển được bằng bút trình chiếu (phím ←/→, PageUp/PageDown) và phím A–D để chọn đáp án.
7. **Hợp điện thoại** (học sinh xem ở nhà): không cuộn ngang, hộp thoại AI thành bảng trượt dưới đáy màn hình.
8. Tôn trọng `prefers-reduced-motion`. Mọi màu lấy từ biến CSS trong `assets/css/lab.css`.

## 3. Cấu trúc thư mục (mục tiêu)
```
index.html                     Trang chủ: 3 thẻ môn Vật lí / Hóa học / Sinh học
subject.html                   Trang một môn: danh sách bài theo lớp 6–9 (URL: /vat-li, /hoa-hoc, /sinh-hoc)
lab.html                       Trang thí nghiệm, nạp module theo URL (/vat-li/thau-kinh)
api/ask.js                     Serverless: nhận câu hỏi + trạng thái thí nghiệm → Gemini → { text }
assets/css/lab.css             Giao diện dùng chung (biến màu, sân khấu, hộp thoại AI…)
assets/js/catalog.js           Danh mục: SUBJECTS và LESSONS (id, môn, lớp, bài, trạng thái, đường dẫn module)
assets/js/engine.js            Lõi: chạy bước, hỏi mồi, chat AI, số liệu, công cụ vẽ canvas
assets/js/pages/home.js        Dựng trang chủ từ catalog
assets/js/pages/subject.js     Dựng trang môn từ catalog
assets/js/pages/lab.js         Đọc URL → import động module bài → mountLab()
assets/js/lessons/<mon>/<bai>.js   Mỗi thí nghiệm một module (mon: vat-li | hoa-hoc | sinh-hoc)
docs/lessons/<mon>/<bai>.md    Đặc tả bài do giáo viên viết (nguồn sự thật về nội dung)
docs/lessons/_TEMPLATE.md      Mẫu đặc tả
tests/e2e.mjs                  Kiểm thử Playwright (Gemini được giả lập)
sw.js, manifest.webmanifest    Offline + cài như ứng dụng
vercel.json                    Header, rewrites cho URL đẹp
```
URL đẹp dùng `rewrites` trong `vercel.json`: `/:mon` → `/subject.html`, `/:mon/:bai` → `/lab.html` (giới hạn `mon` trong 3 giá trị). `sw.js` phải trả `subject.html`/`lab.html` đã lưu cho các URL này khi mất mạng.

## 4. Hợp đồng module bài học
Mỗi file `assets/js/lessons/<mon>/<bai>.js` `export default` một object:
```js
{
  id, subject, grade, chapter, lesson, title, shortTitle, intro, canvasLabel, readyTitle,
  view: { w, h, ox, oy },        // vùng nhìn theo đơn vị cảnh (vd cm); lõi tự tính tỉ lệ vẽ
  base(S), rest(S),              // đặt lại biến cảnh / cảnh lúc mới mở
  draw(g, S),                    // vẽ mỗi khung hình; g: ctx, X(), Y(), sc, C (màu), text(), path(), arrowV(), rr(), fs()
  readout(S) -> string,          // dòng số liệu góc trên trái
  describe(S) -> string[],       // mô tả trạng thái gửi cho AI (chỉ sự thật đang hiển thị)
  startChips: [{ q, a }],        // câu gợi ý lúc chưa chạy (a: trả lời soạn sẵn khi mất mạng)
  steps: [{ title, sgk, note, html?, q?, chips:[{q,a}], setup(S), async run(h) }],
  questions: [{ id, short, tag, text, opts[4], answer, async sim(h, c), async reset(h), wrong[4], hint2, right, ref }]
}
```
- Trong `run(h)` / `sim(h, c)`: dùng `h.tw({biến: giá trị}, ms)`, `h.wait(ms)`, `h.ask('id-câu')`, `h.showObs()`, `h.S`. Không dùng setTimeout riêng (lõi cần hủy được hoạt ảnh khi chuyển bước).
- **Đáp án = thông số thí nghiệm**: thiết kế để mỗi đáp án là một giá trị (vị trí, dụng cụ, chất…) và `sim()` chạy lại cùng mô phỏng với giá trị đó. Đáp án sai phải **cho thấy hậu quả** trên mô phỏng.
- Bước có câu hỏi mồi: đặt `q: true`.
- Mẫu đầy đủ: `assets/js/lessons/vat-li/thau-kinh.js` (sau khi tái cấu trúc).

## 5. Quy trình thêm một thí nghiệm
1. Đọc `docs/lessons/<mon>/<bai>.md`. Thiếu gì thì hỏi.
2. Viết module theo hợp đồng ở mục 4. Vẽ bằng canvas 2D, đơn vị cảnh có ý nghĩa vật lí (cm, mL…), số liệu tính bằng công thức đúng chứ không vẽ "cho giống".
3. Thêm vào `catalog.js` (`status: 'ready'`).
4. Cập nhật `sw.js` (SHELL + tăng CACHE).
5. Chạy `node tests/e2e.mjs`: mở bài, chạy hết các bước với câu hỏi mồi bật, chọn sai rồi chọn đúng mỗi câu, không có lỗi console.
6. Báo lại: danh sách bước, câu hỏi, chỗ nào đã đơn giản hóa so với thực tế.

## 6. Chạy và kiểm tra
- Xem nhanh không có AI: `npx serve .` (lưu ý rewrites chỉ có trên Vercel; dùng `npx vercel dev` để chạy đủ, cần `.env.local` có `GEMINI_API_KEY`).
- Kiểm thử: `node tests/e2e.mjs` (tự bật server tĩnh + giả lập `/api/ask`).

## 7. Không được làm
- Không đổi hợp đồng `POST /api/ask` (`{ lesson, lessonTitle, state, messages }` → `{ text }`) nếu không được yêu cầu.
- Không đưa nội dung chưa kiểm chứng vào bước SGK hoặc đáp án.
- Không thêm theo dõi người dùng, không gửi dữ liệu học sinh ra ngoài. Số liệu câu hỏi chỉ lưu `localStorage` trên máy giáo viên.
