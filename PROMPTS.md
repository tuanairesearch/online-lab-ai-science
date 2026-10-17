# Chuỗi prompt dựng Phòng thí nghiệm KHTN bằng Claude Code

Làm **lần lượt từng prompt**. Xong mỗi prompt: mở web xem thử, ưng thì `git commit`, rồi mới sang prompt sau.
Claude Code tự đọc `CLAUDE.md` ở thư mục gốc, nên prompt không cần nhắc lại toàn bộ bối cảnh.

---

## Bước 0 – Chuẩn bị (không phải prompt)
```bash
unzip khtn-lab-claude-code.zip && cd khtn-lab
git init && git add . && git commit -m "Khởi tạo từ bản demo"
claude
```

---

## Prompt 1 – Làm quen, chưa sửa gì
```
Đọc CLAUDE.md, README.md và toàn bộ code hiện có.
1. Tóm tắt kiến trúc hiện tại trong 10 dòng.
2. So với "Cấu trúc thư mục (mục tiêu)" ở mục 3 của CLAUDE.md, liệt kê những gì cần thêm, di chuyển, sửa.
3. Chỉ ra rủi ro có thể làm hỏng phần đang chạy (thí nghiệm Thấu kính, /api/ask, offline).
Chưa sửa file nào.
```

---

## Prompt 2 – Tái cấu trúc + giao diện 3 môn
```
Tái cấu trúc dự án theo mục 3 của CLAUDE.md. Lập kế hoạch trước, đợi mình duyệt rồi mới làm.

Yêu cầu giao diện:
1. Trang chủ (/) có 3 thẻ lớn: Vật lí, Hóa học, Sinh học.
   - Mỗi môn một màu nhận diện riêng (thêm biến --vat-li, --hoa-hoc, --sinh-hoc trong lab.css, có giá trị cho cả chế độ sáng và tối) và một hình minh họa nhỏ bằng SVG nội tuyến:
     Vật lí: chùm tia qua thấu kính; Hóa học: ống nghiệm sủi bọt; Sinh học: chiếc lá có tế bào.
   - Trên thẻ ghi số thí nghiệm đã sẵn sàng và tên 2–3 bài tiêu biểu.
   - Thẻ to, dễ bấm khi chiếu tivi; trên điện thoại xếp thành một cột.
2. Trang môn (/vat-li, /hoa-hoc, /sinh-hoc): đầu trang theo màu môn, các tab Lớp 6 / 7 / 8 / 9 / Tất cả.
   - Mỗi bài là một thẻ: "KHTN 9 · Bài 8", tên bài, một dòng mô tả, nhãn "Có câu hỏi AI" nếu có.
   - Bài status 'planned' hiện mờ với nhãn "Đang soạn", không bấm được.
3. Trang thí nghiệm (/vat-li/thau-kinh): giữ nguyên giao diện hiện tại, thêm thanh điều hướng
   "Trang chủ › Vật lí › Thấu kính" và màu điểm nhấn theo môn.

Yêu cầu kỹ thuật:
- Chuyển module Thấu kính sang assets/js/lessons/vat-li/thau-kinh.js, dữ liệu danh mục sang assets/js/catalog.js.
- lab.html đọc URL rồi import động module tương ứng; URL sai thì hiện trang "Không tìm thấy thí nghiệm" có nút về trang chủ.
- Thêm rewrites vào vercel.json cho /:mon và /:mon/:bai.
- Cập nhật sw.js: thêm file mới vào SHELL, tăng CACHE, và khi mất mạng thì trả subject.html / lab.html đã lưu cho các URL đẹp.
- Viết tests/e2e.mjs bằng Playwright: tự bật server tĩnh có xử lý rewrites, giả lập /api/ask;
  kiểm tra trang chủ có 3 môn → vào Vật lí → mở Thấu kính → chạy 2 bước → chọn sai rồi chọn đúng câu hỏi 1 → không có lỗi console.
- Không đổi hành vi của engine.js và api/ask.js.

Xong thì chạy test, chụp màn hình trang chủ và trang môn (máy tính và điện thoại) để mình xem.
```

---

## Prompt 3 – Nạp danh mục bài dự kiến
```
Thêm vào catalog.js các bài sau với status 'planned' (chưa có module).
Chỉ ghi đúng tên bài như dưới đây, không thêm bài khác:

Vật lí:
- KHTN 7 · Bài 9 · Đo tốc độ
- KHTN 8 · Bài 25 · Thực hành đo cường độ dòng điện và hiệu điện thế
Hóa học:
- KHTN 8 · Bài 7 · Tốc độ phản ứng và chất xúc tác
- KHTN 8 · Bài 9 · Base. Thang pH
- KHTN 9 · Bài 19 · Dãy hoạt động hóa học
Sinh học:
- KHTN 7 · Bài 24 · Thực hành: Chứng minh quang hợp ở cây xanh
- KHTN 7 · Bài 27 · Thực hành: Hô hấp ở thực vật
- KHTN 8 · Bài 33 · Máu và hệ tuần hoàn của cơ thể người

Với mỗi bài, tạo sẵn file đặc tả rỗng docs/lessons/<mon>/<bai>.md từ docs/lessons/_TEMPLATE.md,
điền sẵn phần "Thông tin chung" (môn, lớp, bài). Không tự viết các bước hay câu hỏi.
```
*(Danh sách trên chỉ là gợi ý. Cha sửa theo bài trường thiếu thiết bị nhất.)*

---

## Prompt 4 – Dựng một thí nghiệm mới từ đặc tả (dùng lại cho mỗi bài)
Trước prompt này, **cha điền xong file đặc tả** `docs/lessons/<mon>/<bai>.md` (chép các bước từ SGK, tự soạn câu hỏi mồi).
```
Dựng thí nghiệm từ docs/lessons/<mon>/<bai>.md theo quy trình ở mục 5 của CLAUDE.md.

Trước khi viết code:
1. Tóm tắt lại các bước và câu hỏi mồi bằng lời của bạn.
2. Liệt kê chỗ đặc tả còn thiếu, mơ hồ, hoặc có vẻ sai so với kiến thức chuẩn. Hỏi mình, không tự đoán.
3. Mô tả cách vẽ cảnh: những vật thể nào, đơn vị cảnh, biến trạng thái nào trong S, và mỗi đáp án của từng câu hỏi
   ứng với thông số nào để sim() chạy lại cùng mô phỏng.
Đợi mình duyệt rồi mới code.

Sau khi code: thêm bài vào catalog (status 'ready'), cập nhật sw.js, thêm bài vào tests/e2e.mjs, chạy test,
chụp màn hình từng câu hỏi mồi (một lần chọn sai, một lần chọn đúng).
```

---

## Prompt 5 – Kiểm định khoa học (chạy sau mỗi bài mới)
```
Đóng vai một giáo viên KHTN khó tính đang chấm sản phẩm. Rà soát assets/js/lessons/<mon>/<bai>.js
so với docs/lessons/<mon>/<bai>.md và kiến thức chuẩn của chương trình KHTN THCS:
- Hiện tượng, số liệu, hình vẽ có đúng khoa học không (ví dụ: hướng tia sáng, màu dung dịch, tỉ lệ)?
- Mỗi đáp án sai có thật sự cho thấy hậu quả trên mô phỏng không?
- Lời nhận xét có nói lộ đáp án không? Có từ nào khó với học sinh THCS không?
- describe() có mô tả đúng điều đang hiển thị không?
Trả về bảng: vấn đề / mức độ / đề xuất sửa. Chưa sửa gì.
```
*(Ghi lại các lỗi AI tìm ra: đây là minh chứng "kiểm định nội dung AI" cho hồ sơ dự thi.)*

---

## Prompt 6 – Chế độ chiếu lớp
```
Thêm nút "Chế độ lớp học" trên trang thí nghiệm:
- Tăng cỡ chữ chú thích, hộp thoại AI, nhãn trên canvas khoảng 1,3 lần; ẩn bảng số liệu và phần "Dùng trên lớp".
- Nhớ lựa chọn bằng localStorage (bọc try/catch).
- Kiểm tra ở độ phân giải 1366×768 và 1920×1080 rằng hộp thoại AI không che điểm quan trọng của thí nghiệm khi thu nhỏ.
Chụp màn hình trước và sau.
```

---

## Prompt 7 – Trang số liệu cho giáo viên
```
Tạo trang /giao-vien tổng hợp số liệu câu hỏi mồi của tất cả các bài (đọc từ localStorage, khóa khtn-lab-stats-v1):
- Bảng theo bài: số lượt hỏi, % đúng ngay lần đầu, câu khó nhất, đáp án sai hay bị chọn nhất.
- Biểu đồ cột đơn giản (SVG tự vẽ, không thư viện): % đúng ngay lần đầu theo từng câu.
- Nút tải CSV toàn bộ và nút xóa có bước xác nhận.
- Thêm liên kết nhỏ "Số liệu" ở chân trang chủ.
```

---

## Prompt 8 – Trước khi đưa lên Vercel
```
Kiểm tra trước khi deploy:
1. Chạy tests/e2e.mjs cho tất cả bài.
2. Rà soát không có API key, .env, hay dữ liệu thật nào trong repo.
3. Kiểm tra sw.js đã có đủ file và đã tăng CACHE.
4. Kiểm tra offline: mở từng trang một lần, tắt mạng, tải lại, mọi bài vẫn chạy.
5. Cập nhật README.md (cấu trúc mới, cách thêm bài) và CLAUDE.md nếu có quy ước mới.
Báo cáo kết quả từng mục.
```

---

## Mẹo khi làm với Claude Code
- **Mỗi lần một việc.** Prompt càng nhỏ, kết quả càng đúng. Bài nào lỗi thì sửa xong mới sang bài khác.
- **Bắt nó lập kế hoạch trước** với các thay đổi lớn (Prompt 2, 4), đọc kỹ rồi mới cho làm.
- **Gửi ảnh chụp màn hình** khi giao diện chưa ưng, kèm mô tả muốn sửa chỗ nào.
- **Commit sau mỗi bước ổn.** Hỏng thì quay lại bản trước được ngay.
- **Nội dung là của cha, code là của AI.** Cha viết đặc tả và duyệt từng câu hỏi; Claude Code chỉ dựng theo đặc tả. Đây cũng chính là câu chuyện "ứng dụng AI có trách nhiệm" khi trình bày với giám khảo.
