(function () {
  'use strict';

  var App = window.App;
  var ui = App.ui;

  var auth = {};

  // Hanya email terakhir yang diingat untuk memudahkan mengetik ulang.
  // Kata sandi tidak pernah disimpan di perangkat.
  var LAST_EMAIL_KEY = 'kasbuku.lastEmail';

  function lastEmail() {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function rememberEmail(email) {
    try {
      localStorage.setItem(LAST_EMAIL_KEY, email || '');
    } catch (e) {
      /* penyimpanan diblokir */
    }
  }

  function field(id, label, type, opts) {
    opts = opts || {};
    return (
      '<label class="big-field" for="' + id + '">' +
      '<span class="big-label">' + ui.esc(label) + '</span>' +
      '<input id="' + id + '" type="' + type + '" ' +
      (opts.autocomplete ? 'autocomplete="' + opts.autocomplete + '" ' : 'autocomplete="off" ') +
      'placeholder="' + ui.esc(opts.placeholder || '') + '" />' +
      '</label>'
    );
  }

  auth.show = function (pesan) {
    var el = document.getElementById('auth-root');
    if (!el) return;

    document.title = 'Masuk · Buku Hutang';
    el.classList.remove('hidden');
    var appEl = document.getElementById('app-root');
    if (appEl) appEl.classList.add('hidden');

    el.innerHTML =
      '<div class="auth-page">' +
      '<div class="auth-box">' +
      '<div class="auth-brand">' +
      '<div><div class="auth-brand-name">Buku Hutang</div>' +
      '<div class="auth-brand-sub">Catatan belanja dan hutang toko</div></div></div>' +
      (pesan ? '<p class="auth-notice error">' + ui.esc(pesan) + '</p>' : '') +
      '<div class="auth-body">' +
      '<h1 class="auth-title">Masuk</h1>' +
      '<p class="auth-sub">Gunakan akun toko Anda.</p>' +
      field('a-email', 'Email', 'email', { autocomplete: 'username', placeholder: 'nama@email.com' }) +
      field('a-pass', 'Kata sandi', 'password', { autocomplete: 'current-password', placeholder: 'Kata sandi' }) +
      '<div class="auth-row">' +
      '<button class="text-btn" type="button" id="a-lihat">Lihat kata sandi</button>' +
      '</div>' +
      '<button class="big-btn primary" type="button" id="a-masuk">Masuk</button>' +
      '</div>' +
      '<div class="auth-help"><span>Lupa kata sandi? Hubungi pengelola aplikasi.</span></div>' +
      '</div>' +
      '</div>';

    bind();
  };

  auth.hide = function () {
    var el = document.getElementById('auth-root');
    if (el) {
      el.classList.add('hidden');
      el.innerHTML = '';
    }
    var appEl = document.getElementById('app-root');
    if (appEl) appEl.classList.remove('hidden');
  };

  function bind() {
    var emailEl = document.getElementById('a-email');
    var passEl = document.getElementById('a-pass');
    var btn = document.getElementById('a-masuk');

    if (emailEl) emailEl.value = lastEmail();

    function setBusy(on) {
      if (!btn) return;
      btn.disabled = on;
      btn.textContent = on ? 'Memeriksa…' : 'Masuk';
    }

    function submit() {
      var valueEmail = String(emailEl ? emailEl.value : '').trim().toLowerCase();
      var valuePass = String(passEl ? passEl.value : '');

      if (!valueEmail) {
        auth.show('Isi email dulu.');
        return;
      }
      if (!valuePass) {
        auth.show('Isi kata sandi dulu.');
        return;
      }

      if (!App.cloud || !App.cloud.configured) {
        auth.show('Penyimpanan akun belum disiapkan. Hubungi pengelola aplikasi.');
        return;
      }

      setBusy(true);

      App.cloud
        .signIn(valueEmail, valuePass)
        .then(function () {
          rememberEmail(valueEmail);
          App.auth.enterApp();
        })
        .catch(function (err) {
          setBusy(false);
          auth.show(App.cloud.friendly(err));
        });
    }

    if (btn) btn.addEventListener('click', submit);

    var lihat = document.getElementById('a-lihat');
    if (lihat) {
      lihat.addEventListener('click', function () {
        if (!passEl) return;
        var showing = passEl.type === 'text';
        passEl.type = showing ? 'password' : 'text';
        lihat.textContent = showing ? 'Lihat kata sandi' : 'Sembunyikan kata sandi';
        passEl.focus();
      });
    }

    [emailEl, passEl].forEach(function (input) {
      if (!input) return;
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });

    if (passEl) setTimeout(function () { passEl.focus(); }, 40);
  }

  App.auth = auth;
})();
