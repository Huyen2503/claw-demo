# Lily — English Coach

Trợ lý học tiếng Anh cho người Việt: dịch thuật, sửa lỗi, phát âm và viết lại
câu tự nhiên. Frontend tĩnh (HTML/CSS/JS) + một backend Node nhỏ proxy request
tới VNG Cloud MaaS.

## Tính năng

### Thanh điều khiển

- **Header trợ lý** — avatar 🇺🇸 + tên, chấm xanh báo online; 3 chip trạng thái
  nhanh: chế độ hiện tại, ngôn ngữ đích (English 🇺🇸), giọng đọc (Giọng Mỹ);
  nút ⚙️ mở cài đặt.
- **Bảng thống kê** — đếm theo phiên: số câu *Đã dịch*, *Đã sửa*, *Từ học được*.
- **Thanh chọn chế độ** — chuyển nhanh giữa các tính năng, tab đang chọn được
  highlight.
- **Dòng gợi ý động** — đổi theo chế độ đang chọn, hướng dẫn người dùng nhập gì.

### Các chế độ

| Chế độ | Chức năng |
|--------|-----------|
| 💬 Dịch thuật | Dịch Việt → Anh (chuẩn giọng Mỹ) |
| 📝 Sửa lỗi | Sửa chính tả & ngữ pháp câu tiếng Anh |
| 🔊 Phát âm | Đọc / hướng dẫn phát âm chuẩn giọng Mỹ |
| ✨ Viết lại tự nhiên | Viết lại câu tiếng Anh tự nhiên, trôi chảy hơn |

Nút 🔊 trên mỗi câu trả lời dùng Web Speech API để đọc to phần tiếng Anh.

## Kiến trúc

- **Frontend** — `index.html`, `app.js`, `style.css` (tĩnh, không build step).
- **Backend** — `server.js`: Node HTTP server, phục vụ file tĩnh và proxy
  `POST /api/chat` tới MaaS, kèm `GET /health`.
- **Model** — `qwen/qwen3-5-27b` trên VNG Cloud MaaS, gọi với
  `enable_thinking: false` để câu trả lời nằm thẳng trong `message.content`.

## Chạy local

Cần Node 20+. API key đọc từ biến môi trường `MAAS_API_KEY` (đặt trong `.env`):

```bash
echo 'MAAS_API_KEY=<your-maas-key>' > .env
node --env-file=.env server.js
# mở http://localhost:8080
```

## Deploy

Đóng gói bằng `Dockerfile` (container lắng nghe cổng 8080) và deploy lên
VNG Cloud AgentBase. Inject `MAAS_API_KEY` qua env file của runtime — không
hardcode key vào image.

> `.env`, `.greennode.json` và `.claude/` đã được `.gitignore` loại trừ.
