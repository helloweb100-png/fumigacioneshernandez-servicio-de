(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ *
   * Footer year
   * ------------------------------------------------------------------ */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ *
   * Loader
   * ------------------------------------------------------------------ */
  (function loader() {
    var loaderEl = document.getElementById('loader');
    var progressCircle = document.getElementById('loaderProgress');
    var pctEl = document.getElementById('loaderPct');
    if (!loaderEl || !progressCircle || !pctEl) return;

    var CIRC = 2 * Math.PI * 54;
    progressCircle.style.strokeDasharray = CIRC;
    progressCircle.style.strokeDashoffset = CIRC;

    var target = 0;
    var displayed = 0;
    var done = false;

    function paint() {
      displayed += (target - displayed) * 0.14;
      if (Math.abs(target - displayed) < 0.3) displayed = target;
      var shown = Math.round(displayed);
      pctEl.textContent = shown + '%';
      progressCircle.style.strokeDashoffset = CIRC * (1 - displayed / 100);
      if (!done || displayed < 100) requestAnimationFrame(paint);
    }
    requestAnimationFrame(paint);

    var creep = 0;
    var creepTimer = setInterval(function () {
      creep = Math.min(creep + Math.random() * 12, 86);
      target = creep;
    }, 200);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(creepTimer);
      target = 100;
      setTimeout(function () {
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
        loaderEl.setAttribute('aria-hidden', 'true');
      }, reduceMotion ? 60 : 420);
    }

    var minDuration = reduceMotion ? 200 : 1050;
    var start = performance.now();
    window.addEventListener('load', function () {
      var elapsed = performance.now() - start;
      setTimeout(finish, Math.max(0, minDuration - elapsed));
    });
    setTimeout(finish, 4000);
  })();

  /* ------------------------------------------------------------------ *
   * Header scroll state (no scroll listener: IntersectionObserver on a sentinel)
   * ------------------------------------------------------------------ */
  (function headerState() {
    var nav = document.getElementById('nav');
    var sentinel = document.getElementById('navSentinel');
    if (!nav || !sentinel || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      nav.classList.toggle('nav--scrolled', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);
  })();

  /* ------------------------------------------------------------------ *
   * Mobile nav toggle
   * ------------------------------------------------------------------ */
  (function mobileNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return;

    function close() {
      nav.classList.remove('nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    function open() {
      nav.classList.add('nav--open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    toggle.addEventListener('click', function () {
      nav.classList.contains('nav--open') ? close() : open();
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  /* ------------------------------------------------------------------ *
   * Scroll reveal
   * ------------------------------------------------------------------ */
  (function reveal() {
    if (!('IntersectionObserver' in window)) return;

    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    var targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ------------------------------------------------------------------ *
   * Hero ambient particle network
   * ------------------------------------------------------------------ */
  (function heroCanvas() {
    var canvas = document.getElementById('heroCanvas');
    var hero = document.querySelector('.hero');
    if (!canvas || !hero || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var raf = null;
    var running = false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      var rect = hero.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(56, Math.round((rect.width * rect.height) / 22000));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        });
      }
    }

    function step() {
      var w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = 'rgba(111,155,255,' + (0.18 * (1 - dist / 130)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(232,180,76,.55)';
        ctx.beginPath();
        ctx.arc(particles[a].x, particles[a].y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; step(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    size();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(size, 200);
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 });
      io.observe(hero);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
  })();

  /* ------------------------------------------------------------------ *
   * Parallax banner (rAF gated by IntersectionObserver, no scroll listener)
   * ------------------------------------------------------------------ */
  (function parallax() {
    var els = document.querySelectorAll('[data-parallax] .banner__bg');
    if (!els.length || reduceMotion) return;
    var active = new Set();
    var raf = null;

    function tick() {
      active.forEach(function (el) {
        var rect = el.parentElement.getBoundingClientRect();
        var center = rect.top + rect.height / 2 - window.innerHeight / 2;
        var offset = Math.max(-40, Math.min(40, center * -0.08));
        el.style.setProperty('--parallax-y', offset.toFixed(1) + 'px');
      });
      raf = active.size ? requestAnimationFrame(tick) : null;
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var bg = entry.target.querySelector('.banner__bg');
          if (!bg) return;
          if (entry.isIntersecting) {
            active.add(bg);
            if (!raf) raf = requestAnimationFrame(tick);
          } else {
            active.delete(bg);
          }
        });
      }, { threshold: 0 });
      document.querySelectorAll('[data-parallax]').forEach(function (s) { io.observe(s); });
    }
  })();

  /* ------------------------------------------------------------------ *
   * Gallery lightbox
   * ------------------------------------------------------------------ */
  (function lightbox() {
    var items = Array.prototype.map.call(document.querySelectorAll('.gallery__item img'), function (img) {
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
    });
    var box = document.getElementById('lightbox');
    var imgEl = document.getElementById('lightboxImage');
    var captionEl = document.getElementById('lightboxCaption');
    if (!box || !imgEl || !items.length) return;

    var current = 0;
    var lastFocused = null;

    function render() {
      imgEl.src = items[current].src;
      imgEl.alt = items[current].alt || '';
      captionEl.textContent = items[current].alt || '';
    }
    function open(index) {
      current = index;
      lastFocused = document.activeElement;
      render();
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }
    function next() { current = (current + 1) % items.length; render(); }
    function prev() { current = (current - 1 + items.length) % items.length; render(); }

    document.querySelectorAll('[data-lightbox-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        open(parseInt(btn.getAttribute('data-lightbox-index'), 10) || 0);
      });
    });
    box.querySelectorAll('[data-lightbox-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    box.querySelector('[data-lightbox-next]').addEventListener('click', next);
    box.querySelector('[data-lightbox-prev]').addEventListener('click', prev);

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  })();

  /* ------------------------------------------------------------------ *
   * Contact form -> WhatsApp
   * ------------------------------------------------------------------ */
  (function contactForm() {
    var form = document.getElementById('contactForm');
    var note = document.getElementById('formNote');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var nombre = form.nombre.value.trim();
      var telefono = form.telefono.value.trim();
      var tipo = form.tipo.value;
      var mensaje = form.mensaje.value.trim();

      var text = 'Hola, soy ' + nombre + '.' +
        ' Quiero solicitar una fumigación.' +
        '\nTipo de espacio: ' + tipo +
        '\nTeléfono: ' + telefono +
        '\nDetalles: ' + mensaje;

      var url = 'https://wa.me/8333837323?text=' + encodeURIComponent(text);
      if (note) note.textContent = 'Abriendo WhatsApp con tu mensaje...';
      window.open(url, '_blank', 'noopener');
    });
  })();

})();
