(function () {
  'use strict';

  var App = (window.App = window.App || {});

  var KEY = 'kasbuku.theme.v1';
  var LIGHT_BG = '#fbfbfa';
  var DARK_BG = '#121513';

  var CHOICES = [
    { value: 'light', label: 'Terang' },
    { value: 'dark', label: 'Gelap' },
    { value: 'system', label: 'Ikuti perangkat' }
  ];

  var media = null;
  try {
    media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  } catch (e) {
    media = null;
  }

  function read() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch (e) {
      /* penyimpanan diblokir: pakai pengaturan perangkat */
    }
    return 'system';
  }

  var choice = read();
  var meta = null;

  function isDark() {
    if (choice === 'dark') return true;
    if (choice === 'light') return false;
    return !!(media && media.matches);
  }

  // Atribut ini yang dipakai CSS, dan warna latarnya juga dikirim ke
  // <meta name="theme-color"> supaya bilah browser di ponsel ikut berubah.
  function apply() {
    var dark = isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    if (!meta) meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? DARK_BG : LIGHT_BG);
  }

  App.theme = {
    CHOICES: CHOICES,

    choice: function () {
      return choice;
    },

    isDark: isDark,

    set: function (value) {
      if (value !== 'light' && value !== 'dark' && value !== 'system') return;
      choice = value;
      try {
        localStorage.setItem(KEY, value);
      } catch (e) {
        /* penyimpanan diblokir */
      }
      apply();
    }
  };

  // Bila memilih "Ikuti perangkat", tema ikut berganti saat perangkat
  // beralih ke mode gelap atau terang.
  if (media) {
    var onChange = function () {
      if (choice === 'system') apply();
    };

    if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange);
    else if (typeof media.addListener === 'function') media.addListener(onChange);
  }

  apply();
})();
