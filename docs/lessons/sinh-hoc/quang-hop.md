# Đặc tả thí nghiệm: Chứng minh quang hợp tạo ra tinh bột

> BẢN NHÁP do Claude Code soạn theo kiến thức chuẩn, giáo viên duyệt trước khi dùng chính thức.
> Mọi chỗ ghi **CHƯA CHẮC** cần đối chiếu SGK KHTN 7 (Kết nối tri thức). Sửa thẳng vào file này.

## Trạng thái dựng (bản demo, 2026-10-18)
- Đã dựng `assets/js/lessons/quang-hop.js`, chỉ phần **thí nghiệm tinh bột** (lá khoai lang + iodine): 5 bước, 4 câu hỏi mồi, chế độ tự do rẽ nhánh.
- **Chưa dựng:** thí nghiệm thứ hai của bài (cành rong đuôi chó thải khí oxygen, que đóm còn tàn đỏ bùng cháy).
- Đã đối chiếu trên mạng (lời giải SGK, tài liệu thực hành GCSE): phần lá bịt có màu vàng nâu/vàng cam của iodine, phần không bịt có màu xanh tím; đun cồn cách thủy vì cồn dễ cháy; dụng cụ SGK có bóng đèn 500W, nước ấm khoảng 40 °C.

## Thông tin chung
- Môn: Sinh học · Lớp 7
- Chương – Bài – Trang: Chương VII Trao đổi chất và chuyển hóa năng lượng ở sinh vật – Bài 24 Thực hành: Chứng minh quang hợp ở cây xanh – tr. 108–110 (**CHƯA CHẮC** tên chương)
- Mục tiêu: học sinh chứng minh được lá cây tạo ra tinh bột khi quang hợp, và chỉ tạo ra khi có ánh sáng; hiểu vai trò của từng bước (để trong tối, bịt giấy đen, tẩy diệp lục, thử iodine).
- Vì sao cần mô phỏng: thí nghiệm thật kéo dài 2–3 ngày; trường thiếu cồn 90°, dung dịch iodine, đèn cồn; đun cồn có nguy cơ cháy. Mô phỏng cho cả lớp thấy cùng lúc và thử được các cách làm sai.

## Dụng cụ, hóa chất
- Chậu cây khoai lang (có thể thay bằng cây khác tùy địa phương), băng giấy đen, kẹp giấy
- Bóng đèn 500W (thay ánh nắng), cồn 90°, nước ấm khoảng 40 °C, cốc thủy tinh, nồi đun cách thủy, đèn cồn
- Dung dịch iodine loãng, đĩa petri, panh, ống nhỏ giọt
- (**CHƯA CHẮC** danh sách đúng theo SGK)

## Các bước
| # | Tên bước | Thực hiện | Quan sát được |
|---|---|---|---|
| 1 | Chuẩn bị cây | Để chậu cây khoai lang vào chỗ tối 2 ngày. | Lá không quang hợp, tinh bột cũ được chuyển đi và dùng hết. |
| 2 | Bịt lá, chiếu sáng | Bịt kín một phần lá ở cả hai mặt bằng băng giấy đen. Đem ra chỗ nắng (hoặc chiếu đèn) 4–6 giờ. | Phần không bịt nhận ánh sáng, phần bịt thì không. |
| 3 | Tẩy màu lá | Ngắt lá, bỏ băng giấy đen. Đun cách thủy lá trong cồn 90° để tẩy diệp lục. Rửa lá trong nước ấm. | Lá bạc màu, cồn chuyển xanh lục. |
| 4 | Thử tinh bột | Cho lá vào đĩa petri, nhỏ vài giọt dung dịch iodine. | Phần không bịt: xanh tím. Phần bịt: không có màu xanh tím (vàng nâu của iodine). |
| 5 | Kết luận | | Lá chỉ tạo ra tinh bột khi được chiếu sáng. |

## Số liệu dùng trong mô phỏng (MINH HỌA, không phải số đo)
- Lượng tinh bột trong lá: 0–1. Để trong tối 2 ngày: tinh bột cũ giảm về 0. Chiếu sáng t giờ: phần được chiếu tăng thêm min(1, t/4).
- Thời gian chiếu sáng trên mô phỏng: 5 giờ (SGK 4–6 giờ). Phương án "5 phút" cho lượng tinh bột gần như bằng 0.
- Lá chưa tẩy diệp lục: màu xanh lục che 80% màu thuốc thử (để thấy "khó phân biệt").
- Màu đậm nhạt chỉ để minh họa xu hướng.

## Câu hỏi mồi (mỗi đáp án là một cách làm; chọn sai thì tua nhanh tới kết quả để thấy hậu quả)
1. **Bước 1** – Để cây ở đâu 2 ngày? A. Ngoài nắng · **B. Trong chỗ tối** · C. Chỗ sáng, tưới nhiều nước · D. Không cần, làm ngay. Sai → cả lá (kể cả phần bịt) xanh tím.
2. **Bước 2** – Bịt lá xong, đưa cây đi đâu? A. Để tiếp trong tối (cả lá không có tinh bột) · B. Ra nắng 5 phút (gần như không thấy màu) · C. Bỏ giấy đen rồi ra nắng (cả lá xanh tím) · **D. Giữ giấy đen, ra nắng 4–6 giờ**.
3. **Bước 3** – Đun cách thủy lá trong gì? A. Nước lã · B. Nước muối · **C. Cồn 90°** · D. Không đun. Sai → lá vẫn xanh lục, khó nhìn màu iodine.
4. **Bước 4** – Thuốc thử tinh bột? **A. Dung dịch iodine** · B. Nước vôi trong · C. Cồn 90° · D. Nước cất. Sai → lá không đổi màu.
- Nhận xét khi sai, gợi ý lần 2, giải thích khi đúng: xem `questions` trong module. **CHƯA CHẮC**: SGK có nhắc "nước vôi trong nhận biết khí carbon dioxide" ở lớp 7 không.

## Chế độ tự do (rẽ nhánh từng bước)
Học sinh/giáo viên chọn cách làm ở từng bước; chọn xong bước nào thì mô phỏng chạy bước đó và mở bước sau. Đổi lựa chọn bước trước → chạy lại theo hướng mới.

| Bước | Lựa chọn |
|---|---|
| 1. Để cây 2 ngày | Chỗ tối / Ngoài nắng / Làm ngay |
| 2. Bịt lá | Bịt giấy đen / Không bịt |
| 3. Chiếu sáng | Nắng 4–6 giờ / Nắng 5 phút / Trong tối |
| 4. Tẩy màu | Cồn 90° / Nước lã / Không tẩy |
| 5. Thuốc thử | Iodine / Nước vôi trong / Nước cất |

## Kết luận
| Phần lá | Ánh sáng | Nhỏ iodine | Tinh bột |
|---|---|---|---|
| Không bịt | Có | Xanh tím | Có |
| Bịt giấy đen | Không | Không có màu xanh tím | Không |

Lá cây chỉ tạo ra tinh bột khi được chiếu sáng.
