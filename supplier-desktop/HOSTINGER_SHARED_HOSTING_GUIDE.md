# Zada Pharmacy SPMS - Hostinger Shared Web Hosting Deployment Guide (Zero Node.js Required)

Agar aapke Hostinger account mein Node.js nahi hai, toh yeh guide aapke liye hai! Humne is poori application ko **PHP + MySQL** par convert kar diya hai jo aapke isi Hostinger plan par **100% chalegi** — koi extra kharcha nahi.

---

## 📁 Aapka Ready-to-Upload Folder: `dist`

Jab hum `npm run build` run karte hain, toh `supplier-desktop/dist/` folder ke andar tamam zaroori cheezein ready ho jati hain:
- `index.html` (React App)
- `assets/` (Styling aur JavaScript)
- `.htaccess` (Server routing aur security)
- `api/`
  - `config.php` (Database connection)
  - `db.php` (Auto table creation)
  - `index.php` (REST API)
  - `jwt.php` (Secure Login system)

---

## 🚀 Hostinger Par Upload Karne Ka Tareeqa (Sirf 4 Asaan Steps)

### Step 1: Hostinger par MySQL Database Banayein
1. Apne Hostinger **hPanel** (control panel) mein login karein.
2. Left menu mein **Databases** -> **MySQL Databases** par click karein.
3. Naya database banayein:
   - **Database Name:** e.g. `zada_supplier_db`
   - **Username:** e.g. `zada_user`
   - **Password:** Koi bhi strong password set karein (aur yaad rakhein).
4. **Create** par click karein.

> **Note:** Tables khud banane ki zaroorat nahi hai! Hamari PHP script pehli martaba login hotay hi saari tables khud create kar legi.

---

### Step 2: `api/config.php` mein Database Details Daalein
Hostinger File Manager mein ja kar (ya upload karne se pehle apne computer par `supplier-desktop/dist/api/config.php` ko open karein):

```php
return [
    'db_host' => 'localhost',
    'db_name' => 'u123456789_zada_supplier_db', // Hostinger wala poora database name
    'db_user' => 'u123456789_zada_user',        // Hostinger wala poora database user
    'db_pass' => 'AapkaHostingerPassword123!',    // Aapka set kiya hua password

    'jwt_secret' => 'zada_spms_secret_key_2026_xyz',

    'default_admin_user' => 'admin',
    'default_admin_pass' => 'admin123',
];
```

---

### Step 3: Files ko Hostinger ke `public_html` Mein Upload Karein
1. Hostinger hPanel mein **File Manager** open karein.
2. `public_html` folder ke andar jayein.
3. `supplier-desktop/dist/` folder ke **tamam files aur folders** ko `public_html` ke andar upload kar dein:
   - `assets/`
   - `api/`
   - `index.html`
   - `.htaccess`
   - `logo.png`

---

### Step 4: Website Kholein aur Login Karein! 🎉
Ab apne browser mein apni website ya subdomain ka link kholein:
👉 `https://aapka-domain.com`

Aapke samne **Login Screen** aayegi:
- **Default Username:** `admin`
- **Default Password:** `admin123`

Login hote hi:
1. Aap summary, bills, aur payments dekh sakte hain.
2. Left sidebar mein **"👥 Users & Staff"** tab se apne counter staff ke liye naye accounts bana sakte hain!
