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
    var series = s.chartSeries(from, to);

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

    var hasChart = series.rows.length > 0;
    var summaryHTML = '';
    var rangeText = '';
    var pickIndex = -1;

    if (hasChart) {
      summaryHTML =
        '<div class="chart-summary">' +
        '<div><strong>' + ui.rupiah(series.total) + '</strong><span>total belanja</span></div>' +
        '<div><strong>' + series.daysWithSpending + ' hari</strong><span>ada belanja</span></div>' +
        (series.peak
          ? '<div><strong>' + ui.rupiah(series.peak) + '</strong>' +
            '<span>paling besar · ' + ui.dateShort(series.peakDate) + '</span></div>'
          : '') +
        '</div>';

      var firstRow = series.rows[0];
      var lastRow = series.rows[series.rows.length - 1];
      rangeText =
        ui.dateShort(firstRow.date) + ' – ' + ui.dateShort(lastRow.date);

      // Titik awal yang dibaca: hari terakhir yang ada belanjanya.
      for (var p = series.rows.length - 1; p >= 0; p--) {
        if (series.rows[p].expense > 0) {
          pickIndex = p;
          break;
        }
      }
      if (pickIndex < 0) pickIndex = series.rows.length - 1;
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
      '<p class="chart-note muted small">' +
      (rangeText ? ui.esc(rangeText) + ' · ' : '') +
      (series.clipped
        ? 'menampilkan ' + s.CHART_MAX_DAYS + ' hari terakhir · '
        : '') +
      'garis menunjukkan jumlah belanja tiap hari. Arahkan atau geser jari di atas grafik untuk melihat angka tiap tanggal.</p>' +
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
      summaryHTML +
      (hasChart
        ? '<div class="chart-wrap" id="chart-wrap"></div>' +
          '<div class="chart-detail" id="chart-detail"></div>'
        : ui.empty({
            icon: 'chart',
            title: 'Belum ada belanja di rentang ini',
            text: 'Pilih rentang tanggal lain atau catat belanja pertama Anda.',
            compact: true
          })) +
      '<p class="mini-foot muted">Rentang tanggal mengikuti filter di halaman Catatan, ' +
      'grafik paling jauh ' + s.CHART_MAX_DAYS + ' hari.</p>' +
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

    /* ---------- grafik garis ---------- */

    function rowLabel(row) {
      return ui.dateLabel(row.date);
    }

    function detailHtml(row) {
      var countText = row.count ? row.count + ' catatan' : 'Tidak ada belanja';
      return (
        '<span class="chart-detail-when">' + ui.esc(rowLabel(row)) +
        '<em>' + ui.esc(countText) + '</em></span>' +
        '<strong>' + ui.rupiah(row.expense) + '</strong>'
      );
    }

    function setReadout(index) {
      var detail = document.getElementById('chart-detail');
      if (detail && series.rows[index]) detail.innerHTML = detailHtml(series.rows[index]);
    }

    var chartWrap = document.getElementById('chart-wrap');

    function drawChart() {
      if (!chartWrap) return;

      var width = Math.max(260, Math.round(chartWrap.clientWidth));
      var height = width < 430 ? 176 : 208;
      var padLeft = 50;
      var padRight = 10;
      var padTop = 12;
      var padBottom = 26;
      var plotW = Math.max(20, width - padLeft - padRight);
      var plotH = Math.max(20, height - padTop - padBottom);

      var rows = series.rows;
      var n = rows.length;
      var maxY = series.peak > 0 ? series.peak : 1;

      function xAt(i) {
        return padLeft + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
      }

      function yAt(v) {
        return padTop + plotH - (Math.max(0, Number(v) || 0) / maxY) * plotH;
      }

      var parts = [];

      parts.push(
        '<svg class="chart-svg" id="chart-svg" viewBox="0 0 ' + width + ' ' + height +
        '" width="' + width + '" height="' + height + '" role="img" aria-label="' +
        ui.esc('Grafik belanja ' + rangeText) + '">'
      );

      parts.push(
        '<defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop class="chart-fill-a" offset="0%"/>' +
        '<stop class="chart-fill-b" offset="100%"/>' +
        '</linearGradient></defs>'
      );

      // Garis bantu mendatar dengan label rupiah ringkas.
      [0, 0.5, 1].forEach(function (frac) {
        var y = padTop + plotH - frac * plotH;
        parts.push(
          '<line class="chart-grid" x1="' + padLeft + '" y1="' + y +
          '" x2="' + (padLeft + plotW) + '" y2="' + y + '"/>'
        );
        if (series.peak > 0) {
          parts.push(
            '<text class="chart-axis-label" x="' + (padLeft - 6) + '" y="' + (y + 3) +
            '" text-anchor="end">' + ui.esc(ui.rupiahShort(frac * maxY)) + '</text>'
          );
        }
      });

      var line = '';
      rows.forEach(function (row, i) {
        line += (i ? 'L' : 'M') + xAt(i) + ' ' + yAt(row.expense);
      });

      if (n > 1) {
        var area =
          line +
          'L' + xAt(n - 1) + ' ' + (padTop + plotH) +
          'L' + xAt(0) + ' ' + (padTop + plotH) + 'Z';
        parts.push('<path class="chart-area" d="' + area + '"/>');
      }

      parts.push('<path class="chart-line" d="' + line + '"/>');

      if (n === 1) {
        parts.push(
          '<circle class="chart-dot" cx="' + xAt(0) + '" cy="' + yAt(rows[0].expense) + '" r="4"/>'
        );
      }

      // Label tanggal: beberapa saja supaya tidak berdesakan.
      var maxLabels = Math.max(2, Math.floor(plotW / 78));
      var step = Math.max(1, Math.ceil(n / maxLabels));
      var lastX = -999;

      rows.forEach(function (row, i) {
        var isEdge = i === 0 || i === n - 1;
        if (i % step !== 0 && !isEdge) return;

        var x = xAt(i);
        if (!isEdge && x - lastX < 52) return;
        if (i === n - 1 && x - lastX < 30) return;
        lastX = x;

        var anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';

        parts.push(
          '<text class="chart-axis-label" x="' + x + '" y="' + (height - 8) +
          '" text-anchor="' + anchor + '">' + ui.esc(ui.dateShort(row.date)) + '</text>'
        );
      });

      parts.push(
        '<line class="chart-cursor" id="chart-cursor" x1="0" y1="' + padTop +
        '" x2="0" y2="' + (padTop + plotH) + '" style="display:none"/>'
      );
      parts.push(
        '<circle class="chart-dot" id="chart-dot" cx="0" cy="0" r="4" style="display:none"/>'
      );
      parts.push('</svg>');
      parts.push('<div class="chart-tip" id="chart-tip" hidden></div>');

      chartWrap.innerHTML = parts.join('');

      var svgEl = document.getElementById('chart-svg');
      var cursorEl = document.getElementById('chart-cursor');
      var dotEl = document.getElementById('chart-dot');
      var tipEl = document.getElementById('chart-tip');
      var active = -1;

      function showAt(index, withTip) {
        if (!rows[index]) return;
        active = index;

        var x = xAt(index);
        var y = yAt(rows[index].expense);

        cursorEl.setAttribute('x1', x);
        cursorEl.setAttribute('x2', x);
        cursorEl.style.display = '';

        dotEl.setAttribute('cx', x);
        dotEl.setAttribute('cy', y);
        dotEl.style.display = '';

        setReadout(index);

        if (!withTip) {
          tipEl.hidden = true;
          return;
        }

        var row = rows[index];
        tipEl.innerHTML =
          '<strong>' + ui.esc(rowLabel(row)) + '</strong>' +
          '<span class="chart-tip-value">' + ui.rupiah(row.expense) + '</span>' +
          '<span class="chart-tip-sub">' +
          ui.esc(row.count ? row.count + ' catatan' : 'Tidak ada belanja') + '</span>';
        tipEl.hidden = false;

        var tipW = 132;
        var left = Math.min(Math.max(x, tipW / 2 + 2), width - tipW / 2 - 2);
        tipEl.style.left = left + 'px';
        tipEl.style.top = Math.max(0, y - 12) + 'px';
      }

      function hideTip() {
        if (cursorEl) cursorEl.style.display = 'none';
        if (dotEl) dotEl.style.display = 'none';
        if (tipEl) tipEl.hidden = true;
      }

      function nearestIndex(clientX) {
        var rect = svgEl.getBoundingClientRect();
        var scale = rect.width ? width / rect.width : 1;
        var x = (clientX - rect.left) * scale;
        var t = (x - padLeft) / (plotW || 1);
        return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
      }

      // Ikuti kursor tanpa perlu klik: menggerakkan mouse di atas grafik atau
      // menggeser jari di layar sentuh membuat garis dan angkanya ikut bergerak.
      // Pendengar dipasang di wadah grafik, jadi seluruh bidang terbaca, bukan
      // hanya tepat di atas garisnya.
      var dragging = false;

      chartWrap.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch' && !dragging) return;
        showAt(nearestIndex(e.clientX), true);
      });

      chartWrap.addEventListener('pointerdown', function (e) {
        dragging = true;
        if (typeof chartWrap.setPointerCapture === 'function') {
          try {
            chartWrap.setPointerCapture(e.pointerId);
          } catch (err) {
            /* browser lama: tanpa penangkapan tetap jalan */
          }
        }
        showAt(nearestIndex(e.clientX), true);
      });

      chartWrap.addEventListener('pointerup', function () {
        dragging = false;
      });

      chartWrap.addEventListener('pointercancel', function () {
        dragging = false;
      });

      chartWrap.addEventListener('pointerleave', function (e) {
        if (dragging || e.pointerType === 'touch') return;
        if (pickIndex >= 0) showAt(pickIndex, false);
        else hideTip();
      });

      chartWrap.setAttribute('tabindex', '0');
      chartWrap.setAttribute('role', 'application');
      chartWrap.setAttribute('aria-label', 'Grafik belanja. Panah kiri dan kanan untuk berpindah tanggal.');
      chartWrap.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var next;
        if (active < 0) next = e.key === 'ArrowRight' ? 0 : n - 1;
        else next = active + (e.key === 'ArrowRight' ? 1 : -1);
        showAt(Math.max(0, Math.min(n - 1, next)), true);
      });

      showAt(pickIndex >= 0 ? pickIndex : n - 1, false);
    }

    if (chartWrap) {
      drawChart();

      if (App._chartResize) window.removeEventListener('resize', App._chartResize);

      var resizeTimer = null;
      App._chartResize = function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          if (!document.getElementById('chart-wrap')) return;
          drawChart();
        }, 180);
      };
      window.addEventListener('resize', App._chartResize);
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

    // Animasi: kartu masuk, angka utama, dan progress bar hutang.
    var motion = App.motion;
    if (motion) {
      motion.enter(root);
      motion.countUp(document.getElementById('debt-remaining'), remaining, ui.rupiah);
      motion.progress(document.getElementById('debt-progress'), paidPct);
    }
  };
})();
