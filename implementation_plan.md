# 🔧 GRID — Implementation Plan: Major Overhaul

## Ringkasan Perubahan
Revisi besar menyentuh **3 file utama**: `Code.gs`, `index.html`, `app_js.html`

---

## 1. PERUBAHAN STRUKTUR DATABASE (Code.gs)

### Sheet: `Users` — tambah kolom `nama` dan `nip_nidn`
| Col | Lama | Baru |
|---|---|---|
| 1 | id_user | id_user |
| 2 | username | username |
| 3 | password | password |
| 4 | role | role |
| 5 | status | status |
| 6 | *(baru)* | nama |
| 7 | *(baru)* | nip_nidn |

### Sheet: `Kategori` — tambah kolom `kode_arsip`
| Col | Lama | Baru |
|---|---|---|
| 1 | id_kategori | id_kategori |
| 2 | nama_kategori | nama_kategori |
| 3 | icon | icon |
| 4 | folder_id | folder_id |
| 5 | urutan | urutan |
| 6 | *(baru)* | kode_arsip |

### Sheet: `Sub_Kategori` — tambah kolom `kode_sub`
| Col | Lama | Baru |
|---|---|---|
| 1 | id_sub_kategori | id_sub_kategori |
| 2 | id_kategori | id_kategori |
| 3 | nama_sub_kategori | nama_sub_kategori |
| 4 | *(baru)* | kode_sub |

### Sheet: `Data_Akademik` — tambah kolom `uploader`
| Col | Lama | Baru |
|---|---|---|
| 1-11 | sama | sama |
| 12 | *(baru)* | uploader |

---

## 2. FUNGSI BARU / DIMODIFIKASI (Code.gs)

### Fungsi yang dimodifikasi:
- `initSheetHeaders()` — default 7 kategori baru dengan kode_arsip, header baru Users/Sub_Kategori/Data_Akademik
- `getKategoriList()` — sertakan `kode_arsip`
- `getSubKategoriByKategori()` — sertakan `kode_sub`
- `preloadAllData()` — sertakan `kode_sub` pada subKategori
- `loginUser()` — sertakan `nama`, `nip_nidn` dalam return user object
- `getUserList()` — sertakan `nama`, `nip_nidn`
- `addUser()` — terima parameter `nama`, `nip_nidn`
- `uploadArsip()` — gunakan kode baru + simpan `uploader`
- `generateKodeArsip(kodeKat, kodeSub, tahun)` — format baru: `AKD-RPS-341-2026`
- `addKategori()` — terima `kode_arsip`
- `updateKategori()` — update `kode_arsip`
- `addSubKategori()` — terima `kode_sub`

### Fungsi baru:
- `updateKategoriKode(id, kode)` — update kode arsip kategori saja
- `updateSubKategoriKode(id, kode)` — update kode sub kategori
- `updateUserProfile(id, nama, nipNidn, newPassword)` — untuk dosen ubah profil sendiri

---

## 3. DEFAULT 7 KATEGORI BARU

```
1. Akademik          → kode: AKD  | icon: fa-solid fa-book
2. Penelitian        → kode: PEN  | icon: fa-solid fa-flask
3. Pengabdian        → kode: PKM  | icon: fa-solid fa-hand-holding-heart
4. Mutu Prodi        → kode: MUT  | icon: fa-solid fa-award
5. Data Dosen        → kode: DSN  | icon: fa-solid fa-chalkboard-user
6. Data Mahasiswa    → kode: MHS  | icon: fa-solid fa-users
7. Data Alumni       → kode: ALU  | icon: fa-solid fa-user-graduate
```

---

## 4. FORMAT KODE ARSIP BARU

```
KODE_KAT - KODE_SUB - RANDOM3DIGIT - TAHUN
Contoh: AKD - RPS - 341 - 2026
```

- Jika tidak ada sub: `AKD - 000 - 341 - 2026`
- RANDOM 3 DIGIT: 100–999

---

## 5. ROLES & AKSES MENU

| Role | Dashboard | Data Studi | Pengaturan |
|---|---|---|---|
| **admin** | ✅ Semua | ✅ Semua | ✅ Full (+ Kelola Dosen) |
| **operator** | ✅ Semua | ✅ Semua | Setting (ubah pw sendiri) |
| **dosen** | ✅ (semua data) | ✅ Semua | Setting (ubah nama+pw sendiri) |
| **mahasiswa_aktif** | ✅ (MHS + ALU saja) | MHS + ALU saja | ❌ Sembunyikan semua |
| **alumni** | ✅ (ALU saja) | ALU saja | ❌ Sembunyikan semua |

### Logika filter menu berdasarkan `kode_arsip`:
- `mahasiswa_aktif`: tampilkan hanya kode `MHS` dan `ALU`
- `alumni`: tampilkan hanya kode `ALU`
- `dosen`, `operator`, `admin`: tampilkan semua

---

## 6. KOLOM UPLOADER

Tampil di menu: **Akademik, Penelitian, Pengabdian, Mutu Prodi, Data Dosen**  
(kode: AKD, PEN, PKM, MUT, DSN)

Tidak tampil di: **Data Mahasiswa (MHS), Data Alumni (ALU)**

---

## 7. HALAMAN KELOLA DOSEN (Admin Only)

Menu baru di Pengaturan: **"Kelola Dosen"**

Form tambah dosen:
- Nama Dosen
- NIP/NIDN
- Username
- Password

Tabel menampilkan semua user dengan role='dosen'

---

## 8. SETTING PAGE PER ROLE

| Role | Yang tampil |
|---|---|
| `admin` | Full user management + Kelola Dosen |
| `operator` | Hanya ubah password sendiri |
| `dosen` | Ubah nama + NIP/NIDN + password sendiri |
| `mahasiswa_aktif` | Hidden (tidak bisa akses) |
| `alumni` | Hidden (tidak bisa akses) |

---

## 9. PERUBAHAN index.html

- Modal Kategori: tambah field "Kode Arsip"
- Modal Sub-Kategori: tambah field "Kode Sub"
- Modal Tambah User: tambah pilihan role (dosen, mahasiswa_aktif, alumni)
- Modal baru: Tambah/Edit Dosen (dengan field nama, nip_nidn, username, password)
- Sidebar: tambah menu "Kelola Dosen" di bagian Pengaturan (admin only)

---

## 10. URUTAN IMPLEMENTASI

1. ✅ `Code.gs` — struktur + fungsi
2. ✅ `index.html` — modal + sidebar  
3. ✅ `app_js.html` — logika RBAC + render
