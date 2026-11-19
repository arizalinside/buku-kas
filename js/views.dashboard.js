(function () {
  'use strict';

  var App = window.App;
  var ui = App.ui;

  App.views = App.views || {};

  var RANGES = [
    { value: 'today', label: 'Hari ini' },
    { value: 'yesterday', label: 'Kemarin' },
    { value: '7d', label: '7 hari' },
    { value: '30d', label: '30 hari' },
    { value: 'month', label: 'Bulan ini' },
    { value: 'all', label: 'Semua' },
    { value: 'custom', label: 'Pilih tanggal' }
  ];

  function listState() {
    if (!App.listState) {
      App.listState = {
        range: 'month',
        type: 'all',
        q: '',
        page: 1,
        perPage: App.store.perPage(),
        from: '',
        to: ''
      };
    }
    return App.listState;
  }

  App.views.beranda = function (root) {
    var s = App.store;
    var st = listState();
    var today = s.todayISO();
    var todayTotals = s.totals(today, today);
    var monthTotals = s.totals(s.monthStartISO(), today);
    var debt = s.debtStats();
    var recent = s.sorted().slice(0, 8);

    var dates = s.rangeDates(st.range, st.from, st.to);
    var from = st.range === 'all' ? '' : dates.from;
    var to = st.range === 'all' ? '' : dates.to;
    var series = s.chartTotals(from, to, 14);

    var remaining = debt.remaining;
    var remainingClass = remaining > 0 ? 'neg' : remaining < 0 ? 'pos' : '';
    var paidPct =
      debt.borrowed > 0 ? Math.min(100, Math.round((debt.paid / debt.borrowed) * 100)) : 0;

    var recentHTML = recent.length
      ? recent.map(ui.txRow).join('')
      : ui.empty({
          icon: 'list',
          title: 'Belum ada catatan',
          text: 'Tekan tombol + di kanan bawah untuk mencatat belanja.',
          compact: true
        });

    var chartHTML = '';
    if (series.length) {
      var max = 1;
      series.forEach(function (r) {
        max = Math.max(max, r.expense);
      });

      chartHTML =
        '<div class="chart" id="chart">' +
        series
          .map(function (r) {
            var h = r.expense ? Math.max(3, Math.round((r.expense / max) * 100)) : 0;
            return (
              '<div class="chart-col" tabindex="0">' +
              '<span class="chart-tip">' +
              '<strong>' + ui.dateLabel(r.date) + '</strong>' +
              '<span class="tip-out">Belanja ' + ui.rupiah(r.expense) + '</span>' +
              '</span>' +
              '<div class="chart-bars solo">' +
              '<span class="chart-bar out" style="height:' + h + '%"></span>' +
              '</div>' +
              '<span class="chart-label">' + ui.dateTick(r.date) + '</span>' +
              '</div>'
            );
          })
          .join('') +
        '</div>';
    } else {
      chartHTML = ui.empty({
        icon: 'chart',
        title: 'Belum ada belanja di rentang ini',
        text: 'Pilih rentang tanggal lain atau catat belanja pertama Anda.',
        compact: true
      });
    }

    root.innerHTML =
      '<div class="page-head">' +
      '<div><h1>Beranda</h1>' +
      '<p class="sub">Sisa hutang dan belanja toko</p></div>' +
      '</div>' +

      '<section class="card debt-card">' +
      '<div class="card-head"><h2>Hutang ke uang pribadi</h2>' +
      '<button class="btn btn-ghost btn-sm" id="btn-pay-debt">' + ui.icon('wallet', 14) + ' Bayar hutang</button>' +
      '</div>' +
      '<div class="debt-main">' +
      '<span class="kpi-label">Sisa hutang</span>' +
      '<strong class="debt-remaining ' + remainingClass + '" id="debt-remaining"></strong>' +
      '</div>' +
      '<div class="debt-grid">' +
      '<div><span class="kpi-label">Total hutang</span>' +
      '<strong class="kpi-value">' + ui.rupiah(debt.borrowed) + '</strong></div>' +
      '<div><span class="kpi-label">Sudah dibayar</span>' +
      '<strong class="kpi-value pos">' + ui.rupiah(debt.paid) + '</strong></div>' +
      '</div>' +
      (debt.borrowed > 0
        ? '<div class="bar-track" style="margin-top:16px" role="progressbar" ' +
          'aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + paidPct + '" ' +
          'aria-label="Hutang yang sudah dibayar">' +
          '<span class="bar-fill good" id="debt-progress" style="width:0%"></span>' +
          '</div>' +
          '<div class="mini-foot muted"><strong>' + paidPct + '%</strong> hutang sudah dibayar</div>'
        : '') +
      '<p class="note-box" style="margin-top:12px">' +
      'Belanja yang dibayar pakai uang pribadi Anda dicatat sebagai hutang toko. ' +
      'Uang penjualan yang dipakai mengganti dihitung sebagai pembayaran hutang, bukan belanja baru.' +
      '</p>' +
      '</section>' +

      '<div class="today">' +
      '<div><span class="today-label">Belanja hari ini</span>' +
      '<strong class="today-value neg">' + ui.rupiah(todayTotals.expense) + '</strong></div>' +
      '<div><span class="today-label">Bayar hutang hari ini</span>' +
      '<strong class="today-value pay">' + ui.rupiah(todayTotals.paid) + '</strong></div>' +
      '</div>' +

      '<section class="card chart-card">' +
      '<div class="card-head"><h2>Belanja per tanggal</h2></div>' +
      '<div class="chips" id="chart-ranges">' +
      RANGES.map(function (r) {
        return '<button type="button" class="chip' + (r.value === st.range ? ' active' : '') +
          '" data-chart-range="' + r.value + '">' + r.label + '</button>';
      }).join('') +
      '</div>' +
      '<div class="custom-range' + (st.range === 'custom' ? '' : ' hidden') + '" id="chart-custom">' +
      '<label class="small muted" for="chart-from">Dari</label>' +
      '<input type="date" id="chart-from" class="input" value="' + ui.esc(st.from) + '" />' +
      '<label class="small muted" for="chart-to">Sampai</label>' +
      '<input type="date" id="chart-to" class="input" value="' + ui.esc(st.to) + '" />' +
      '</div>' +
      chartHTML +
      '<p class="mini-foot muted">Rentang tanggal sama dengan filter di halaman Catatan.</p>' +
      '</section>' +

      '<section class="card" style="margin-top:14px">' +
      '<div class="card-head"><h2>Catatan terakhir</h2>' +
      '<button class="btn btn-ghost btn-sm" data-route="catatan">Lihat semua</button></div>' +
      '<div class="month-line muted small">Bulan ini: belanja <strong class="neg">' +
      ui.rupiah(monthTotals.expense) + '</strong>' +
      (monthTotals.paid ? ' · bayar hutang <strong class="pay">' + ui.rupiah(monthTotals.paid) + '</strong>' : '') +
      '</div>' +
      '<div id="recent-list">' + recentHTML + '</div>' +
      '</section>';

    var payBtn = document.getElementById('btn-pay-debt');
    if (payBtn) {
      payBtn.addEventListener('click', function () {
        App.openTransactionForm(null, 'debt_payment');
      });
    }

    var list = document.getElementById('recent-list');
    if (list) {
      list.addEventListener('click', function (e) {
        var row = e.target.closest('[data-tx]');
        if (row) App.openTransactionForm(row.getAttribute('data-tx'));
      });
    }

    var chartEl = document.getElementById('chart');
    if (chartEl) {
      chartEl.addEventListener('click', function (e) {
        var col = e.target.closest('.chart-col');
        var active = chartEl.querySelectorAll('.chart-col.is-active');
        active.forEach(function (c) {
          c.classList.remove('is-active');
        });
        if (col && !col.classList.contains('is-active')) {
          col.classList.add('is-active');
        }
      });
    }

    root.querySelectorAll('#chart-ranges .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        st.range = chip.getAttribute('data-chart-range');
        st.page = 1;
        App.saveListState();
        App.render();
      });
    });

    var chartFrom = document.getElementById('chart-from');
    var chartTo = document.getElementById('chart-to');
    if (chartFrom) {
      chartFrom.addEventListener('change', function () {
        st.from = this.value;
        st.page = 1;
        App.saveListState();
        App.render();
      });
    }
    if (chartTo) {
      chartTo.addEventListener('change', function () {
        st.to = this.value;
        st.page = 1;
        App.saveListState();
        App.render();
      });
    }

    // Animasi: angka utama, batang grafik, dan progress bar hutang.
    var motion = App.motion;
    if (motion) {
      motion.enter(root);
      motion.countUp(document.getElementById('debt-remaining'), remaining, ui.rupiah);
      motion.bars('#chart .chart-bar');
      motion.progress(document.getElementById('debt-progress'), paidPct);
    }
  };
})();
