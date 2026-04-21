// Mock Data untuk Kategori
const mockKategori = [
    { id: 'mhs', nama: 'Data Mahasiswa', icon: 'fa-solid fa-users' },
    { id: 'dosen', nama: 'Data Dosen', icon: 'fa-solid fa-chalkboard-user' },
    { id: 'akreditasi', nama: 'Mutu Prodi', icon: 'fa-solid fa-award' },
    { id: 'penelitian', nama: 'Penelitian', icon: 'fa-solid fa-flask' }
];

const mockSubKategori = {
    'mhs': ['Angkatan 2022', 'Angkatan 2023', 'Angkatan 2024'],
    'dosen': ['Sertifikasi', 'SK Mengajar', 'Ijazah'],
    'akreditasi': ['Borang', 'Laporan Evaluasi', 'Sertifikat Mutu'],
    'penelitian': ['Jurnal Nasional', 'Jurnal Internasional', 'Prosiding']
};

const mockDataAkademik = [
    { id: 1, kode_arsip: 'ARS-DOS-1001', kategori: 'dosen', sub: 'Sertifikasi', tahun: '2024', nama_arsip: 'Sertifikat Pak Budi', tipe_file: 'PDF', tgl_upload: '12 Apr 2024', url: '#' },
    { id: 2, kode_arsip: 'ARS-DOS-1002', kategori: 'dosen', sub: 'SK Mengajar', tahun: '2024', nama_arsip: 'SK Genap 23/24', tipe_file: 'PDF', tgl_upload: '15 Apr 2024', url: '#' },
    { id: 3, kode_arsip: 'ARS-MHS-1003', kategori: 'mhs', sub: 'Angkatan 2024', tahun: '2024', nama_arsip: 'Form_Registrasi_Maba', tipe_file: 'XLSX', tgl_upload: '20 Apr 2024', url: '#' },
    { id: 4, kode_arsip: 'ARS-PEN-1004', kategori: 'penelitian', sub: 'Jurnal Nasional', tahun: '2023', nama_arsip: 'Laporan Hibah 2023', tipe_file: 'DOCX', tgl_upload: '10 Jan 2023', url: '#' }
];

let activeCategory = 'dashboard';
let dashChartInstance = null; 

document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    setupNavigation();
    
    // Simulate initial click on dashboard
    const dashMenu = document.querySelector('[data-target="dashboard"]');
    if(dashMenu) dashMenu.click();
});

function renderMenu() {
    const menuContainer = document.getElementById('dynamicMenuList');
    if (!menuContainer) return;
    
    let html = '';
    mockKategori.forEach(kat => {
        html += `
            <a href="#" class="menu-item dynamic-item" data-target="${kat.id}">
                <i class="${kat.icon}"></i> ${kat.nama}
            </a>
        `;
    });
    menuContainer.innerHTML = html;
}

function setupNavigation() {
    const mainContent = document.getElementById('mainContentArea');
    const titleEle = document.getElementById('pageTitle');

    document.body.addEventListener('click', function(e) {
        const item = e.target.closest('.menu-item');
        if (!item) return;

        e.preventDefault();
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const target = item.getAttribute('data-target');
        activeCategory = target;
        
        // Tutup sidebar di mobile setelah klik
        if(window.innerWidth <= 768) {
            document.getElementById('mainSidebar').classList.remove('active');
            document.getElementById('sidebarOverlay').classList.remove('active');
        }
        
        if (target === 'dashboard') {
            titleEle.innerText = 'Dashboard';
            renderDashboard(mainContent);
        } else if (target === 'kategori' || target === 'setting') {
            titleEle.innerText = target === 'kategori' ? 'Manajemen Kategori' : 'Setting Sistem';
            mainContent.innerHTML = `<div class="card"><p>Halaman ini sedang dimuat. Menunggu Backend GAS terpasang.</p></div>`;
        } else {
            const katObj = mockKategori.find(k => k.id === target);
            if (katObj) {
                titleEle.innerText = katObj.nama;
                renderDataPage(target, katObj.nama);
            }
        }
    });
}

function renderDashboard(container) {
    // 1. Hitung total data berdasarkan Kategori Utama
    let cardsHtml = '';
    mockKategori.forEach(kat => {
        const sum = mockDataAkademik.filter(d => d.kategori === kat.id).length;
        cardsHtml += `
            <div class="stat-card">
                <div class="stat-icon"><i class="${kat.icon}"></i></div>
                <div class="stat-info">
                    <h4>${kat.nama}</h4>
                    <span>${sum}</span>
                </div>
            </div>
        `;
    });

    const now = new Date();
    const loginDate = now.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric'});
    const loginTime = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit'});

    container.innerHTML = `
        <!-- Welcome Card -->
        <div class="card" style="margin-bottom: 25px; border-left: 4px solid var(--primary-red); background: white; padding: 20px 25px;">
            <div style="display:flex; align-items:center; gap:20px;">
               <div style="width:55px; height:55px; background:var(--light-red); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary-red); font-size:26px;">
                    <i class="fa-solid fa-hands-clapping"></i>
               </div>
               <div>
                   <h3 style="margin:0; color:var(--text-main); font-size: 18px;">Selamat Datang Kembali, Admin Prodi!</h3>
                   <p style="margin:0; color:var(--text-muted); font-size:14px; margin-top: 4px;">Inilah tampilan ringkasan rekaman arsip dan statistik database Anda hari ini.</p>
               </div>
            </div>
        </div>

        <!-- Cards -->
        <div class="dash-cards-grid">
            ${cardsHtml}
        </div>
        
        <div class="dash-content-grid">
            <!-- Left: Chart -->
            <div class="card">
                <div class="card-header header-no-border">
                    <div class="card-title">Stastistik Total Arsip Diunggah</div>
                    <select id="chartFilter" class="form-control" style="width: auto; min-width: 150px;" onchange="updateDashboardChart()">
                        <option value="bulanan">Bulanan (2024)</option>
                        <option value="harian">Harian (Minggu Ini)</option>
                        <option value="tahunan">Tahunan</option>
                    </select>
                </div>
                <div style="position: relative; height:300px; width:100%;">
                    <canvas id="myChart"></canvas>
                </div>
            </div>
            
            <!-- Right: Login Log -->
            <div class="card">
                <div class="card-header header-no-border">
                    <div class="card-title">Login Akses Terakhir</div>
                </div>
                <div class="login-log">
                    <div class="login-log-item">
                        <div class="log-icon"><i class="fa-solid fa-circle-check"></i></div>
                        <div class="log-details" style="width: 100%;">
                            <h5 style="display:flex; justify-content:space-between;">Admin Prodi <span style="font-size:10px; padding:2px 6px; background:#e8f8f5; color:#1abc9c; border-radius:10px;">Saat Ini</span></h5>
                            <p>${loginDate}</p>
                            <span><i class="fa-regular fa-clock"></i> ${loginTime} WIB</span>
                        </div>
                    </div>
                     <div class="login-log-item">
                        <div class="log-icon" style="color:var(--text-muted)"><i class="fa-solid fa-clock-rotate-left"></i></div>
                        <div class="log-details">
                            <h5>Sistem Operator 2</h5>
                            <p>19 April 2024</p>
                            <span style="color:var(--text-muted)"><i class="fa-regular fa-clock"></i> 08:30:15 WIB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(updateDashboardChart, 150);
}

window.updateDashboardChart = function() {
    const filter = document.getElementById('chartFilter')?.value || 'bulanan';
    const ctx = document.getElementById('myChart');
    if(!ctx) return;
    
    let labels = [];
    let dataSets = [];
    
    if(filter === 'bulanan') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
        dataSets = [5, 12, 8, mockDataAkademik.length, 0, 0];
    } else if (filter === 'tahunan') {
        labels = ['2022', '2023', '2024'];
        dataSets = [14, 25, mockDataAkademik.filter(d=>d.tahun==='2024').length];
    } else {
        // Harian
        labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        dataSets = [1, 0, 2, 0, mockDataAkademik.length, 0, 0];
    }

    if (dashChartInstance) {
        dashChartInstance.destroy();
    }

    dashChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Arsip',
                data: dataSets,
                backgroundColor: '#C62828',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
};

function renderDataPage(kategoriId, kategoriNama) {
    const mainContent = document.getElementById('mainContentArea');
    
    const subs = mockSubKategori[kategoriId] || [];
    let subOptions = `<option value="ALL">Semua Sub</option>`;
    subs.forEach(s => subOptions += `<option value="${s}">${s}</option>`);

    mainContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Arsip ${kategoriNama}</div>
                <button class="btn btn-primary" onclick="openUploadModal('${kategoriId}')">
                    <i class="fa-solid fa-plus"></i> Tambah Arsip
                </button>
            </div>
            
            <div class="filter-bar">
                <div class="form-group">
                    <label>Tahun Data:</label>
                    <select id="filterTahun" class="form-control" onchange="filterData('${kategoriId}')">
                        <option value="ALL">Semua</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sub-Kategori:</label>
                    <select id="filterSub" class="form-control" onchange="filterData('${kategoriId}')">
                        ${subOptions}
                    </select>
                </div>
                <div style="flex: 1"></div>
                <button class="btn btn-success" onclick="alert('Mengekspor data menuju Excel...')">
                    <i class="fa-solid fa-file-excel"></i> Export Excel
                </button>
            </div>
            
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Kode Arsip</th>
                            <th>Nama Arsip</th>
                            <th>Sub Kategori</th>
                            <th>Tipe File</th>
                            <th>Tanggal Upload</th>
                            <th style="width: 100px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    renderTableData(kategoriId, 'ALL', 'ALL');
}

function renderTableData(kategoriId, filterThn, filterSub) {
    const tb = document.getElementById('tableBody');
    if (!tb) return;

    let filtered = mockDataAkademik.filter(d => d.kategori === kategoriId);
    
    if (filterThn !== 'ALL') filtered = filtered.filter(d => d.tahun === filterThn);
    if (filterSub !== 'ALL') filtered = filtered.filter(d => d.sub === filterSub);

    if (filtered.length === 0) {
        tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color:var(--text-muted)">Belum ada arsip yang ditemukan.</td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach((d) => {
        let fileIcon = 'fa-file';
        let badgeColor = 'badge-file';
        const type = d.tipe_file.toUpperCase();
        
        if(type.includes('PDF')) { fileIcon = 'fa-file-pdf'; badgeColor = 'badge-pdf'; }
        else if (type.includes('XLS') || type.includes('CSV')) { fileIcon = 'fa-file-excel'; badgeColor = 'badge-xls'; }
        else if (type.includes('DOC')) { fileIcon = 'fa-file-word'; badgeColor = 'badge-file'; }
        else if (type.includes('PNG') || type.includes('JPG') || type.includes('JPEG')) { fileIcon = 'fa-file-image'; badgeColor = 'badge-img'; }
        else if (type.includes('ZIP') || type.includes('RAR')) { fileIcon = 'fa-file-zipper'; badgeColor = 'badge-file'; }
        
        html += `
            <tr>
                <td style="font-family:monospace; font-weight:600; font-size:12px; color:var(--primary-red);">
                    <i class="fa-solid fa-barcode" style="color:var(--text-muted); margin-right:4px;"></i>${d.kode_arsip}
                </td>
                <td>
                    <div style="display:flex; flex-direction:column;">
                        <a href="${d.url}" class="file-link"><i class="fa-solid ${fileIcon}"></i> ${d.nama_arsip}</a>
                        <span style="font-size:11px; color:var(--text-muted); margin-top:4px;">Tahun Perekaman: ${d.tahun}</span>
                    </div>
                </td>
                <td><span class="badge ${d.sub ? 'badge-success' : ''}">${d.sub || '-'}</span></td>
                <td><span class="badge ${badgeColor}">${type}</span></td>
                <td style="color:var(--text-muted); font-size:13px;">
                    <i class="fa-regular fa-calendar-days" style="margin-right:5px; color:var(--primary-red)"></i> ${d.tgl_upload}
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-view" title="Lihat/Download"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-icon btn-delete" title="Hapus Data"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tb.innerHTML = html;
}

window.filterData = function(kategoriId) {
    const fltTahun = document.getElementById('filterTahun').value;
    const fltSub = document.getElementById('filterSub').value;
    renderTableData(kategoriId, fltTahun, fltSub);
};

window.openUploadModal = function(kategoriId) {
    document.getElementById('uploadModal').classList.add('active');
    const subSelect = document.getElementById('inputSubKategori');
    const subs = mockSubKategori[kategoriId] || [];
    let subOptions = '';
    subs.forEach(s => subOptions += `<option value="${s}">${s}</option>`);
    subSelect.innerHTML = subOptions || `<option value="-">- Tidak Ada Sub -</option>`;
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('active');
};

// Form Handler (Mock)
document.getElementById('uploadForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nama_arsip = document.getElementById('inputJudul').value;
    const thn = document.getElementById('inputTahun').value;
    const sub = document.getElementById('inputSubKategori').value;
    const fileNode = document.getElementById('inputFile');
    
    let tipe = 'FILE';
    if(fileNode.files.length > 0) {
        const filename = fileNode.files[0].name;
        const pts = filename.split('.');
        if(pts.length > 1) {
             tipe = pts.pop().toUpperCase();
        }
    }
    
    const now = new Date();
    // Format Tgl. Bln. Tahun Time
    const tgl = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Generate Kode Arsip
    const prefix = activeCategory.substring(0,3).toUpperCase();
    const randomN = Math.floor(1000 + Math.random() * 9000);
    const generatedKode = 'ARS-' + prefix + '-' + randomN;
    
    // Add to topmost
    mockDataAkademik.unshift({
        id: Date.now(),
        kode_arsip: generatedKode,
        kategori: activeCategory,
        sub: sub,
        tahun: thn,
        nama_arsip: nama_arsip,
        tipe_file: tipe,
        tgl_upload: tgl,
        url: '#'
    });
    
    closeModal('uploadModal');
    alert('Arsip Baru Berhasil Diunggah!\nKode Arsip Anda: ' + generatedKode);
    this.reset();
    
    if (activeCategory === 'dashboard') {
        renderDashboard(document.getElementById('mainContentArea'));
    } else {
        filterData(activeCategory);
    }
});
