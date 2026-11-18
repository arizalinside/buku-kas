(function () {
  'use strict';

  var App = window.App;
  var ui = App.ui;

  App.views = App.views || {};

  App.views.beranda = function (root) {
    var s = App.store;
    var today = s.todayISO();
    var todayTotals = s.totals(today, today);
    var monthTotals = s.totals(s.monthStartISO(), today);
    var debt = s.debtStats();
    var recent = s.sorted().slice(0, 8);

    var recentHTML = recent.length
      ? recent.map(ui.txRow).join('')
      : ui.empty({
          icon: 'list',
          title: 'Belum ada catatan',
          text: 'Tekan tombol + di kanan bawah untuk mencatat penjualan atau belanja.',
          compact: true
        });

    var remaining = debt.remaining;
    var remainingClass = remaining > 0 ? 'neg' : remaining < 0 ? 'pos' : '';
    var paidPct =
      debt.borrowed > 0 ? Math.min(100, Math.round((debt.paid / debt.borrowed) * 100)) : 0;

    root.innerHTML =
      '<div class="page-head">' +
      '<div><h1>Beranda</h1>' +
      '<p class="sub">Kas toko hari ini</p></div>' +
      '</div>' +

      '<section class="statement">' +
      '<div>' +
      '<p class="statement-label">Uang di toko sekarang</p>' +
      '<p class="statement-value ' + (debt.cash < 0 ? 'neg' : '') + '">' + ui.rupiah(debt.cash) + '</p>' +
      '<p class="statement-note">Pemasukan − belanja − bayar hutang</p>' +
      '</div>' +
      '<dl class="statement-side">' +
      '<div><dt>Masuk hari ini</dt><dd class="pos">' + ui.rupiah(todayTotals.income) + '</dd></div>' +
      '<div><dt>Keluar hari ini</dt><dd class="neg">' + ui.rupiah(todayTotals.expense) + '</dd></div>' +
      '</dl>' +
      '</section>' +

      '<section class="card debt-card">' +
      '<div class="card-head"><h2>Hutang ke uang pribadi</h2>' +
      '<button class="btn btn-ghost btn-sm" id="btn-pay-debt">' + ui.icon('wallet', 14) + ' Bayar hutang</button>' +
      '</div>' +
      '<div class="debt-grid">' +
      '<div><span class="kpi-label">Total pengeluaran</span>' +
      '<strong class="kpi-value">' + ui.rupiah(debt.totalExpense) + '</strong></div>' +
      '<div><span class="kpi-label">Total hutang</span>' +
      '<strong class="kpi-value">' + ui.rupiah(debt.borrowed) + '</strong></div>' +
      '<div><span class="kpi-label">Sudah dibayar</span>' +
      '<strong class="kpi-value pos">' + ui.rupiah(debt.paid) + '</strong></div>' +
      '<div class="kpi-highlight"><span class="kpi-label">Sisa hutang</span>' +
      '<strong class="kpi-value ' + remainingClass + '">' + ui.rupiah(remaining) + '</strong></div>' +
      '</div>' +
      (debt.borrowed > 0
        ? '<div class="bar-track" style="margin-top:16px"><span class="bar-fill good" style="width:' +
          paidPct + '%"></span></div>' +
          '<div class="mini-foot muted">' + paidPct + '% hutang sudah diganti</div>'
        : '') +
      '<p class="note-box" style="margin-top:12px">' +
      'Belanja yang dibayar pakai uang pribadi Anda dicatat sebagai hutang toko. ' +
      'Uang penjualan yang dipakai mengganti dihitung sebagai pembayaran hutang, bukan belanja baru.' +
      '</p>' +
      '</section>' +

      '<section class="card" style="margin-top:14px">' +
      '<div class="card-head"><h2>Catatan terakhir</h2>' +
      '<button class="btn btn-ghost btn-sm" data-route="catatan">Lihat semua</button></div>' +
      '<div class="month-line muted small">Bulan ini: masuk <strong class="pos">' +
      ui.rupiah(monthTotals.income) + '</strong> · keluar <strong class="neg">' +
      ui.rupiah(monthTotals.expense) + '</strong></div>' +
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
  };
})();
