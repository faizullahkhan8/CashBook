# Zada Pharmacy POS Cash Counter - Hostinger Shared Web Hosting Deployment Guide

Yeh guide aapko Zada Pharmacy **POS Cash Counter & Shift Closing App** ko Hostinger Web Hosting par **PHP + MySQL** ke sath live karne ka mukammal tareeqa batati hai.

---

## 📁 Aapka Ready-to-Upload Folder: `dist`

Jab hum root folder mein `npm run build` run karte hain, toh `dist/` folder ke andar tamam zaroori cheezein ready ho jati hain:
- `index.html` (React POS Cash Counter App)
- `assets/` (Compiled JavaScript & CSS)
- `.htaccess` (Hostinger LiteSpeed / Apache routing)
- `api/`
  - `config.php` (MySQL Database credentials)
  - `db.php` (Auto-creates 7 MySQL tables + Default Admin & Settings)
  - `index.php` (REST API for Shifts, Ledgers, Closings, Short Items, Users)
  - `jwt.php` (Secure Login & Token authentication)

---

## 🚀 Hostinger Par Live Karne Ka Tareeqa (Sirf 4 Asaan Steps)

### Step 1: Hostinger par MySQL Database Banayein
1. Apne Hostinger **hPanel** (control panel) mein login karein.
2. Left menu mein **Databases** -> **MySQL Databases** par click karein.
3. Naya database banayein:
   - **Database Name:** e.g. `zada_pos_db`
   - **Username:** e.g. `zada_pos_user`
   - **Password:** Koi bhi strong password set karein.
4. **Create** par click karein.

> **Tip:** Manually SQL tables import karne ki bilkul zaroorat nahi hai! Hamari PHP script pehli dafa login karne par tamam tables (`users`, `settings`, `employees`, `shifts`, `ledger_entries`, `shift_closings`, `short_items`) **khud ba khud create aur initialize** kar degi!

---

### Step 2: `api/config.php` mein Database Details Fill Karein
Apne computer par `dist/api/config.php` file ko kisi bhi text editor mein kholein (ya Hostinger File Manager mein upload ke baad edit karein):

```php
return [
    'db_host' => 'localhost',
    'db_name' => 'u123456789_zada_pos_db',     // Hostinger ka poora DB name
    'db_user' => 'u123456789_zada_pos_user',   // Hostinger ka poora DB username
    'db_pass' => 'AapkaHostingerPassword123!',  // Aapka database password

    'jwt_secret' => 'zada_pos_jwt_secret_key_change_me_in_prod_2026',

    'default_admin_user' => 'admin',
    'default_admin_pass' => 'admin123',
];
```

---

### Step 3: Files ko Hostinger ke `public_html` (ya Subdomain) Mein Upload Karein
1. Hostinger hPanel mein **File Manager** open karein.
2. `public_html` (ya agar subdomain banaya hai jaise `counter.zadapharmacy.com` toh uske folder) ke andar jayein.
3. `dist/` folder ke **tamam files aur folders** ko upload kar dein:
   - `assets/`
   - `api/`
   - `index.html`
   - `.htaccess`
   - `logo.png`
   - `logo-dark.png`
   - `logo.ico`
   - `rx-icon.svg`

---

### Step 4: Website Kholein aur Login Karein! 🎉
Browser mein apna domain open karein:
👉 `https://counter.zadapharmacy.com` (ya aapka domain)

Aapke samne **Cash Counter Login Screen** aayegi:
- **Default Username:** `admin`
- **Default Password:** `admin123`

---

## 👥 Staff & Cashier User Management:
- **Admin Users:** Sidebar ke bottom mein **"Staff"** button par click karke naye cashiers (counter operators) create kar sakte hain aur unhe deactivate/activate kar sakte hain.
- **Cashier Users:** Daily ledger entries, short items, aur shift closings perform kar sakte hain.
