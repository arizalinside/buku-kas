(function () {
  'use strict';

  var App = (window.App = window.App || {});

  var DATA_KEY = 'kasbuku.data.v1';
  var VERSION = 3;

  var TYPES = [
    { value: 'income', label: 'Uang masuk' },
    { value: 'expense', label: 'Uang keluar' },
    { value: 'debt_payment', label: 'Bayar hutang' }
  ];

  var PER_PAGE_OPTIONS = [10, 25, 50, 100];

  var state = null;

  /* ---------- utilitas tanggal (WIB) ---------- */

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function todayISO() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) {
        map[p.type] = p.value;
      });
      return map.year + '-' + map.month + '-' + map.day;
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
  }

  function isDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  }

  function shiftDate(dateStr, days) {
    var d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function daysAgoISO(n) {
    return shiftDate(todayISO(), -n);
  }

  function monthStartISO() {
    return todayISO().slice(0, 8) + '01';
  }

  function uid(prefix) {
    return (
      (prefix || 'id') +
      '_' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  /* ---------- bentuk data ---------- */

  function defaults() {
    return {
      version: VERSION,
      transactions: [],
      settings: { perPage: 25 }
    };
  }

  // Menerima data versi lama (buku/akun/pindah dana) dan menyederhanakannya
  // menjadi kas toko: hanya uang masuk, uang keluar, dan bayar hutang.
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return defaults();

    var out = defaults();
    if (raw.settings && PER_PAGE_OPTIONS.indexOf(Number(raw.settings.perPage)) !== -1) {
      out.settings.perPage = Number(raw.settings.perPage);
    }

    var list = Array.isArray(raw.transactions) ? raw.transactions : [];

    list.forEach(function (t) {
      var mapped;
      if (t.type === 'income') mapped = 'income';
      else if (t.type === 'expense') mapped = 'expense';
      else if (t.type === 'debt_payment') mapped = 'debt_payment';
      else return; // transfer / prive / modal / tidak dikenal: dilewati

      var tx = {
        id: t.id || uid('tx'),
        date: isDate(t.date) ? t.date : todayISO(),
        type: mapped,
        amount: Math.round(Number(t.amount) || 0),
        note: String(t.note || '').trim(),
        createdAt: t.createdAt || Date.now()
      };

      if (mapped === 'expense') {
        tx.funding = t.funding === 'business' ? 'business' : 'personal';
      }
      if (t.category) tx.category = String(t.category).trim().slice(0, 40);
      if (t.qty != null && t.qty !== '') tx.qty = t.qty;
      if (t.unit) tx.unit = String(t.unit).trim().slice(0, 20);
      if (t.unitPrice) tx.unitPrice = Math.round(Number(t.unitPrice) || 0);

      if (tx.amount > 0) out.transactions.push(tx);
    });

    // Saldo awal dari versi lama dijadikan uang masuk pertama.
    if (Array.isArray(raw.accounts) && raw.accounts.length) {
      var opening = raw.accounts.reduce(function (sum, a) {
        return sum + Math.round(Number(a.openingBalance) || 0);
      }, 0);
      if (opening > 0) {
        out.transactions.push({
          id: uid('tx'),
          date: todayISO(),
          type: 'income',
          amount: opening,
          note: 'Saldo awal',
          createdAt: Date.now()
        });
      }
    }

    return out;
  }

  /* ---------- penyimpanan ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (raw) {
        state = normalize(JSON.parse(raw));
        save();
        return state;
      }
    } catch (e) {
      console.warn('Buku Uang: gagal membaca data', e);
    }
    state = defaults();
    save();
    return state;
  }

  function save() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Buku Uang: gagal menyimpan data', e);
      return false;
    }
  }

  function ensure() {
    if (!state) load();
    return state;
  }

  function snapshot() {
    return ensure();
  }

  function replaceAll(data) {
    if (!data || !Array.isArray(data.transactions)) return false;
    state = normalize(data);
    save();
    return true;
  }

  function resetAll() {
    state = defaults();
    save();
  }

  /* ---------- transaksi ---------- */

  function transactions() {
    return ensure().transactions;
  }

  function sorted() {
    return transactions()
      .slice()
      .sort(function (a, b) {
        if (a.date === b.date) return (b.createdAt || 0) - (a.createdAt || 0);
        return a.date < b.date ? 1 : -1;
      });
  }

  function byId(id) {
    var list = transactions();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function addTransaction(data) {
    ensure();
    var type = data.type === 'income' || data.type === 'debt_payment' ? data.type : 'expense';
    var tx = {
      id: uid('tx'),
      date: isDate(data.date) ? data.date : todayISO(),
      type: type,
      amount: Math.round(Number(data.amount) || 0),
      note: String(data.note || '').trim(),
      createdAt: Date.now()
    };
    if (type === 'expense') {
      tx.funding = data.funding === 'business' ? 'business' : 'personal';
      if (data.category) tx.category = String(data.category).trim().slice(0, 40);
    }
    if (tx.amount <= 0) return null;
    state.transactions.push(tx);
    save();
    return tx;
  }

  function updateTransaction(id, data) {
    ensure();
    var tx = byId(id);
    if (!tx) return null;

    var type = data.type === 'income' || data.type === 'debt_payment' ? data.type : 'expense';
    tx.type = type;
    tx.date = isDate(data.date) ? data.date : tx.date;
    tx.amount = Math.round(Number(data.amount) || 0);
    tx.note = String(data.note || '').trim();
    if (type === 'expense') {
      tx.funding = data.funding === 'business' ? 'business' : 'personal';
      if (data.category) tx.category = String(data.category).trim().slice(0, 40);
      else delete tx.category;
    } else {
      delete tx.funding;
      delete tx.category;
    }

    save();
    return tx;
  }

  function deleteTransaction(id) {
    ensure();
    state.transactions = transactions().filter(function (t) {
      return t.id !== id;
    });
    save();
  }

  function clearTransactions() {
    ensure();
    state.transactions = [];
    save();
  }

  function typeLabel(type) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].value === type) return TYPES[i].label;
    return 'Catatan';
  }

  /* ---------- hitungan ---------- */

  function totals(from, to) {
    var income = 0;
    var expense = 0;
    var paid = 0;

    transactions().forEach(function (t) {
      if (from && t.date < from) return;
      if (to && t.date > to) return;
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'debt_payment') paid += t.amount;
    });

    return { income: income, expense: expense, paid: paid, net: income - expense - paid };
  }

  // Ringkasan hutang ke uang pribadi pemilik.
  function debtStats() {
    var totalExpense = 0;
    var borrowed = 0;
    var paid = 0;
    var income = 0;
    var cashExpense = 0;

    transactions().forEach(function (t) {
      if (t.type === 'income') {
        income += t.amount;
        return;
      }
      if (t.type === 'debt_payment') {
        paid += t.amount;
        return;
      }
      if (t.type === 'expense') {
        totalExpense += t.amount;
        if (t.funding === 'business') cashExpense += t.amount;
        else borrowed += t.amount;
      }
    });

    return {
      totalExpense: totalExpense,
      borrowed: borrowed,
      paid: paid,
      remaining: borrowed - paid,
      income: income,
      cash: income - cashExpense - paid
    };
  }

  function balance() {
    return debtStats().cash;
  }

  /* ---------- rentang tanggal ---------- */

  function rangeDates(range, customFrom, customTo) {
    var today = todayISO();
    switch (range) {
      case 'today':
        return { from: today, to: today };
      case 'yesterday': {
        var y = daysAgoISO(1);
        return { from: y, to: y };
      }
      case '7d':
        return { from: daysAgoISO(6), to: today };
      case '30d':
        return { from: daysAgoISO(29), to: today };
      case 'month':
        return { from: monthStartISO(), to: today };
      case 'custom':
        return {
          from: isDate(customFrom) ? customFrom : '',
          to: isDate(customTo) ? customTo : ''
        };
      default:
        return { from: '', to: '' };
    }
  }

  /* ---------- daftar berhalaman ---------- */

  function filterTransactions(opts) {
    opts = opts || {};

    var dates = rangeDates(opts.range, opts.from, opts.to);
    var type = opts.type || 'all';
    var q = String(opts.q || '').toLowerCase().trim();
    var perPage = PER_PAGE_OPTIONS.indexOf(Number(opts.perPage)) !== -1 ? Number(opts.perPage) : 25;

    var list = sorted().filter(function (t) {
      if (opts.range && opts.range === 'custom') {
        if (opts.from && t.date < opts.from) return false;
        if (opts.to && t.date > opts.to) return false;
      } else if (opts.range && opts.range !== 'all') {
        if (dates.from && t.date < dates.from) return false;
        if (dates.to && t.date > dates.to) return false;
      }

      if (type !== 'all' && t.type !== type) return false;

      if (q) {
        var hay = (t.note + ' ' + t.amount + ' ' + typeLabel(t.type) + ' ' + (t.category || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }

      return true;
    });

    var total = list.length;
    var pages = Math.max(1, Math.ceil(total / perPage));
    var page = Math.min(Math.max(1, parseInt(opts.page, 10) || 1), pages);

    var sum = { income: 0, expense: 0, paid: 0 };
    list.forEach(function (t) {
      if (t.type === 'income') sum.income += t.amount;
      else if (t.type === 'expense') sum.expense += t.amount;
      else if (t.type === 'debt_payment') sum.paid += t.amount;
    });

    return {
      items: list.slice((page - 1) * perPage, page * perPage),
      total: total,
      page: page,
      pages: pages,
      perPage: perPage,
      from: (page - 1) * perPage + (total ? 1 : 0),
      to: Math.min(page * perPage, total),
      sum: sum
    };
  }

  function categories() {
    var seen = {};
    var out = [];
    transactions().forEach(function (t) {
      if (!t.category || seen[t.category]) return;
      seen[t.category] = true;
      out.push(t.category);
    });
    return out.sort();
  }

  function categoryTotals(from, to) {
    var map = {};
    transactions().forEach(function (t) {
      if (t.type !== 'expense') return;
      if (from && t.date < from) return;
      if (to && t.date > to) return;
      var key = t.category || 'Tanpa kategori';
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.keys(map)
      .map(function (key) {
        return { name: key, total: map[key] };
      })
      .sort(function (a, b) {
        return b.total - a.total;
      });
  }

  /* ---------- preferensi ---------- */

  function perPage() {
    return ensure().settings.perPage || 25;
  }

  function setPerPage(value) {
    var n = Number(value);
    if (PER_PAGE_OPTIONS.indexOf(n) === -1) return;
    ensure().settings.perPage = n;
    save();
  }

  /* ---------- data contoh ---------- */

  function seedDemo() {
    ensure();

    var today = todayISO();

    function push(dayOffset, type, amount, note, funding) {
      var tx = {
        id: uid('tx'),
        date: shiftDate(today, -dayOffset),
        type: type,
        amount: amount,
        note: note,
        createdAt: Date.now() - dayOffset * 1000
      };
      if (type === 'expense') tx.funding = funding === 'business' ? 'business' : 'personal';
      state.transactions.push(tx);
    }

    push(0, 'income', 385000, 'Penjualan hari ini');
    push(0, 'expense', 72000, 'Beli minyak goreng 2 liter', 'personal');
    push(0, 'expense', 25000, 'Beli plastik kemasan', 'business');

    push(1, 'income', 420000, 'Penjualan hari ini');
    push(1, 'expense', 32000, 'Beli telur 1 kg', 'personal');
    push(1, 'expense', 22000, 'Beli gas LPG 3 kg', 'business');

    push(2, 'income', 310000, 'Penjualan hari ini');
    push(2, 'expense', 85000, 'Beli gula pasir 5 kg', 'personal');

    push(3, 'income', 365000, 'Penjualan hari ini');
    push(3, 'expense', 320000, 'Beli beras 25 kg', 'personal');
    push(3, 'expense', 45000, 'Beli sabun dan pewangi', 'business');

    push(4, 'income', 290000, 'Penjualan hari ini');
    push(4, 'expense', 150000, 'Bayar listrik toko', 'business');

    push(5, 'income', 410000, 'Penjualan hari ini');
    push(5, 'expense', 65000, 'Beli kecap dan saus', 'personal');

    push(6, 'income', 340000, 'Penjualan hari ini');

    push(7, 'debt_payment', 500000, 'Bayar hutang ke uang pribadi');
    push(7, 'income', 300000, 'Penjualan hari ini');
    push(7, 'expense', 48000, 'Beli kopi sachet 1 kotak', 'business');

    save();
    return true;
  }

  /* ---------- cadangan ---------- */

  function exportJSON() {
    return JSON.stringify(ensure(), null, 2);
  }

  function importJSON(text) {
    var parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.transactions)) {
      throw new Error('Format berkas tidak dikenali.');
    }
    state = normalize(parsed);
    save();
    return true;
  }

  App.store = {
    load: load,
    save: save,
    snapshot: snapshot,
    replaceAll: replaceAll,
    resetAll: resetAll,

    TYPES: TYPES,
    PER_PAGE_OPTIONS: PER_PAGE_OPTIONS,
    typeLabel: typeLabel,

    todayISO: todayISO,
    daysAgoISO: daysAgoISO,
    monthStartISO: monthStartISO,
    shiftDate: shiftDate,
    rangeDates: rangeDates,

    transactions: transactions,
    sorted: sorted,
    byId: byId,
    addTransaction: addTransaction,
    updateTransaction: updateTransaction,
    deleteTransaction: deleteTransaction,
    clearTransactions: clearTransactions,

    totals: totals,
    debtStats: debtStats,
    balance: balance,

    categories: categories,
    categoryTotals: categoryTotals,
    filterTransactions: filterTransactions,
    perPage: perPage,
    setPerPage: setPerPage,

    seedDemo: seedDemo,
    exportJSON: exportJSON,
    importJSON: importJSON
  };
})();
