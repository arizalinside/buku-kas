(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var ui = {};

  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var ICONS = {
    grid:
      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    list:
      '<line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>' +
      '<line x1="4" y1="6" x2="4.01" y2="6"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
    'arrow-up': '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="9 7 17 7 17 15"/>',
    'arrow-down': '<line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 9 17 17 9 17"/>',
    wallet:
      '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/>' +
      '<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5"/>' +
      '<circle cx="16.5" cy="14" r="1.1"/>',
    trash:
      '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
      '<line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 .3-9 6 6 0 0 0-11.6 1.6A3.7 3.7 0 0 0 6.5 19z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.6 20a7.4 7.4 0 0 1 14.8 0"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    check: '<polyline points="20 6 9 17 4 12"/>'
  };

  ui.icon = function (name, size) {
    var s = size || 18;
    return (
      '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || '') +
      '</svg>'
    );
  };

  ui.esc = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  ui.rupiah = function (n) {
    var v = Math.round(Number(n) || 0);
    var sign = v < 0 ? '-' : '';
    return sign + 'Rp' + Math.abs(v).toLocaleString('id-ID');
  };

  ui.rupiahSigned = function (n) {
    var v = Math.round(Number(n) || 0);
    if (v > 0) return '+Rp' + v.toLocaleString('id-ID');
    if (v < 0) return '-Rp' + Math.abs(v).toLocaleString('id-ID');
    return 'Rp0';
  };

  // Bentuk ringkas untuk label sumbu grafik: Rp0, Rp250 rb, Rp1,2 jt
  ui.rupiahShort = function (n) {
    var v = Math.round(Number(n) || 0);
    if (v >= 1000000) {
      var jt = Math.round((v / 1000000) * 10) / 10;
      return 'Rp' + String(jt).replace('.', ',') + ' jt';
    }
    if (v >= 1000) return 'Rp' + Math.round(v / 1000).toLocaleString('id-ID') + ' rb';
    return 'Rp' + v.toLocaleString('id-ID');
  };

  ui.parseAmount = function (text) {
    var digits = String(text == null ? '' : text).replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  ui.formatAmountInput = function (text) {
    var n = ui.parseAmount(text);
    return n ? n.toLocaleString('id-ID') : '';
  };

  /* ---------- tanggal & jam WIB ---------- */

  function dateParts(dateStr) {
    var p = String(dateStr || '').split('-');
    if (p.length < 3) return null;
    return { y: parseInt(p[0], 10), m: parseInt(p[1], 10), d: parseInt(p[2], 10) };
  }

  ui.dateLabel = function (dateStr) {
    var p = dateParts(dateStr);
    if (!p) return String(dateStr || '');
    var dt = new Date(p.y, p.m - 1, p.d);
    return DAYS_SHORT[dt.getDay()] + ', ' + p.d + ' ' + MONTHS_SHORT[p.m - 1] + ' ' + p.y;
  };

  // Label ringkas untuk sumbu grafik: 12/11
  ui.dateTick = function (dateStr) {
    var p = dateParts(dateStr);
    if (!p) return '';
    return p.d + '/' + p.m;
  };

  ui.dateShort = function (dateStr) {
    var p = dateParts(dateStr);
    if (!p) return String(dateStr || '');
    return p.d + ' ' + MONTHS_SHORT[p.m - 1];
  };

  // Nama bulan singkat untuk label sumbu grafik: "Nov"
  ui.monthShort = function (dateStr) {
    var p = dateParts(dateStr);
    if (!p) return '';
    return MONTHS_SHORT[p.m - 1] || '';
  };

  // Jam dan tanggal berjalan menurut WIB, bukan zona waktu perangkat.
  ui.wibNow = function () {
    var now = new Date();
    var dateText;
    var timeText;

    try {
      dateText = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now);

      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(now);

      var map = {};
      parts.forEach(function (p) {
        map[p.type] = p.value;
      });
      timeText = map.hour + ':' + map.minute + ':' + map.second;
    } catch (e) {
      dateText = now.toDateString();
      timeText = now.toTimeString().slice(0, 8);
    }

    return { date: dateText, time: timeText };
  };

  /* ---------- komponen ---------- */

  ui.empty = function (opts) {
    opts = opts || {};
    return (
      '<div class="empty' + (opts.compact ? ' compact' : '') + '">' +
      '<div class="empty-icon">' + ui.icon(opts.icon || 'book', 22) + '</div>' +
      '<p class="empty-title">' + ui.esc(opts.title || '') + '</p>' +
      (opts.text ? '<p class="empty-text">' + ui.esc(opts.text) + '</p>' : '') +
      '</div>'
    );
  };

  ui.txRow = function (t) {
    var isPay = t.type === 'debt_payment';
    var iconName = isPay ? 'wallet' : 'arrow-down';
    var iconClass = isPay ? 'pay' : 'out';
    var amountClass = isPay ? 'pay' : 'neg';
    var sign = '−';

    var title = t.note || (isPay ? 'Bayar hutang' : 'Belanja');
    var sub = ui.dateLabel(t.date);

    if (t.category) {
      sub += ' · ' + t.category;
    }
    if (t.type === 'expense' && t.funding === 'business') {
      sub += ' · uang toko';
    }

    var badge = '';
    if (t.type === 'expense' && t.funding !== 'business') {
      badge = '<span class="type-badge">hutang</span>';
    }
    if (isPay) {
      badge = '<span class="type-badge pay">bayar hutang</span>';
    }

    return (
      '<button type="button" class="tx-row" data-tx="' + t.id + '">' +
      '<span class="tx-icon ' + iconClass + '">' + ui.icon(iconName, 16) + '</span>' +
      '<span class="tx-main">' +
      '<span class="tx-title">' + ui.esc(title) + ' ' + badge + '</span>' +
      '<span class="tx-sub">' + ui.esc(sub) + '</span>' +
      '</span>' +
      '<span class="tx-amount ' + amountClass + '">' + ui.esc(sign + ui.rupiah(t.amount)) + '</span>' +
      '</button>'
    );
  };

  /* ---------- modal ---------- */

  ui.modal = function (opts) {
    var root = document.getElementById('modal-root');
    if (!root) return;

    var actions = (opts.actions || [])
      .map(function (a, i) {
        return (
          '<button type="button" class="btn ' + (a.variant ? 'btn-' + a.variant : 'btn-ghost') +
          '" data-action="' + i + '">' + ui.esc(a.label) + '</button>'
        );
      })
      .join('');

    root.innerHTML =
      '<div class="modal-backdrop">' +
      '<div class="modal" role="dialog" aria-modal="true">' +
      '<header class="modal-head"><h2>' + ui.esc(opts.title || '') + '</h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="Tutup">' + ui.icon('x') + '</button></header>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (actions ? '<footer class="modal-foot">' + actions + '</footer>' : '') +
      '</div></div>';

    var backdrop = root.firstElementChild;

    function close() {
      ui.closeModal();
    }

    root.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', close);
    });

    root.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = (opts.actions || [])[parseInt(b.getAttribute('data-action'), 10)];
        if (act && typeof act.onClick === 'function') act.onClick(close, b);
        else close();
      });
    });

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    ui._escHandler = function (e) {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', ui._escHandler);

    if (typeof opts.onMount === 'function') opts.onMount(root);

    var focusable = root.querySelector('input, select, textarea');
    if (focusable) setTimeout(function () { focusable.focus(); }, 40);
  };

  ui.closeModal = function () {
    var root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
    if (ui._escHandler) {
      document.removeEventListener('keydown', ui._escHandler);
      ui._escHandler = null;
    }
  };

  ui.toast = function (message) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () { el.classList.add('toast-out'); }, 2200);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2700);
  };

  ui.confirm = function (message, onYes, opts) {
    opts = opts || {};
    ui.modal({
      title: opts.title || 'Konfirmasi',
      body: '<p class="confirm-text">' + ui.esc(message) + '</p>',
      actions: [
        { label: 'Batal', variant: 'ghost' },
        {
          label: opts.yesLabel || 'Ya, lanjutkan',
          variant: opts.danger ? 'danger' : 'primary',
          onClick: function (close) {
            close();
            onYes();
          }
        }
      ]
    });
  };

  /* ---------- status penyimpanan ---------- */

  ui.syncText = function () {
    var cloud = App.cloud;
    if (!cloud || !cloud.configured) return 'Tersimpan di perangkat ini';
    if (!cloud.user) return 'Belum tersambung ke penyimpanan akun';
    if (cloud.status === 'error') return 'Gagal menyimpan ke akun — data aman di perangkat';
    if (cloud.status === 'syncing') return 'Menyimpan ke akun…';
    if (cloud.status === 'saved') return 'Tersimpan ke akun';
    return 'Tersambung ke akun';
  };

  ui.renderSyncStatus = function () {
    var el = document.getElementById('sync-status');
    if (!el) return;
    var cloud = App.cloud;
    var tone = '';
    if (cloud && cloud.user) tone = cloud.status === 'error' ? 'warn' : 'ok';
    el.className = 'sync-line ' + tone;
    el.innerHTML = ui.icon(cloud && cloud.user ? 'cloud' : 'lock', 14) +
      '<span>' + ui.esc(ui.syncText()) + '</span>';
  };

  App.ui = ui;
})();
