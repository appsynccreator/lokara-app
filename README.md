# 🗺️ LOKARA
### Solusi UMKM di Sekitarmu

LOKARA adalah aplikasi marketplace lokal berbasis lokasi yang menghubungkan pembeli dengan pelaku UMKM dalam radius **1 km**. Dibangun di atas Google Apps Script + Google Sheets sebagai backend, sehingga gratis dan mudah di-deploy tanpa server.

---

## ✨ Fitur Utama

- 📍 **Produk Terdekat** — Tampilkan produk UMKM dalam radius 1 km berdasarkan GPS
- 🛒 **Beli Langsung** — Checkout dengan metode COD, DANA, atau OVO
- 💬 **Chat** — Komunikasi langsung antara pembeli dan penjual
- ❤️ **Wishlist** — Simpan produk favorit
- 🔔 **Notifikasi** — Update status pesanan real-time
- 📊 **Dashboard Penjual** — Statistik produk, pesanan, dan rating
- 🗺️ **Pilih Lokasi di Peta** — Powered by Leaflet + OpenStreetMap

---

## 🛠️ Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Peta | Leaflet.js + OpenStreetMap |
| Icon | Font Awesome 6 |
| Font | Poppins (Google Fonts) |

---

## 🚀 Cara Deploy

### 1. Siapkan Google Sheets
- Buat Google Spreadsheet baru
- Catat **Spreadsheet ID** dari URL-nya

### 2. Setup Google Apps Script
- Buka [script.google.com](https://script.google.com)
- Buat project baru
- Copy isi `code_lokara.js` ke editor
- Ganti `SHEET_ID` di bagian `CONFIG` dengan ID Spreadsheet kamu
- Jalankan fungsi `initializeAll()` sekali untuk membuat semua sheet

### 3. Deploy sebagai Web App
- Klik **Deploy** → **New deployment**
- Pilih tipe: **Web app**
- Execute as: **Me**
- Who has access: **Anyone**
- Klik **Deploy** → copy URL yang muncul

### 4. Hubungkan Frontend
- Buka `index_lokara.html`
- Pastikan semua `google.script.run` sudah terhubung ke project GAS kamu
- Upload `index_lokara.html` ke GAS sebagai file HTML (nama: `Index`)

---

## 📁 Struktur File

```
lokara-app/
├── index_lokara.html   # Frontend (UI + logika client-side)
├── code_lokara.js      # Backend (Google Apps Script)
├── icon-192.png        # App icon 192x192 (PWA)
├── icon-512.png        # App icon 512x512 (PWA)
├── manifest.json       # PWA manifest
└── README.md
```

---

## 👤 Role Pengguna

**Pembeli**
- Browse & cari produk terdekat
- Beli produk, lacak pesanan
- Chat dengan penjual, beri ulasan

**Penjual UMKM**
- Daftarkan toko & produk
- Atur lokasi toko di peta
- Kelola pesanan masuk & lihat statistik

---

## 📄 Lisensi

MIT License — bebas digunakan dan dimodifikasi.
