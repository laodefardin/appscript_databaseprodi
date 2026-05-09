// ============================================================
// Code.gs — Backend Utama Sistem GRID
// ============================================================

const CONFIG = {
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA',
  ROOT_FOLDER_ID: 'GANTI_DENGAN_FOLDER_DRIVE_ROOT_ID_ANDA'
};

const SHEET = {
  USERS: 'Users',
  KATEGORI: 'Kategori',
  SUB_KATEGORI: 'Sub_Kategori',
  DATA_AKADEMIK: 'Data_Akademik',
  LOGIN_LOG: 'Login_Log',
  SETTINGS: 'Settings',
  PANDUAN: 'Panduan',
  USER_PERMISSIONS: 'User_Permissions'
};

// Kode kategori yang boleh diakses per role
const ROLE_ACCESS = {
  alumni:         ['ALU'],
  mahasiswa_aktif:['MHS','ALU'],
  dosen:          null, // null = semua
  operator:       null,
  admin:          null
};

// ==================================================================
// ENTRY POINT
// ==================================================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('GRID - Gerbang Repositori Informasi Data Prodi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==================================================================
// HELPER: Spreadsheet
// ==================================================================
function getSpreadsheet() { return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); }

function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); initSheetHeaders(sheet, name); }
  return sheet;
}

function initSheetHeaders(sheet, name) {
  switch(name) {
    case SHEET.USERS:
      sheet.appendRow(['id_user','username','password','role','status','nama','nip_nidn']);
      sheet.appendRow([generateId(),'admin',encodePwd('admin123'),'admin','active','Administrator','']);
      break;
    case SHEET.KATEGORI:
      sheet.appendRow(['id_kategori','nama_kategori','icon','folder_id','urutan','kode_arsip']);
      var defaults = [
        ['Akademik',      'fa-solid fa-book',                 'AKD'],
        ['Penelitian',    'fa-solid fa-flask',                'PEN'],
        ['Pengabdian',    'fa-solid fa-hand-holding-heart',   'PKM'],
        ['Mutu Prodi',    'fa-solid fa-award',                'MUT'],
        ['Data Dosen',    'fa-solid fa-chalkboard-user',      'DSN'],
        ['Data Mahasiswa','fa-solid fa-users',                'MHS'],
        ['Data Alumni',   'fa-solid fa-user-graduate',        'ALU']
      ];
      defaults.forEach(function(item, idx) {
        var fid = getOrCreateFolder(item[0]);
        sheet.appendRow([generateId(), item[0], item[1], fid, idx+1, item[2]]);
      });
      break;
    case SHEET.SUB_KATEGORI:
      sheet.appendRow(['id_sub_kategori','id_kategori','nama_sub_kategori','kode_sub']);
      break;
    case SHEET.DATA_AKADEMIK:
      sheet.appendRow(['id_data','kode_arsip','id_kategori','nama_kategori',
        'sub_kategori','tahun_data','nama_arsip','tipe_file',
        'file_drive_url','id_file_drive','tanggal_upload','uploader']);
      break;
    case SHEET.LOGIN_LOG:
      sheet.appendRow(['id_log','username','role','waktu_login']);
      break;
    case SHEET.SETTINGS:
      sheet.appendRow(['key','value']);
      sheet.appendRow(['app_name',        'GRID']);
      sheet.appendRow(['login_subtext',   'Sistem Database Program Studi']);
      sheet.appendRow(['welcome_title',   'Selamat Datang di GRID!']);
      sheet.appendRow(['welcome_subtext', 'Gerbang Repositori Informasi Data Prodi Pendidikan Matematika']);
      sheet.appendRow(['footer_text',     'Pendidikan Matematika']);
      sheet.appendRow(['app_favicon',     'https://cdn-icons-png.flaticon.com/512/5132/5132142.png']);
      sheet.appendRow(['grid_modal_desc', 'GRID adalah sistem informasi manajemen data terpadu yang dikembangkan khusus untuk mendukung kebutuhan administrasi, akademik, dan riset di lingkungan Program Studi.']);
      sheet.appendRow(['grid_modal_cards', JSON.stringify([
        {"icon":"fa-solid fa-user-graduate","color1":"#C62828","color2":"#E53935","title":"Data Mahasiswa","desc":"Manajemen data mahasiswa aktif, alumni, dan profil akademik."},
        {"icon":"fa-solid fa-file-lines","color1":"#1565C0","color2":"#1E88E5","title":"Dokumen Digital","desc":"Pengelolaan dokumen tugas akhir, laporan, dan berkas penting lainnya."},
        {"icon":"fa-solid fa-chart-bar","color1":"#2E7D32","color2":"#43A047","title":"Laporan & Statistik","desc":"Dashboard analitik dan rekapitulasi data program studi secara real-time."},
        {"icon":"fa-solid fa-shield-halved","color1":"#E65100","color2":"#FB8C00","title":"Akses Berbasis Peran","desc":"Hak akses berbeda untuk Admin, Dosen, Mahasiswa, dan Alumni."}
      ])]);
      break;
    case SHEET.PANDUAN:
      sheet.appendRow(['id_kategori','judul_panduan','isi_panduan']);
      break;
  }
}

// ==================================================================
// UTILITIES
// ==================================================================
function generateId() {
  return Utilities.getUuid().replace(/-/g,'').substring(0,12);
}

function generateKodeArsip(kodeKat, kodeSub, tahun) {
  var k = (kodeKat || 'XXX').toUpperCase();
  var s = (kodeSub  || '---').toUpperCase();
  var r = String(Math.floor(100 + Math.random() * 900));
  var y = tahun || new Date().getFullYear();
  return k + '-' + s + '-' + r + '-' + y;
}

function encodePwd(str)    { return Utilities.base64Encode(str); }
function decodePwd(encoded){ return Utilities.newBlob(Utilities.base64Decode(encoded)).getDataAsString(); }

// ==================================================================
// GOOGLE DRIVE
// ==================================================================
function getRootFolder() { return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID); }

function getOrCreateFolder(folderName) {
  var root = getRootFolder();
  var f = root.getFoldersByName(folderName);
  return f.hasNext() ? f.next().getId() : root.createFolder(folderName).getId();
}

function getOrCreateSubFolder(parentId, subName) {
  var parent = DriveApp.getFolderById(parentId);
  var f = parent.getFoldersByName(subName);
  return f.hasNext() ? f.next().getId() : parent.createFolder(subName).getId();
}

// ==================================================================
// AUTENTIKASI
// ==================================================================
function loginUser(username, password) {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && decodePwd(data[i][2]) === password && data[i][4] === 'active') {
      var logSheet = getSheet(SHEET.LOGIN_LOG);
      logSheet.appendRow([generateId(), username, data[i][3], new Date()]);
      var userId = data[i][0];
      // Ambil permissions user ini
      var perms = {};
      try { perms = getUserPermissions(userId); } catch(e) {}
      return {
        success: true,
        user: {
          id:          userId,
          username:    data[i][1],
          role:        data[i][3],
          nama:        data[i][5] || username,
          nip_nidn:    data[i][6] || '',
          permissions: perms   // <-- disertakan saat login
        }
      };
    }
  }
  return { success: false, message: 'Username atau Password salah.' };
}


function getLoginLogs() {
  var sheet = getSheet(SHEET.LOGIN_LOG);
  var data  = sheet.getDataRange().getValues();
  var logs  = [];
  for (var i = data.length - 1; i >= 1 && logs.length < 10; i--) {
    logs.push({
      username: data[i][1],
      role:     data[i][2],
      waktu:    Utilities.formatDate(new Date(data[i][3]), Session.getScriptTimeZone(), "dd MMMM yyyy, HH:mm:ss")
    });
  }
  return logs;
}

// ==================================================================
// KATEGORI (CRUD)
// ==================================================================
function getKategoriList() {
  var sheet = getSheet(SHEET.KATEGORI);
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var idxOf = function(h) { return headers.indexOf(h); };
  var list = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue; // skip baris kosong
    list.push({
      id:         r[idxOf('id_kategori')]   || r[0],
      nama:       r[idxOf('nama_kategori')] || r[1] || '',
      icon:       r[idxOf('icon')]          || r[2] || 'fa-solid fa-folder',
      folder_id:  r[idxOf('folder_id')]     || r[3] || '',
      urutan:     r[idxOf('urutan')]        || r[4] || 0,
      kode_arsip:(r[idxOf('kode_arsip')]    || r[5] || '').toString().toUpperCase()
    });
  }
  list.sort(function(a,b){ return (a.urutan||0) - (b.urutan||0); });
  return list;
}

function addKategori(nama, icon, kodeArsip) {
  var sheet  = getSheet(SHEET.KATEGORI);
  var id     = generateId();
  var fid    = getOrCreateFolder(nama);
  var urutan = sheet.getLastRow();
  sheet.appendRow([id, nama, icon || 'fa-solid fa-folder', fid, urutan, (kodeArsip||'').toUpperCase()]);
  return { success: true, id: id, message: 'Kategori "' + nama + '" berhasil ditambahkan.' };
}

function updateKategori(id, nama, icon, kodeArsip) {
  var sheet = getSheet(SHEET.KATEGORI);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i+1,2).setValue(nama);
      if (icon)      sheet.getRange(i+1,3).setValue(icon);
      if (kodeArsip !== undefined) sheet.getRange(i+1,6).setValue(kodeArsip.toUpperCase());
      return { success: true, message: 'Kategori berhasil diperbarui.' };
    }
  }
  return { success: false, message: 'Kategori tidak ditemukan.' };
}

function deleteKategori(id) {
  var sheet = getSheet(SHEET.KATEGORI);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sheet.deleteRow(i+1); return { success: true, message: 'Kategori berhasil dihapus.' }; }
  }
  return { success: false, message: 'Kategori tidak ditemukan.' };
}

// ==================================================================
// SUB KATEGORI (CRUD)
// ==================================================================
function getSubKategoriByKategori(idKategori) {
  var sheet = getSheet(SHEET.SUB_KATEGORI);
  var data  = sheet.getDataRange().getValues();
  var list  = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === idKategori) {
      list.push({ id: data[i][0], id_kategori: data[i][1], nama: data[i][2], kode_sub: data[i][3] || '' });
    }
  }
  return list;
}

function addSubKategori(idKategori, nama, kodeSub) {
  var sheet = getSheet(SHEET.SUB_KATEGORI);
  var id    = generateId();
  sheet.appendRow([id, idKategori, nama, (kodeSub||'').toUpperCase()]);
  var katSheet = getSheet(SHEET.KATEGORI);
  var katData  = katSheet.getDataRange().getValues();
  for (var i = 1; i < katData.length; i++) {
    if (katData[i][0] === idKategori && katData[i][3]) { getOrCreateSubFolder(katData[i][3], nama); break; }
  }
  return { success: true, id: id, message: 'Sub-Kategori "' + nama + '" berhasil ditambahkan.' };
}

function deleteSubKategori(id) {
  var sheet = getSheet(SHEET.SUB_KATEGORI);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var idKat = data[i][1], namaSub = data[i][2];
      var katData = getSheet(SHEET.KATEGORI).getDataRange().getValues();
      for (var j = 1; j < katData.length; j++) {
        if (katData[j][0] === idKat && katData[j][3]) {
          try {
            var pf = DriveApp.getFolderById(katData[j][3]);
            var sf = pf.getFoldersByName(namaSub);
            while (sf.hasNext()) sf.next().setTrashed(true);
          } catch(e) { Logger.log('Folder error: '+e); }
          break;
        }
      }
      sheet.deleteRow(i+1);
      return { success: true, message: 'Sub-Kategori "' + namaSub + '" berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Sub-Kategori tidak ditemukan.' };
}

// ==================================================================
// DATA AKADEMIK (CRUD + UPLOAD)
// ==================================================================
function getDataByKategori(idKategori) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var data  = sheet.getDataRange().getValues();
  var list  = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === idKategori) {
      list.push({
        id:           data[i][0],
        kode_arsip:   data[i][1],
        id_kategori:  data[i][2],
        nama_kategori:data[i][3],
        sub_kategori: data[i][4],
        tahun:        data[i][5],
        nama_arsip:   data[i][6],
        tipe_file:    data[i][7],
        file_url:     data[i][8],
        file_id:      data[i][9],
        tgl_upload:   data[i][10] ? Utilities.formatDate(new Date(data[i][10]), Session.getScriptTimeZone(),"dd MMM yyyy") : '',
        uploader:     data[i][11] || ''
      });
    }
  }
  list.reverse();
  return list;
}

function uploadArsip(formData) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var id    = generateId();

  // Cari kode kategori
  var kodeKat = '';
  var katData = getSheet(SHEET.KATEGORI).getDataRange().getValues();
  var targetFolderId = '';
  for (var i = 1; i < katData.length; i++) {
    if (katData[i][0] === formData.idKategori) {
      kodeKat        = katData[i][5] || 'XXX';
      targetFolderId = katData[i][3];
      break;
    }
  }

  // Cari kode sub kategori
  var kodeSub = '---';
  if (formData.subKategori && formData.subKategori !== '-') {
    var subData = getSheet(SHEET.SUB_KATEGORI).getDataRange().getValues();
    for (var j = 1; j < subData.length; j++) {
      if (subData[j][1] === formData.idKategori && subData[j][2] === formData.subKategori) {
        kodeSub = subData[j][3] || formData.subKategori.substring(0,3).toUpperCase();
        break;
      }
    }
    if (targetFolderId) targetFolderId = getOrCreateSubFolder(targetFolderId, formData.subKategori);
  }

  var kodeArsip = generateKodeArsip(kodeKat, kodeSub, formData.tahun);

  var fileUrl = '', fileId = '', tipeFile = '';
  if (formData.fileBase64 && formData.fileName) {
    var decoded = Utilities.base64Decode(formData.fileBase64);
    var blob    = Utilities.newBlob(decoded, formData.fileMime || 'application/octet-stream', formData.fileName);
    var folder  = targetFolderId ? DriveApp.getFolderById(targetFolderId) : getRootFolder();
    var file    = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileUrl  = file.getUrl();
    fileId   = file.getId();
    var parts = formData.fileName.split('.');
    tipeFile = parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
  }

  sheet.appendRow([
    id, kodeArsip, formData.idKategori, formData.namaKategori,
    formData.subKategori || '-', formData.tahun, formData.namaArsip,
    tipeFile, fileUrl, fileId, new Date(), formData.uploader || ''
  ]);

  return { success: true, kode_arsip: kodeArsip, message: 'Arsip berhasil diunggah! Kode: ' + kodeArsip };
}

function deleteArsip(id) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (data[i][9]) { try { DriveApp.getFileById(data[i][9]).setTrashed(true); } catch(e){} }
      sheet.deleteRow(i+1);
      return { success: true, message: 'Arsip berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Arsip tidak ditemukan.' };
}

// ==================================================================
// EXPORT EXCEL
// ==================================================================
function exportDataToExcel(idKategori) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var data  = sheet.getDataRange().getValues();
  var exported  = SpreadsheetApp.create('Export_Arsip_' + new Date().getTime());
  var expSheet  = exported.getActiveSheet();
  expSheet.appendRow(['Kode Arsip','Nama Arsip','Kategori','Sub-Kategori','Tahun','Tipe File','Tanggal Upload','Uploader','URL File']);
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === idKategori) {
      var tgl = data[i][10] ? Utilities.formatDate(new Date(data[i][10]), Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm") : '';
      expSheet.appendRow([data[i][1],data[i][6],data[i][3],data[i][4],data[i][5],data[i][7],tgl,data[i][11],data[i][8]]);
    }
  }
  var url      = 'https://docs.google.com/feeds/download/spreadsheets/Export?key=' + exported.getId() + '&exportFormat=xlsx';
  var token    = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
  var root     = getRootFolder();
  var folders  = root.getFoldersByName('_Export');
  var exportFolder = folders.hasNext() ? folders.next() : root.createFolder('_Export');
  var excelFile = exportFolder.createFile(response.getBlob().setName('Export_Arsip.xlsx'));
  excelFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  DriveApp.getFileById(exported.getId()).setTrashed(true);
  return { success: true, downloadUrl: excelFile.getUrl(), message: 'File Excel berhasil dibuat!' };
}

// ==================================================================
// USER MANAGEMENT
// ==================================================================
function getUserList() {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  var list  = [];
  for (var i = 1; i < data.length; i++) {
    list.push({ id:data[i][0], username:data[i][1], role:data[i][3], status:data[i][4], nama:data[i][5]||'', nip_nidn:data[i][6]||'' });
  }
  return list;
}

function addUser(username, password, role, nama, nipNidn) {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username) return { success: false, message: 'Username "' + username + '" sudah digunakan.' };
  }
  var id = generateId();
  sheet.appendRow([id, username, encodePwd(password), role || 'operator', 'active', nama||'', nipNidn||'']);
  return { success: true, message: 'User "' + username + '" berhasil ditambahkan.' };
}

function updateUserPassword(id, newPassword) {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sheet.getRange(i+1,3).setValue(encodePwd(newPassword)); return { success: true, message: 'Password berhasil diubah.' }; }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

function updateUserProfile(id, nama, nipNidn, newPassword) {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (nama    !== undefined) sheet.getRange(i+1,6).setValue(nama);
      if (nipNidn !== undefined) sheet.getRange(i+1,7).setValue(nipNidn);
      if (newPassword)           sheet.getRange(i+1,3).setValue(encodePwd(newPassword));
      return { success: true, message: 'Profil berhasil diperbarui.' };
    }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

function toggleUserStatus(id) {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var ns = data[i][4] === 'active' ? 'inactive' : 'active';
      sheet.getRange(i+1,5).setValue(ns);
      return { success: true, message: 'Status berhasil diubah menjadi ' + ns + '.' };
    }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

function deleteUser(id) {
  var sheet = getSheet(SHEET.USERS);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (data[i][3] === 'admin') {
        var cnt = 0;
        for (var j = 1; j < data.length; j++) { if (data[j][3]==='admin') cnt++; }
        if (cnt <= 1) return { success: false, message: 'Tidak bisa menghapus satu-satunya admin!' };
      }
      sheet.deleteRow(i+1);
      // Hapus juga permissions user ini
      try {
        var ps = getSheet(SHEET.USER_PERMISSIONS);
        var pd = ps.getDataRange().getValues();
        for (var k = pd.length - 1; k >= 1; k--) {
          if (pd[k][0] === id) ps.deleteRow(k+1);
        }
      } catch(e) {}
      return { success: true, message: 'User berhasil dihapus.' };
    }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

// ==================================================================
// USER PERMISSIONS (Hak Akses per Menu)
// ==================================================================
function getUserPermissions(userId) {
  var sheet = getSheet(SHEET.USER_PERMISSIONS);
  var data  = sheet.getDataRange().getValues();
  var perms = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      var menuKey = data[i][1];
      var actions = {};
      try { actions = JSON.parse(data[i][2] || '{}'); } catch(e) { actions = {}; }
      perms[menuKey] = actions;
    }
  }
  return perms;
}

function saveUserPermissions(userId, permissionsObj) {
  // permissionsObj: { menuKey: { view: true, create: false, edit: true, delete: false }, ... }
  var sheet = getSheet(SHEET.USER_PERMISSIONS);
  var data  = sheet.getDataRange().getValues();

  // Hapus baris lama untuk user ini
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === userId) sheet.deleteRow(i + 1);
  }

  // Tulis baris baru
  for (var menuKey in permissionsObj) {
    sheet.appendRow([userId, menuKey, JSON.stringify(permissionsObj[menuKey]), new Date()]);
  }

  return { success: true, message: 'Hak akses berhasil disimpan.' };
}

function getAllUsersWithPermissions() {
  var users = getUserList();
  var sheet = getSheet(SHEET.USER_PERMISSIONS);
  var data  = sheet.getDataRange().getValues();

  // Build map: userId -> { menuKey: actions }
  var permMap = {};
  for (var i = 1; i < data.length; i++) {
    var uid = data[i][0];
    var menuKey = data[i][1];
    var actions = {};
    try { actions = JSON.parse(data[i][2] || '{}'); } catch(e){}
    if (!permMap[uid]) permMap[uid] = {};
    permMap[uid][menuKey] = actions;
  }

  users.forEach(function(u) {
    u.permissions = permMap[u.id] || {};
  });

  return users;
}

// ==================================================================
// PANDUAN
// ==================================================================
function getAllPanduan() {
  var sheet  = getSheet(SHEET.PANDUAN);
  var data   = sheet.getDataRange().getValues();
  var result = {};
  for (var i = 1; i < data.length; i++) {
    result[data[i][0]] = { judul: data[i][1]||'', isi: data[i][2]||'' };
  }
  return result;
}

function savePanduan(idKategori, judul, isi) {
  var sheet = getSheet(SHEET.PANDUAN);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === idKategori) {
      sheet.getRange(i+1,2).setValue(judul);
      sheet.getRange(i+1,3).setValue(isi);
      return { success: true, message: 'Panduan berhasil diperbarui.' };
    }
  }
  sheet.appendRow([idKategori, judul, isi]);
  return { success: true, message: 'Panduan berhasil disimpan.' };
}

// ==================================================================
// PRELOAD — Semua data dalam 1 panggilan
// ==================================================================
function preloadAllData() {
  try {
  var kategoriList = getKategoriList();

  // Sub-Kategori — toleran terhadap kolom lama
  var subSheet = getSheet(SHEET.SUB_KATEGORI);
  var subData  = subSheet.getDataRange().getValues();
  var subHeaders = subData.length > 0 ? subData[0] : [];
  var subKodeIdx = subHeaders.indexOf('kode_sub');
  var allSub = {};
  for (var i = 1; i < subData.length; i++) {
    var row = subData[i];
    if (!row[0]) continue;
    var kid = row[1];
    if (!allSub[kid]) allSub[kid] = [];
    allSub[kid].push({
      id:         row[0],
      id_kategori:row[1],
      nama:       row[2],
      kode_sub:   (subKodeIdx >= 0 ? row[subKodeIdx] : '') || ''
    });
  }

  // Data Akademik — toleran terhadap kolom lama
  var dataSheet  = getSheet(SHEET.DATA_AKADEMIK);
  var rawData    = dataSheet.getDataRange().getValues();
  var dHeaders   = rawData.length > 0 ? rawData[0] : [];
  var uploaderIdx = dHeaders.indexOf('uploader');
  var allData = {}, counts = {};
  kategoriList.forEach(function(k){ allData[k.id]=[]; counts[k.id]=0; });
  for (var i = 1; i < rawData.length; i++) {
    var r = rawData[i];
    if (!r[0]) continue;
    var kid = r[2];
    var tglRaw = r[10];
    var tglStr = '';
    try { if (tglRaw) tglStr = Utilities.formatDate(new Date(tglRaw), Session.getScriptTimeZone(), 'dd MMM yyyy'); } catch(e){}
    var item = {
      id:           r[0],
      kode_arsip:   r[1]  || '',
      id_kategori:  r[2]  || '',
      nama_kategori:r[3]  || '',
      sub_kategori: r[4]  || '',
      tahun:        r[5]  || '',
      nama_arsip:   r[6]  || '',
      tipe_file:    r[7]  || '',
      file_url:     r[8]  || '',
      file_id:      r[9]  || '',
      tgl_upload:   tglStr,
      uploader:     (uploaderIdx >= 0 ? r[uploaderIdx] : '') || ''
    };
    if (allData[kid]) { allData[kid].push(item); counts[kid]++; }
  }
  for (var key in allData) { allData[key].reverse(); }

  return {
    kategori:     kategoriList,
    subKategori:  allSub,
    dataAkademik: allData,
    counts:       counts,
    loginLogs:    getLoginLogs(),
    panduan:      getAllPanduan(),
    roleAccess:   ROLE_ACCESS,
    settings:     getSystemSettings()
  };
  } catch(e) {
    throw new Error('preloadAllData gagal: ' + e.message + ' | Stack: ' + e.stack);
  }
}

// ==================================================================
// SYSTEM SETTINGS
// ==================================================================
function getSystemSettings() {
  var sheet = getSheet(SHEET.SETTINGS);
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) settings[data[i][0]] = data[i][1];
  }
  return settings;
}

function saveSystemSettings(settingsObj) {
  var sheet = getSheet(SHEET.SETTINGS);
  var data = sheet.getDataRange().getValues();
  var rowMap = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) rowMap[data[i][0]] = i + 1;
  }
  for (var key in settingsObj) {
    if (rowMap[key]) {
      sheet.getRange(rowMap[key], 2).setValue(settingsObj[key]);
    } else {
      sheet.appendRow([key, settingsObj[key]]);
    }
  }
  return { success: true, message: 'Pengaturan sistem berhasil disimpan!' };
}

// ==================================================================
// SETUP
// ==================================================================
function setupInitial() {
  getSheet(SHEET.USERS);
  getSheet(SHEET.KATEGORI);
  getSheet(SHEET.SUB_KATEGORI);
  getSheet(SHEET.DATA_AKADEMIK);
  getSheet(SHEET.LOGIN_LOG);
  getSheet(SHEET.SETTINGS);
  getSheet(SHEET.PANDUAN);
  migrateSheets();
  Logger.log('Setup selesai!');
}

// ==================================================================
// MIGRASI KOLOM — tambahkan kolom baru ke sheet lama (aman, tanpa hapus data)
// ==================================================================
function migrateSheets() {
  var ss = getSpreadsheet();

  // Helper: pastikan header ada di kolom tertentu
  function ensureHeader(sheetName, requiredHeaders) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    requiredHeaders.forEach(function(h) {
      if (headers.indexOf(h) === -1) {
        var nextCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, nextCol).setValue(h);
        Logger.log('Migrasi: tambah kolom "' + h + '" di sheet "' + sheetName + '"');
      }
    });
  }

  ensureHeader(SHEET.USERS,        ['id_user','username','password','role','status','nama','nip_nidn']);
  ensureHeader(SHEET.KATEGORI,     ['id_kategori','nama_kategori','icon','folder_id','urutan','kode_arsip']);
  ensureHeader(SHEET.SUB_KATEGORI, ['id_sub_kategori','id_kategori','nama_sub_kategori','kode_sub']);
  ensureHeader(SHEET.DATA_AKADEMIK,['id_data','kode_arsip','id_kategori','nama_kategori',
    'sub_kategori','tahun_data','nama_arsip','tipe_file',
    'file_drive_url','id_file_drive','tanggal_upload','uploader']);
  ensureHeader(SHEET.LOGIN_LOG,    ['id_log','username','role','waktu_login']);
  ensureHeader(SHEET.PANDUAN,      ['id_kategori','judul_panduan','isi_panduan']);

  Logger.log('Migrasi kolom selesai.');
}

// ==================================================================
// TEST — Jalankan dari Editor untuk diagnosa
// ==================================================================
function testConnection() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet OK: ' + ss.getName());
    var sheetNames = ss.getSheets().map(function(s){ return s.getName(); });
    Logger.log('📋 Sheet tersedia: ' + sheetNames.join(', '));
    var result = preloadAllData();
    Logger.log('✅ preloadAllData OK, kategori: ' + result.kategori.length);
    result.kategori.forEach(function(k){ Logger.log('  - ' + k.nama + ' [' + k.kode_arsip + ']'); });
  } catch(e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}
