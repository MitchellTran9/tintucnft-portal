# 🌐 TINTUCNFT.COM - Kho Tài Nguyên AI & Giải Pháp Bot Trading

> Hệ sinh thái nội dung Jamstack chuẩn SEO tốc độ cao: Tích hợp **Notion CMS** làm trình soạn thảo, **Astro 5+ (Tailwind CSS v4)** biên dịch tĩnh siêu tốc và triển khai miễn phí vĩnh viễn trên **Cloudflare Pages**.

---

## 🏗️ Cấu Trúc Hệ Thống (All-in-One Subdirectories)

Toàn bộ hệ thống liên kết tập trung trên 1 domain gốc để tối đa hóa sức mạnh SEO (Domain Authority):

| Đường Dẫn (Route) | Chuyên Mục / Dịch Vụ | Mục Đích |
| :--- | :--- | :--- |
| `/` | **Home (Trang chủ)** | Định vị hệ sinh thái, feed bài viết mới nhất và 3 phễu chuyển đổi |
| `/thi-truong-va-ai-247` | **Thị Trường và AI 247** | Cập nhật tin tức tài chính, Vàng, Crypto, AI 24/7 từ Notion |
| `/huong-dan-ve-ai` | **Hướng Dẫn Về AI** | Hướng dẫn MMO, thủ thuật prompt, nuôi tài khoản đa luồng |
| `/kho-ai-ha-tang-mmo` | **Kho AI & Hạ Tầng MMO** | Bán License GPM-Login, VPS, Proxy IPv4 tĩnh, Tool bản quyền |
| `/phan-tich-crypto-va-gold` | **Phân Tích Crypto và Gold** | Phân tích kỹ thuật SMC, Order Block, Quét thanh khoản |
| `/trading-signal-vip` | **Trading Signal VIP** | Khung tín hiệu sống, Webhook MT5, kéo ref sàn đối tác |
| `/bot-ea-trading` | **BOT EA Trading** | Hiển thị lịch sử Myfxbook 2 Bot NPNG, tặng 1 tuần chạy thử |
| `/about` | **Giới Thiệu** | Định vị thương hiệu, sứ mệnh, thông tin liên hệ và disclaimer |
| `/p/[slug]` | **Bài Viết Chi Tiết** | Đọc bài viết trực tiếp từ Notion với Call-To-Action theo chuyên mục |

---

## ⚙️ Cấu Hình Cloudflare Pages (Deploy 1 Phút)

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Chọn repo: **`MitchellTran9/tintucnft-portal`**.
3. Cấu hình Build settings:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Cấu hình Biến Môi Trường (**Environment variables**):
   - `NOTION_TOKEN`: Mã Notion Integration Token của bạn (`secret_...` hoặc `ntn_...`)
   - `NOTION_DATABASE_ID`: Mã ID của Database Notion (`41cf...`)
5. Nhấn **Save and Deploy**.
6. Vào mục **Custom Domains** $\rightarrow$ Thêm tên miền **`tintucnft.com`**.

---

## 📝 Cách Đăng Bài Mới Từ Ứng Dụng Notion

1. Mở database **HỆ THỐNG TIN TỨC** trên ứng dụng Notion (điện thoại hoặc máy tính).
2. Tạo bài viết mới và điền:
   - **Title (Name):** Tiêu đề bài viết chuẩn SEO.
   - **Slug:** Đường dẫn bài viết (vd: `phan-tich-xauusd-hom-nay`).
   - **Category:** Chọn 1 trong 3 nhóm: `Thị Trường và AI 247`, `Hướng Dẫn Về AI`, `Phân Tích Crypto và Gold`.
   - **Summary:** 1-2 câu tóm tắt làm thẻ meta description.
   - **Date:** Ngày xuất bản.
   - **Published:** Tích chọn `true`.
3. Soạn thảo nội dung bài viết chi tiết bên trong trang Notion (hỗ trợ heading, ảnh, callout, danh sách, code).
4. Cloudflare Pages sẽ tự động cập nhật bài viết mới!

---
© 2026 TINTUCNFT.COM & Smart Trader VIP Team.
