# Prompt dựng thí nghiệm "Đo tốc độ" (KHTN 7 – Bài 9) bằng Claude Code

Chuẩn bị (không phải prompt):
1. Chép file đặc tả vào repo: `docs/lessons/vat-li/do-toc-do.md`.
2. Cha đọc đặc tả, chốt các chỗ ghi **CẦN GV XÁC NHẬN** (5 chỗ), sửa thẳng vào file.
3. `git add . && git commit -m "Đặc tả bài Đo tốc độ"`, rồi mở `claude` trong thư mục repo.

Làm lần lượt: Prompt A → duyệt → Prompt B → xem thử, commit → Prompt C.

---

## Prompt A – Lập kế hoạch (chưa code)
```
Dựng thí nghiệm mới: KHTN 7 – Bài 9 Đo tốc độ (Kết nối tri thức), phần Vật lí.
Nguồn sự thật duy nhất về nội dung: docs/lessons/vat-li/do-toc-do.md.
Đọc CLAUDE.md, file đặc tả, và hai bài mẫu:
- assets/js/lessons/thau-kinh.js (dụng cụ trên giá, kéo thả, chế độ tự do)
- assets/js/lessons/toc-do-phan-ung.js (số liệu tính bằng công thức, đồ thị, ghi chú "minh họa")

CHƯA viết code. Trả lời lần lượt:
1. Tóm tắt 8 bước và 4 câu hỏi mồi bằng lời của bạn.
2. Tự tính lại MỌI con số trong đặc tả bằng một đoạn node chạy thật, in bảng "đặc tả ghi / bạn tính được":
   t(50 cm) với a = 0,95 × 9,8 × 6/80; ba lần đo 1,14 – 1,31 – 1,13 s và trung bình; số liệu từng đáp án câu 1 và câu 2;
   cổng (3), cổng (4) với a = 0,35 m/s²; đáp án câu 3; 5 m chia 0,40 / 0,35 / 0,30 / 0,25 s ra m/s và km/h.
   Số nào lệch thì báo, không tự sửa đặc tả.
3. Liệt kê chỗ đặc tả còn thiếu, mơ hồ, mâu thuẫn hoặc có vẻ sai so với kiến thức chuẩn KHTN 7. Hỏi mình, không tự đoán.
4. Thiết kế cảnh:
   - Đề xuất 3 cảnh, đổi theo bước: (A) tấm gỗ kê sách, xe, hai vạch, thước, đồng hồ bấm giây, Bảng 9.1;
     (B) máng nghiêng, nam châm điện, viên bi, cổng (3), (4), đồng hồ hiện số hiện hai số chỉ;
     (C) mặt đường, hai vạch mốc cách 5 m, camera, màn hình tốc độ.
   - Đơn vị cảnh (cm), view, các biến trong S; Bảng 9.1 vẽ trên canvas hay bằng HTML (html của bước).
   - Từng câu hỏi: mỗi đáp án là thông số nào, sim() chạy gì, hậu quả hiện ra sao.
     Quan trọng: câu 1 và câu 3 phải tô màu "đoạn đường ứng với khoảng thời gian đã chọn" đặt cạnh "đoạn đo bằng thước",
     để học sinh nhìn thấy hai đoạn không khớp khi chọn sai.
   - Chế độ tự do: danh sách params (type, min, max, step, unit), target(), observe().
5. Danh sách file sẽ tạo và sửa.
Đợi mình duyệt rồi mới code.
```

---

## Prompt B – Dựng thí nghiệm (sau khi đã duyệt kế hoạch)
```
Duyệt kế hoạch, với các chỉnh sửa sau: [ghi chỉnh sửa nếu có, không có thì xóa dòng này].

Code theo mục 4 và 5 của CLAUDE.md, lưu ý riêng cho bài này:
- Module: assets/js/lessons/do-toc-do.js (cùng thư mục với 3 bài đang có, không tạo thư mục con).
- Thêm vào LESSONS trong assets/js/catalog.js:
  { id:'do-toc-do', subject:'vat-li', grade:7, lesson:'Bài 9', title:'Đo tốc độ',
    desc:'Đo tốc độ xe đồ chơi bằng đồng hồ bấm giây, viên bi bằng cổng quang điện, và thiết bị bắn tốc độ. 8 bước, 4 câu hỏi mồi.',
    status:'ready', ai:true, href:'/vat-li/do-toc-do', module:'/assets/js/lessons/do-toc-do.js' }
- assets/js/art.js: thêm hình cho thẻ bài (xe trên mặt dốc, hai vạch, đồng hồ bấm giây), cùng phong cách và cơ chế chuyển động với 3 hình đang có.
- Không sửa engine.js, api/ask.js, sw.js (đã bỏ offline). Nếu engine thiếu chức năng cần thiết thì DỪNG LẠI HỎI.
- Mọi số hiện trên màn hình tính bằng công thức trong module, không gõ tay. Chế độ theo bước SGK dùng 3 cặp độ trễ bấm tay CỐ ĐỊNH
  ghi trong đặc tả (để lần nào chiếu cũng ra 1,14 – 1,31 – 1,13 s); chỉ chế độ tự do mới lấy ngẫu nhiên.
- Đồng hồ bấm giây hiện 2 chữ số thập phân, đồng hồ hiện số 3 chữ số. Số thập phân dùng dấu phẩy.
- Tốc độ hiện cả cm/s và m/s ở thí nghiệm 1; m/s và km/h ở thiết bị bắn tốc độ.
- Hoạt ảnh chỉ dùng h.tw / h.wait. Ghi chú "minh họa" ở footer: gia tốc, độ trễ bấm tay là số minh họa.
- describe(S) chỉ mô tả cái đang hiển thị; không đưa "thời gian thật" cho AI khi học sinh chưa trả lời câu hỏi.
- Chữ trên canvas đủ to khi chiếu tivi 1366×768; điện thoại 390 px không cuộn ngang.

Kiểm tra:
- Repo chưa có tests/e2e.mjs. Viết tests/e2e.mjs bằng Playwright: tự bật server tĩnh có rewrites như serve.json, giả lập /api/ask.
  Với bài Đo tốc độ: chạy hết 8 bước khi bật câu hỏi mồi; mỗi câu chọn một đáp án sai, kiểm tra nhận xét hiện ra, rồi chọn đúng;
  chế độ tự do: đổi từng thông số; không có lỗi console. Với 3 bài cũ: mở trang, chạy bước 1, không lỗi console.
- Chạy node tests/e2e.mjs đến khi qua hết.
- Chụp màn hình: mỗi câu hỏi mồi (một lần sai, một lần đúng); trang /vat-li có thẻ bài mới; khung 1366×768 và 390×844.

Báo lại: danh sách bước và câu hỏi; con số hiện ra ở từng đáp án; chỗ nào đã đơn giản hóa so với thực tế.
```

---

## Prompt C – Kiểm định khoa học (sau khi đã xem thử)
```
Đóng vai một giáo viên Vật lí THCS khó tính đang chấm sản phẩm. Rà soát assets/js/lessons/do-toc-do.js
so với docs/lessons/vat-li/do-toc-do.md và kiến thức chuẩn KHTN 7 (Bài 8 Tốc độ chuyển động, Bài 9 Đo tốc độ):
- Số liệu: chạy lại công thức, so với số hiện trên màn hình (t, trung bình, v, đổi đơn vị, km/h).
- Hình vẽ: xe nhanh dần khi xuống dốc; vạch và thước đúng tỉ lệ; bi chỉ làm đồng hồ ghi số khi đi qua cổng.
- Mỗi đáp án sai có thật sự cho thấy hậu quả trên mô phỏng không (đoạn tô màu lệch với đoạn thước đo)?
- Lời nhận xét có lộ đáp án không? Có từ nào khó với học sinh lớp 7 không?
- Có chỗ nào gọi v = s/t là "tốc độ tức thời" thay vì tốc độ trung bình trên đoạn đó không?
- describe() có mô tả đúng điều đang hiển thị không?
Trả về bảng: vấn đề / mức độ / đề xuất sửa. Chưa sửa gì.
```
(Ghi lại các lỗi tìm ra: đây là minh chứng "kiểm định nội dung AI" cho hồ sơ dự thi.)
