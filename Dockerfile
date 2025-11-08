FROM node:20-alpine

# Thư mục làm việc trong container
WORKDIR /app

# Copy file khai báo phụ thuộc
# Dùng package*.json để không bắt buộc phải có package-lock.json
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source vào container
COPY . .

# Build TypeScript -> JavaScript (ra thư mục dist)
RUN npm run build

# Expose port bên trong container (app đang listen 8080)
EXPOSE 8080

# Chạy app đã build (dist/app.js sinh ra từ src/app.ts)
CMD ["node", "dist/app.js"]
