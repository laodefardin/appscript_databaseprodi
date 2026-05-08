// ============================================================
// NOTIFIKASI & KONFIRMASI (pengganti alert / confirm)
// ============================================================
function showNotif(type, title, message) {
    var icon = document.getElementById('notifIcon');
    if (type === 'success') {
        icon.style.background = '#e8f8f5'; icon.style.color = '#27ae60';
        icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else {
        icon.style.background = '#ffebee'; icon.style.color = '#c62828';
        icon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
    }
    document.getElementById('notifTitle').innerText = title;
    document.getElementById('notifMessage').innerText = message;
    document.getElementById('notifModal').classList.add('active');
}

function showConfirm(iconHtml, iconBg, iconColor, title, message, btnText, btnColor, callback) {
    var icon = document.getElementById('confirmIcon');
    icon.style.background = iconBg; icon.style.color = iconColor;
    icon.innerHTML = iconHtml;
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = message;
    var btn = document.getElementById('confirmActionBtn');
    btn.innerHTML = btnText;
    if (btnColor) btn.style.background = btnColor;
    else btn.style.background = '';
    btn.onclick = function() { closeModal('confirmModal'); callback(); };
    document.getElementById('confirmModal').classList.add('active');
}

// ============================================================
// SESSION PERSISTENCE
// ============================================================
var currentUser = null;

function showDashboard(user) {
    currentUser = user;
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('sidebarUsername').innerText = user.nama || user.username;
    var roleEl = document.getElementById('sidebarRole');
    if (roleEl) roleEl.innerText = user.role;
    initDashboard();
}
function showLogin() {
    currentUser = null;
    localStorage.removeItem('dataprodi_user');
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('btnLogin').disabled = false;
    document.getElementById('btnLogin').innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk Sistem';
}
// checkSession dipanggil dari app_js.html setelah semua fungsi terdefinisi
function checkSession() {
    var saved = localStorage.getItem('dataprodi_user');
    if (saved) { try { showDashboard(JSON.parse(saved)); } catch(e) { localStorage.removeItem('dataprodi_user'); } }
}

// ============================================================
// LOGIN
// ============================================================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    var btn = document.getElementById('btnLogin');
    var alertBox = document.getElementById('loginAlert');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memverifikasi...';
    alertBox.style.display = 'none';
    google.script.run
        .withSuccessHandler(function(r) {
            if (r.success) { localStorage.setItem('dataprodi_user', JSON.stringify(r.user)); showDashboard(r.user); }
            else { document.getElementById('loginAlertText').innerText = r.message; alertBox.style.display = 'block'; btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk Sistem'; }
        })
        .withFailureHandler(function(err) { document.getElementById('loginAlertText').innerText = 'Error: ' + err.message; alertBox.style.display = 'block'; btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk Sistem'; })
        .loginUser(username, password);
});

// ============================================================
// LOGOUT (Modal)
// ============================================================
document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById('logoutModal').classList.add('active');
});
function doLogout() { closeModal('logoutModal'); showLogin(); }

// ============================================================
// SIDEBAR & CLOCK
// ============================================================
function toggleSidebar() { document.getElementById('mainSidebar').classList.toggle('active'); document.getElementById('sidebarOverlay').classList.toggle('active'); }
setInterval(function() { var now = new Date(); var el = document.getElementById('headerClock'); if(el) el.innerText = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }); }, 1000);

// ============================================================
// DRAG & DROP FILE UPLOAD
// ============================================================
var dropZone = document.getElementById('dropZone');
var fileInput = document.getElementById('inputFile');

dropZone.addEventListener('click', function(e) {
    if (e.target.closest('.drop-zone-file button')) return;
    fileInput.click();
});
fileInput.addEventListener('change', function() { if (fileInput.files.length) showDropFile(fileInput.files[0]); });
dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', function(e) {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        showDropFile(e.dataTransfer.files[0]);
    }
});
function showDropFile(file) {
    document.getElementById('dropZonePrompt').style.display = 'none';
    document.getElementById('dropZoneFile').style.display = 'flex';
    document.getElementById('dropFileName').innerText = file.name;
    document.getElementById('dropFileSize').innerText = (file.size / 1024).toFixed(1) + ' KB';
}
function clearDropFile() {
    fileInput.value = '';
    document.getElementById('dropZonePrompt').style.display = 'flex';
    document.getElementById('dropZoneFile').style.display = 'none';
}