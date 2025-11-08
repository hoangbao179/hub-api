# hub-api

Backend dùng để gom và chuẩn hóa các API liên quan tới proxy, license, Gmail và một số dịch vụ bên ngoài khác.  
Dự án sử dụng **Node.js + TypeScript + Express**, deploy qua Docker và GitHub Actions.

---

## 1. Tech stack

- Node.js 20
- TypeScript
- Express
- Axios
- Google Sheets API (service account)
- Docker & Docker Compose
- GitHub Actions (CI / CD)

---

## 2. Cấu trúc thư mục

```txt
.
├── src/
│   ├── app.ts                      # Entry point
│   ├── routers/                    # Định nghĩa route /api
│   ├── controllers/                # Xử lý request/response
│   ├── services/                   # Business logic, call tới các provider ngoài
│   ├── models/                     # Kiểu dữ liệu / DTO
│   ├── enums/                      # Enum dùng chung
│   ├── utils/                      # Helper (ví dụ: gửi Telegram)
├── .env                            # Biến môi trường (chỉ local, KHÔNG commit)
├── .env.example                    # Mẫu biến môi trường (không chứa secrets)
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── .github/
    └── workflows/
        └── deploy-hub-api.yml      # CI + CD
```

---

## 3. Cài đặt & chạy local

### 3.1. Yêu cầu

- Node.js >= 20  
- npm

### 3.2. Cài dependencies

```bash
npm install
```

### 3.3. Chuẩn bị `.env` local

Tạo file `.env` ở thư mục gốc dự án, dựa trên `.env.example`:

```bash
cp .env.example .env
# sau đó chỉnh giá trị phù hợp với môi trường dev của bạn
```

> Lưu ý: file `.env` chỉ dùng cho local / môi trường riêng. **Không commit** file này lên git.

### 3.4. Chạy dev (ts-node / nodemon)

```bash
npm run dev
```

Mặc định server lắng nghe tại:

```text
http://localhost:8080
```

Các API được mount dưới prefix `/api`.

### 3.5. Build & chạy production (JS)

```bash
npm run build
node dist/app.js
```

---

## 4. Biến môi trường

Trong môi trường deploy qua CI/CD:

- `.env` trên server **được tạo tự động từ GitHub Secrets** bởi workflow `deploy-hub-api.yml`.
- Không chỉnh sửa `.env` trực tiếp trên server (mọi thay đổi nên đi từ secrets).

Ở local, `.env` dùng để dev/test.

**Một số biến chính (tên giữ đúng như trong code):**

```env
# Thông tin user / dịch vụ bên ngoài
API_GET_INFO_USER=...

# Rotating proxy
API_KEY_PROXY_ROTATING=...
API_USER_WEB_ROTATING_PROXY=...
URL_BUY_PROXY_ROTATING=...
URL_GET_DATA_ROTATING_PROXY=...
URL_GET_PACKAGE_ROTATING_PROXY=...

# Static proxy
API_KEY_SITE_BUY_PROXY=...
SITE_BUY_PROXY=...                 # Base URL của provider static proxy

# Cấu hình dùng cho các dịch vụ liên quan
SITE_SELL_GMAIL=...
SITE_SELL_PROXY=...
USER_TOKEN_API_TH=...

# Gmail / Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEET_ID=...
SHEET_NAME_INS=instagram

# Thông báo qua Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Temp mail
TEMP_MAIL_API_BASE=...

# Các thông tin khác
APP_INS_VERSION=1.1.1
```

### PROXY_VN_CALL_API (legacy / sẽ xoá sau)

```env
PROXY_VN_CALL_API=host:port:user:pass   # OPTIONAL - LEGACY
```

Biến này được dùng để cấu hình một HTTP proxy trung gian cho các request của static proxy service.

- **Hiện tại**:
  - Ở môi trường deploy chính, static proxy **không cần** đi qua proxy trung gian.
  - `PROXY_VN_CALL_API` được coi là **tuỳ chọn**:
    - Nếu **không khai báo** hoặc để trống → static proxy gọi trực tiếp provider, không cấu hình proxy.
    - Nếu **được khai báo đúng định dạng** → static proxy sẽ gắn `HttpsProxyAgent` và route request qua proxy này.

- **Kế hoạch**:
  - Biến `PROXY_VN_CALL_API` chỉ còn tồn tại để **giữ tương thích tạm thời** với các môi trường cũ.
  - Sau khi hoàn tất việc chuyển đổi hạ tầng và không còn môi trường nào phụ thuộc vào cơ chế này, toàn bộ:
    - Biến môi trường `PROXY_VN_CALL_API`
    - Logic xử lý proxy tương ứng trong static proxy service  
    sẽ được **loại bỏ khỏi codebase**.
  - Các môi trường mới không nên dựa vào biến này. Mặc định hãy triển khai theo hướng static proxy gọi trực tiếp provider.

---

## 5. Static proxy service (tóm tắt logic)

Static proxy sử dụng service riêng trong `src/services/static-proxy/...`.

Chức năng chính:

- Mua / khởi tạo static proxy từ provider.
- Chuẩn hóa response để trả về cho client.
- Gửi thông báo qua Telegram khi:
  - Mua thành công.
  - Gặp lỗi từ provider.
  - Bị timeout / trạng thái không rõ ràng.

Luồng xử lý chính:

1. Build URL request dựa trên:
   - `SITE_BUY_PROXY`
   - API key, tham số từ controller.
2. (Tuỳ chọn) Nếu `PROXY_VN_CALL_API` được cấu hình hợp lệ:
   - Tạo `HttpsProxyAgent` và gắn vào cấu hình `axios`.
3. Gửi request tới provider.
4. Parse kết quả:
   - Thành công → trả về dữ liệu + gửi notify Telegram.
   - Lỗi / timeout → map sang thông báo phù hợp + gửi notify.

---

## 6. Rotating proxy service (tóm tắt)

Rotating proxy sử dụng service trong `src/services/rotating-proxy/...`.

Chức năng:

- Lấy danh sách gói, tồn kho, thông tin proxy từ provider rotating proxy.
- Chuẩn hóa response (format JSON) để frontend / công cụ khác dễ sử dụng.
- Có thể thêm logic mapping status, filter, format lại dữ liệu.

---

## 7. Google Sheets & Gmail

Dự án sử dụng **service account** để thao tác với Google Sheets.

Các biến liên quan:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SHEET_ID`
- `SHEET_NAME_INS`

Một số use case:

- Đọc/ghi license / thông tin người dùng từ Google Sheet.
- Đồng bộ một phần dữ liệu giữa hệ thống và sheet.

Lưu ý:

- `GOOGLE_PRIVATE_KEY` được lưu ở dạng string, bao gồm `\n` trong nội dung, sau đó trong code sẽ replace `\n` → `
` trước khi dùng.
- Không commit file JSON key lên repo, chỉ sử dụng env.

---

## 8. Docker

### 8.1. Dockerfile

- Dùng base image Node 20 (alpine).
- Copy `package*.json`, cài dependencies.
- Copy source, chạy `npm run build`.
- Chạy app qua `node dist/app.js`.

Build image:

```bash
docker build -t hub-api .
```

Chạy container:

```bash
docker run -d --name hub-api -p 80:8080 --env-file .env hub-api
```

### 8.2. docker-compose

Ví dụ `docker-compose.yml`:

```yaml
version: "3.9"

services:
  hub-api:
    build: .
    container_name: hub-api
    restart: always
    env_file:
      - .env
    ports:
      - "80:8080"   # host:container
```

Chạy:

```bash
docker compose up -d --build
```

---

## 9. CI + CD

Workflow chính: `.github/workflows/deploy-hub-api.yml`

### Trigger

```yaml
on:
  push:
    branches:
      - staging
```

Mỗi lần có `push` vào nhánh `staging`:

1. **Job `ci`**:
   - Checkout source.
   - Setup Node 20.
   - `npm install`.
   - `npm run build`.
   - (Có thể thêm `npm test` nếu dự án có test.)

2. **Job `deploy`** (chạy khi `ci` PASS):
   - Dùng `appleboy/ssh-action` để SSH vào server.
   - Trên server:
     - `cd /opt/hub-api` (hoặc đường dẫn bạn cấu hình).
     - `git fetch && git checkout staging && git pull origin staging`.
     - Tạo file `.env` từ GitHub Secrets (`cat > .env << EOF ... EOF`).
     - `docker compose up -d --build`.
     - Dọn các image không còn dùng: `docker image prune -f`.

> `.env` trên server luôn được sinh lại từ secrets, không chỉnh tay.
