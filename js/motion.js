(function () {
  'use strict';

  var App = (window.App = window.App || {});
  var motion = {};

  function reduceMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  motion.enabled = function () {
    return !!(window.gsap && !reduceMotion());
  };

  // Satu gerakan masuk yang teratur saat halaman berganti.
  motion.enter = function (root) {
    if (!motion.enabled() || !root) return;

    var items = root.querySelectorAll('.page-head, .statement, .chart-card, .card');
    if (!items.length) return;

    window.gsap.from(items, {
      y: 10,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.05,
      clearProps: 'transform,opacity'
    });
  };

  // Angka besar dihitung naik, bukan langsung muncul.
  motion.countUp = function (el, value, format) {
    if (!el) return;

    var fmt = format || function (v) {
      return String(Math.round(v));
    };

    if (!motion.enabled() || !isFinite(value)) {
      el.textContent = fmt(value);
      return;
    }

    var counter = { value: 0 };
    window.gsap.to(counter, {
      value: value,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: function () {
        el.textContent = fmt(counter.value);
      }
    });
  };

  motion.bars = function (selector) {
    if (!motion.enabled()) return;
    var bars = document.querySelectorAll(selector);
    if (!bars.length) return;

    window.gsap.from(bars, {
      scaleY: 0,
      opacity: 0,
      transformOrigin: 'bottom center',
      duration: 0.5,
      ease: 'power2.out',
      stagger: 0.02
    });
  };

  motion.progress = function (el, percent) {
    if (!el) return;
    var target = Math.max(0, Math.min(100, Number(percent) || 0));

    if (!motion.enabled()) {
      el.style.width = target + '%';
      return;
    }

    el.style.width = '0%';
    window.gsap.to(el, {
      width: target + '%',
      duration: 0.8,
      ease: 'power2.out'
    });
  };

  App.motion = motion;
})();
