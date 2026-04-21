// ============================================================
// Code.gs — Backend Utama Sistem Database Prodi
// Platform: Google Apps Script (GAS)
// ============================================================

// === KONFIGURASI ===
const CONFIG = {
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA',
  ROOT_FOLDER_ID: 'GANTI_DENGAN_FOLDER_DRIVE_ROOT_ID_ANDA'
};

// === SHEET NAMES ===
const SHEET = {
  USERS: 'Users',
  KATEGORI: 'Kategori',
  SUB_KATEGORI: 'Sub_Kategori',
  DATA_AKADEMIK: 'Data_Akademik',
  LOGIN_LOG: 'Login_Log',
  SETTINGS: 'Settings'
};

// ==================================================================
// WEB APP ENTRY POINT — Satu halaman saja (SPA Murni)
// ==================================================================

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('DataProdi - Sistem Database Program Studi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// Utility: Include file HTML parsial
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==================================================================
// HELPER: Akses Spreadsheet
// ==================================================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheetHeaders(sheet, name);
  }
  return sheet;
}

function initSheetHeaders(sheet, name) {
  switch(name) {
    case SHEET.USERS:
      sheet.appendRow(['id_user','username','password','role','status']);
      sheet.appendRow([generateId(), 'admin', encodePwd('admin123'), 'admin', 'active']);
      break;
    case SHEET.KATEGORI:
      sheet.appendRow(['id_kategori','nama_kategori','icon','folder_id','urutan']);
      var defaults = [
        ['Data Mahasiswa', 'fa-solid fa-users'],
        ['Data Dosen', 'fa-solid fa-chalkboard-user'],
        ['Mutu Prodi', 'fa-solid fa-award'],
        ['Alumni', 'fa-solid fa-user-graduate'],
        ['Penelitian', 'fa-solid fa-flask'],
        ['Pengabdian', 'fa-solid fa-hand-holding-heart']
      ];
      defaults.forEach(function(item, idx) {
        var folderId = getOrCreateFolder(item[0]);
        sheet.appendRow([generateId(), item[0], item[1], folderId, idx + 1]);
      });
      break;
    case SHEET.SUB_KATEGORI:
      sheet.appendRow(['id_sub_kategori','id_kategori','nama_sub_kategori']);
      break;
    case SHEET.DATA_AKADEMIK:
      sheet.appendRow([
        'id_data','kode_arsip','id_kategori','nama_kategori',
        'sub_kategori','tahun_data','nama_arsip','tipe_file',
        'file_drive_url','id_file_drive','tanggal_upload'
      ]);
      break;
    case SHEET.LOGIN_LOG:
      sheet.appendRow(['id_log','username','role','waktu_login']);
      break;
    case SHEET.SETTINGS:
      sheet.appendRow(['key','value']);
      sheet.appendRow(['app_name','DataProdi']);
      sheet.appendRow(['root_folder_id', CONFIG.ROOT_FOLDER_ID]);
      break;
  }
}

// ==================================================================
// UTILITIES
// ==================================================================

function generateId() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 12);
}

function generateKodeArsip(namaKategori) {
  var prefix = namaKategori.replace(/\s+/g,'').substring(0,3).toUpperCase();
  var num = Math.floor(1000 + Math.random() * 9000);
  return 'ARS-' + prefix + '-' + num;
}

function encodePwd(str) {
  return Utilities.base64Encode(str);
}

function decodePwd(encoded) {
  return Utilities.newBlob(Utilities.base64Decode(encoded)).getDataAsString();
}

// ==================================================================
// GOOGLE DRIVE: Folder Management
// ==================================================================

function getRootFolder() {
  return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
}

function getOrCreateFolder(folderName) {
  var root = getRootFolder();
  var folders = root.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next().getId();
  } else {
    return root.createFolder(folderName).getId();
  }
}

function getOrCreateSubFolder(parentFolderId, subFolderName) {
  var parent = DriveApp.getFolderById(parentFolderId);
  var folders = parent.getFoldersByName(subFolderName);
  if (folders.hasNext()) {
    return folders.next().getId();
  } else {
    return parent.createFolder(subFolderName).getId();
  }
}

// ==================================================================
// AUTENTIKASI
// ==================================================================

function loginUser(username, password) {
  var sheet = getSheet(SHEET.USERS);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && decodePwd(data[i][2]) === password && data[i][4] === 'active') {
      // Catat login log
      var logSheet = getSheet(SHEET.LOGIN_LOG);
      logSheet.appendRow([generateId(), username, data[i][3], new Date()]);
      
      return {
        success: true,
        user: {
          id: data[i][0],
          username: data[i][1],
          role: data[i][3]
        }
      };
    }
  }
  return { success: false, message: 'Username atau Password salah.' };
}

function getLoginLogs() {
  var sheet = getSheet(SHEET.LOGIN_LOG);
  var data = sheet.getDataRange().getValues();
  var logs = [];
  
  for (var i = data.length - 1; i >= 1 && logs.length < 10; i--) {
    logs.push({
      username: data[i][1],
      role: data[i][2],
      waktu: Utilities.formatDate(new Date(data[i][3]), Session.getScriptTimeZone(), "dd MMMM yyyy, HH:mm:ss")
    });
  }
  return logs;
}

// ==================================================================
// KATEGORI (CRUD)
// ==================================================================

function getKategoriList() {
  var sheet = getSheet(SHEET.KATEGORI);
  var data = sheet.getDataRange().getValues();
  var list = [];
  
  for (var i = 1; i < data.length; i++) {
    list.push({
      id: data[i][0],
      nama: data[i][1],
      icon: data[i][2],
      folder_id: data[i][3],
      urutan: data[i][4]
    });
  }
  list.sort(function(a, b) { return a.urutan - b.urutan; });
  return list;
}

function addKategori(nama, icon) {
  var sheet = getSheet(SHEET.KATEGORI);
  var id = generateId();
  var folderId = getOrCreateFolder(nama);
  var urutan = sheet.getLastRow();
  
  sheet.appendRow([id, nama, icon || 'fa-solid fa-folder', folderId, urutan]);
  return { success: true, id: id, message: 'Kategori "' + nama + '" berhasil ditambahkan.' };
}

function updateKategori(id, nama, icon) {
  var sheet = getSheet(SHEET.KATEGORI);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(nama);
      if (icon) sheet.getRange(i + 1, 3).setValue(icon);
      return { success: true, message: 'Kategori berhasil diperbarui.' };
    }
  }
  return { success: false, message: 'Kategori tidak ditemukan.' };
}

function deleteKategori(id) {
  var sheet = getSheet(SHEET.KATEGORI);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Kategori berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Kategori tidak ditemukan.' };
}

// ==================================================================
// SUB KATEGORI (CRUD)
// ==================================================================

function getSubKategoriByKategori(idKategori) {
  var sheet = getSheet(SHEET.SUB_KATEGORI);
  var data = sheet.getDataRange().getValues();
  var list = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === idKategori) {
      list.push({ id: data[i][0], id_kategori: data[i][1], nama: data[i][2] });
    }
  }
  return list;
}

function addSubKategori(idKategori, nama) {
  var sheet = getSheet(SHEET.SUB_KATEGORI);
  var id = generateId();
  sheet.appendRow([id, idKategori, nama]);
  
  // Buat sub-folder di Drive
  var katSheet = getSheet(SHEET.KATEGORI);
  var katData = katSheet.getDataRange().getValues();
  for (var i = 1; i < katData.length; i++) {
    if (katData[i][0] === idKategori && katData[i][3]) {
      getOrCreateSubFolder(katData[i][3], nama);
      break;
    }
  }
  return { success: true, id: id, message: 'Sub-Kategori "' + nama + '" berhasil ditambahkan.' };
}

function deleteSubKategori(id) {
  var sheet = getSheet(SHEET.SUB_KATEGORI);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var idKategori = data[i][1];
      var namaSubKat = data[i][2];
      
      // Cari folder induk kategori
      var katSheet = getSheet(SHEET.KATEGORI);
      var katData = katSheet.getDataRange().getValues();
      for (var j = 1; j < katData.length; j++) {
        if (katData[j][0] === idKategori && katData[j][3]) {
          // Cari dan hapus sub-folder di Drive
          try {
            var parentFolder = DriveApp.getFolderById(katData[j][3]);
            var subFolders = parentFolder.getFoldersByName(namaSubKat);
            while (subFolders.hasNext()) {
              subFolders.next().setTrashed(true);
            }
          } catch(err) {
            // Folder mungkin sudah dihapus manual, lanjutkan saja
            Logger.log('Folder tidak bisa dihapus: ' + err);
          }
          break;
        }
      }
      
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Sub-Kategori "' + namaSubKat + '" dan foldernya berhasil dihapus.' };
    }
  }
  return { success: false, message: 'Sub-Kategori tidak ditemukan.' };
}

// ==================================================================
// DATA AKADEMIK (CRUD + FILE UPLOAD)
// ==================================================================

function getDataByKategori(idKategori) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var data = sheet.getDataRange().getValues();
  var list = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === idKategori) {
      list.push({
        id: data[i][0],
        kode_arsip: data[i][1],
        id_kategori: data[i][2],
        nama_kategori: data[i][3],
        sub_kategori: data[i][4],
        tahun: data[i][5],
        nama_arsip: data[i][6],
        tipe_file: data[i][7],
        file_url: data[i][8],
        file_id: data[i][9],
        tgl_upload: data[i][10] ? Utilities.formatDate(new Date(data[i][10]), Session.getScriptTimeZone(), "dd MMM yyyy") : ''
      });
    }
  }
  list.reverse();
  return list;
}

function getAllDataCount() {
  var kategoriList = getKategoriList();
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var data = sheet.getDataRange().getValues();
  
  var counts = {};
  kategoriList.forEach(function(kat) { counts[kat.id] = 0; });
  
  for (var i = 1; i < data.length; i++) {
    var katId = data[i][2];
    if (counts[katId] !== undefined) counts[katId]++;
  }
  return counts;
}

function uploadArsip(formData) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var id = generateId();
  var kodeArsip = generateKodeArsip(formData.namaKategori);
  
  // Cari target folder
  var katSheet = getSheet(SHEET.KATEGORI);
  var katData = katSheet.getDataRange().getValues();
  var targetFolderId = '';
  
  for (var i = 1; i < katData.length; i++) {
    if (katData[i][0] === formData.idKategori) {
      targetFolderId = katData[i][3];
      break;
    }
  }
  
  if (formData.subKategori && formData.subKategori !== '-' && targetFolderId) {
    targetFolderId = getOrCreateSubFolder(targetFolderId, formData.subKategori);
  }
  
  var fileUrl = '';
  var fileId = '';
  var tipeFile = '';
  
  if (formData.fileBase64 && formData.fileName) {
    var decoded = Utilities.base64Decode(formData.fileBase64);
    var blob = Utilities.newBlob(decoded, formData.fileMime || 'application/octet-stream', formData.fileName);
    
    var folder = targetFolderId ? DriveApp.getFolderById(targetFolderId) : getRootFolder();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    fileUrl = file.getUrl();
    fileId = file.getId();
    
    var parts = formData.fileName.split('.');
    tipeFile = parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
  }
  
  sheet.appendRow([
    id, kodeArsip, formData.idKategori, formData.namaKategori,
    formData.subKategori || '-', formData.tahun, formData.namaArsip,
    tipeFile, fileUrl, fileId, new Date()
  ]);
  
  return { success: true, kode_arsip: kodeArsip, message: 'Arsip berhasil diunggah! Kode: ' + kodeArsip };
}

function deleteArsip(id) {
  var sheet = getSheet(SHEET.DATA_AKADEMIK);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var fileId = data[i][9];
      if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch(err) {} }
      sheet.deleteRow(i + 1);
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
  var data = sheet.getDataRange().getValues();
  
  var exported = SpreadsheetApp.create('Export_Arsip_' + new Date().getTime());
  var expSheet = exported.getActiveSheet();
  
  expSheet.appendRow(['Kode Arsip', 'Nama Arsip', 'Kategori', 'Sub-Kategori', 'Tahun', 'Tipe File', 'Tanggal Upload', 'URL File']);
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === idKategori) {
      var tgl = data[i][10] ? Utilities.formatDate(new Date(data[i][10]), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : '';
      expSheet.appendRow([data[i][1], data[i][6], data[i][3], data[i][4], data[i][5], data[i][7], tgl, data[i][8]]);
    }
  }
  
  var url = 'https://docs.google.com/feeds/download/spreadsheets/Export?key=' + exported.getId() + '&exportFormat=xlsx';
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
  
  var root = getRootFolder();
  var exportFolder;
  var folders = root.getFoldersByName('_Export');
  exportFolder = folders.hasNext() ? folders.next() : root.createFolder('_Export');
  
  var excelFile = exportFolder.createFile(response.getBlob().setName('Export_Arsip.xlsx'));
  excelFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  DriveApp.getFileById(exported.getId()).setTrashed(true);
  
  return { success: true, downloadUrl: excelFile.getUrl(), message: 'File Excel berhasil dibuat!' };
}

// ==================================================================
// USER MANAGEMENT (CRUD)
// ==================================================================

function getUserList() {
  var sheet = getSheet(SHEET.USERS);
  var data = sheet.getDataRange().getValues();
  var list = [];
  
  for (var i = 1; i < data.length; i++) {
    list.push({
      id: data[i][0],
      username: data[i][1],
      role: data[i][3],
      status: data[i][4]
    });
  }
  return list;
}

function addUser(username, password, role) {
  var sheet = getSheet(SHEET.USERS);
  var data = sheet.getDataRange().getValues();
  
  // Cek duplikat username
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username) {
      return { success: false, message: 'Username "' + username + '" sudah digunakan.' };
    }
  }
  
  var id = generateId();
  sheet.appendRow([id, username, encodePwd(password), role || 'operator', 'active']);
  return { success: true, message: 'User "' + username + '" berhasil ditambahkan.' };
}

function updateUserPassword(id, newPassword) {
  var sheet = getSheet(SHEET.USERS);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 3).setValue(encodePwd(newPassword));
      return { success: true, message: 'Password berhasil diubah.' };
    }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

function toggleUserStatus(id) {
  var sheet = getSheet(SHEET.USERS);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var newStatus = data[i][4] === 'active' ? 'inactive' : 'active';
      sheet.getRange(i + 1, 5).setValue(newStatus);
      return { success: true, message: 'Status user berhasil diubah menjadi ' + newStatus + '.' };
    }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

function deleteUser(id) {
  var sheet = getSheet(SHEET.USERS);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      if (data[i][3] === 'admin') {
        // Cek apakah ini admin terakhir
        var adminCount = 0;
        for (var j = 1; j < data.length; j++) { if (data[j][3] === 'admin') adminCount++; }
        if (adminCount <= 1) {
          return { success: false, message: 'Tidak bisa menghapus satu-satunya admin!' };
        }
      }
      sheet.deleteRow(i + 1);
      return { success: true, message: 'User berhasil dihapus.' };
    }
  }
  return { success: false, message: 'User tidak ditemukan.' };
}

// ==================================================================
// PRELOAD: Ambil semua data dalam 1x panggilan (Optimasi Kecepatan)
// ==================================================================

function preloadAllData() {
  var kategoriList = getKategoriList();
  
  // Ambil semua sub-kategori sekaligus
  var subSheet = getSheet(SHEET.SUB_KATEGORI);
  var subData = subSheet.getDataRange().getValues();
  var allSubKategori = {};
  for (var i = 1; i < subData.length; i++) {
    var katId = subData[i][1];
    if (!allSubKategori[katId]) allSubKategori[katId] = [];
    allSubKategori[katId].push({ id: subData[i][0], id_kategori: subData[i][1], nama: subData[i][2] });
  }
  
  // Ambil semua data akademik sekaligus
  var dataSheet = getSheet(SHEET.DATA_AKADEMIK);
  var rawData = dataSheet.getDataRange().getValues();
  var allData = {};
  var counts = {};
  
  kategoriList.forEach(function(kat) { allData[kat.id] = []; counts[kat.id] = 0; });
  
  for (var i = 1; i < rawData.length; i++) {
    var katId = rawData[i][2];
    var item = {
      id: rawData[i][0],
      kode_arsip: rawData[i][1],
      id_kategori: rawData[i][2],
      nama_kategori: rawData[i][3],
      sub_kategori: rawData[i][4],
      tahun: rawData[i][5],
      nama_arsip: rawData[i][6],
      tipe_file: rawData[i][7],
      file_url: rawData[i][8],
      file_id: rawData[i][9],
      tgl_upload: rawData[i][10] ? Utilities.formatDate(new Date(rawData[i][10]), Session.getScriptTimeZone(), "dd MMM yyyy") : ''
    };
    if (allData[katId]) {
      allData[katId].push(item);
      counts[katId]++;
    }
  }
  
  // Reverse setiap array data (terbaru di atas)
  for (var key in allData) { allData[key].reverse(); }
  
  // Ambil login logs
  var logs = getLoginLogs();
  
  return {
    kategori: kategoriList,
    subKategori: allSubKategori,
    dataAkademik: allData,
    counts: counts,
    loginLogs: logs
  };
}

// ==================================================================
// SETUP: Inisialisasi Awal
// ==================================================================

function setupInitial() {
  getSheet(SHEET.USERS);
  getSheet(SHEET.KATEGORI);
  getSheet(SHEET.SUB_KATEGORI);
  getSheet(SHEET.DATA_AKADEMIK);
  getSheet(SHEET.LOGIN_LOG);
  getSheet(SHEET.SETTINGS);
  Logger.log('Setup selesai! Semua sheet telah dibuat.');
}
