(function () {
  'use strict';

  var App = window.App;
  var ui = App.ui;

  var cloud = App.cloud;

  App.views.pengaturan = function (root) {
    var s = App.store;
    var email = cloud && cloud.user ? String(cloud.user.email || '') : '';

    var accountHTML;

    if (!cloud || !cloud.configured) {
      accountHTML =
        '<section class="card">' +
        '<div class="card-head"><h2>Cadangan otomatis</h2>' +
        '<span class="muted small">Belum tersambung</span></div>' +
        '<p class="note-box">Catatan tersimpan di perangkat ini. Supaya bisa dibuka dari ponsel atau komputer lain, sambungkan sekali ke penyimpanan gratis.</p>' +
        '<div class="setup-steps">' +
        '<div class="setup-step"><span>1</span><div>' +
        '<div class="setting-title">Buat project Supabase gratis</div>' +
        '<div class="muted small">Daftar di supabase.com, lalu klik New project.</div>' +
        '</div></div>' +
        '<div class="setup-step"><span>2</span><div>' +
        '<div class="setting-title">Jalankan skema tabel</div>' +
        '<div class="muted small">SQL Editor, tempel isi <code>supabase/schema.sql</code>, lalu Run.</div>' +
        '</div></div>' +
        '<div class="setup-step"><span>3</span><div>' +
        '<div class="setting-title">Buat akun penyimpanan</div>' +
        '<div class="muted small">Authentication &rarr; Users &rarr; Add user, centang Auto Confirm User.</div>' +
        '</div></div>' +
        '<div class="setup-step"><span>4</span><div>' +
        '<div class="setting-title">Tempel 2 nilai di config.js</div>' +
        '<div class="muted small">SUPABASE_URL dan SUPABASE_ANON_KEY dari Project Settings.</div>' +
        '</div></div>' +
        '</div>' +
        '<p class="note-box" style="margin-top:14px">Panduan lengkap: <code>docs/SETUP-SUPABASE.md</code>.</p>' +
        '</section>';
    } else if (cloud.user) {
      accountHTML =
        '<section class="card">' +
        '<div class="card-head"><h2>Cadangan otomatis</h2><span class="tag">Tersambung</span></div>' +
        '<div class="setting-row">' +
        '<div class="setting-main">' +
        '<span class="acc-icon">' + ui.icon('cloud', 16) + '</span>' +
        '<div><div class="setting-title">' + ui.esc(email) + '</div>' +
        '<div class="muted small">' + ui.esc(ui.syncText()) + '</div></div>' +
        '</div>' +
        '<div class="setting-actions">' +
        '<button class="btn btn-ghost btn-sm" id="btn-sync-now">Simpan sekarang</button>' +
        '<button class="btn btn-ghost btn-sm" id="btn-logout">' + ui.icon('logout', 14) + ' Keluar</button>' +
        '</div></div>' +
        '<div class="setting-row">' +
        '<div><div class="setting-title">Pakai catatan dari akun</div>' +
        '<div class="muted small">Untuk perangkat baru, atau kalau catatan di sini terasa belum lengkap.</div></div>' +
        '<button class="btn btn-ghost btn-sm" id="btn-pull-now">Ambil</button>' +
        '</div>' +
        '</section>';
    } else {
      accountHTML =
        '<section class="card">' +
        '<div class="card-head"><h2>Cadangan otomatis</h2>' +
        '<span class="muted small">Bermasalah</span></div>' +
        '<p class="note-box">Catatan tetap aman di perangkat ini, tetapi belum tersambung ke akun. Periksa <code>js/config.js</code> dan akun Supabase Anda.</p>' +
        '<div class="setting-actions" style="margin-top:14px">' +
        '<button class="btn btn-ghost btn-sm" id="btn-check-conn">Coba lagi</button>' +
        '</div>' +
        '</section>';
    }

    root.innerHTML =
      '<div class="page-head"><div><h1>Pengaturan</h1>' +
      '<p class="sub">Akun, cadangan, dan data</p></div></div>' +
      '<div class="settings-grid">' +
      accountHTML +

      '<section class="card">' +
      '<div class="card-head"><h2>Data</h2></div>' +
      '<div class="setting-row">' +
      '<div><div class="setting-title">Unduh cadangan</div>' +
      '<div class="muted small">Simpan semua catatan sebagai berkas.</div></div>' +
      '<button class="btn btn-ghost btn-sm" id="btn-export">' + ui.icon('download', 14) + ' Unduh</button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><div class="setting-title">Pulihkan cadangan</div>' +
      '<div class="muted small">Impor berkas cadangan. Data sekarang akan diganti.</div></div>' +
      '<button class="btn btn-ghost btn-sm" id="btn-import">' + ui.icon('upload', 14) + ' Impor</button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><div class="setting-title">Isi contoh</div>' +
      '<div class="muted small">Tambahkan catatan contoh untuk melihat cara kerjanya.</div></div>' +
      '<button class="btn btn-ghost btn-sm" id="btn-demo">Isi contoh</button>' +
      '</div>' +
      '</section>' +

      '<section class="card danger-zone">' +
      '<div class="card-head"><h2>Hapus data</h2></div>' +
      '<div class="setting-row">' +
      '<div><div class="setting-title">Hapus semua catatan</div>' +
      '<div class="muted small">Semua uang masuk dan keluar dihapus.</div></div>' +
      '<button class="btn btn-ghost btn-sm" id="btn-clear">Hapus catatan</button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><div class="setting-title">Mulai dari nol</div>' +
      '<div class="muted small">Kembalikan semuanya ke pengaturan awal.</div></div>' +
      '<button class="btn btn-danger btn-sm" id="btn-reset">Reset semua</button>' +
      '</div>' +
      '</section>' +

      '<section class="card">' +
      '<div class="card-head"><h2>Tentang aplikasi</h2></div>' +
      '<p class="note-box">' +
      'Buku Uang — pencatatan kas toko. Login memakai akun Supabase; ' +
      'kata sandi tidak disimpan di aplikasi. Untuk mengubahnya, buka ' +
      'Authentication &rarr; Users di dashboard Supabase.' +
      '</p>' +
      '</section>' +
      '</div>';

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.json';
    fileInput.style.display = 'none';
    root.appendChild(fileInput);

    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', App.logout);

    var checkBtn = document.getElementById('btn-check-conn');
    if (checkBtn) {
      checkBtn.addEventListener('click', function () {
        checkBtn.disabled = true;
        checkBtn.textContent = 'Memeriksa…';
        cloud
          .checkConnection()
          .then(function (result) {
            ui.toast(result.message);
            if (result.ok) {
              App.auth.enterApp();
            } else {
              App.auth.show(result.message);
            }
          })
          .catch(function () {
            checkBtn.disabled = false;
            checkBtn.textContent = 'Coba lagi';
            ui.toast('Tidak bisa memeriksa koneksi.');
          });
      });
    }

    var syncBtn = document.getElementById('btn-sync-now');
    if (syncBtn) {
      syncBtn.addEventListener('click', function () {
        syncBtn.disabled = true;
        cloud
          .syncNow()
          .then(function (result) {
            syncBtn.disabled = false;
            ui.toast(result.message);
            App.render();
          })
          .catch(function (err) {
            syncBtn.disabled = false;
            ui.toast(cloud.friendly(err));
          });
      });
    }

    var pullBtn = document.getElementById('btn-pull-now');
    if (pullBtn) {
      pullBtn.addEventListener('click', function () {
        ui.confirm(
          'Ambil catatan dari akun dan ganti catatan di perangkat ini?',
          function () {
            cloud
              .pullNow()
              .then(function (result) {
                ui.toast(result.message);
                App.render();
              })
              .catch(function (err) {
                ui.toast(cloud.friendly(err));
              });
          },
          { title: 'Ambil dari akun', yesLabel: 'Ambil' }
        );
      });
    }

    document.getElementById('btn-export').addEventListener('click', function () {
      var blob = new Blob([s.exportJSON()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'buku-uang-cadangan-' + s.todayISO() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
      ui.toast('Cadangan diunduh.');
    });

    document.getElementById('btn-import').addEventListener('click', function () {
      fileInput.value = '';
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          s.importJSON(String(reader.result));
          ui.toast('Data berhasil diimpor.');
          App.render();
        } catch (err) {
          ui.toast('Gagal impor: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-demo').addEventListener('click', function () {
      ui.confirm(
        'Tambahkan catatan contoh? Catatan Anda yang sudah ada tidak dihapus.',
        function () {
          s.seedDemo();
          ui.toast('Catatan contoh ditambahkan.');
          App.render();
        },
        { yesLabel: 'Tambahkan' }
      );
    });

    document.getElementById('btn-clear').addEventListener('click', function () {
      ui.confirm(
        'Hapus semua catatan? Tindakan ini tidak bisa dibatalkan.',
        function () {
          s.clearTransactions();
          ui.toast('Semua catatan dihapus.');
          App.render();
        },
        { danger: true, yesLabel: 'Hapus semua' }
      );
    });

    document.getElementById('btn-reset').addEventListener('click', function () {
      ui.confirm(
        'Kembalikan semuanya ke pengaturan awal? Semua catatan akan hilang.',
        function () {
          s.resetAll();
          ui.toast('Data dikembalikan ke awal.');
          App.render();
        },
        { danger: true, yesLabel: 'Reset' }
      );
    });
  };
})();
