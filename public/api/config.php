<?php
// ====================================================================
// Zada Pharmacy Cash Counter - Hostinger MySQL Database Configuration
// ====================================================================
// Hostinger par upload karte waqt apna MySQL Database Name,
// Username aur Password yahan darj karein.
// ====================================================================

return [
    // Database connection details
    'db_host' => 'localhost',
    'db_name' => 'u123456789_zada_pos_db',     // Hostinger MySQL database name
    'db_user' => 'u123456789_zada_pos_user',   // Hostinger MySQL username
    'db_pass' => 'YourStrongPassword123!',      // Hostinger MySQL user password

    // Security & JWT Secret
    'jwt_secret' => 'zada_pos_cashbook_super_secret_jwt_key_2026_hostinger',

    // Initial Administrator Account
    'default_admin_user' => 'admin',
    'default_admin_pass' => 'admin123',
];
