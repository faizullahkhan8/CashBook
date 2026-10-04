<?php
require_once __DIR__ . '/jwt.php';

function get_config() {
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

function get_db() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $cfg = get_config();
    $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'MySQL connection failed. Please verify credentials in api/config.php. Details: ' . $e->getMessage()
        ]);
        exit;
    }

    init_pos_schema($pdo, $cfg);
    return $pdo;
}

function init_pos_schema($pdo, $cfg) {
    // 1. Users Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
            status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. Settings Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 3. Employees Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            assigned_shift VARCHAR(50) DEFAULT 'Day',
            role VARCHAR(50) DEFAULT 'Counter Staff'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 4. Shifts Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS shifts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shift_code VARCHAR(50) UNIQUE,
            register_station VARCHAR(50) DEFAULT 'Register 01',
            shift_type VARCHAR(50) DEFAULT 'Day',
            employee_1 VARCHAR(100),
            employee_2 VARCHAR(100),
            cashier_name VARCHAR(150) DEFAULT 'Cashier 01',
            opening_float DECIMAL(12, 2) DEFAULT 0.00,
            opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            closed_at DATETIME NULL DEFAULT NULL,
            status VARCHAR(20) DEFAULT 'OPEN'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 5. Ledger Entries Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ledger_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shift_id INT NOT NULL,
            invoice_number VARCHAR(50) NOT NULL,
            customer_type VARCHAR(100) DEFAULT 'Walk-in Customer',
            amount DECIMAL(12, 2) NOT NULL,
            payment_method VARCHAR(20) NOT NULL,
            notes TEXT,
            shift_type VARCHAR(20) DEFAULT 'Day',
            employee_1 VARCHAR(100),
            employee_2 VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_shift (shift_id),
            INDEX idx_inv (invoice_number),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 6. Shift Closings Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS shift_closings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            closing_code VARCHAR(50) UNIQUE,
            shift_id INT NOT NULL,
            shift_type VARCHAR(20) DEFAULT 'Day',
            employee_1 VARCHAR(100),
            employee_2 VARCHAR(100),
            cashier_name VARCHAR(150),
            opening_float DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            cash_sales DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            online_sales DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            total_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            expected_drawer_cash DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            counted_cash DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            variance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
            status VARCHAR(50) NOT NULL DEFAULT 'Balanced',
            denominations_json TEXT NOT NULL,
            audit_notes TEXT,
            is_void TINYINT(1) DEFAULT 0,
            void_reason TEXT,
            voided_at DATETIME NULL DEFAULT NULL,
            updated_at DATETIME NULL DEFAULT NULL,
            closed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_closed (closed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 7. Short Items Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS short_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shift_id INT NOT NULL,
            amount DECIMAL(12, 2) NOT NULL,
            given_to VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'PENDING',
            returned_amount DECIMAL(12, 2) DEFAULT 0.00,
            spent_amount DECIMAL(12, 2) DEFAULT 0.00,
            bill_amount DECIMAL(12, 2) DEFAULT 0.00,
            reference_no VARCHAR(100) DEFAULT '',
            pharmacy VARCHAR(100) DEFAULT '',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            returned_at DATETIME NULL DEFAULT NULL,
            INDEX idx_short_shift (shift_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Seed default admin user
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $rowCount = $stmt->fetchColumn();
    if ((int)$rowCount === 0) {
        $user = !empty($cfg['default_admin_user']) ? $cfg['default_admin_user'] : 'admin';
        $pass = !empty($cfg['default_admin_pass']) ? $cfg['default_admin_pass'] : 'admin123';
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $ins = $pdo->prepare("INSERT INTO users (username, password_hash, full_name, role, status) VALUES (?, ?, 'Zada Administrator', 'admin', 'active')");
        $ins->execute([$user, $hash]);
    }

    // Seed default employees if empty
    $empCount = $pdo->query("SELECT COUNT(*) FROM employees")->fetchColumn();
    if ((int)$empCount === 0) {
        $pdo->exec("
            INSERT INTO employees (name, assigned_shift, role) VALUES
            ('Muhammad Ali', 'Day', 'Senior Cashier'),
            ('Usman Tariq', 'Day', 'Counter Staff'),
            ('Hamza Khan', 'Night', 'Night Pharmacist'),
            ('Bilal Ahmed', 'Night', 'Night Cashier');
        ");
    }

    // Seed default settings if empty
    $settCount = $pdo->query("SELECT COUNT(*) FROM settings")->fetchColumn();
    if ((int)$settCount === 0) {
        $defaults = [
            'pharmacy_name' => 'ZADA PHARMACY — POS CASH COUNTER & CLOSINGS',
            'register_station' => 'Register 01',
            'currency' => 'PKR',
            'active_shift_type' => 'Day',
            'day_employee_1' => 'Muhammad Ali',
            'day_employee_2' => 'Usman Tariq',
            'night_employee_1' => 'Hamza Khan',
            'night_employee_2' => 'Bilal Ahmed',
            'short_items_staff' => json_encode(['Ali (Runner)', 'Kamran (Rider)', 'Zeeshan (Purchase)']),
            'short_item_pharmacies' => json_encode(['Local Pharmacy', 'Medicine Market']),
            'theme' => 'light',
        ];
        $settStmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        foreach ($defaults as $k => $v) {
            $settStmt->execute([$k, $v]);
        }
    }

    // Seed initial active shift if none open
    $openShift = $pdo->query("SELECT COUNT(*) FROM shifts WHERE status = 'OPEN'")->fetchColumn();
    if ((int)$openShift === 0) {
        $shiftCode = 'SHF-' . date('Ymd') . '-DAY-01';
        $pdo->exec("
            INSERT INTO shifts (shift_code, register_station, shift_type, employee_1, employee_2, cashier_name, opening_float, opened_at, status)
            VALUES ('$shiftCode', 'Register 01', 'Day', 'Muhammad Ali', 'Usman Tariq', 'Muhammad Ali & Usman Tariq', 0.00, NOW(), 'OPEN')
        ");
    }
}
