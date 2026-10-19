# Đặc tả thí nghiệm: Tốc độ phản ứng và chất xúc tác

> BẢN NHÁP do Claude Code soạn, giáo viên duyệt trước khi dựng module.
> Mọi chỗ ghi **CHƯA CHẮC** cần đối chiếu SGK KHTN 8 (Kết nối tri thức). Sửa thẳng vào file này.

## Trạng thái dựng (bản demo, 2026-10-17)
- Đã dựng `assets/js/lessons/toc-do-phan-ung.js`, chỉ phần **đá vôi + HCl**: bước 1–4 + kết luận (3 yếu tố), câu hỏi mồi 1–3, chế độ tự do (bình 2: dạng đá vôi, nồng độ 0,5–2 M, nhiệt độ 5–60 °C).
- **Chưa dựng:** bước 5 chất xúc tác (H₂O₂ + MnO₂) và câu hỏi 4.
- Khác bản nháp bên dưới: thời gian thí nghiệm trên mô phỏng là 600 s (tua nhanh); "ngâm nước đá" tính là 5 °C; câu hỏi 3 hỏi trước, sau đó mới chạy thí nghiệm nước ấm 50 °C theo SGK.
- Mọi chỗ CHƯA CHẮC bên dưới vẫn còn nguyên, cần giáo viên duyệt trước khi dùng chính thức.

## Thông tin chung
- Môn (mạch): Hóa học
- Lớp: 8
- Chương – Bài – Trang SGK: Chương I Phản ứng hóa học – Bài 7 Tốc độ phản ứng và chất xúc tác – tr. __ (**CHƯA CHẮC** số bài và trang)
- Tên thí nghiệm: Các yếu tố ảnh hưởng đến tốc độ phản ứng
- Mục tiêu: học sinh thấy được tốc độ phản ứng tăng khi (1) tăng diện tích bề mặt chất rắn, (2) tăng nồng độ, (3) tăng nhiệt độ, (4) có chất xúc tác; chất xúc tác không bị mất đi sau phản ứng.
- Vì sao cần mô phỏng: trường thiếu acid HCl, H₂O₂, MnO₂, ống nghiệm, đèn cồn. HCl ăn mòn, nguy hiểm khi học sinh tự làm. Chiếu tivi thì cả lớp đều thấy được bọt khí (làm thật chỉ vài em đứng gần mới thấy). Mô phỏng thêm xi lanh đo thể tích khí và đồ thị để **so sánh nhanh/chậm bằng số**, không chỉ "nhìn bọt".

## Dụng cụ, hóa chất (**CHƯA CHẮC**: đối chiếu đúng danh sách SGK)
- 2 bình tam giác (hoặc 2 ống nghiệm) đặt cạnh nhau để so sánh
- Đá vôi (CaCO₃): dạng viên và dạng bột
- Dung dịch HCl loãng (0,5 M; 1 M; 2 M)
- Cốc nước ấm (khoảng 50 °C), cốc nước đá
- Dung dịch H₂O₂ 3% (nước oxy già), bột MnO₂, que đóm
- **Thêm so với SGK (để đo):** xi lanh thu khí có vạch mL gắn trên mỗi bình, đồng hồ bấm giờ, cân. Giáo viên quyết định giữ hay bỏ.

## Các bước
Mỗi bước so sánh **hai bình chạy cùng lúc**: bình trái giữ nguyên, bình phải đổi đúng một yếu tố.

| # | Tên bước | Thực hiện | Quan sát được |
|---|---|---|---|
| 1 | Chuẩn bị, an toàn | Đeo kính, găng tay. Mỗi bình cho 50 mL dung dịch HCl 1 M. Chuẩn bị 2 phần đá vôi, mỗi phần 0,5 g. | Giới thiệu phản ứng: CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O. Khí CO₂ thoát ra thành bọt. |
| 2 | Diện tích bề mặt | Bình trái: 0,5 g đá vôi **viên**. Bình phải: 0,5 g đá vôi **bột**. Cho vào cùng lúc. | Bình bột sủi bọt mạnh hơn, hết chất rắn sớm hơn. Cuối cùng hai bình thu được cùng một lượng khí (khoảng 124 mL). |
| 3 | Nồng độ | Cùng đá vôi viên. Bình trái HCl **0,5 M**, bình phải HCl **2 M**. | Bình 2 M sủi mạnh hơn, khí ra nhanh hơn. Lượng khí cuối cùng vẫn bằng nhau (acid đều dư). |
| 4 | Nhiệt độ | Cùng đá vôi viên, HCl 1 M. Bình trái để ở nhiệt độ phòng (25 °C), bình phải ngâm trong cốc nước ấm (50 °C). | Bình nóng sủi mạnh hơn, khí ra nhanh hơn. |
| 5 | Chất xúc tác | Hai ống mỗi ống 10 mL H₂O₂ 3%. Ống phải thêm một ít bột MnO₂. Đưa que đóm còn tàn đỏ vào miệng ống. | Ống không có MnO₂: gần như không thấy bọt. Ống có MnO₂: sủi bọt mạnh, que đóm bùng cháy (khí O₂). Lọc, cân lại: MnO₂ không bị hao hụt. |
| 6 | Kết luận | Rút ra 4 yếu tố làm tăng tốc độ phản ứng. | Bảng tổng kết (cuối file). |

**CHƯA CHẮC:** SGK dùng đá vôi với HCl cho cả 3 yếu tố đầu, hay dùng chất khác (ví dụ kẽm với HCl) cho yếu tố nồng độ/nhiệt độ? SGK có bước cân lại MnO₂ không? Nếu khác, mình sửa theo SGK.

## Số liệu, công thức dùng trong mô phỏng
- **Lượng khí tối đa** (theo phương trình, acid dư):
  - 0,5 g CaCO₃ = 0,005 mol → 0,005 mol CO₂ → **≈ 124 mL** (thể tích mol khí 24,79 L/mol ở 25 °C, 1 bar, theo SGK KHTN 8).
  - Kiểm tra acid dư: 50 mL HCl 0,5 M = 0,025 mol, cần 0,01 mol, vậy acid luôn dư.
  - 10 mL H₂O₂ 3% (≈ 0,3 g H₂O₂ = 0,0088 mol), 2H₂O₂ → 2H₂O + O₂ → 0,0044 mol O₂ → **≈ 109 mL**.
- **Thể tích khí theo thời gian:** V(t) = V_max · (1 − e^(−r·t)).
- **Tốc độ r** = r₀ × (nồng độ / 1 M) × hệ số bề mặt × 2^((T − 25)/10).
  - Hệ số bề mặt: viên 1, mảnh nhỏ 3, bột 10.
  - Nhiệt độ: tăng 10 °C thì tốc độ tăng khoảng 2 lần (SGK có nêu quy tắc này không? **CHƯA CHẮC**; nếu không thì chỉ hiện "nhanh hơn", không hiện số lần).
  - H₂O₂: không xúc tác r rất nhỏ (gần như không thấy khí trong thời gian thí nghiệm); có MnO₂ r lớn.
- **Đơn giản hóa (sẽ ghi rõ cho giáo viên):** r₀ và các hệ số là số **minh họa**, chọn để thấy rõ nhanh/chậm, không phải số đo thật. Xu hướng (tăng/giảm) đúng kiến thức; tỉ lệ chính xác thì không. Thời gian trên màn hình được tua nhanh, có ghi "Tua nhanh".

## Câu hỏi mồi (4 câu; mỗi đáp án là một thông số, chạy lại hai bình để thấy hậu quả)

### Câu 1: Diện tích bề mặt
- Hỏi ở đâu: đầu bước 2, trước khi cho đá vôi vào
- Nhãn ngắn: Dạng đá vôi nào tan nhanh nhất?
- Câu hỏi: "Cùng 0,5 g đá vôi, cùng loại acid. Em cho đá vôi dạng nào vào bình phải để khí thoát ra nhanh nhất?"
- Đáp án:
  - A. Một viên to → bình phải chạy như bình trái (bằng nhau)
  - B. Vài mảnh nhỏ → nhanh hơn một chút
  - **C. Bột mịn** (đúng) → sủi mạnh, xi lanh đầy nhanh nhất
  - D. Một viên to nhưng đổ gấp đôi acid (100 mL, cùng 1 M) → **không nhanh hơn**, vì nồng độ không đổi
- Nhận xét khi chọn sai:
  - A: "Hai bình y hệt nhau thì khí ra bằng nhau. Em thử đổi hình dạng đá vôi xem."
  - B: "Nhanh hơn viên to rồi! Còn cách nào để acid chạm vào đá vôi nhiều hơn nữa?"
  - D: "Thêm acid mà nồng độ vẫn thế thì bọt không ra nhanh hơn. Acid chỉ phản ứng ở chỗ chạm vào mặt đá vôi."
- Gợi ý khi sai lần 2: "Chia nhỏ đá vôi thì phần mặt ngoài chạm vào acid nhiều hơn hay ít hơn?"
- Giải thích khi đúng: "Đá vôi càng nhỏ thì diện tích bề mặt tiếp xúc với acid càng lớn, phản ứng càng nhanh. Lượng khí cuối cùng vẫn bằng nhau vì cùng 0,5 g đá vôi."
- Nguồn SGK: KHTN 8 Bài 7 (**CHƯA CHẮC** trang)
- Nối bài cũ: Bài 2 Phản ứng hóa học (dấu hiệu có phản ứng: có chất khí thoát ra) — **CHƯA CHẮC** tên bài

### Câu 2: Nồng độ
- Hỏi ở đâu: đầu bước 3
- Nhãn ngắn: Dùng acid nào để sủi nhanh hơn?
- Câu hỏi: "Bình trái đang dùng HCl 0,5 M. Em chọn acid nào cho bình phải để khí thoát ra nhanh hơn?"
- Đáp án:
  - A. HCl 0,5 M (giống bình trái) → bằng nhau
  - B. HCl 0,5 M pha thêm nước → chậm hơn bình trái
  - C. Nước cất → không có phản ứng, không có bọt
  - **D. HCl 2 M** (đúng) → nhanh hơn rõ rệt
- Nhận xét khi chọn sai:
  - A: "Cùng nồng độ nên hai bình sủi như nhau."
  - B: "Pha thêm nước làm acid loãng hơn, bọt còn ra chậm hơn bình trái!"
  - C: "Nước không phản ứng với đá vôi nên không có bọt khí nào."
- Gợi ý khi sai lần 2: "Trong cùng một thể tích, acid đặc hơn có nhiều hay ít chất phản ứng hơn?"
- Giải thích khi đúng: "Nồng độ acid càng lớn thì phản ứng càng nhanh. Lượng khí cuối cùng vẫn bằng nhau vì acid đều dư, lượng đá vôi như nhau."
- Nguồn SGK: KHTN 8 Bài 7; nồng độ mol ở Bài 4 Dung dịch và nồng độ (**CHƯA CHẮC**)

### Câu 3: Nhiệt độ
- Hỏi ở đâu: đầu bước 4
- Nhãn ngắn: Làm sao cho phản ứng CHẬM lại?
- Câu hỏi: "Ngược lại, muốn bình phải phản ứng CHẬM hơn bình trái, em làm gì?"
- Đáp án:
  - A. Ngâm bình vào nước ấm 50 °C → nhanh hơn (ngược ý)
  - **B. Ngâm bình vào nước đá** (đúng) → chậm hơn
  - C. Nghiền đá vôi thành bột → nhanh hơn (ngược ý)
  - D. Dùng HCl 2 M → nhanh hơn (ngược ý)
- Nhận xét khi chọn sai:
  - A: "Bình nóng sủi còn mạnh hơn! Nhiệt độ cao làm phản ứng nhanh lên."
  - C: "Bột có diện tích bề mặt lớn, phản ứng nhanh hơn, ngược với điều cần."
  - D: "Acid đặc hơn làm phản ứng nhanh hơn, ngược với điều cần."
- Gợi ý khi sai lần 2: "Vì sao nhà em cất thức ăn trong tủ lạnh?"
- Giải thích khi đúng: "Nhiệt độ thấp làm phản ứng chậm lại. Vì thế người ta bảo quản thực phẩm trong tủ lạnh để chúng lâu hỏng."
- Nguồn SGK: KHTN 8 Bài 7 (**CHƯA CHẮC** SGK có ví dụ tủ lạnh không; nếu không, chỉ giữ câu đầu)

### Câu 4: Chất xúc tác
- Hỏi ở đâu: đầu bước 5
- Nhãn ngắn: Thêm gì để H₂O₂ phân hủy nhanh?
- Câu hỏi: "H₂O₂ để yên thì phân hủy rất chậm. Em thêm gì vào ống phải để có nhiều bọt khí O₂ ngay?"
- Đáp án:
  - A. Thêm nước → loãng hơn, vẫn gần như không có bọt
  - **B. Thêm một ít bột MnO₂** (đúng) → sủi mạnh, que đóm bùng cháy
  - C. Đặt ống vào nước đá → còn chậm hơn
  - D. Đổ thêm H₂O₂ 3% → vẫn gần như không có bọt (cùng nồng độ)
- Nhận xét khi chọn sai:
  - A: "Thêm nước làm dung dịch loãng hơn, phản ứng chậm hơn nữa."
  - C: "Lạnh thì phản ứng chậm đi, que đóm không bùng cháy."
  - D: "Nồng độ không đổi nên vẫn rất chậm. Cần một chất giúp phản ứng nhanh hơn mà bản thân nó không mất đi."
- Gợi ý khi sai lần 2: "Trong số dụng cụ trên bàn, có một chất bột màu đen chưa dùng tới."
- Giải thích khi đúng: "MnO₂ là chất xúc tác: làm phản ứng nhanh hơn, sau phản ứng vẫn còn nguyên. Khí làm que đóm bùng cháy là O₂."
- Nguồn SGK: KHTN 8 Bài 7 (**CHƯA CHẮC**)

## Chế độ tự do (đề xuất)
Học sinh tự chỉnh **bình phải**; bình trái giữ chuẩn (viên, HCl 1 M, 25 °C) để so sánh.

| Thông số | Giá trị |
|---|---|
| Dạng đá vôi | Viên / Mảnh nhỏ / Bột |
| Nồng độ HCl | 0,5–2 M (bước 0,25) |
| Nhiệt độ | 5–60 °C (bước 5) |
| Phản ứng | Đá vôi + HCl / H₂O₂ (có hoặc không MnO₂) |

Dòng "Quan sát": bình nào nhanh hơn, sau bao lâu (thời gian mô phỏng) thì đạt một nửa lượng khí, thể tích khí cuối cùng.

## Câu hỏi gợi ý cho ô chat
| Bước | Câu hỏi gợi ý | Trả lời soạn sẵn |
|---|---|---|
| 1 | Bọt khí là khí gì? | Đó là khí carbon dioxide (CO₂), sinh ra khi đá vôi phản ứng với acid. |
| 1 | Vì sao phải đeo kính, găng tay? | Acid HCl ăn mòn da và mắt. Khi làm thí nghiệm thật, phải đeo kính, găng tay, không ngửi hay nếm hóa chất. |
| 2 | Vì sao hai bình cuối cùng có cùng lượng khí? | Vì hai bình có cùng 0,5 g đá vôi. Diện tích bề mặt chỉ làm phản ứng nhanh hay chậm, không làm thay đổi lượng khí tạo ra. |
| 4 | Vì sao nóng thì phản ứng nhanh hơn? | Khi nóng, các hạt chuyển động nhanh hơn, va chạm với nhau nhiều và mạnh hơn, nên phản ứng nhanh hơn. (**CHƯA CHẮC** SGK lớp 8 có giải thích theo va chạm hạt không) |
| 5 | Chất xúc tác có bị mất đi không? | Không. Chất xúc tác giúp phản ứng nhanh hơn nhưng sau phản ứng vẫn còn nguyên, có thể dùng lại. |

## Kết luận của bài
| Yếu tố | Thay đổi | Tốc độ phản ứng |
|---|---|---|
| Diện tích bề mặt | Chất rắn càng nhỏ (bột) | Tăng |
| Nồng độ | Càng đặc | Tăng |
| Nhiệt độ | Càng cao | Tăng |
| Chất xúc tác | Có chất xúc tác (MnO₂) | Tăng; chất xúc tác không mất đi sau phản ứng |
