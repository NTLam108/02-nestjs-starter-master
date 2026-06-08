# Recruitment Management System (RMS) - NestJS Backend

## 🚀 Tổng quan dự án

Dự án này là một hệ thống quản lý tuyển dụng (tương tự LinkedIn/TopCV thu nhỏ), cung cấp đầy đủ các tính năng từ quản lý người dùng, công ty, tin tuyển dụng cho đến quy trình ứng tuyển (Resumes) và phân quyền chi tiết (RBAC).

### Công nghệ lõi (Tech Stack)
- **Framework:** NestJS (v9) - Node.js framework mạnh mẽ cho kiến trúc modular.
- **Database:** MongoDB thông qua **Mongoose** (ODM).
- **Authentication:** Passport.js (JWT & Local Strategy).
- **Security:** Helmet, CORS, Throttler (Rate limiting).
- **Documentation:** Swagger UI (OpenAPI 3.0), Compodoc.
- **Email:** Nodemailer & @nestjs-modules/mailer (Template EJS/Handlebars).
- **Utilities:** Class-validator, Class-transformer, api-query-params.

---

## ✨ Tính năng chính

### 1. Quản trị hệ thống (Core Modules)
- **Auth:** Đăng nhập, đăng ký, Refresh Token, quản lý Cookies bảo mật.
- **Users:** Quản lý thông tin người dùng, trạng thái tài khoản.
- **Roles & Permissions:** Hệ thống phân quyền dựa trên vai trò (RBAC) linh hoạt, quản lý permission đến từng API endpoint.
- **Databases:** Cơ chế tự động khởi tạo dữ liệu mẫu (Seeding data) khi deploy lần đầu.

### 2. Nghiệp vụ Tuyển dụng (Business Modules)
- **Companies:** Quản lý thông tin doanh nghiệp, logo, mô tả, địa chỉ.
- **Jobs:** Đăng tin tuyển dụng với đầy đủ thông tin (level, salary, description, skills). Hỗ trợ lọc tin nâng cao.
- **Resumes:** Quản lý CV ứng viên, theo dõi trạng thái ứng tuyển (PENDING, REVIEWING, APPROVED, REJECTED).
- **Subscribers:** Hệ thống đăng ký nhận thông báo việc làm qua email dựa trên kỹ năng (Skill-based).

### 3. Tiện ích & Hiệu năng
- **File Upload:** Xử lý tải lên CV và hình ảnh với Multer.
- **Mail Service:** Tự động gửi email thông báo trạng thái hoặc việc làm mới định kỳ (Schedule/Cron).
- **Health Check:** Theo dõi tình trạng sức khỏe hệ thống với Terminus.

---

## 🛠 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- MongoDB (Local hoặc MongoDB Atlas)

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc và cấu hình các thông số sau (Tham khảo mẫu bên dưới):
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_ACCESS_TOKEN_SECRET=YOUR_SECRET
JWT_ACCESS_EXPIRE=1d
JWT_REFRESH_TOKEN_SECRET=YOUR_SECRET
JWT_REFRESH_EXPIRE=1d

# Init Data
SHOULD_INIT=true
INIT_PASSWORD=123456

# Mail Config
EMAIL_HOST=smtp.gmail.com
EMAIL_AUTH_USER=your_email@gmail.com
EMAIL_AUTH_PASS=your_app_password
```

### 4. Chạy dự án
```bash
# Chế độ phát triển (Watch mode)
npm run dev

# Chế độ Production
npm run build
npm run start:prod
```

---

## 📖 Tài liệu API (Swagger)

Hệ thống đã tích hợp sẵn Swagger để demo và test API. Sau khi chạy dự án, bạn có thể truy cập tại:
- **URL:** `http://localhost:8000/swagger`
- **Tài khoản Admin mặc định:** `admin@gmail.com` / `123456`

---

## 🏗 Kiến trúc dự án (Project Structure)

Dự án tuân thủ kiến trúc Modular của NestJS để dễ dàng bảo trì và mở rộng:
```
src/
├── auth/           # Xác thực & Phân quyền
├── companies/      # Quản lý công ty
├── jobs/           # Quản lý tin tuyển dụng
├── users/          # Quản lý người dùng
├── resumes/        # Quản lý hồ sơ ứng tuyển
├── roles/          # Quản lý vai trò (Admin, User, ...)
├── permissions/    # Quản lý quyền hạn chi tiết
├── mail/           # Dịch vụ gửi email template
├── files/          # Xử lý upload file
├── core/           # Interceptors, Decorators, Filters dùng chung
└── main.ts         # Điểm khởi đầu của ứng dụng
```

---

## 🛡 Đặc điểm kỹ thuật nổi bật
1. **Global Interceptor:** Chuẩn hóa dữ liệu trả về cho mọi API (Transform Response).
2. **Global Guard:** Bảo mật mặc định cho toàn bộ endpoint bằng JWT.
3. **Soft Delete:** Sử dụng plugin chuyên dụng cho Mongoose giúp quản lý dữ liệu bị xóa an toàn.
4. **API Versioning:** Hỗ trợ đa phiên bản API (`v1`, `v2`) trực tiếp qua URI.
5. **Request Validation:** Pipeline chặt chẽ, tự động lọc (whitelist) và validate dữ liệu đầu vào.

---
**Phát triển bởi Nguyen Trong Lam**
