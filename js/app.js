(function () {
  'use strict';

  var App = window.App;
  var ui = App.ui;

  var ROUTES = [
    { id: 'beranda', label: 'Beranda', icon: 'grid' },
    { id: 'catatan', label: 'Catatan', icon: 'list' },
    { id: 'rekap', label: 'Rekap', icon: 'chart' },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings' }
  ];

  var PREF_KEY = 'kasbuku.nav.v1';
  var LIST_KEY = 'kasbuku.list.v1';

  App.uiState = { route: 'beranda' };

  function isRoute(id) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return true;
    return false;
  }

  function routeLabel(id) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i].label;
    return 'Buku Hutang';
  }

  function routeFromHash() {
    var h = String(location.hash || '').replace(/^#\/?/, '');
    return isRoute(h) ? h : '';
  }

  function loadPrefs() {
    try {
      var rawList = localStorage.getItem(LIST_KEY);
      if (rawList) App.listState = JSON.parse(rawList);

      var raw = localStorage.getItem(PREF_KEY);
      if (!raw) return;
      var prefs = JSON.parse(raw);
      if (prefs && isRoute(prefs.route)) App.uiState.route = prefs.route;
      if (prefs && prefs.list && !App.listState) App.listState = prefs.list;
    } catch (e) {
      /* diabaikan */
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        PREF_KEY,
        JSON.stringify({ route: App.uiState.route, list: App.listState || null })
      );
    } catch (e) {
      /* diabaikan */
    }
  }

  App.go = function (route) {
    if (!isRoute(route)) route = 'beranda';
    if (location.hash !== '#/' + route) location.hash = '#/' + route;
    else App.render();
  };

  App.render = function () {
    var fromHash = routeFromHash();
    if (fromHash) App.uiState.route = fromHash;
    else if (!isRoute(App.uiState.route)) App.uiState.route = 'beranda';

    var view = document.getElementById('view');

    document.querySelectorAll('#nav .nav-item, #tabbar .tab-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-route') === App.uiState.route);
    });

    document.title = routeLabel(App.uiState.route) + ' · Buku Hutang';
    savePrefs();

    if (view) {
      view.innerHTML = '';
      var renderView = App.views[App.uiState.route];
      if (typeof renderView === 'function') renderView(view);
    }

    ui.renderSyncStatus();
  };

  function navHTML(cls, withLabels) {
    return ROUTES.map(function (r) {
      return (
        '<button type="button" class="' + cls + '" data-route="' + r.id + '">' +
        '<span class="nav-icon">' + ui.icon(r.icon, withLabels ? 19 : 22) + '</span>' +
        '<span class="' + (withLabels ? 'nav-label' : 'tab-label') + '">' + r.label + '</span>' +
        '</button>'
      );
    }).join('');
  }

  /* ---------- jam WIB ---------- */

  function tickClock() {
    var dateEl = document.getElementById('clock-date');
    var timeEl = document.getElementById('clock-time');
    if (!dateEl || !timeEl) return;
    var now = ui.wibNow();
    dateEl.textContent = now.date;
    timeEl.textContent = now.time + ' WIB';
  }

  /* ---------- alur masuk aplikasi ---------- */

  App.auth.enterApp = function () {
    App.auth.hide();
    App.store.load();
    loadPrefs();
    App.render();

    if (!App.cloud.configured || !App.cloud.user) {
      ui.renderSyncStatus();
      return;
    }

    App.cloud.pulling = true;
    App.cloud
      .pull(App.cloud.user.id)
      .then(function (remote) {
        var hasRemote = !!(remote && Array.isArray(remote.transactions));
        if (hasRemote) {
          var localCount = (App.store.snapshot().transactions || []).length;
          var remoteCount = (remote.transactions || []).length;
          if (remoteCount > 0 || localCount === 0) {
            App.store.replaceAll(remote);
          } else {
            App.cloud.push();
          }
        } else {
          App.cloud.push();
        }
        App.cloud.status = 'saved';
        ui.renderSyncStatus();
        App.render();
      })
      .catch(function (err) {
        console.warn('Buku Hutang: penyimpanan akun tidak tersambung', err);
        App.cloud.status = 'error';
        ui.renderSyncStatus();
      })
      .then(function () {
        App.cloud.pulling = false;
      });
  };

  App.logout = function () {
    ui.confirm(
      'Keluar dari aplikasi? Catatan tetap tersimpan dan bisa dibuka lagi dengan masuk kembali.',
      function () {
        App.cloud
          .signOut()
          .catch(function (err) {
            console.warn('Buku Hutang: gagal keluar dari sesi', err);
          })
          .then(function () {
            App.auth.show();
          });
      },
      { title: 'Keluar', yesLabel: 'Keluar' }
    );
  };

  /* ---------- boot ---------- */

  var booted = false;

  function boot() {
    if (booted) return;
    booted = true;

    App.store.load();
    loadPrefs();

    var fabIcon = document.getElementById('fab-icon');
    if (fabIcon) fabIcon.innerHTML = ui.icon('plus', 24);

    var nav = document.getElementById('nav');
    var tabbar = document.getElementById('tabbar');
    if (nav) nav.innerHTML = navHTML('nav-item', true);
    if (tabbar) tabbar.innerHTML = navHTML('tab-item', false);

    document.addEventListener('click', function (e) {
      var routeEl = e.target.closest('[data-route]');
      if (routeEl) {
        e.preventDefault();
        App.go(routeEl.getAttribute('data-route'));
      }
    });

    var fab = document.getElementById('fab-add');
    if (fab) {
      fab.addEventListener('click', function () {
        App.openAddMenu();
      });
    }

    tickClock();
    setInterval(tickClock, 1000);

    // Tombol tambah disembunyikan saat daftar digulir ke bawah supaya
    // tidak menutupi angka, lalu muncul lagi saat berhenti menggulir.
    if (fab) {
      var lastY = window.scrollY || 0;
      var hideTimer = null;

      function showFab() {
        fab.classList.remove('is-hidden');
      }

      window.addEventListener(
        'scroll',
        function () {
          var y = window.scrollY || 0;
          if (y > lastY + 6 && y > 120) fab.classList.add('is-hidden');
          else if (y < lastY - 6) showFab();
          lastY = y;

          clearTimeout(hideTimer);
          hideTimer = setTimeout(showFab, 900);
        },
        { passive: true }
      );
    }

    window.addEventListener('hashchange', function () {
      var appRoot = document.getElementById('app-root');
      if (appRoot && appRoot.classList.contains('hidden')) return;
      App.render();
      window.scrollTo(0, 0);
    });

    if (!App.cloud.configured) {
      App.auth.show('Penyimpanan akun belum disiapkan. Hubungi pengelola aplikasi.');
      return;
    }

    App.cloud
      .restoreSession()
      .then(function (session) {
        if (session) App.auth.enterApp();
        else App.auth.show();
      })
      .catch(function () {
        App.auth.show();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
