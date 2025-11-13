// src/db.ts
import mysql from 'mysql2/promise';

export let dbPool: mysql.Pool; // <-- export singleton

export async function initDatabase(): Promise<void> {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error('[DB] Missing DB env config (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    process.exit(1);
  }

  const port = DB_PORT ? Number(DB_PORT) : 3306;

  // 1) Tạo DB nếu chưa có
  const bootstrap = await mysql.createConnection({
    host: DB_HOST,
    port,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await bootstrap.end();

  // 2) Tạo pool dùng DB đó (gán vào biến module)
  dbPool = mysql.createPool({
    host: DB_HOST,
    port,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 10,
  });

  // 3) Tạo bảng nếu chưa có
  await createSchema(dbPool);

  console.log('[DB] Database & tables are ready.');
}

async function createSchema(pool: mysql.Pool): Promise<void> {
  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      external_order_id VARCHAR(100) NOT NULL,
      result_token VARCHAR(191) NOT NULL UNIQUE,
      loaiproxy VARCHAR(50) NOT NULL,
      quantity INT NOT NULL,
      days INT NOT NULL,
      type VARCHAR(10) NOT NULL,
      status ENUM('PENDING','PROCESSING','SUCCESS','PARTIAL','FAILED') NOT NULL DEFAULT 'PENDING',
      error_message VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_external_order_id (external_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  const createProxiesTable = `
    CREATE TABLE IF NOT EXISTS proxies (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      idproxy BIGINT NULL,
      proxy_string VARCHAR(255) NULL,
      expired_at DATETIME NULL,
      status ENUM('PENDING','ACTIVE','EXPIRED','FAILED') NOT NULL DEFAULT 'PENDING',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      INDEX idx_order_id (order_id),
      INDEX idx_expired_at (expired_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  await pool.query(createOrdersTable);
  await pool.query(createProxiesTable);
}
