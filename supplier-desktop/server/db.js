import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'zada_supplier_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
      dateStrings: true,
    });
  }
  return pool;
}

export async function initDb() {
  const p = getPool();

  // Test connection
  try {
    const conn = await p.getConnection();
    console.log('[MySQL] Connected successfully to host:', process.env.DB_HOST || 'localhost');
    conn.release();
  } catch (err) {
    console.error('[MySQL] Connection error. Please check your DB credentials in .env:', err.message);
    throw err;
  }

  // 1. Users table
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role ENUM('admin', 'operator') NOT NULL DEFAULT 'operator',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Bills table
  await p.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sync_id VARCHAR(64) NOT NULL UNIQUE,
      posting_date VARCHAR(20) NOT NULL,
      bill_date VARCHAR(20) NOT NULL,
      supplier_name VARCHAR(255) NOT NULL,
      supplier_bill_no VARCHAR(100) DEFAULT '',
      voucher_no VARCHAR(100) DEFAULT '',
      total_bill_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      actual_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      category VARCHAR(50) NOT NULL DEFAULT 'PAYABLE',
      remarks TEXT,
      created_by VARCHAR(50) DEFAULT NULL,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_posting_date (posting_date),
      INDEX idx_supplier_name (supplier_name),
      INDEX idx_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Payments table
  await p.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sync_id VARCHAR(64) NOT NULL UNIQUE,
      bill_sync_id VARCHAR(64) NOT NULL,
      payment_date VARCHAR(20) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      payment_mode VARCHAR(50) NOT NULL DEFAULT 'COUNTER_CASH',
      reference_no VARCHAR(100) DEFAULT '',
      remarks TEXT,
      created_by VARCHAR(50) DEFAULT NULL,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bill_sync_id (bill_sync_id),
      INDEX idx_payment_date (payment_date),
      INDEX idx_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Seed default Admin user if no users exist
  const [rows] = await p.query('SELECT COUNT(*) as count FROM users');
  if (rows[0].count === 0) {
    const defaultUsername = process.env.DEFAULT_ADMIN_USER || 'admin';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASS || 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);

    await p.query(
      'INSERT INTO users (username, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
      [defaultUsername, hash, 'System Administrator', 'admin', 'active']
    );
    console.log(`[MySQL] Seeded default admin user: "${defaultUsername}" with password: "${defaultPassword}"`);
    console.log('[MySQL] Please change this password after initial login!');
  }
}
