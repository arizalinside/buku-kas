(function () {
  'use strict';

  var App = window.App;
  var ui = App.ui;

  App.views = App.views || {};

  var RANGES = [
    { value: 'today', label: 'Hari ini' },
    { value: '7d', label: '7 hari' },
    { value: '30d', label: '30 hari' },
    { value: 'month', label: 'Bulan ini' },
    { value: 'all', label: 'Semua' },
    { value: 'custom', label: 'Pilih tanggal' }
  ];

  App.views.rekap = function (root) {
    var s = App.store;

    if (!App.rekapState) {
      App.rekapState = { range: '30d', from: '', to: '' };
    }
    var st = App.rekapState;
    var dates = s.rangeDates(st.range, st.from, st.to);

    var list = s.sorted().filter(function (t) {
      if (st.range === 'custom') {
        if (st.from && t.date < st.from) return false;
        if (st.to && t.date > st.to) return false;
      } else if (st.range !== 'all') {
        if (dates.from && t.date < dates.from) return false;
        if (dates.to && t.date > dates.to) return false;
      }
      return true;
    });

    var expense = 0;
    var borrowed = 0;
    var paid = 0;
    var byDate = {};

    list.forEach(function (t) {
      if (t.type === 'debt_payment') {
        paid += t.amount;
        return;
      }
      expense += t.amount;
      if (t.funding !== 'business') borrowed += t.amount;
      byDate[t.date] = (byDate[t.date] || 0) + t.amount;
    });

    var topExpenses = list
      .filter(function (t) {
        return t.type === 'expense';
      })
      .slice()
      .sort(function (a, b) {
        return b.amount - a.amount;
      })
      .slice(0, 10);

    var days = Object.keys(byDate).sort().reverse();

    var catFrom = st.range === 'custom' ? st.from : dates.from;
    var catTo = st.range === 'custom' ? st.to : dates.to;
    var catTotals = s.categoryTotals(catFrom, catTo);

    var topHTML = topExpenses.length
      ? topExpenses
          .map(function (t) {
            return (
              '<div class="mini-row">' +
              '<div class="mini-head"><span>' + ui.esc(t.note || 'Belanja') + '</span>' +
              '<span class="muted">' + ui.rupiah(t.amount) + '</span></div>' +
              '<div class="mini-foot muted">' + ui.dateLabel(t.date) + ' · ' +
              (t.funding === 'business' ? 'uang toko' : 'uang pribadi') + '</div>' +
              '</div>'
            );
          })
          .join('')
      : ui.empty({ icon: 'chart', title: 'Belum ada belanja', compact: true });

    var catHTML = catTotals.length
      ? '<table class="table"><thead><tr><th>Kategori</th><th class="num">Jumlah</th></tr></thead><tbody>' +
        catTotals
          .map(function (c) {
            return '<tr><td>' + ui.esc(c.name) + '</td><td class="num">' + ui.rupiah(c.total) + '</td></tr>';
          })
          .join('') +
        '</tbody></table>'
      : ui.empty({ icon: 'chart', title: 'Belum ada kategori', compact: true });

    var dailyHTML = days.length
      ? '<table class="table"><thead><tr><th>Tanggal</th><th class="num">Belanja</th></tr></thead><tbody>' +
        days
          .map(function (d) {
            return (
              '<tr><td>' + ui.dateLabel(d) + '</td>' +
              '<td class="num neg">' + ui.rupiah(byDate[d]) + '</td></tr>'
            );
          })
          .join('') +
        '</tbody></table>'
      : ui.empty({ icon: 'chart', title: 'Belum ada catatan di rentang ini', compact: true });

    root.innerHTML =
      '<div class="page-head">' +
      '<div><h1>Rekap</h1><p class="sub">Ringkasan belanja dan hutang</p></div>' +
      '</div>' +

      '<div class="card">' +
      '<div class="chips" id="rekap-chips">' +
      RANGES.map(function (r) {
        return '<button type="button" class="chip' + (r.value === st.range ? ' active' : '') +
          '" data-range="' + r.value + '">' + r.label + '</button>';
      }).join('') +
      '</div>' +
      '<div class="custom-range' + (st.range === 'custom' ? '' : ' hidden') + '" id="rekap-custom">' +
      '<label class="small muted" for="rekap-from">Dari</label>' +
      '<input type="date" id="rekap-from" class="input" value="' + ui.esc(st.from) + '" />' +
      '<label class="small muted" for="rekap-to">Sampai</label>' +
      '<input type="date" id="rekap-to" class="input" value="' + ui.esc(st.to) + '" />' +
      '</div>' +
      '</div>' +

      '<div class="stat-grid stat-grid-3" style="margin-top:14px">' +
      '<div class="card stat"><span class="stat-label">Total belanja</span>' +
      '<strong class="stat-value neg">' + ui.rupiah(expense) + '</strong></div>' +
      '<div class="card stat"><span class="stat-label">Dari uang pribadi</span>' +
      '<strong class="stat-value">' + ui.rupiah(borrowed) + '</strong>' +
      '<span class="stat-meta">Menambah hutang</span></div>' +
      '<div class="card stat stat-highlight"><span class="stat-label">Bayar hutang</span>' +
      '<strong class="stat-value pay">' + ui.rupiah(paid) + '</strong>' +
      '<span class="stat-meta">Dari uang toko ' + ui.rupiah(expense - borrowed) + '</span></div>' +
      '</div>' +

      '<div class="grid-2 grid-2-even" style="margin-top:14px">' +
      '<section class="card"><div class="card-head"><h2>Belanja terbesar</h2></div>' +
      topHTML + '</section>' +
      '<section class="card"><div class="card-head"><h2>Per hari</h2></div>' +
      dailyHTML + '</section>' +
      '</div>' +
      '<section class="card" style="margin-top:14px">' +
      '<div class="card-head"><h2>Per kategori</h2></div>' +
      catHTML +
      '</section>';

    root.querySelectorAll('#rekap-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        st.range = chip.getAttribute('data-range');
        App.render();
      });
    });

    var fromEl = document.getElementById('rekap-from');
    var toEl = document.getElementById('rekap-to');
    if (fromEl) {
      fromEl.addEventListener('change', function () {
        st.from = this.value;
        App.render();
      });
    }
    if (toEl) {
      toEl.addEventListener('change', function () {
        st.to = this.value;
        App.render();
      });
    }

    if (App.motion) App.motion.enter(root);
  };
})();
