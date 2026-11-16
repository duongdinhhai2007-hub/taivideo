
# TaiVideo - All in One Downloader

Website tải video và hình ảnh đa nền tảng.

## 1. Công nghệ

- HTML5
- CSS3
- JavaScript
- LocalStorage
- Fetch API
- Vercel Hosting

## 2. Cài đặt trên máy tính

Cài Visual Studio Code.

Tạo thư mục `taivideo` và thêm 4 file:

- index.html
- style.css
- script.js
- README.md

Mở thư mục bằng VS Code.

Có thể cài extension Live Server và chọn:
Open with Live Server.

Website sẽ chạy trên địa chỉ localhost.

## 3. Triển khai lên Vercel

1. Tạo tài khoản Vercel.
2. Tạo repository GitHub.
3. Upload 4 file lên GitHub.
4. Vào Vercel và chọn Add New Project.
5. Import repository.
6. Chọn Framework Preset: Other.
7. Build Command: để trống.
8. Output Directory: .
9. Chọn Deploy.

Sau khi triển khai, bạn có thể kết nối domain:
taivideo.vercel.app

## 4. Cấu hình API

Mặc định API endpoint:

/api/download

Frontend gửi POST JSON:

{
  "action": "analyze",
  "url": "https://example.com/video",
  "platform": "TikTok"
}

Backend phân tích trả về:

{
  "success": true,
  "title": "Video title",
  "formats": [
    {
      "id": "1080",
      "label": "1080p Full HD"
    },
    {
      "id": "720",
      "label": "720p HD"
    }
  ]
}

Yêu cầu tải:

{
  "action": "download",
  "url": "https://example.com/video",
  "platform": "TikTok",
  "quality": "1080",
  "formatId": "1080"
}

Backend trả về:

{
  "success": true,
  "downloadUrl": "https://your-cdn.example/file.mp4"
}

## 5. Chỉnh sửa website

Đổi màu sắc:
Mở style.css và chỉnh biến --primary.

Đổi logo:
Mở index.html và sửa TaiVideo.

Thêm nền tảng:
Mở script.js và thêm dữ liệu vào PLATFORMS.

Đổi ngôn ngữ:
Chỉnh object TRANSLATIONS trong script.js.

Đổi API:
Vào mục Quản trị hoặc chỉnh CONFIG trong script.js.

## 6. Lưu ý bảo mật

- Mật khẩu admin trong bản demo không an toàn.
- LocalStorage chỉ lưu dữ liệu trên trình duyệt hiện tại.
- Không dùng bản admin demo để quản trị website công khai.
- Backend cần xác thực quản trị phía server.
- Backend phải kiểm tra URL, hostname, redirect và chặn SSRF.
- Không lưu cookie hoặc mật khẩu mạng xã hội của người dùng.
- Chỉ xử lý nội dung được phép tải xuống.
- API cần giới hạn tốc độ và kiểm soát dung lượng.

## 7. Phiên bản

TaiVideo v1.0.0
