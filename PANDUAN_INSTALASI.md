# 📘 Panduan Instalasi Lengkap — Sistem Database Prodi (Google Apps Script)

Dokumen ini menjelaskan langkah demi langkah cara memasang sistem **DataProdi** di Google Apps Script agar bisa diakses sebagai Web App online.

---

## ✅ Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun Google (Gmail atau Google Workspace)
- Browser modern (Chrome/Edge)
- File-file kode dari folder `d:\Project\PROJECT WEB\database\`:
  - `Code.gs`
  - `login.html`
  - `dashboard.html`
  - `app_js.html`
  - `styles_css.html`

---

## LANGKAH 1: Buat Google Spreadsheet (Database)

1. Buka browser, masuk ke akun Google Anda
2. Buka **Google Sheets**: https://sheets.google.com
3. Klik tombol **"+"** (Spreadsheet kosong baru)
4. Klik judul di pojok kiri atas, ubah nama menjadi: **`Database_Prodi`**
5. **Salin ID Spreadsheet** dari URL di address bar browser:

```
https://docs.google.com/spreadsheets/d/SALIN_ID_INI/edit#gid=0
                                       ^^^^^^^^^^^^^^
```

> Contoh ID: `1A2B3C4D5E6F7G8H9I0JKLMNOPQRSTUVWXYZabc`

6. **Simpan/catat ID ini** — akan digunakan nanti

---

## LANGKAH 2: Buat Folder Utama di Google Drive

1. Buka **Google Drive**: https://drive.google.com
2. Klik tombol **"+ Baru"** → **"Folder"**
3. Beri nama folder: **`Sistem Aplikasi Prodi`**
4. Tekan **"Buat"**
5. **Buka folder** tersebut (klik 2x)
6. **Salin Folder ID** dari URL di address bar browser:

```
https://drive.google.com/drive/folders/SALIN_FOLDER_ID_INI
                                        ^^^^^^^^^^^^^^^^^^^^
```

> Contoh ID: `1xYzAbCdEfGh_IJKlmnOPQrsTUVWxyz012`

7. **Simpan/catat Folder ID ini** — akan digunakan nanti

---

## LANGKAH 3: Buat Project Google Apps Script

1. Buka **Google Apps Script Editor**: https://script.google.com
2. Klik **"Proyek baru"** (New Project)
3. Akan muncul editor kode dengan file default bernama `Code.gs`
4. Klik judul "Proyek tanpa judul" di pojok kiri atas, ubah menjadi: **`DataProdi`**

---

## LANGKAH 4: Salin Kode Backend (Code.gs)

1. Di editor GAS, Anda sudah melihat file **`Code.gs`** terbuka
2. **Hapus semua** isi kode default yang ada
3. Buka file `Code.gs` dari folder komputer Anda (`d:\Project\PROJECT WEB\database\Code.gs`)
4. **Salin seluruh isinya** (Ctrl+A → Ctrl+C)
5. **Tempel** ke editor GAS (Ctrl+V)
6. **PENTING** — Cari bagian ini di baris paling atas kode:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA',
  ROOT_FOLDER_ID: 'GANTI_DENGAN_FOLDER_DRIVE_ROOT_ID_ANDA'
};
```

7. Ganti `GANTI_DENGAN_SPREADSHEET_ID_ANDA` dengan **ID Spreadsheet** dari Langkah 1
8. Ganti `GANTI_DENGAN_FOLDER_DRIVE_ROOT_ID_ANDA` dengan **Folder ID** dari Langkah 2
9. Tekan **Ctrl+S** untuk menyimpan

---

## LANGKAH 5: Buat File HTML — login.html

1. Di panel kiri editor GAS, klik ikon **"+"** (di samping tulisan "File")
2. Pilih **"HTML"**
3. Akan muncul dialog nama file — ketik: **`login`** (tanpa ekstensi `.html`, GAS akan menambahkan otomatis)
4. Tekan Enter
5. **Hapus semua** isi kode default di file `login.html` yang baru dibuat
6. Buka file `login.html` dari folder komputer Anda
7. **Salin seluruh isinya** dan **tempel** ke editor GAS
8. Tekan **Ctrl+S**

---

## LANGKAH 6: Buat File HTML — dashboard.html

1. Klik **"+"** → **"HTML"**
2. Nama file: **`dashboard`**
3. **Hapus** isi default, **salin-tempel** dari file `dashboard.html` komputer Anda
4. Tekan **Ctrl+S**

---

## LANGKAH 7: Buat File HTML — app_js.html

1. Klik **"+"** → **"HTML"**
2. Nama file: **`app_js`**
3. **Hapus** isi default, **salin-tempel** dari file `app_js.html` komputer Anda
4. Tekan **Ctrl+S**

---

## LANGKAH 8: Buat File HTML — styles_css.html

1. Klik **"+"** → **"HTML"**
2. Nama file: **`styles_css`**
3. **Hapus** isi default, **salin-tempel** dari file `styles_css.html` komputer Anda
4. Tekan **Ctrl+S**

---

## LANGKAH 9: Verifikasi Struktur File

Setelah selesai, panel kiri editor GAS Anda harus menunjukkan **5 file** seperti ini:

```
📄 Code.gs
📄 login.html
📄 dashboard.html
📄 app_js.html
📄 styles_css.html
```

Jika ada file yang kurang, ulangi langkah pembuatan file tersebut.

---

## LANGKAH 10: Jalankan Inisialisasi Database

Langkah ini akan membuat semua sheet + data default secara otomatis di Google Spreadsheet Anda.

1. Di editor GAS, pastikan file **`Code.gs`** terbuka
2. Di toolbar atas, ada dropdown yang bertuliskan nama fungsi (biasanya `myFunction`) — klik dropdown tersebut
3. Cari dan pilih fungsi: **`setupInitial`**
4. Klik tombol **▶ Jalankan (Run)**
5. Akan muncul dialog **"Otorisasi diperlukan"** — klik **"Tinjau izin"**
6. Pilih **akun Google** Anda
7. Jika muncul peringatan "Aplikasi ini belum diverifikasi":
   - Klik **"Lanjutan"** (Advanced)
   - Klik **"Buka DataProdi (tidak aman)"**
8. Klik **"Izinkan"** (Allow) untuk semua permission yang diminta
9. Tunggu hingga proses selesai (sekitar 5-15 detik)
10. Cek di bagian bawah editor — jika muncul log **"Execution completed"**, berarti berhasil!

### Verifikasi:
- Buka kembali **Google Spreadsheet** `Database_Prodi` Anda
- Anda seharusnya melihat **6 sheet baru** telah terbuat:
  - `Users` (sudah ada akun admin default)
  - `Kategori` (sudah ada 6 kategori default)
  - `Sub_Kategori`
  - `Data_Akademik`
  - `Login_Log`
  - `Settings`
- Buka **Google Drive** → folder `Sistem Aplikasi Prodi`
- Anda seharusnya melihat **6 sub-folder** telah otomatis terbuat:
  - 📁 Data Mahasiswa
  - 📁 Data Dosen
  - 📁 Mutu Prodi
  - 📁 Alumni
  - 📁 Penelitian
  - 📁 Pengabdian

---

## LANGKAH 11: Deploy sebagai Web App

1. Di editor GAS, klik tombol **"Deploy"** (pojok kanan atas) → **"Deployment baru"** (New deployment)
2. Klik ikon ⚙️ (roda gigi) di samping "Pilih jenis" → centang **"Aplikasi web"** (Web app)
3. Isi konfigurasi:
   - **Deskripsi**: `DataProdi v1.0`
   - **Jalankan sebagai** (Execute as): `Saya` (Me)
   - **Siapa yang memiliki akses** (Who has access): `Siapa saja` (Anyone)
4. Klik **"Deploy"**
5. Akan muncul **URL Web App** — **SALIN URL INI!**

```
https://script.google.com/macros/s/XXXXXXXXXXXXXXX/exec
```

> Ini adalah alamat utama sistem DataProdi Anda yang bisa diakses kapan saja!

---

## LANGKAH 12: Login Pertama

1. Buka URL Web App yang telah disalin di browser
2. Halaman login akan muncul
3. Masukkan kredensial default:
   - **Username:** `admin`
   - **Password:** `admin123`
4. Klik **"Masuk Sistem"**
5. Jika berhasil, Anda akan diarahkan ke halaman **Dashboard**

---

## 🔒 LANGKAH 13: Ubah Password Default (WAJIB!)

Demi keamanan, segera ubah password admin default:

1. Buka **Google Spreadsheet** `Database_Prodi`
2. Buka sheet **`Users`**
3. Pada baris admin, kolom **`password`** berisi teks ter-encode (base64)
4. Untuk mengganti password, buka website: https://www.base64encode.org
5. Ketik password baru Anda di kolom input
6. Klik **"Encode"**
7. Salin hasil encode dan tempel ke kolom `password` di sheet

> Contoh: Password `rahasiaku2024` → Base64: `cmFoYXNpYWt1MjAyNA==`

---

## 🔄 Cara Update Kode di Masa Depan

Jika Anda perlu mengubah kode setelah deploy:

1. Buka project di https://script.google.com
2. Lakukan perubahan di editor
3. Klik **"Deploy"** → **"Kelola deployment"** (Manage deployments)
4. Klik ikon ✏️ (pensil) pada deployment yang aktif
5. Ubah **Versi** menjadi **"Deployment baru"** (New version)
6. Klik **"Deploy"**

> URL tetap sama, tidak perlu disebarkan ulang.

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---|---|
| Login gagal terus | Cek sheet `Users`: pastikan username benar dan status = `active` |
| Menu tidak muncul | Pastikan `setupInitial()` sudah dijalankan dan sheet `Kategori` berisi data |
| File tidak terupload | Periksa apakah Folder ID di `CONFIG` sudah benar dan folder ada di Drive |
| Error "Script function not found" | Pastikan semua file sudah tersalin dengan benar dan nama file tepat |
| Halaman blank setelah login | Pastikan file `dashboard.html` sudah dibuat di editor GAS |
| Permission denied | Jalankan ulang `setupInitial()` dan izinkan semua permission |

---

## 📋 Rangkuman Kredensial & ID

Simpan informasi berikut di tempat yang aman:

| Item | Nilai |
|---|---|
| URL Web App | `https://script.google.com/macros/s/.../exec` |
| Spreadsheet ID | (dari Langkah 1) |
| Root Folder ID | (dari Langkah 2) |
| Username Admin | `admin` |
| Password Default | `admin123` (segera diganti!) |
