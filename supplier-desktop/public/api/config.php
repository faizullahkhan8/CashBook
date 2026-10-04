<?php
// ====================================================================
// Zada Pharmacy SPMS - Hostinger MySQL Database Configuration
// ====================================================================
// Jab aap Hostinger par upload karein, toh yahan apna Hostinger
// Database Name, Username aur Password darj karein.
// ====================================================================

return [
    // Database connection details
    'db_host' => 'localhost',
    'db_name' => 'u123456789_zada_db',       // Hostinger database name (e.g. u123456789_zada_db)
    'db_user' => 'u123456789_zada_user',     // Hostinger MySQL username
    'db_pass' => 'YourStrongPassword123!',    // Hostinger MySQL user password

    // Security & JWT Secret (Change to any random string for security)
    'jwt_secret' => 'zada_spms_secure_token_secret_key_2026_hostinger',

    // Initial Administrator Account (Created automatically on first run)
    'default_admin_user' => 'admin',
    'default_admin_pass' => 'admin123',
];
