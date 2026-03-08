# AutoRent — Panduan Instalasi

## Cara Install (3 Langkah)

### Langkah 1 — Import Database ke phpMyAdmin
1. Buka **http://localhost/phpmyadmin**
2. Klik **"New"** di sidebar kiri
3. Ketik nama database: `autorent` → klik **Create**
4. Klik database `autorent` yang baru dibuat
5. Klik tab **Import** (atas)
6. Klik **"Choose File"** → pilih file `autorent.sql`
7. Scroll ke bawah → klik **Go**
8. Tunggu sampai muncul pesan hijau "Import has been successfully finished"

### Langkah 2 — Copy Folder ke XAMPP
1. Copy seluruh folder `autorent/` ke:
   ```
   C:\xampp\htdocs\autorent\
   ```
2. Pastikan struktur folder seperti ini:
   ```
   C:\xampp\htdocs\autorent\
   ├── index.html
   ├── style.css
   ├── app.js
   ├── api.js          ← file koneksi ke PHP
   ├── autorent.sql    ← file import database
   ├── config\
   │   └── database.php
   └── api\
       ├── auth.php
       ├── mobil.php
       ├── transaksi.php
       ├── pelanggan.php
       └── dashboard.php
   ```

### Langkah 3 — Buka di Browser
- Buka: **http://localhost/autorent**
- Login dengan:
  - 👑 Admin    → `admin` / `admin123`
  - 🔧 Operator → `operator` / `op123`

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| phpMyAdmin loading terus | Ganti `localhost` → `127.0.0.1` di config.inc.php |
| "Koneksi database gagal" | Pastikan MySQL Running di XAMPP |
| "404 Not Found" | Pastikan folder ada di `htdocs/autorent/` |
| Data tidak tersimpan | Cek tab Network di DevTools (F12) |
