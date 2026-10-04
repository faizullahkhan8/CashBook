# Zada Pharmacy SPMS - Hostinger VPS Deployment Guide

Yeh guide aapko Zada Pharmacy **Supplier & Payment Management System (SPMS)** ko Hostinger VPS par online host karne aur MySQL database ke sath connect karne ka mukammal tareeqa batati hai.

---

## 📌 Architecture Overview

```
[ Browser / Phone / Desktop ]
             ↓  (HTTP / HTTPS)
[ Hostinger VPS: Node.js Express Server (Port 5000) ]
       ↓                       ↓
[ React Web App (dist/) ]   [ MySQL / MariaDB Database ]
                             - users (Role-based: admin, operator)
                             - bills (Bills & Tax calculation)
                             - payments (Cheque, Online, Cash)
```

---

## 🚀 Step-by-Step Setup on Hostinger VPS

### 1. Requirements on VPS
VPS terminal (SSH) mein check karein ke Node.js aur MySQL installed hain:
```bash
node -v   # v20+ recommended
mysql -V  # MySQL ya MariaDB
```
Agar installed nahi hain:
```bash
sudo apt update
sudo apt install -y nodejs npm mysql-server
npm install -g pm2
```

---

### 2. MySQL Database Setup on Hostinger
MySQL terminal ya phpMyAdmin mein login karein aur database banayein:

```sql
CREATE DATABASE zada_supplier_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dedicated user banayein (optional but recommended):
CREATE USER 'zada_user'@'localhost' IDENTIFIED BY 'AapkaStrongPassword123!';
GRANT ALL PRIVILEGES ON zada_supplier_db.* TO 'zada_user'@'localhost';
FLUSH PRIVILEGES;
```

> **Note:** Tables manually create karne ki zaroorat nahi hai. Server pehli baar run hotay hi `users`, `bills`, aur `payments` tables **automatically** create kar lega!

---

### 3. Project Upload & Install
Project files ko VPS par kisi folder mein clone ya upload karein (e.g., `/var/www/supplier-desktop`):

```bash
cd /var/www/supplier-desktop

# Dependencies install karein
npm install
```

---

### 4. Configure `.env` File
`supplier-desktop/.env` file banayein:
```bash
cp .env.example .env
nano .env
```

Andar apni database details fill karein:
```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=zada_user
DB_PASSWORD=AapkaStrongPassword123!
DB_NAME=zada_supplier_db

JWT_SECRET=koi_bhi_lamba_random_secret_code_yahan_likhein

DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASS=admin123
```

---

### 5. Build Frontend & Start Server

```bash
# 1. Frontend build karein
npm run build

# 2. PM2 ke zariye background mein run karein (Auto-restart on reboot)
pm2 start server/index.js --name "zada-spms"
pm2 save
pm2 startup
```

Ab aapka app live hai! Check karne ke liye:
`http://AAPKA_VPS_IP:5000`

---

## 🔐 Login Credentials & User Management

### Default Admin Account:
- **Username:** `admin`
- **Password:** `admin123`

### Features:
1. **Admin Role:**
   - Summary view, Add Bills, All Bills, Payments
   - **Users & Staff Tab:** Naye staff accounts banana, active/inactive karna.
2. **Operator / Staff Role:**
   - Bills aur Payments ki entry kar sakte hain, lekin user accounts edit nahi kar sakte.

---

## 🌐 (Optional) Connect Custom Domain with Nginx & SSL

Agar aap isay apne domain par chalana chahte hain (e.g. `suppliers.zadapharmacy.com`):

`/etc/nginx/sites-available/spms`:
```nginx
server {
    server_name suppliers.zadapharmacy.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable karein aur Free SSL lagayein:
```bash
sudo ln -s /etc/nginx/sites-available/spms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d suppliers.zadapharmacy.com
```
