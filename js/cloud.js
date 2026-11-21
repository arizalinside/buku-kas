(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var cfg = window.KASBUKU_CONFIG || {};
  var cloud = {};

  var client = null;
  var pushTimer = null;
  var pushing = false;
  var pendingPush = false;

  // Hanya dua nilai publik. Kata sandi tidak ada di browser sama sekali:
  // Supabase yang memverifikasinya di server.
  cloud.configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  cloud.user = null;
  cloud.status = 'idle'; // idle | syncing | saved | error
  cloud.pulling = false;

  if (cloud.configured) {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        });
      } catch (e) {
        console.warn('Buku Hutang: gagal menyiapkan Supabase', e);
        cloud.configured = false;
      }
    } else {
      console.warn('Buku Hutang: pustaka Supabase tidak termuat');
      cloud.configured = false;
    }
  }

  /* ---------- pesan kesalahan dalam bahasa sehari-hari ---------- */

  function friendly(error) {
    if (!error) return 'Terjadi kesalahan. Coba lagi.';
    var code = String(error.code || '');
    var msg = String(error.message || '');

    if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
      return 'Email atau kata sandi salah.';
    }
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
      return 'Akun ini belum aktif. Hubungi pengelola aplikasi.';
    }
    if (/relation .* does not exist|42P01/i.test(msg + ' ' + code)) {
      return 'Tabel penyimpanan belum ada. Jalankan supabase/schema.sql di project Anda.';
    }
    if (/invalid api key|no api key|invalid jwt|jwt expired/i.test(msg)) {
      return 'Kunci Supabase salah atau sudah tidak berlaku. Periksa js/config.js.';
    }
    if (/rate limit|too many/i.test(msg)) {
      return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    }
    if (code === 'weak_password' || /password should be at least/i.test(msg)) {
      return 'Kata sandi minimal 6 huruf.';
    }
    if (/failed to fetch|network|load failed/i.test(msg)) {
      return 'Tidak ada koneksi internet. Coba lagi.';
    }
    return msg || 'Terjadi kesalahan. Coba lagi.';
  }

  cloud.friendly = friendly;

  /* ---------- akun ---------- */

  // Sesi yang tersimpan di perangkat (kalau ada) dipulihkan tanpa
  // meminta kata sandi lagi.
  cloud.restoreSession = function () {
    if (!client) return Promise.resolve(null);
    return client.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      cloud.user = session ? session.user : null;
      return session;
    });
  };

  // Kata sandi dikirim ke Supabase untuk diperiksa di server. Tidak ada
  // kata sandi yang disimpan di kode maupun di perangkat.
  cloud.signIn = function (email, password) {
    if (!client) {
      return Promise.reject(new Error('Penyimpanan akun belum disiapkan.'));
    }
    return client.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) throw res.error;
      cloud.user = res.data.session ? res.data.session.user : null;
      cloud.status = 'idle';
      return cloud.user;
    });
  };

  // Ganti kata sandi selama sesi masih aktif. Tidak perlu email sama sekali.
  cloud.updatePassword = function (password) {
    if (!client) {
      return Promise.reject(new Error('Penyimpanan akun belum disiapkan.'));
    }
    return client.auth.updateUser({ password: password }).then(function (res) {
      if (res.error) throw res.error;
      return true;
    });
  };

  cloud.signOut = function () {
    cloud.user = null;
    cloud.status = 'idle';
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function () {});
  };

  /* ---------- data ---------- */

  cloud.pull = function (uid) {
    if (!client || !uid) return Promise.resolve(null);
    return client
      .from('user_data')
      .select('data')
      .eq('user_id', uid)
      .maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data && res.data.data ? res.data.data : null;
      });
  };

  function doPush() {
    if (!client || !cloud.user) return Promise.resolve();
    if (pushing) {
      pendingPush = true;
      return Promise.resolve();
    }
    pushing = true;
    var wasError = cloud.status === 'error';
    cloud.status = 'syncing';
    if (App.ui && App.ui.renderSyncStatus) App.ui.renderSyncStatus();

    var payload = {
      user_id: cloud.user.id,
      data: App.store.snapshot(),
      updated_at: new Date().toISOString()
    };

    return client
      .from('user_data')
      .upsert(payload, { onConflict: 'user_id' })
      .then(function (res) {
        if (res.error) throw res.error;
        cloud.status = 'saved';
      })
      .catch(function (err) {
        console.warn('Buku Hutang: gagal menyimpan ke akun', err);
        cloud.status = 'error';
        // Pengguna perlu tahu saat pengiriman gagal, bukan hanya diam-diam
        // menyimpan di perangkat lalu hilang di perangkat lain.
        if (!wasError && App.ui && App.ui.toast) {
          App.ui.toast('Gagal menyimpan ke akun. Data tetap aman di perangkat ini.');
        }
      })
      .then(function () {
        pushing = false;
        if (App.ui && App.ui.renderSyncStatus) App.ui.renderSyncStatus();
        if (pendingPush) {
          pendingPush = false;
          return doPush();
        }
      });
  }

  cloud.push = function () {
    return doPush();
  };

  // Dipanggil setiap kali store menyimpan ke perangkat.
  cloud.onLocalSave = function () {
    if (!cloud.configured || !cloud.user || cloud.pulling) return;
    if (pushTimer) clearTimeout(pushTimer);
    cloud.status = 'syncing';
    if (App.ui && App.ui.renderSyncStatus) App.ui.renderSyncStatus();
    pushTimer = setTimeout(function () {
      pushTimer = null;
      doPush();
    }, 500);
  };

  // Kalau halaman ditutup atau ditinggal sebelum jeda pengiriman habis, kirim
  // sekarang supaya catatan tidak tertinggal hanya di perangkat ini.
  function flushPush() {
    if (!cloud.configured || !cloud.user || cloud.pulling) return;
    if (!pushTimer) return;
    clearTimeout(pushTimer);
    pushTimer = null;
    doPush();
  }

  window.addEventListener('pagehide', flushPush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushPush();
  });

  /* ---------- pemeriksaan dan sinkronisasi manual ---------- */

  cloud.checkConnection = function () {
    if (!client) {
      return Promise.resolve({
        ok: false,
        message: 'Penyimpanan akun belum disiapkan. Isi dua nilai di js/config.js.'
      });
    }

    return cloud
      .restoreSession()
      .then(function (session) {
        if (!session) {
          return { ok: false, message: 'Sesi berakhir. Silakan masuk lagi.' };
        }
        return client.from('user_data').select('user_id', { count: 'exact', head: true }).limit(1);
      })
      .then(function (res) {
        if (res && res.ok === false) return res;
        if (res.error) return { ok: false, message: friendly(res.error) };
        return { ok: true, message: 'Tersambung. Penyimpanan akun siap dipakai.' };
      })
      .catch(function (err) {
        return { ok: false, message: friendly(err) };
      });
  };

  // Ambil data dari akun dan ganti isi perangkat ini.
  cloud.pullNow = function () {
    if (!client || !cloud.user) {
      return Promise.reject(new Error('Belum masuk ke akun.'));
    }

    cloud.pulling = true;

    return client
      .from('user_data')
      .select('data')
      .eq('user_id', cloud.user.id)
      .maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        var remote = res.data && res.data.data ? res.data.data : null;
        if (!remote || !remote.transactions) {
          return { replaced: false, message: 'Belum ada data di akun penyimpanan.' };
        }
        App.store.replaceAll(remote);
        cloud.status = 'saved';
        if (App.ui.renderSyncStatus) App.ui.renderSyncStatus();
        return { replaced: true, message: 'Data dari akun sudah dimuat.' };
      })
      .then(function (result) {
        cloud.pulling = false;
        return result;
      })
      .catch(function (err) {
        cloud.pulling = false;
        throw err;
      });
  };

  cloud.syncNow = function () {
    if (!client || !cloud.user) {
      return Promise.reject(new Error('Belum masuk ke akun.'));
    }
    return doPush().then(function () {
      var ok = cloud.status !== 'error';
      return {
        ok: ok,
        message: ok
          ? 'Data sudah dikirim ke akun penyimpanan.'
          : 'Gagal mengirim. Data tetap aman di perangkat ini.'
      };
    });
  };

  App.cloud = cloud;
})();
