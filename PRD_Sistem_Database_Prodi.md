# Project Requirements Document (PRD)
**Nama Proyek:** Sistem Database Program Studi Terintegrasi
**Platform:** Web App (Google Apps Script - GAS)
**Database:** Google Spreadsheets
**Penyimpanan Dokumen:** Google Drive

## 1. Pendahuluan
### 1.1 Latar Belakang
Dalam upaya mendukung tata kelola akademik yang baik, diperlukan sebuah sistem file dan database terpusat yang dapat menyimpan, mengelola, dan mengintegrasikan berbagai data program studi. Menggunakan ekosistem Google Workspace sangat efisien untuk meminimalkan biaya *hosting* dan mempermudah akses kolaborasi.

### 1.2 Tujuan
Membangun aplikasi berbasis web guna mengelola data akademik Program Studi secara terintegrasi menggunakan Google Apps Script (sebagai *Backend* sekaligus *Hosting Web*), Google Sheets (sebagai *Relational Database*), dan Google Drive (sebagai penyimpanan *file* terstruktur).

## 2. Pengguna Sistem (User Roles)
- **Admin Prodi / Operator:** Pengelola sistem yang memiliki hak akses untuk login, merombak menu (kategori), mengunggah/mengedit file, mengelola data akademik, serta melihat atau membagikan link ke sistem.
 *(Jika ke depan diperlukan, peran dapat ditambahkan untuk level 'Dosen' atau 'Asesor' dengan format read-only).*

## 3. Spesifikasi Teknologi
- **Frontend / Antarmuka:** HTML5, Vanilla JavaScript, CSS (Bisa menggunakan framework ringan / modern UI untuk *Glassmorphism* dan interaksi dinamis).
- **Backend / Logika Web:** Google Apps Script (GAS) menggunakan format `kode.gs` atau `.js`.
- **Database Utama:** Google Sheets (Tabel yang dijadikan database).
- **Penyimpanan Berkas (Storage):** Google Drive (API Folder dan File GAS).

## 4. Fitur Utama (Core Features)

### 4.1. Otentikasi Registrasi/Login (Custom Area)
- Halaman Custom Login (berbasis web, bukan pop-up bawaan Google).
- Validasi Input *Username* dan *Password*.
- Data kredensial pengguna akan disimpan dalam Google Sheets khusus (sheet 'Users').

### 4.2. Manajemen Menu Dinamis
- **Menu Statis:**
  - **Kategori:** Halaman master untuk membuat, mengedit, dan menghapus Kategori Akademik.
  - **Setting (Pengaturan):** Manajemen profil aplikasi dan pengaturan folder parent (Akar).
- **Menu Dinamis:** 
  - Navigasi (*sidebar*) lain akan dimuat sedemikian rupa setelah melooping master kategori dari database.
  - Setiap menambah kategori, struktur web otomatis menghasilkan halaman menu baru.
  - *Data Default Kategori Awal*: Rekap Data Mahasiswa, Data Dosen, Mutu Prodi, Alumni, Penelitian, dan Pengabdian. 

### 4.3. Manajemen Data Akademik Berbasis Kategori (CRUD)
- Konten dari setiap halaman menu dinamis adalah daftar/tabel data.
- **Unggah Data/File:** Form yang mendukung teks dan *attachment*. Saat melakukan input data, formulir akan dilengkapi dengan isian **Sub-Kategori** agar data terstruktur lebih spesifik (misal: di 'Data Dosen' ada sub-kategori 'Sertifikasi' atau 'SK').
- **Olah Data:** Fungsi Tambah (Create), Lihat (Read), Ubah (Update), dan Hapus (Delete).
- **Filter Data:** Di tiap halaman daftar database, tersedia filter khusus untuk menampilkan data hanya memuat **Sub-Kategori** tertentu dan berdasarkan **Tahun**.
- **Export Data:** Tersedia tombol **Export Excel** untuk mengunduh seluruh data (atau data yang sedang disortir/filter) di halaman tersebut menjadi format `.xlsx`.

### 4.4. Google Drive Storage Integration (Terstruktur)
- **Manajemen Folder Cerdas:** Saat admin membuat/menyesuaikan *Kategori*, sistem juga dapat membuat folder di dalam struktur Google Drive secara cerdas dengan nama yang sama persis seperti kategori.
- **Auto-Routing File:** File yang diunggah melalui menu (contoh: diunggah di menu "Penelitian") akan otomatis ditempatkan di dalam folder Drive "Penelitian".
- File URL (yang dapat diunduh/dilihat) akan direkap dalam baris (*record*) di dalam Google Sheets untuk menautkan file fisik dengan rekaman data.

## 5. Skema Struktur Database (Google Sheets)
Sebuah Google Sheet *"Database_Prodi"* akan terdiri dari beberapa sub-sheet:

1. **Sheet `Users`**
   - Kolom: `id_user`, `username`, `password` (opsional dienkripsi base64), `role`, `status`.
2. **Sheet `Kategori`**
   - Kolom: `id_kategori`, `nama_kategori`, `folder_id` (menyimpan ID Folder *Google Drive*).
3. **Sheet `Sub_Kategori`** (Master Sub-Kategori Dinamis)
   - Kolom: `id_sub_kategori`, `id_kategori` (Relasi), `nama_sub_kategori`.
4. **Sheet `Data_Akademik`** (Pusat Rekaman Seluruh Modul)
   - Kolom: `id_data`, `id_kategori` (Relasi), `sub_kategori`/`id_sub_kategori`, `tahun_data`, `tanggal_input`, `judul_berkas/rekaman`, `keterangan_tambahan`, `file_drive_url`, `id_file_drive`.

## 6. Desain Struktur Google Drive
```text
[Folder Utama (Root)] Sistem Aplikasi Prodi/
 │
 ├── 📁 Rekap Data Mahasiswa/
 │    ├── 📁 2023/
 │    │    └── Form_Pendaftaran_Mhs_2023.pdf
 │    └── 📁 2024/
 │
 ├── 📁 Data Dosen/
 │    ├── 📁 Sertifikat/ (Contoh Sub-Kategori)
 │    │    └── Sertifikat_Dosen_A.pdf
 │    └── 📁 SK/
 │         └── SK_Tugas_Mengajar.pdf
 │
 ├── 📁 Penelitian/
 │    └── Laporan_Hibah_Dikti.pdf
 │
 └── 📁 Kategori Dinamis Lainnya / ...
```

## 7. Arsitektur Perilaku Sistem (User Journey Flow)
1. **Akses:** Admin membuka URL Web App hasil *Deployment* Google Apps Script. 
2. **Login:** Memasukkan *username* & *password* di custom form. GAS memvalidasinya di *Sheet Users*.
3. **Dashboard/Menu:** GAS mengembalikan UI *Index*. Navigasi di-generate secara asinkron (AJAX via `google.script.run`) dari *Sheet Kategori*.
4. **Alur Upload File:** Admin memilih Menu "Penelitian" lalu menekan tombol "Tambah Data" -> Mengisi formulir dan mengunggah dokumen (*File stream diubah ke Base64* untuk web API).
5. **Backend Processing:** Fungsi `kode.gs` mengonversi balik Base64 ke file aktual -> Membaca *ID Folder* Tujuan (dari `Sheet Kategori`) -> Menyimpan file dengan nama aslinya ke Drive -> Menuliskan record ke baris `Sheet Data_Akademik`.

## 8. Rencana Implementasi & Persyaratan Pengembangan
1. **Akun Google Terdedikasi:** Sangat direkomendasikan menyiapkan 1 akun Google *(Google Workspace / Gmail)* khusus sebagai Admin Sistem tempat *Apps Script*, *Sheets*, dan *Drive* tersebut *di-hosting*.
2. **Keamanan (Limitation):** 
   - Google Apps Script memiliki limit harian eksekusi dan ukuran file untuk setiap unggahan (biasanya max > 50MB per eksekusi). Form unggah disesuaikan.
3. **Optimisasi Render:** UI dibuat Single Page Application (SPA), jadi perpindahan *tab/kategori* tidak perlu *refresh page* (mempercepat transisi).
