// ============================================================
// app_js.html â€” Client-Side JavaScript
// ============================================================

var kategoriData = [];
var activeCategory = 'dashboard';
var dashChartInstance = null;

var CACHE = {
    subKategori: {},
    dataAkademik: {},
    counts: {},
    loginLogs: [],
    panduan: {},
    loaded: false
};

// ==================================================================
// LOADING OVERLAY GLOBAL
// ==================================================================
function showLoading(text) {
    var el = document.getElementById('globalLoading');
    var txt = document.getElementById('globalLoadingText');
    if (txt) txt.innerText = text || 'Memproses...';
    if (el) { el.style.display = 'flex'; }
}
function hideLoading() {
    var el = document.getElementById('globalLoading');
    if (el) el.style.display = 'none';
}

// ==================================================================
// INIT
// ==================================================================
function initDashboard() {
    setupNavigation();
    populateYearDropdowns();
    preloadData(null); // null = pertama kali, arahkan ke dashboard
}

function preloadData(afterLoad) {
    if (!afterLoad) {
        var mainContent = document.getElementById('mainContentArea');
        mainContent.innerHTML = '<div class="card"><div class="card-header"><div class="card-title"><i class="fa-solid fa-spinner fa-spin"></i> Memuat seluruh data...</div></div></div>';
    }
    google.script.run
        .withSuccessHandler(function(result) {
            try {
                kategoriData = result.kategori;
                CACHE.subKategori = result.subKategori || {};
                CACHE.dataAkademik = result.dataAkademik || {};
                CACHE.counts = result.counts || {};
                CACHE.loginLogs = result.loginLogs || [];
                CACHE.panduan = result.panduan || {};
                CACHE.loaded = true;
                renderMenu();
                if (typeof afterLoad === 'function') {
                    afterLoad();
                } else {
                    var dashItem = document.querySelector('[data-target="dashboard"]');
                    if (dashItem) dashItem.click();
                }
            } catch(jsErr) {
                var mc = document.getElementById('mainContentArea');
                mc.innerHTML = '<div class="card"><p style="color:red;"><strong>JS Error:</strong> ' + jsErr.message + '</p><pre style="font-size:11px;background:#f8f8f8;padding:10px;overflow:auto;">' + (jsErr.stack||'') + '</pre></div>';
            }
        })
        .withFailureHandler(function(err) {
            var mc = document.getElementById('mainContentArea');
            mc.innerHTML = '<div class="card"><p style="color:red;">Gagal memuat: ' + err.message + '</p></div>';
        })
        .preloadAllData();
}

function populateYearDropdowns() {
    var sel = document.getElementById('inputTahun');
    if (!sel) return;
    var currentYear = new Date().getFullYear();
    sel.innerHTML = '';
    for (var y = currentYear; y >= currentYear - 10; y--) {
        var opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        sel.appendChild(opt);
    }
}

// ==================================================================
// ROLE HELPERS
// ==================================================================
function getRole()       { return currentUser ? currentUser.role : ''; }
function isAdmin()       { return getRole() === 'admin'; }
function isDosen()       { return getRole() === 'dosen'; }
function isMahasiswa()   { return getRole() === 'mahasiswa_aktif'; }
function isAlumni()      { return getRole() === 'alumni'; }
function isOperator()    { return getRole() === 'operator'; }
function isPengaturanHidden() { return isMahasiswa() || isAlumni(); }

// Cek apakah kategori boleh diakses oleh role saat ini
function katBolehDiakses(kat) {
    if (isAdmin() || isDosen() || isOperator()) return true;
    if (isMahasiswa()) return kat.kode_arsip === 'MHS' || kat.kode_arsip === 'ALU';
    if (isAlumni())    return kat.kode_arsip === 'ALU';
    return false;
}

// ==================================================================
// MENU DINAMIS (role-aware)
// ==================================================================
function renderMenu() {
    var mc = document.getElementById('dynamicMenuList');
    if (!mc) return;
    var html = '';
    kategoriData.forEach(function(kat) {
        if (!katBolehDiakses(kat)) return;
        html += '<a href="#" class="menu-item dynamic-item" data-target="kat_' + kat.id + '" data-kat-id="' + kat.id + '" data-kat-nama="' + kat.nama + '"><i class="' + (kat.icon || 'fa-solid fa-folder') + '"></i> ' + kat.nama + '</a>';
    });
    mc.innerHTML = html;

    // Sembunyikan section Pengaturan untuk role terbatas
    var pengaturanSection = document.querySelector('.menu-section:last-of-type');
    if (pengaturanSection) pengaturanSection.style.display = isPengaturanHidden() ? 'none' : '';

    // Sembunyikan menu admin-only
    var adminOnly = ['kategori','sub_kategori','panduan_admin','kelola_dosen'];
    adminOnly.forEach(function(t) {
        var el = document.querySelector('[data-target="' + t + '"]');
        if (el) el.style.display = isAdmin() ? '' : 'none';
    });

    // Dosen bisa akses Setting (ubah profil)
    var settingEl = document.querySelector('[data-target="setting"]');
    if (settingEl) settingEl.style.display = isPengaturanHidden() ? 'none' : '';

    // Update sidebar user info
    var roleLabel = document.getElementById('sidebarRole');
    if (roleLabel) roleLabel.innerText = getRole();
}

// ==================================================================
// NAVIGASI SPA (role-aware)
// ==================================================================
function setupNavigation() {
    document.body.addEventListener('click', function(e) {
        var item = e.target.closest('.menu-item');
        if (!item) return;
        e.preventDefault();
        var target = item.getAttribute('data-target');

        // Blokir menu pengaturan untuk mahasiswa/alumni
        var adminTargets = ['kategori','sub_kategori','panduan_admin','kelola_dosen'];
        if (isPengaturanHidden() && (adminTargets.indexOf(target) >= 0 || target === 'setting')) {
            showNotif('error', 'Akses Ditolak', 'Menu ini tidak dapat diakses.'); return;
        }
        if (!isAdmin() && adminTargets.indexOf(target) >= 0) {
            showNotif('error', 'Akses Ditolak', 'Menu ini hanya untuk Admin.'); return;
        }
        // Blokir kategori yang tidak boleh diakses
        if (target.startsWith('kat_')) {
            var katId2 = item.getAttribute('data-kat-id');
            var kat2   = kategoriData.find(function(k){ return k.id === katId2; });
            if (kat2 && !katBolehDiakses(kat2)) { showNotif('error', 'Akses Ditolak', 'Menu ini tidak dapat diakses.'); return; }
        }

        document.querySelectorAll('.menu-item').forEach(function(el) { el.classList.remove('active'); });
        item.classList.add('active');
        if (window.innerWidth <= 768) { document.getElementById('mainSidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); }
        var titleEl = document.getElementById('pageTitle');
        var mc      = document.getElementById('mainContentArea');

        if      (target === 'dashboard')    { activeCategory = 'dashboard';    titleEl.innerText = 'Dashboard';          renderDashboard(mc); }
        else if (target === 'kategori')     { activeCategory = 'kategori';     titleEl.innerText = 'Kategori & Menu';    renderKategoriPage(mc); }
        else if (target === 'sub_kategori') { activeCategory = 'sub_kategori'; titleEl.innerText = 'Sub-Kategori';       renderSubKategoriPage(mc); }
        else if (target === 'panduan_admin'){ activeCategory = 'panduan_admin';titleEl.innerText = 'Panduan Menu';       renderPanduanAdminPage(mc); }
        else if (target === 'kelola_dosen') { activeCategory = 'kelola_dosen'; titleEl.innerText = 'Kelola Dosen';       renderKelolaDosen(mc); }
        else if (target === 'setting')      { activeCategory = 'setting';      titleEl.innerText = 'Setting Sistem';     renderSettingPage(mc); }
        else if (target.startsWith('kat_')) {
            var katId = item.getAttribute('data-kat-id');
            var katNama = item.getAttribute('data-kat-nama');
            activeCategory = katId; titleEl.innerText = katNama;
            renderDataPage(katId, katNama, mc);
        }
    });
}

// ==================================================================
// DASHBOARD
// ==================================================================
function renderDashboard(container) {
    var cardsHtml = '';
    kategoriData.forEach(function(kat) {
        if (!katBolehDiakses(kat)) return;
        var cnt = CACHE.counts[kat.id] || 0;
        cardsHtml += '<div class="stat-card"><div class="stat-icon"><i class="' + (kat.icon || 'fa-solid fa-folder') + '"></i></div><div class="stat-info"><h4>' + kat.nama + '</h4><span>' + cnt + '</span></div></div>';
    });
    var logsHtml = '';
    var logs = CACHE.loginLogs;
    if (logs.length === 0) { logsHtml = '<p style="color:var(--text-muted); padding:10px;">Belum ada riwayat login.</p>'; }
    else { logs.forEach(function(log, idx) {
        var ic = idx === 0;
        logsHtml += '<div class="login-log-item"><div class="log-icon" style="color:' + (ic ? '#27ae60' : 'var(--text-muted)') + '"><i class="fa-solid ' + (ic ? 'fa-circle-check' : 'fa-clock-rotate-left') + '"></i></div><div class="log-details" style="width:100%;"><h5 style="display:flex; justify-content:space-between;">' + log.username + (ic ? ' <span style="font-size:10px; padding:2px 6px; background:#e8f8f5; color:#1abc9c; border-radius:10px;">Saat Ini</span>' : '') + '</h5><p>' + log.waktu + '</p></div></div>';
    }); }

    container.innerHTML =
        '<div class="card" style="margin-bottom:25px; border-left:4px solid var(--primary-red); padding:20px 25px;"><div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;"><div style="width:55px; height:55px; background:var(--light-red); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary-red); font-size:26px;"><i class="fa-solid fa-hands-clapping"></i></div><div style="flex:1; min-width:200px;"><h3 style="margin:0; font-size:18px;">Selamat Datang di GRID!</h3><p style="margin:4px 0 0; color:var(--text-muted); font-size:14px;">Gerbang Repositori Informasi Data Prodi Pendidikan Matematika</p></div><button class="btn btn-secondary" onclick="preloadData()" style="white-space:nowrap;"><i class="fa-solid fa-rotate"></i> Refresh Data</button></div></div>' +

        '<div class="dash-cards-grid">' + cardsHtml + '</div>' +
        '<div class="dash-content-grid"><div class="card"><div class="card-header header-no-border"><div class="card-title"><i class="fa-solid fa-chart-column" style="margin-right:8px; color:var(--primary-red)"></i>Statistik Arsip</div></div><div style="position:relative; height:300px; width:100%;"><canvas id="myChart"></canvas></div></div><div class="card"><div class="card-header header-no-border"><div class="card-title"><i class="fa-solid fa-clock-rotate-left" style="margin-right:8px; color:var(--primary-red)"></i>Login Terakhir</div></div><div class="login-log" style="max-height:380px; overflow-y:auto; padding-right:4px;">' + logsHtml + '</div></div></div>';


    setTimeout(function() {
        var ctx = document.getElementById('myChart'); if (!ctx) return;
        var labels = [], vals = [];
        kategoriData.forEach(function(k) { labels.push(k.nama); vals.push(CACHE.counts[k.id] || 0); });
        if (dashChartInstance) dashChartInstance.destroy();
        dashChartInstance = new Chart(ctx, { type:'bar', data:{labels:labels, datasets:[{label:'Jumlah Arsip', data:vals, backgroundColor:'#C62828', borderRadius:4}]}, options:{responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true, ticks:{precision:0}}}} });
    }, 200);
}

// ==================================================================
// DATA ARSIP (cache, instan)
// ==================================================================
function renderDataPage(katId, katNama, container) {
    var subList = CACHE.subKategori[katId] || [];
    var dataList = CACHE.dataAkademik[katId] || [];
    buildDataPageHtml(container, katId, katNama, subList, dataList);
}

function buildDataPageHtml(container, katId, katNama, subList, dataList) {
    var subOpt = '<option value="ALL">Semua Sub</option>';
    subList.forEach(function(s) { subOpt += '<option value="' + s.nama + '">' + s.nama + '</option>'; });
    var yr = new Date().getFullYear(), yrOpt = '<option value="ALL">Semua</option>';
    for (var y = yr; y >= yr - 10; y--) yrOpt += '<option value="' + y + '">' + y + '</option>';
    // Cek apakah kategori ini perlu kolom uploader (bukan MHS/ALU)
    var katObj = kategoriData.find(function(k){ return k.id === katId; });
    var showUploader = katObj && katObj.kode_arsip !== 'MHS' && katObj.kode_arsip !== 'ALU';
    window._showUploader = showUploader;
    var uploaderTh = showUploader ? '<th>Uploader</th>' : '';

    container.innerHTML =
        '<div class="card"><div class="card-header"><div class="card-title"><i class="fa-solid fa-database" style="margin-right:8px; color:var(--primary-red)"></i>Arsip ' + katNama + '</div>' +
        '<div style="display:flex; gap:8px;">' +
        '<button class="btn" style="background:var(--light-red); color:var(--primary-red); border:1px solid #f5c6cb;" onclick="openInfoModal(\'' + katId + '\', \'' + katNama + '\')" ><i class="fa-solid fa-circle-info"></i> Panduan</button>' +
        '<button class="btn btn-primary" onclick="openUploadModal(\'' + katId + '\', \'' + katNama + '\')" ><i class="fa-solid fa-plus"></i> Tambah Arsip</button>' +
        '</div></div>' +
        '<div class="filter-bar"><div class="form-group"><label><i class="fa-solid fa-calendar" style="margin-right:4px;"></i>Tahun:</label><select id="filterTahun" class="form-control" onchange="applyFilter()">' + yrOpt + '</select></div><div class="form-group"><label><i class="fa-solid fa-layer-group" style="margin-right:4px;"></i>Sub:</label><select id="filterSub" class="form-control" onchange="applyFilter()">' + subOpt + '</select></div><div style="flex:1"></div><button class="btn btn-success" onclick="doExportExcel(\'' + katId + '\')" ><i class="fa-solid fa-file-excel"></i> Export Excel</button></div>' +
        '<div class="table-responsive"><table><thead><tr><th>Kode Arsip</th><th>Nama Arsip</th><th>Sub Kategori</th><th>Tipe File</th><th>Tgl Upload</th>' + uploaderTh + '<th style="width:80px;">Aksi</th></tr></thead><tbody id="tableBody"></tbody></table></div></div>';

    window._currentDataList = dataList;
    window._currentKatId = katId;
    window._currentKatNama = katNama;
    applyFilter();
}

function applyFilter() {
    var data = window._currentDataList || [];
    var ft = document.getElementById('filterTahun'), fs = document.getElementById('filterSub');
    var fv = ft ? ft.value : 'ALL', sv = fs ? fs.value : 'ALL';
    var filtered = data.filter(function(d) { return (fv === 'ALL' || String(d.tahun) === fv) && (sv === 'ALL' || d.sub_kategori === sv); });
    var tb = document.getElementById('tableBody'); if (!tb) return;

    if (filtered.length === 0) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted)"><i class="fa-solid fa-inbox" style="font-size:24px; display:block; margin-bottom:10px;"></i>Belum ada arsip.</td></tr>'; return; }

    var html = '';
    filtered.forEach(function(d) {
        var fi = 'fa-file', bc = 'badge-file', t = (d.tipe_file || 'FILE').toUpperCase();
        if (t.indexOf('PDF') > -1) { fi = 'fa-file-pdf'; bc = 'badge-pdf'; }
        else if (t.indexOf('XLS') > -1 || t.indexOf('CSV') > -1) { fi = 'fa-file-excel'; bc = 'badge-xls'; }
        else if (t.indexOf('DOC') > -1) { fi = 'fa-file-word'; bc = 'badge-file'; }
        else if (t.indexOf('PNG') > -1 || t.indexOf('JPG') > -1 || t.indexOf('JPEG') > -1) { fi = 'fa-file-image'; bc = 'badge-img'; }
        else if (t.indexOf('ZIP') > -1 || t.indexOf('RAR') > -1) { fi = 'fa-file-zipper'; bc = 'badge-file'; }

        html += '<tr>' +
            '<td style="font-family:monospace; font-weight:600; font-size:12px; color:var(--primary-red);"><i class="fa-solid fa-barcode" style="color:var(--text-muted); margin-right:4px;"></i>' + (d.kode_arsip || '-') + '</td>' +
            '<td><div style="display:flex; flex-direction:column;"><a href="' + (d.file_url || '#') + '" target="_blank" class="file-link"><i class="fa-solid ' + fi + '"></i> ' + d.nama_arsip + '</a><span style="font-size:11px; color:var(--text-muted); margin-top:4px;">Tahun: ' + d.tahun + '</span></div></td>' +
            '<td><span class="badge badge-success">' + (d.sub_kategori || '-') + '</span></td>' +
            '<td><span class="badge ' + bc + '">' + t + '</span></td>' +
            '<td style="color:var(--text-muted); font-size:13px;"><i class="fa-regular fa-calendar-days" style="margin-right:5px; color:var(--primary-red)"></i>' + (d.tgl_upload || '-') + '</td>' +
            (window._showUploader ? '<td style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-user" style="margin-right:4px;"></i>' + (d.uploader || '-') + '</td>' : '') +
            '<td><div class="action-btns">' +
                (d.file_url ? '<a href="' + d.file_url + '" target="_blank" class="btn-icon btn-view" title="Lihat"><i class="fa-solid fa-eye"></i></a>' : '') +
                '<button class="btn-icon btn-delete" title="Hapus" onclick="confirmHapusArsip(\'' + d.id + '\', \'' + d.nama_arsip.replace(/'/g, "\'") + '\')" ><i class="fa-solid fa-trash-can"></i></button>' +
            '</div></td></tr>';
    });
    tb.innerHTML = html;
}

// ==================================================================
// UPLOAD ARSIP
// ==================================================================
function openUploadModal(katId, katNama) {
    document.getElementById('uploadModal').classList.add('active');
    window._uploadKatId = katId;
    window._uploadKatNama = katNama;
    populateYearDropdowns();
    clearDropFile();
    document.getElementById('uploadForm').reset();
    var subList = CACHE.subKategori[katId] || [];
    var sel = document.getElementById('inputSubKategori');
    sel.innerHTML = '<option value="-">- Tanpa Sub-Kategori -</option>';
    subList.forEach(function(s) { sel.innerHTML += '<option value="' + s.nama + '">' + s.nama + '</option>'; });
}

document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var fileInput = document.getElementById('inputFile');
    if (!fileInput.files.length) { showNotif('error', 'File Kosong', 'Silakan pilih atau seret file untuk diunggah.'); return; }

    var btn = document.getElementById('btnUpload');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';
    var progress = document.getElementById('uploadProgress');
    var pBar = document.getElementById('progressBar');
    var pText = document.getElementById('progressText');
    progress.style.display = 'block'; pBar.style.width = '30%'; pText.innerText = 'Membaca file...';

    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function(ev) {
        pBar.style.width = '60%'; pText.innerText = 'Mengirim ke server...';
        var bytes = new Uint8Array(ev.target.result), binary = '';
        for (var i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);

        var katId = window._uploadKatId, katNama = window._uploadKatNama;
        google.script.run
            .withSuccessHandler(function(r) {
                pBar.style.width = '100%'; pText.innerText = 'Selesai!';
                setTimeout(function() {
                    closeModal('uploadModal');
                    progress.style.display = 'none'; pBar.style.width = '0%';
                    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan Arsip';
                    document.getElementById('uploadForm').reset(); clearDropFile();
                    showNotif('success', 'Berhasil!', r.message);
                    preloadData(function() { renderDataPage(katId, katNama, document.getElementById('mainContentArea')); });
                }, 400);
            })
            .withFailureHandler(function(err) {
                progress.style.display = 'none'; btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan Arsip';
                showNotif('error', 'Gagal Mengunggah', err.message);
            })
            .uploadArsip({ namaArsip: document.getElementById('inputJudul').value.trim(), tahun: document.getElementById('inputTahun').value, subKategori: document.getElementById('inputSubKategori').value, idKategori: window._uploadKatId, namaKategori: window._uploadKatNama, fileBase64: btoa(binary), fileName: file.name, fileMime: file.type, uploader: (currentUser ? (currentUser.nama || currentUser.username) : '-') });
    };
    reader.readAsArrayBuffer(file);
});

// ==================================================================
// HAPUS ARSIP (Modal Konfirmasi)
// ==================================================================
function confirmHapusArsip(id, nama) {
    var katId = window._currentKatId, katNama = window._currentKatNama;
    showConfirm('<i class="fa-solid fa-trash-can"></i>', 'var(--light-red)', 'var(--primary-red)',
        'Hapus Arsip?', 'Arsip "' + nama + '" dan file di Drive akan dihapus permanen.',
        '<i class="fa-solid fa-trash-can"></i> Ya, Hapus', '', function() {
            showLoading('Menghapus arsip...');
            google.script.run
                .withSuccessHandler(function(r) { hideLoading(); showNotif('success', 'Dihapus!', r.message); preloadData(function() { renderDataPage(katId, katNama, document.getElementById('mainContentArea')); }); })
                .withFailureHandler(function(err) { hideLoading(); showNotif('error', 'Gagal', err.message); })
                .deleteArsip(id);
        });
}

// ==================================================================
// EXPORT EXCEL
// ==================================================================
function doExportExcel(katId) {
    showConfirm('<i class="fa-solid fa-file-excel"></i>', '#e8f5e9', '#2e7d32',
        'Export ke Excel?', 'Semua data arsip kategori ini akan diekspor ke file Excel.',
        '<i class="fa-solid fa-file-excel"></i> Ya, Export', '#2e7d32', function() {
            showLoading('Membuat file Excel...');
            google.script.run
                .withSuccessHandler(function(r) {
                    hideLoading();
                    if (r.success) window.open(r.downloadUrl, '_blank');
                    showNotif('success', 'Berhasil!', r.message);
                })
                .withFailureHandler(function(err) {
                    hideLoading();
                    showNotif('error', 'Gagal Export', err.message);
                })
                .exportDataToExcel(katId);
        });
}


// ==================================================================
// KATEGORI
// ==================================================================
function renderKategoriPage(container) {
    var rows = '';
    kategoriData.forEach(function(kat, idx) {
        rows += '<tr><td>' + (idx+1) + '</td><td><i class="' + (kat.icon||'fa-solid fa-folder') + '" style="margin-right:8px; color:var(--primary-red);"></i>' + kat.nama + '</td>' +
            '<td style="font-family:monospace; font-size:12px; color:var(--text-muted);">' + (kat.icon||'-') + '</td>' +
            '<td><span class="badge badge-file" style="font-family:monospace; font-size:12px;">' + (kat.kode_arsip||'-') + '</span></td>' +
            '<td><div class="action-btns"><button class="btn-icon btn-edit" onclick="editKategori(\'' + kat.id + '\', \'' + kat.nama + '\', \'' + (kat.icon||'') + '\', \'' + (kat.kode_arsip||'') + '\')"><i class="fa-solid fa-pen"></i></button><button class="btn-icon btn-delete" onclick="confirmHapusKategori(\'' + kat.id + '\', \'' + kat.nama + '\')" ><i class="fa-solid fa-trash-can"></i></button></div></td></tr>';
    });
    container.innerHTML = '<div class="card"><div class="card-header"><div class="card-title"><i class="fa-solid fa-folder-tree" style="margin-right:8px; color:var(--primary-red)"></i>Daftar Kategori</div><button class="btn btn-primary" onclick="openKategoriModal()"><i class="fa-solid fa-plus"></i> Tambah Kategori</button></div><div class="table-responsive"><table><thead><tr><th>No</th><th>Nama Kategori</th><th>Icon</th><th>Kode Arsip</th><th style="width:100px;">Aksi</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function openKategoriModal(eId, eNama, eIcon, eKode) {
    document.getElementById('kategoriModal').classList.add('active');
    document.getElementById('editKategoriId').value   = eId   || '';
    document.getElementById('inputNamaKategori').value = eNama || '';
    document.getElementById('inputIconKategori').value = eIcon || 'fa-solid fa-folder';
    document.getElementById('inputKodeKategori').value = eKode || '';
    document.getElementById('kategoriModalTitle').innerText = eId ? 'Ubah Kategori' : 'Tambah Kategori';
}
function editKategori(id, nama, icon, kode) { openKategoriModal(id, nama, icon, kode); }

document.getElementById('kategoriForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnKategori');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    var eId  = document.getElementById('editKategoriId').value;
    var nama = document.getElementById('inputNamaKategori').value.trim();
    var icon = document.getElementById('inputIconKategori').value.trim();
    var kode = document.getElementById('inputKodeKategori').value.trim().toUpperCase();
    closeModal('kategoriModal');
    showLoading(eId ? 'Memperbarui kategori...' : 'Menambah kategori...');
    var done = function(r) { hideLoading(); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan'; showNotif('success', 'Berhasil!', r.message); preloadData(function() { renderKategoriPage(document.getElementById('mainContentArea')); }); };
    var fail = function(err) { hideLoading(); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan'; showNotif('error', 'Gagal', err.message); };
    if (eId) google.script.run.withSuccessHandler(done).withFailureHandler(fail).updateKategori(eId, nama, icon, kode);
    else     google.script.run.withSuccessHandler(done).withFailureHandler(fail).addKategori(nama, icon, kode);
});

function confirmHapusKategori(id, nama) {
    showConfirm('<i class="fa-solid fa-folder-minus"></i>', 'var(--light-red)', 'var(--primary-red)',
        'Hapus Kategori?', 'Kategori "' + nama + '" akan dihapus.',
        '<i class="fa-solid fa-trash-can"></i> Ya, Hapus', '', function() {
            showLoading('Menghapus kategori...');
            google.script.run.withSuccessHandler(function(r) { hideLoading(); showNotif('success', 'Dihapus!', r.message); preloadData(function() { renderKategoriPage(document.getElementById('mainContentArea')); }); }).withFailureHandler(function(err) { hideLoading(); showNotif('error', 'Gagal', err.message); }).deleteKategori(id);
        });
}

// ==================================================================
// SUB-KATEGORI
// ==================================================================
function renderSubKategoriPage(container) {
    var allSubs = [];
    kategoriData.forEach(function(kat) {
        (CACHE.subKategori[kat.id] || []).forEach(function(s) {
            allSubs.push({ id: s.id, nama: s.nama, kode_sub: s.kode_sub || '-', kategoriNama: kat.nama });
        });
    });
    var rows = '';
    if (allSubs.length === 0) rows = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">Belum ada sub-kategori.</td></tr>';
    else allSubs.forEach(function(s, i) {
        rows += '<tr><td>' + (i+1) + '</td><td>' + s.kategoriNama + '</td><td>' + s.nama + '</td>' +
            '<td><span class="badge badge-file" style="font-family:monospace;">' + s.kode_sub + '</span></td>' +
            '<td><button class="btn-icon btn-delete" onclick="confirmHapusSubKat(\'' + s.id + '\', \'' + s.nama + '\')"><i class="fa-solid fa-trash-can"></i></button></td></tr>';
    });
    container.innerHTML = '<div class="card"><div class="card-header"><div class="card-title"><i class="fa-solid fa-sitemap" style="margin-right:8px; color:var(--primary-red)"></i>Daftar Sub-Kategori</div><button class="btn btn-primary" onclick="openSubKategoriModal()"><i class="fa-solid fa-plus"></i> Tambah Sub-Kategori</button></div><div class="table-responsive"><table><thead><tr><th>No</th><th>Kategori Induk</th><th>Nama Sub</th><th>Kode Sub</th><th style="width:80px;">Aksi</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function openSubKategoriModal() {
    document.getElementById('subKategoriModal').classList.add('active');
    document.getElementById('subKategoriForm').reset();
    var sel = document.getElementById('inputSubKatParent'); sel.innerHTML = '';
    kategoriData.forEach(function(k) { sel.innerHTML += '<option value="' + k.id + '">' + k.nama + '</option>'; });
}

document.getElementById('subKategoriForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnSubKategori');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    var parentId = document.getElementById('inputSubKatParent').value;
    var nama     = document.getElementById('inputNamaSubKat').value.trim();
    var kodeSub  = document.getElementById('inputKodeSubKat').value.trim().toUpperCase();
    closeModal('subKategoriModal');
    showLoading('Menambah sub-kategori...');
    google.script.run
        .withSuccessHandler(function(r) { hideLoading(); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan'; showNotif('success', 'Berhasil!', r.message); preloadData(function() { renderSubKategoriPage(document.getElementById('mainContentArea')); }); })
        .withFailureHandler(function(err) { hideLoading(); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan'; showNotif('error', 'Gagal', err.message); })
        .addSubKategori(parentId, nama, kodeSub);
});

function confirmHapusSubKat(id, nama) {
    showConfirm('<i class="fa-solid fa-trash-can"></i>', 'var(--light-red)', 'var(--primary-red)',
        'Hapus Sub-Kategori?', '"' + nama + '" dan foldernya di Drive akan dihapus.',
        '<i class="fa-solid fa-trash-can"></i> Ya, Hapus', '', function() {
            showLoading('Menghapus sub-kategori...');
            google.script.run.withSuccessHandler(function(r) { hideLoading(); showNotif('success', 'Dihapus!', r.message); preloadData(function() { renderSubKategoriPage(document.getElementById('mainContentArea')); }); }).withFailureHandler(function(err) { hideLoading(); showNotif('error', 'Gagal', err.message); }).deleteSubKategori(id);
        });
}

// ==================================================================
// SETTING â€” USER MANAGEMENT (role-aware)
// ==================================================================
function renderSettingPage(container) {
    var myId = currentUser ? currentUser.id : '';
    var myUsername = currentUser ? currentUser.username : '';
    var myNama = currentUser ? (currentUser.nama || myUsername) : '';
    var myNip  = currentUser ? (currentUser.nip_nidn || '') : '';

    // DOSEN: ubah profil + password sendiri
    if (isDosen()) {
        container.innerHTML =
            '<div class="card"><div class="card-header header-no-border"><div class="card-title"><i class="fa-solid fa-user-circle" style="margin-right:8px; color:var(--primary-red)"></i>Profil Saya</div></div>' +
            '<div style="max-width:450px; padding:10px 0;">' +
            '<div class="form-group"><label>Nama Lengkap</label><input type="text" id="dsnNama" class="form-control" value="' + myNama + '"></div>' +
            '<div class="form-group"><label>NIP/NIDN</label><input type="text" id="dsnNip" class="form-control" value="' + myNip + '"></div>' +
            '<div class="form-group"><label>Username (tidak bisa diubah)</label><input type="text" class="form-control" value="' + myUsername + '" disabled></div>' +
            '<div class="form-group"><label for="dsnPwd">Password Baru <small style="color:var(--text-muted);">(kosongkan jika tidak ingin ubah)</small></label><input type="password" id="dsnPwd" class="form-control" placeholder="Password baru..." autocomplete="new-password"></div>' +
            '<button id="btnDsnSave" class="btn btn-primary" onclick="dosenSimpanProfil(\' + myId + \')"><i class="fa-solid fa-check"></i> Simpan Profil</button>' +
            '</div></div>';
        return;
    }

    // OPERATOR: ubah password sendiri saja
    if (isOperator()) {
        container.innerHTML =
            '<div class="card"><div class="card-header header-no-border"><div class="card-title"><i class="fa-solid fa-lock" style="margin-right:8px; color:var(--primary-red)"></i>Ubah Password Saya</div></div>' +
            '<div style="max-width:420px; padding:10px 0;">' +
            '<div class="form-group"><label>Username</label><input type="text" class="form-control" value="' + myUsername + '" disabled></div>' +
            '<div class="form-group"><label for="opPwd">Password Baru</label><input type="password" id="opPwd" class="form-control" placeholder="Masukkan password baru" autocomplete="new-password"></div>' +
            '<button id="btnOpPwd" class="btn btn-primary" onclick="operatorUbahPassword(\' + myId + \')"><i class="fa-solid fa-check"></i> Simpan Password</button>' +
            '</div></div>';
        return;
    }

    // ADMIN: tampilkan lengkap user management
    container.innerHTML = '<div class="card"><p style="padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat...</p></div>';
    google.script.run
        .withSuccessHandler(function(users) {
            var rows = '';
            users.forEach(function(u, i) {
                var sb = u.status === 'active' ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-pdf">Nonaktif</span>';
                var roleMap = {admin:'Admin',operator:'Operator',dosen:'Dosen',mahasiswa_aktif:'Mahasiswa',alumni:'Alumni'};
                var rb = '<span class="badge badge-file">' + (roleMap[u.role]||u.role) + '</span>';
                rows += '<tr><td>'+(i+1)+'</td><td><strong>'+u.username+'</strong></td><td>'+rb+'</td><td>'+sb+'</td><td><div class="action-btns"><button class="btn-icon btn-edit" onclick="openPasswordModal(\' + u.id + \',\' + u.username + \')"><i class="fa-solid fa-key"></i></button><button class="btn-icon" style="background:#f39c12;" onclick="confirmToggle(\' + u.id + \',\' + u.username + \')"><i class="fa-solid fa-toggle-on"></i></button><button class="btn-icon btn-delete" onclick="confirmHapusUser(\' + u.id + \',\' + u.username + \')"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>';
            });
            container.innerHTML =
                '<div class="card"><div class="card-header"><div class="card-title"><i class="fa-solid fa-users-gear" style="margin-right:8px; color:var(--primary-red)"></i>Manajemen User</div><button class="btn btn-primary" onclick="openUserModal()"><i class="fa-solid fa-user-plus"></i> Tambah User</button></div><div class="table-responsive"><table><thead><tr><th>No</th><th>Username</th><th>Role</th><th>Status</th><th style="width:120px;">Aksi</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
        })
        .withFailureHandler(function(err){ container.innerHTML='<div class="card"><p style="color:red;">Gagal: '+err.message+'</p></div>'; })
        .getUserList();
}

function openUserModal() { document.getElementById('userModal').classList.add('active'); document.getElementById('userForm').reset(); }

document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnAddUser');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    google.script.run
        .withSuccessHandler(function(r) { closeModal('userModal'); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Simpan User'; showNotif(r.success ? 'success' : 'error', r.success ? 'Berhasil!' : 'Gagal', r.message); if (r.success) renderSettingPage(document.getElementById('mainContentArea')); })
        .withFailureHandler(function(err) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Simpan User'; showNotif('error', 'Gagal', err.message); })
        .addUser(document.getElementById('inputNewUsername').value.trim(), document.getElementById('inputNewPassword').value, document.getElementById('inputNewRole').value);
});

function openPasswordModal(id, username) { document.getElementById('passwordModal').classList.add('active'); document.getElementById('editUserId').value = id; document.getElementById('editUserLabel').value = username; document.getElementById('inputEditPassword').value = ''; }

document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnPassword');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    google.script.run
        .withSuccessHandler(function(r) { closeModal('passwordModal'); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Password'; showNotif('success', 'Berhasil!', r.message); })
        .withFailureHandler(function(err) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Password'; showNotif('error', 'Gagal', err.message); })
        .updateUserPassword(document.getElementById('editUserId').value, document.getElementById('inputEditPassword').value);
});

function confirmToggle(id, username) {
    showConfirm('<i class="fa-solid fa-toggle-on"></i>', '#fff3e0', '#f39c12',
        'Ubah Status User?', 'Status "' + username + '" akan diubah (aktif â†” nonaktif).',
        '<i class="fa-solid fa-toggle-on"></i> Ya, Ubah', '#f39c12', function() {
            google.script.run.withSuccessHandler(function(r) { showNotif('success', 'Berhasil!', r.message); renderSettingPage(document.getElementById('mainContentArea')); }).toggleUserStatus(id);
        });
}

function confirmHapusUser(id, username) {
    showConfirm('<i class="fa-solid fa-user-xmark"></i>', 'var(--light-red)', 'var(--primary-red)',
        'Hapus User?', 'User "' + username + '" akan dihapus permanen.',
        '<i class="fa-solid fa-trash-can"></i> Ya, Hapus', '', function() {
            google.script.run.withSuccessHandler(function(r) { showNotif(r.success ? 'success' : 'error', r.success ? 'Dihapus!' : 'Gagal', r.message); if (r.success) renderSettingPage(document.getElementById('mainContentArea')); }).deleteUser(id);
        });
}
// ==================================================================
// KELOLA DOSEN (Admin Only)
// ==================================================================
function renderKelolaDosen(container) {
    container.innerHTML = '<div class="card"><p style="padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat...</p></div>';
    google.script.run
        .withSuccessHandler(function(users) {
            var dosen = users.filter(function(u){ return u.role === 'dosen'; });
            var rows = dosen.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">Belum ada akun dosen.</td></tr>'
                : dosen.map(function(u,i) {
                    var sb = u.status==='active' ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-pdf">Nonaktif</span>';
                    return '<tr><td>'+(i+1)+'</td><td><strong>'+(u.nama||'-')+'</strong></td><td style="font-size:12px;color:var(--text-muted);">'+(u.nip_nidn||'-')+'</td><td><code>'+u.username+'</code></td><td>'+sb+'</td><td><div class="action-btns"><button class="btn-icon btn-edit" onclick="openDosenModal(\''+u.id+'\')"><i class="fa-solid fa-pen"></i></button><button class="btn-icon btn-delete" onclick="confirmHapusUser(\''+u.id+'\',\''+u.username+'\')"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>';
                }).join('');
            container.innerHTML = '<div class="card"><div class="card-header"><div class="card-title"><i class="fa-solid fa-chalkboard-user" style="margin-right:8px;color:var(--primary-red)"></i>Kelola Akun Dosen</div><button class="btn btn-primary" onclick="openDosenModal()"><i class="fa-solid fa-plus"></i> Tambah Dosen</button></div><div class="table-responsive"><table><thead><tr><th>No</th><th>Nama</th><th>NIP/NIDN</th><th>Username</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
            window._dosenCache = dosen;
        })
        .withFailureHandler(function(err){ container.innerHTML='<div class="card"><p style="color:red;">Gagal: '+err.message+'</p></div>'; })
        .getUserList();
}
function openDosenModal(id) {
    var u = id ? (window._dosenCache||[]).find(function(x){return x.id===id;}) : null;
    document.getElementById('dosenModal').classList.add('active');
    document.getElementById('dosenModalTitle').innerText = u ? 'Edit Akun Dosen' : 'Tambah Akun Dosen';
    document.getElementById('editDosenId').value        = u ? u.id       : '';
    document.getElementById('inputNamaDosen').value     = u ? (u.nama||'')    : '';
    document.getElementById('inputNipNidn').value       = u ? (u.nip_nidn||'') : '';
    document.getElementById('inputDosenUsername').value = u ? u.username  : '';
    document.getElementById('inputDosenPassword').value = '';
    document.getElementById('inputDosenUsername').disabled = !!u;
}
document.getElementById('dosenForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn=document.getElementById('btnDosen'), eId=document.getElementById('editDosenId').value;
    btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    var nama=document.getElementById('inputNamaDosen').value.trim();
    var nip=document.getElementById('inputNipNidn').value.trim();
    var un=document.getElementById('inputDosenUsername').value.trim();
    var pw=document.getElementById('inputDosenPassword').value;
    closeModal('dosenModal'); showLoading('Menyimpan data dosen...');
    var done=function(r){ hideLoading(); btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-check"></i> Simpan Dosen'; showNotif(r.success?'success':'error',r.success?'Berhasil!':'Gagal',r.message); if(r.success) renderKelolaDosen(document.getElementById('mainContentArea')); };
    var fail=function(err){ hideLoading(); btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-check"></i> Simpan Dosen'; showNotif('error','Gagal',err.message); };
    if(eId) google.script.run.withSuccessHandler(done).withFailureHandler(fail).updateUserProfile(eId,nama,nip,pw||null);
    else    google.script.run.withSuccessHandler(done).withFailureHandler(fail).addUser(un,pw,'dosen',nama,nip);
});

// ==================================================================
// PANDUAN â€” Tampilkan Info ke User
// ==================================================================
function openInfoModal(katId, katNama) {
    var panduan = CACHE.panduan[katId];
    var titleEl = document.getElementById('infoModalTitle');
    var katEl = document.getElementById('infoModalKatNama');
    var bodyEl = document.getElementById('infoModalBody');
    var emptyEl = document.getElementById('infoModalEmpty');
    katEl.innerText = katNama;
    if (panduan && panduan.isi && panduan.isi.trim()) {
        titleEl.innerText = panduan.judul || 'Panduan Pengisian';
        bodyEl.innerText = panduan.isi;
        bodyEl.style.display = 'block';
        emptyEl.style.display = 'none';
    } else {
        titleEl.innerText = 'Panduan Pengisian';
        bodyEl.style.display = 'none';
        emptyEl.style.display = 'block';
    }
    document.getElementById('infoModal').classList.add('active');
}

// ==================================================================
// PANDUAN ADMIN â€” Kelola Panduan Per Kategori
// ==================================================================
function renderPanduanAdminPage(container) {
    var rows = '';
    if (kategoriData.length === 0) {
        rows = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">Belum ada kategori.</td></tr>';
    } else {
        kategoriData.forEach(function(kat, idx) {
            var p = CACHE.panduan[kat.id];
            var hasInfo = p && p.isi && p.isi.trim();
            var badge = hasInfo
                ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check" style="margin-right:4px;"></i>Tersedia</span>'
                : '<span class="badge badge-pdf"><i class="fa-solid fa-circle-xmark" style="margin-right:4px;"></i>Belum Ada</span>';
            rows += '<tr><td>' + (idx + 1) + '</td>' +
                '<td><i class="' + (kat.icon || 'fa-solid fa-folder') + '" style="margin-right:8px; color:var(--primary-red);"></i><strong>' + kat.nama + '</strong></td>' +
                '<td>' + badge + '</td>' +
                '<td><button class="btn-icon btn-edit" title="Edit Panduan" onclick="openEditPanduan(\'' + kat.id + '\', \'' + kat.nama.replace(/'/g, "\'") + '\')"><i class="fa-solid fa-pen"></i></button></td></tr>';
        });
    }
    container.innerHTML =
        '<div class="card"><div class="card-header header-no-border">' +
        '<div class="card-title"><i class="fa-solid fa-book-open" style="margin-right:8px; color:var(--primary-red)"></i>Kelola Panduan Per Menu</div></div>' +
        '<div style="background:var(--light-red); border-radius:10px; padding:14px 18px; margin:0 20px 20px; display:flex; align-items:flex-start; gap:12px;">' +
        '<i class="fa-solid fa-circle-info" style="color:var(--primary-red); font-size:18px; margin-top:2px;"></i>' +
        '<p style="font-size:13px; color:var(--primary-red); margin:0;">Isi panduan akan tampil saat user mengklik tombol <strong>Panduan</strong> di setiap halaman data studi.</p></div>' +
        '<div class="table-responsive"><table><thead><tr><th>No</th><th>Nama Menu</th><th>Status Panduan</th><th style="width:80px;">Aksi</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
}

function openEditPanduan(katId, katNama) {
    var p = CACHE.panduan[katId];
    document.getElementById('editPanduanKatId').value = katId;
    document.getElementById('editPanduanKatNama').innerText = katNama;
    document.getElementById('inputPanduanJudul').value = (p && p.judul) ? p.judul : '';
    document.getElementById('inputPanduanIsi').value = (p && p.isi) ? p.isi : '';
    document.getElementById('editPanduanModal').classList.add('active');
}

document.getElementById('editPanduanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = document.getElementById('btnSavePanduan');
    var katId = document.getElementById('editPanduanKatId').value;
    var judul = document.getElementById('inputPanduanJudul').value.trim();
    var isi = document.getElementById('inputPanduanIsi').value.trim();
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    closeModal('editPanduanModal');
    showLoading('Menyimpan panduan...');
    google.script.run
        .withSuccessHandler(function(r) {
            hideLoading();
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Panduan';
            showNotif('success', 'Berhasil!', r.message);
            preloadData(function() { renderPanduanAdminPage(document.getElementById('mainContentArea')); });
        })
        .withFailureHandler(function(err) {
            hideLoading();
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Panduan';
            showNotif('error', 'Gagal', err.message);
        })
        .savePanduan(katId, judul, isi);
});

// ==================================================================
// OPERATOR: Ubah Password Sendiri (tanpa modal)
// ==================================================================
function operatorUbahPassword(id) {
    var pwdEl = document.getElementById('opPwd');
    var btn = document.getElementById('btnOpPwd');
    if (!pwdEl || !pwdEl.value.trim()) {
        showNotif('error', 'Password Kosong', 'Masukkan password baru terlebih dahulu.');
        return;
    }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    google.script.run
        .withSuccessHandler(function(r) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Password';
            showNotif('success', 'Berhasil!', r.message);
            pwdEl.value = '';
        })
        .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Simpan Password';
            showNotif('error', 'Gagal', err.message);
        })
        .updateUserPassword(id, pwdEl.value);
}

function dosenSimpanProfil(id) {
    var nama=document.getElementById('dsnNama')?document.getElementById('dsnNama').value.trim():'';
    var nip=document.getElementById('dsnNip')?document.getElementById('dsnNip').value.trim():'';
    var pwd=document.getElementById('dsnPwd')?document.getElementById('dsnPwd').value:'';
    var btn=document.getElementById('btnDsnSave');
    if(btn){btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';}
    google.script.run
        .withSuccessHandler(function(r){
            if(btn){btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-check"></i> Simpan Profil';}
            showNotif('success','Berhasil!',r.message);
            if(r.success&&currentUser){currentUser.nama=nama; currentUser.nip_nidn=nip;}
        })
        .withFailureHandler(function(err){
            if(btn){btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-check"></i> Simpan Profil';}
            showNotif('error','Gagal',err.message);
        })
        .updateUserProfile(id,nama,nip,pwd||null);
}

// ==================================================================
// UTILITIES
// ==================================================================
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ==================================================================
// INIT SESI â€” Dipanggil di sini setelah SEMUA fungsi sudah terdefinisi
// Ini memastikan checkSession() bisa memanggil initDashboard() dengan benar
// ==================================================================
checkSession();