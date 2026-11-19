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

  function state() {
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

  App.saveListState = function () {
    try {
      localStorage.setItem('kasbuku.list.v1', JSON.stringify(state()));
    } catch (e) {
      /* diabaikan */
    }
  };

  App.views.catatan = function (root) {
    var s = App.store;
    var st = state();

    root.innerHTML =
      '<div class="page-head">' +
      '<div><h1>Catatan</h1>' +
      '<p class="sub">Semua belanja dan pembayaran hutang</p></div>' +
      '</div>' +
      '<div class="card">' +
      '<div class="toolbar">' +
      '<div class="search">' +
      '<span class="search-icon">' + ui.icon('search', 16) + '</span>' +
      '<input id="tx-search" type="search" placeholder="Cari belanja atau kategori, mis. minyak" />' +
      '</div>' +
      '<div class="toolbar-right">' +
      '<select id="per-page" class="input" aria-label="Jumlah per halaman">' +
      s.PER_PAGE_OPTIONS.map(function (n) {
        return '<option value="' + n + '"' + (n === st.perPage ? ' selected' : '') + '>' + n + ' per halaman</option>';
      }).join('') +
      '</select>' +
      '</div>' +
      '</div>' +

      '<div class="chips" id="range-chips">' +
      RANGES.map(function (r) {
        return '<button type="button" class="chip' + (r.value === st.range ? ' active' : '') +
          '" data-range="' + r.value + '">' + r.label + '</button>';
      }).join('') +
      '</div>' +

      '<div class="chips" id="type-chips">' +
      [{ v: 'all', l: 'Semua' }, { v: 'expense', l: 'Belanja' }, { v: 'debt_payment', l: 'Bayar hutang' }]
        .map(function (t) {
          return '<button type="button" class="chip' + (t.v === st.type ? ' active' : '') +
            '" data-type="' + t.v + '">' + t.l + '</button>';
        }).join('') +
      '</div>' +

      '<div class="custom-range hidden" id="custom-range">' +
      '<label class="small muted" for="from-date">Dari</label>' +
      '<input type="date" id="from-date" class="input" />' +
      '<label class="small muted" for="to-date">Sampai</label>' +
      '<input type="date" id="to-date" class="input" />' +
      '</div>' +

      '<div id="list-area"></div>' +
      '</div>';

    var searchEl = document.getElementById('tx-search');
    var perPageEl = document.getElementById('per-page');
    var fromEl = document.getElementById('from-date');
    var toEl = document.getElementById('to-date');

    searchEl.value = st.q || '';
    fromEl.value = st.from || '';
    toEl.value = st.to || '';
    if (st.range === 'custom') document.getElementById('custom-range').classList.remove('hidden');

    function paint() {
      var res = s.filterTransactions({
        range: st.range,
        from: st.from,
        to: st.to,
        type: st.type,
        q: st.q,
        page: st.page,
        perPage: st.perPage
      });

      st.page = res.page;

      var area = document.getElementById('list-area');
      if (!area) return;

      var summary =
        '<div class="summary-line">' +
        '<span>Menampilkan <strong>' + res.from + '–' + res.to + '</strong> dari <strong>' +
        res.total + '</strong> catatan</span>' +
        '<span>Belanja <strong class="neg">' + ui.rupiah(res.sum.expense) + '</strong></span>' +
        (res.sum.paid ? '<span>Bayar hutang <strong class="pay">' + ui.rupiah(res.sum.paid) + '</strong></span>' : '') +
        '</div>';

      var body = res.items.length
        ? '<div class="tx-list">' + res.items.map(ui.txRow).join('') + '</div>'
        : ui.empty({
            icon: 'list',
            title: 'Tidak ada catatan',
            text: 'Coba ubah tanggal atau kata pencarian.',
            compact: true
          });

      var pager = res.total
        ? '<div class="pager">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-page="prev"' +
          (res.page <= 1 ? ' disabled' : '') + '>‹ Sebelumnya</button>' +
          '<span class="pager-info">Halaman <strong>' + res.page + '</strong> dari ' + res.pages + '</span>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-page="next"' +
          (res.page >= res.pages ? ' disabled' : '') + '>Berikutnya ›</button>' +
          '</div>'
        : '';

      area.innerHTML = summary + body + pager;
    }

    paint();

    searchEl.addEventListener('input', function () {
      st.q = this.value;
      st.page = 1;
      paint();
    });

    perPageEl.addEventListener('change', function () {
      st.perPage = Number(this.value);
      st.page = 1;
      s.setPerPage(st.perPage);
      App.saveListState();
      paint();
    });

    root.querySelectorAll('#range-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        st.range = chip.getAttribute('data-range');
        st.page = 1;
        root.querySelectorAll('#range-chips .chip').forEach(function (c) {
          c.classList.toggle('active', c === chip);
        });
        document.getElementById('custom-range').classList.toggle('hidden', st.range !== 'custom');
        App.saveListState();
        paint();
      });
    });

    root.querySelectorAll('#type-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        st.type = chip.getAttribute('data-type');
        st.page = 1;
        root.querySelectorAll('#type-chips .chip').forEach(function (c) {
          c.classList.toggle('active', c === chip);
        });
        App.saveListState();
        paint();
      });
    });

    fromEl.addEventListener('change', function () {
      st.from = this.value;
      st.page = 1;
      App.saveListState();
      paint();
    });

    toEl.addEventListener('change', function () {
      st.to = this.value;
      st.page = 1;
      App.saveListState();
      paint();
    });

    document.getElementById('list-area').addEventListener('click', function (e) {
      var row = e.target.closest('[data-tx]');
      if (row) {
        App.openTransactionForm(row.getAttribute('data-tx'));
        return;
      }
      var pagerBtn = e.target.closest('[data-page]');
      if (pagerBtn && !pagerBtn.disabled) {
        st.page += pagerBtn.getAttribute('data-page') === 'next' ? 1 : -1;
        paint();
      }
    });
    if (App.motion) App.motion.enter(root);
  };

  /* ---------- menu tambah ---------- */

  App.openAddMenu = function () {
    ui.modal({
      title: 'Catat apa?',
      body:
        '<div class="choose-list">' +
        '<button type="button" class="choose-item" data-new="expense">' +
        '<span class="choose-icon out">' + ui.icon('arrow-down', 18) + '</span>' +
        '<span class="choose-main"><strong>Belanja</strong><span>Barang yang dibeli</span></span>' +
        '</button>' +
        '<button type="button" class="choose-item" data-new="debt_payment">' +
        '<span class="choose-icon pay">' + ui.icon('wallet', 18) + '</span>' +
        '<span class="choose-main"><strong>Bayar hutang</strong><span>Ganti uang pribadi</span></span>' +
        '</button>' +
        '</div>',
      actions: [{ label: 'Batal', variant: 'ghost' }],
      onMount: function (root) {
        root.querySelectorAll('[data-new]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var type = btn.getAttribute('data-new');
            ui.closeModal();
            App.openTransactionForm(null, type);
          });
        });
      }
    });
  };

  /* ---------- form tambah / ubah ---------- */

  App.openTransactionForm = function (id, presetType) {
    var s = App.store;

    if (!id && !presetType) {
      App.openAddMenu();
      return;
    }

    var tx = id ? s.byId(id) : null;
    var type = tx ? tx.type : presetType || 'expense';
    var isExpense = type === 'expense';

    var title = tx ? 'Ubah catatan' : isExpense ? 'Belanja' : 'Bayar hutang';
    var noteValue = tx
      ? tx.note
      : isExpense
        ? ''
        : 'Bayar hutang ke uang pribadi';
    var funding = tx && tx.funding === 'business' ? 'business' : 'personal';

    var body =
      '<form class="form" id="tx-form">' +
      '<div class="field"><label for="tx-note">' +
      (isExpense ? 'Beli apa?' : 'Keterangan') +
      '</label>' +
      '<input id="tx-note" autocomplete="off" placeholder="' +
      (isExpense ? 'mis. minyak goreng 2 liter' : 'mis. bayar hutang mingguan') +
      '" value="' + ui.esc(noteValue) + '" /></div>' +

      '<div class="field"><label for="tx-amount">Jumlah</label>' +
      '<div class="amount-input"><span>Rp</span>' +
      '<input id="tx-amount" inputmode="numeric" autocomplete="off" placeholder="0" value="' +
      (tx ? ui.formatAmountInput(tx.amount) : '') + '" /></div></div>' +

      '<div class="field"><label for="tx-date">Tanggal</label>' +
      '<div class="date-wrap">' +
      '<input type="date" id="tx-date" aria-label="Tanggal" value="' +
      (tx ? tx.date : s.todayISO()) + '" />' +
      '<span class="date-text" id="tx-date-text" aria-hidden="true"></span>' +
      '</div></div>' +

      (isExpense
        ? '<div class="field"><label>Dibayar pakai uang apa?</label>' +
          '<div class="segmented" id="funding-seg">' +
          '<button type="button" class="seg' + (funding === 'personal' ? ' active' : '') +
          '" data-funding="personal">Uang pribadi</button>' +
          '<button type="button" class="seg' + (funding === 'business' ? ' active' : '') +
          '" data-funding="business">Uang toko</button>' +
          '</div>' +
          '<p class="hint" id="funding-hint"></p></div>' +
          '<div class="field"><label for="tx-category">Kategori (opsional)</label>' +
          '<input id="tx-category" list="tx-cat-list" autocomplete="off" placeholder="mis. Bahan Baku" value="' +
          ui.esc(tx && tx.category ? tx.category : '') + '" />' +
          '<datalist id="tx-cat-list">' +
          (s.categories().length ? s.categories() : ['Bahan Baku', 'Bumbu', 'Perlengkapan'])
            .map(function (c) {
              return '<option value="' + ui.esc(c) + '"></option>';
            })
            .join('') +
          '</datalist></div>'
        : '') +

      '<p class="hint" id="tx-hint"></p>' +
      '</form>';

    ui.modal({
      title: title,
      body: body,
      actions: tx
        ? [
            {
              label: 'Hapus',
              variant: 'ghost',
              onClick: function (close, btn) {
                var sure = document.createElement('button');
                sure.type = 'button';
                sure.className = 'btn btn-danger';
                sure.textContent = 'Yakin hapus?';
                sure.addEventListener('click', function () {
                  s.deleteTransaction(tx.id);
                  close();
                  ui.toast('Catatan dihapus.');
                  App.render();
                });
                btn.parentNode.replaceChild(sure, btn);
              }
            },
            { label: 'Batal', variant: 'ghost' },
            {
              label: 'Simpan',
              variant: 'primary',
              onClick: function (close) {
                submit(close, type, funding);
              }
            }
          ]
        : [
            { label: 'Batal', variant: 'ghost' },
            {
              label: 'Simpan',
              variant: 'primary',
              onClick: function (close) {
                submit(close, type, funding);
              }
            }
          ],
      onMount: function () {
        var dateEl = document.getElementById('tx-date');
        var dateText = document.getElementById('tx-date-text');

        function syncDateText() {
          if (dateText) dateText.textContent = ui.dateLabel(dateEl.value);
        }

        if (dateEl) {
          syncDateText();
          dateEl.addEventListener('change', syncDateText);
          dateEl.addEventListener('input', syncDateText);
          dateEl.addEventListener('click', function () {
            if (typeof dateEl.showPicker === 'function') {
              try {
                dateEl.showPicker();
              } catch (e) {
                /* browser lama: pemilih tetap terbuka lewat input */
              }
            }
          });
        }

        var amountEl = document.getElementById('tx-amount');
        amountEl.addEventListener('input', function () {
          this.value = ui.formatAmountInput(this.value);
        });

        var seg = document.getElementById('funding-seg');
        if (seg) {
          seg.querySelectorAll('.seg').forEach(function (btn) {
            btn.addEventListener('click', function () {
              funding = btn.getAttribute('data-funding');
              seg.querySelectorAll('.seg').forEach(function (b) {
                b.classList.toggle('active', b === btn);
              });
              updateFundingHint();
            });
          });
        }

        updateFundingHint();

        [document.getElementById('tx-note'), amountEl].forEach(function (el) {
          if (!el) return;
          el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit(ui.closeModal, type, funding);
            }
          });
        });
      }
    });

    function updateFundingHint() {
      var hint = document.getElementById('funding-hint');
      if (!hint) return;
      hint.textContent =
        funding === 'personal'
          ? 'Dicatat sebagai hutang toko ke uang pribadi Anda.'
          : 'Dibayar dari uang toko, tidak menambah hutang.';
    }

    function submit(close, txType, txFunding) {
      var note = document.getElementById('tx-note').value.trim();
      var amount = ui.parseAmount(document.getElementById('tx-amount').value);
      var date = document.getElementById('tx-date').value || s.todayISO();

      if (!note) {
        ui.toast(txType === 'expense' ? 'Isi dulu belinya apa.' : 'Isi keterangannya dulu.');
        return;
      }
      if (!amount || amount <= 0) {
        ui.toast('Jumlah harus lebih dari nol.');
        return;
      }

      var payload = {
        type: txType,
        amount: amount,
        date: date,
        note: note,
        funding: txType === 'expense' ? txFunding : undefined,
        category: txType === 'expense' ? document.getElementById('tx-category').value || '' : ''
      };

      if (tx) {
        s.updateTransaction(tx.id, payload);
        ui.toast('Catatan diperbarui.');
      } else {
        s.addTransaction(payload);
        ui.toast('Catatan tersimpan.');
      }

      close();
      App.render();
    }
  };
})();
