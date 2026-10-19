# Phòng thí nghiệm KHTN

Mô phỏng thí nghiệm Khoa học tự nhiên THCS theo từng bước SGK (bộ Kết nối tri thức), có **trợ lý AI hỏi mồi** giữa thí nghiệm. Học sinh chọn sai thì thí nghiệm chạy đúng theo lựa chọn sai, để các em tự thấy kết quả.

- Web tĩnh, **không cần build**. Chỉ có một hàm máy chủ: `api/ask.js`, dùng để gọi Gemini.
- **API key Gemini nằm trên máy chủ Vercel** (biến môi trường), học sinh không cần tài khoản gì.
- **Cần có mạng để mở trang.** Trang đã mở mà mất mạng giữa giờ thì mô phỏng và câu hỏi mồi vẫn chạy tiếp; chỉ ô hỏi AI tự do tạm tắt, các câu gợi ý vẫn có câu trả lời soạn sẵn.
- Số liệu câu hỏi mồi (đúng ngay lần đầu, hay chọn sai đáp án nào) **lưu trên máy giáo viên** và **tải ra được file CSV** để làm minh chứng.

## Cấu trúc

```
index.html                   Trang chủ: 3 thẻ môn Vật lí / Hóa học / Sinh học
subject.html                 Trang một môn (/vat-li, /hoa-hoc, /sinh-hoc): bài theo tab Lớp 6–9
lab.html                     Trang thí nghiệm dùng chung (/vat-li/thau-kinh…): nạp bài theo URL
assets/css/lab.css           Giao diện dùng chung (biến màu, có màu riêng từng môn)
assets/js/catalog.js         Danh mục môn (SUBJECTS) và bài thí nghiệm (LESSONS)
assets/js/art.js             Hình minh họa SVG của 3 môn
assets/js/pages/home.js      Dựng trang chủ từ catalog
assets/js/pages/subject.js   Dựng trang môn từ catalog
assets/js/pages/lab.js       Đọc URL /<môn>/<bài> → tìm bài trong catalog → nạp module bài
assets/js/engine.js          Lõi: chạy bước, câu hỏi mồi, trợ lý AI, số liệu, công cụ vẽ
assets/js/lessons/thau-kinh.js   Nội dung + hình vẽ của thí nghiệm Thấu kính (dùng làm mẫu)
api/ask.js                   Hàm máy chủ gọi Gemini (Vercel Serverless Function)
sw.js                        Gỡ bản offline cũ khỏi máy đã từng cài (không còn chạy offline)
manifest.webmanifest         Cài như ứng dụng
vercel.json, serve.json      Đường dẫn đẹp /vat-li, /vat-li/thau-kinh… và chuyển link cũ /thau-kinh/ sang link mới
```

## Đưa lên mạng (Vercel)

### 1. Lấy API key Gemini
1. Vào https://aistudio.google.com, đăng nhập tài khoản Google.
2. Chọn **Get API key** → **Create API key**. Sao chép key.
3. Xem giới hạn của gói miễn phí ngay trong AI Studio (số lượt mỗi phút, mỗi ngày).

### 2. Đưa code lên GitHub
Tạo một repo mới (để **Private** cũng được), rồi trong thư mục này:
```bash
git init
git add .
git commit -m "Phòng thí nghiệm KHTN"
git branch -M main
git remote add origin https://github.com/<tên-bạn>/<tên-repo>.git
git push -u origin main
```
File `.env` đã nằm trong `.gitignore`, **không bao giờ đưa API key lên GitHub**.

### 3. Tạo project trên Vercel
1. Vào https://vercel.com → **Add New… → Project** → chọn repo vừa tạo → **Import**.
2. **Framework Preset**: chọn **Other**. Không cần Build Command hay Output Directory.
3. Mở **Environment Variables**, thêm:
   - `GEMINI_API_KEY` = key ở bước 1
   - (không bắt buộc) `GEMINI_MODEL` = tên model, mặc định `gemini-flash-latest`
4. Bấm **Deploy**. Vài chục giây sau sẽ có đường link dạng `https://<tên>.vercel.app`.

Cách khác, dùng dòng lệnh:
```bash
npm i -g vercel
vercel            # lần đầu: đăng nhập, tạo project
vercel env add GEMINI_API_KEY
vercel --prod
```

### 4. Chạy thử trên máy
```bash
cp .env.example .env.local    # rồi điền GEMINI_API_KEY
npx vercel dev                # mở http://localhost:3000
```
Chỉ xem phần mô phỏng (không có AI) thì chạy web tĩnh bất kỳ, ví dụ `npx serve .`.

## Thêm thí nghiệm mới
1. Sao chép `assets/js/lessons/thau-kinh.js` thành file mới, ví dụ `assets/js/lessons/do-toc-do.js`. Sửa:
   - `id`, `grade`, `chapter`, `lesson`, `title`, `intro`
   - `view` (vùng nhìn, đơn vị cm), `base()` (biến của cảnh), `draw()` (vẽ cảnh)
   - `steps`: mỗi bước có `title`, `sgk` (chép theo SGK), `note` (điều quan sát được), `chips` (câu hỏi gợi ý kèm câu trả lời soạn sẵn), `setup()` và `run()`. Bước có câu hỏi mồi thì thêm `q: true` và gọi `await h.ask('id-câu-hỏi')` trong `run()`.
   - `questions`: mỗi câu có 4 lựa chọn, `answer`, `sim()` (chạy thí nghiệm theo lựa chọn), `reset()`, `wrong[]` (nhận xét cho từng đáp án sai), `hint2`, `right`, `ref`.
2. File module nằm trong `assets/js/lessons/` (ví dụ `assets/js/lessons/do-toc-do.js`).
3. Thêm bài vào `LESSONS` trong `assets/js/catalog.js` (đúng `subject`, `grade`, `status: 'ready'`, `href: '/<môn>/<bài>'`, `module`). Không cần tạo trang HTML: `lab.html` tự nạp bài theo URL. Thẻ môn ở trang chủ tự cập nhật số thí nghiệm.

Mẹo: thiết kế để **mỗi đáp án là một thông số của thí nghiệm** (một vị trí, một loại dụng cụ…). Khi đó `sim()` chỉ cần chạy lại cùng một mô phỏng với thông số đó.

## Bảo vệ API key
- Key chỉ nằm trong biến môi trường của Vercel, trình duyệt không thấy được.
- `api/ask.js` chỉ nhận yêu cầu từ chính trang web, giới hạn độ dài câu hỏi, và chặn cơ bản 20 câu hỏi / 5 phút cho mỗi địa chỉ IP.
- Nếu dùng tên miền riêng khác, thêm vào biến `ALLOWED_ORIGINS` (cách nhau dấu phẩy).
- Nên bật giới hạn chi tiêu hoặc chỉ dùng gói miễn phí trong Google AI Studio.

## Ghi chú nội dung
Các bước trong `thau-kinh.js` đang soạn theo kiến thức chuẩn của bài. Cần đối chiếu và chỉnh lại câu chữ cho khớp đúng SGK trước khi dùng chính thức. Mọi câu hỏi mồi và nhận xét đều do giáo viên kiểm duyệt.
