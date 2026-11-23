/* quietspire.com home: motion and the three small demos.
   Everything on the page is readable without this file. It only adds:
   - the tower building itself as you scroll (each storey slides in and lands),
   - Scoop coming up out of the roof, and reacting to taps,
   - Alpha Lock's lock, Hapax's word of the day, and a few slabs of SLAB.
   Each effect has a reduced-motion path written next to it. */
(function () {
  'use strict';

  // Paths are relative to this file, not the page, so the same script serves
  // the home page and the app pages under /hapax/ and /slab/.
  var ROOT = (function () {
    var s = document.currentScript;
    try { return s && s.src ? new URL('.', s.src).href : ''; } catch (e) { return ''; }
  })();

  var EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var QUART_IN = 'cubic-bezier(0.5, 0, 0.75, 0)';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function still() { return mq.matches; }
  function canAnimate(el) { return !!(el && el.animate); }

  /* ---------- the dock settles in (transform only: icons are visible from the first frame) ---------- */
  function dock() {
    if (still() || document.visibilityState !== 'visible') return;
    var imgs = document.querySelectorAll('.dock__app img');
    imgs.forEach(function (img, i) {
      if (!canAnimate(img)) return;
      img.animate(
        [{ transform: 'translateY(14px) scale(.94)' }, { transform: 'none' }],
        { duration: 900, delay: 80 + i * 70, easing: EXPO, fill: 'backwards' }
      );
    });
  }

  /* ---------- the tower builds as you scroll ----------
     A storey already on screen at load is left alone (it is already built).
     A storey below the fold slides in from the side and lands the moment its
     first pixel enters the viewport, so the offset is never seen at rest. */
  function tower() {
    if (still() || !('IntersectionObserver' in window)) return;
    var storeys = document.querySelectorAll('.storey, [data-land]');
    var seen = new WeakMap();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (!seen.has(el)) {
          seen.set(el, true);
          if (e.isIntersecting) io.unobserve(el);
          return;
        }
        if (!e.isIntersecting) return;
        io.unobserve(el);
        if (still() || !canAnimate(el)) return;
        var dir = +el.getAttribute('data-dir') || 1;
        var d = Math.min(90, window.innerWidth * 0.09) * dir;
        el.animate(
          [{ transform: 'translateX(' + d + 'px)' }, { transform: 'none' }],
          { duration: 1100, easing: EXPO }
        );
        var demo = el.querySelector('figure');
        if (canAnimate(demo)) {
          demo.animate(
            [{ transform: 'translateY(26px)' }, { transform: 'none' }],
            { duration: 1100, delay: 120, easing: EXPO, fill: 'backwards' }
          );
        }
      });
    });
    storeys.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Scoop ---------- */
  var scoopBtn = document.querySelector('.scoop');
  var scoopImg = scoopBtn && scoopBtn.querySelector('img');
  var MOODS = ['psst', 'ready', 'done'];
  var MOOD_WORDS = { psst: 'whispering psst', ready: 'holding the brief', done: 'cheering' };

  function preloadMoods() {
    MOODS.forEach(function (m) { var i = new Image(); i.src = ROOT + 'img/scoop-' + m + '.png'; });
  }

  function setMood(mood, animate) {
    if (!scoopBtn || scoopBtn.getAttribute('data-mood') === mood && !animate) return;
    var swap = function () {
      scoopImg.src = ROOT + 'img/scoop-' + mood + '.png';
      scoopBtn.setAttribute('data-mood', mood);
    };
    if (!canAnimate(scoopImg)) { swap(); return; }
    if (still()) {
      // reduced motion: a quick crossfade, no movement
      scoopImg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'linear' })
        .onfinish = function () {
          swap();
          scoopImg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'linear' });
        };
      return;
    }
    // he ducks into the roof and comes back up with the new face
    var down = scoopImg.animate(
      [{ transform: 'translateY(7.3%)' }, { transform: 'translateY(30%)' }],
      { duration: 170, easing: QUART_IN }
    );
    down.onfinish = function () {
      swap();
      scoopImg.animate(
        [{ transform: 'translateY(30%)' }, { transform: 'translateY(7.3%)' }],
        { duration: 650, easing: EXPO }
      );
    };
  }

  function scoop() {
    if (!scoopBtn) return;
    // first appearance: up out of his burrow on the roof
    if (!still() && document.visibilityState === 'visible' && canAnimate(scoopImg)) {
      scoopImg.animate(
        [{ transform: 'translateY(62%)' }, { transform: 'translateY(7.3%)' }],
        { duration: 1300, delay: 350, easing: EXPO, fill: 'backwards' }
      );
    }
    scoopBtn.addEventListener('click', function () {
      var now = scoopBtn.getAttribute('data-mood');
      var next = MOODS[(MOODS.indexOf(now) + 1) % MOODS.length];
      setMood(next, true);
      scoopBtn.setAttribute('aria-label', 'Scoop the mole, Alpha Lock’s mascot, ' + MOOD_WORDS[next] + '. Press to change his mood.');
    });
    if ('requestIdleCallback' in window) requestIdleCallback(preloadMoods); else setTimeout(preloadMoods, 1200);
  }

  /* ---------- Alpha Lock: locked, reading, open ---------- */
  function lockDemo() {
    var demo = document.querySelector('.al-demo');
    if (!demo) return;
    var btn = demo.querySelector('.al-btn--demo');
    var bar = demo.querySelector('.al-progress span');
    var status = demo.querySelector('.al-status');
    btn.hidden = false;

    var TEXT = {
      locked: 'Your apps are locked until today’s brief is read.',
      reading: 'Reading today’s brief…',
      open: 'Brief read. Your apps are open.'
    };
    var LABEL = { locked: 'Read today’s brief', reading: 'Reading…', open: 'Lock them again' };

    function set(state) {
      demo.setAttribute('data-state', state);
      status.textContent = TEXT[state];
      btn.textContent = LABEL[state];
      if (state === 'reading') btn.setAttribute('aria-disabled', 'true');
      else btn.removeAttribute('aria-disabled');
      setMood(state === 'locked' ? 'psst' : state === 'reading' ? 'ready' : 'done', false);
    }

    btn.addEventListener('click', function () {
      var state = demo.getAttribute('data-state');
      if (state === 'reading') return;
      if (state === 'open') {
        set('locked');
        if (canAnimate(bar)) bar.getAnimations().forEach(function (a) { a.cancel(); });
        bar.style.transform = 'scaleX(0)';
        return;
      }
      set('reading');
      bar.style.transform = '';
      if (still() || !canAnimate(bar)) {
        // reduced motion: the bar fills in three steps, no sweep
        var steps = [0.34, 0.67, 1], i = 0;
        var tick = function () {
          bar.style.transform = 'scaleX(' + steps[i] + ')';
          i++;
          if (i < steps.length) setTimeout(tick, 380); else setTimeout(function () { set('open'); }, 300);
        };
        tick();
        return;
      }
      var fill = bar.animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: 1700, easing: 'linear', fill: 'forwards' }
      );
      fill.onfinish = function () { set('open'); };
    });
  }

  /* ---------- Hapax: today's real word, from this site's own daily pages ----------
     Without this, the entry shows a real word from the list, labelled
     "A word from Hapax". With it, it becomes today's word. The pronunciation
     speaks the word when tapped, as it does in the app. */
  function hapax() {
    var entry = document.querySelector('.hx-entry');
    if (!entry) return;
    var wordEl = entry.querySelector('.hx-word');
    var when = document.querySelector('.hx-when');
    var today = document.querySelector('.hx-today');

    // keep a long word (up to "quintessential") on one line at any width
    function fit() {
      wordEl.style.fontSize = '';
      var avail = entry.clientWidth, w = wordEl.scrollWidth;
      if (w > avail && avail > 0) {
        var size = parseFloat(getComputedStyle(wordEl).fontSize);
        wordEl.style.fontSize = Math.floor(size * avail / w * 0.98) + 'px';
      }
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else fit();

    // tap the pronunciation to hear the word
    var pron = entry.querySelector('.hx-pron');
    if ('speechSynthesis' in window && window.SpeechSynthesisUtterance) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hx-pron';
      b.setAttribute('data-f', 'pron');
      b.innerHTML = '<span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18 6.3a8 8 0 0 1 0 11.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      b.firstChild.textContent = pron.textContent;
      var label = function () { b.setAttribute('aria-label', 'Hear “' + wordEl.textContent + '”, ' + b.firstChild.textContent); };
      label();
      pron.replaceWith(b);
      pron = b;
      b.addEventListener('click', function () {
        try {
          speechSynthesis.cancel();
          var u = new SpeechSynthesisUtterance(wordEl.textContent);
          u.lang = 'en-US';
          u.rate = 0.9;
          u.onend = u.onerror = function () { b.classList.remove('is-speaking'); };
          b.classList.add('is-speaking');
          speechSynthesis.speak(u);
        } catch (e) { b.classList.remove('is-speaking'); }
      });
      entry.addEventListener('hx:word', label);
    }

    // put an entry into the page: word, pronunciation, part of speech, definition, example
    function fill(f) {
      entry.querySelectorAll('[data-f]').forEach(function (el) {
        var k = el.getAttribute('data-f'), v = f[k];
        var target = el.tagName === 'BUTTON' ? el.firstChild : el;
        if (v) { target.textContent = v; el.hidden = false; } else if (k === 'ex' || k === 'pos') el.hidden = true;
      });
      entry.dispatchEvent(new Event('hx:word'));
      fit();
    }
    function read() {
      var f = {};
      entry.querySelectorAll('[data-f]').forEach(function (el) {
        var target = el.tagName === 'BUTTON' ? el.firstChild : el;
        f[el.getAttribute('data-f')] = el.hidden ? '' : target.textContent;
      });
      return f;
    }

    var fallback = read();      // the real word written into the HTML
    var todayWord = null, todayLabel = '';
    var level = 'intermediate'; // the stream the site's daily pages follow

    /* The Hapax page only: the app's four difficulty levels. Intermediate is
       the level the daily pages follow, so it shows today's word; each of the
       others shows a word from that level, a different one on each press.
       Without the script the four levels are plain text. */
    var levels = document.querySelector('.hx-levels');
    var poolEl = document.getElementById('hx-pool');
    var said = document.querySelector('.hx-said');
    var pool = null;
    try { pool = poolEl ? JSON.parse(poolEl.textContent) : null; } catch (e) { pool = null; }
    if (levels && pool) {
      var turn = {};
      var NAME = { beginner: 'A beginner word', advanced: 'An advanced word', expert: 'An expert word' };
      levels.querySelectorAll('.hx-chip').forEach(function (span) {
        var lv = span.getAttribute('data-level');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'hx-chip';
        b.setAttribute('data-level', lv);
        b.setAttribute('aria-pressed', lv === level ? 'true' : 'false');
        b.textContent = span.textContent;
        span.replaceWith(b);
        b.addEventListener('click', function () {
          var f, label;
          if (lv === 'intermediate') {
            f = todayWord || fallback;
            label = todayWord ? todayLabel : 'A word from Hapax';
          } else {
            var list = pool[lv] || [];
            if (!list.length) return;
            turn[lv] = turn[lv] === undefined ? 0 : (turn[lv] + 1) % list.length;
            f = list[turn[lv]];
            label = NAME[lv];
          }
          level = lv;
          levels.querySelectorAll('.hx-chip').forEach(function (c) {
            c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
          });
          fill(f);
          when.textContent = label;
          entry.setAttribute('aria-label', label);
          if (said) said.textContent = label + ': ' + f.word + '. ' + f.def;
          if (!canAnimate(entry)) return;
          // the new entry settles in; reduced motion: a short crossfade, no movement
          if (still()) entry.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'linear' });
          else entry.animate(
            [{ opacity: 0.35, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
            { duration: 600, easing: EXPO }
          );
        });
      });
    }

    var d = new Date();
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var url = ROOT + 'hapax/word-of-the-day/' + key + '.html';
    if (!window.fetch || !window.DOMParser) return;
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var word = doc.querySelector('main h1');
        var effs = doc.querySelectorAll('main p.eff');
        if (!word || effs.length < 2) return;
        var dateText = effs[0].textContent.trim().replace(/,\s*\d{4}$/, '');
        var pronLine = effs[1].textContent.trim();
        var cut = pronLine.lastIndexOf(',');
        var defEl = effs[1].nextElementSibling;
        var exEl = defEl && defEl.nextElementSibling;
        var f = {
          word: word.textContent.trim(),
          pron: cut > 0 ? pronLine.slice(0, cut).trim() : pronLine,
          pos: cut > 0 ? pronLine.slice(cut + 1).trim() : '',
          def: defEl ? defEl.textContent.trim() : '',
          ex: exEl && /italic/.test(exEl.getAttribute('style') || '') ? exEl.textContent.trim() : ''
        };
        if (!f.word || !f.def) return;
        todayWord = f;
        todayLabel = 'Today’s word, ' + dateText;
        if (today) today.href = url;
        if (level !== 'intermediate') return;  // a reader already picked another level
        fill(f);
        when.textContent = todayLabel;
        entry.setAttribute('aria-label', 'Today’s word on Hapax');
      })
      .catch(function () { /* the word in the HTML stays */ });
  }

  /* ---------- SLAB: a few slabs, by the game's own rules ----------
     Tap to drop. The overhang is sliced off. The speed never changes; the
     target shrinks. A perfect snaps into place; three in a row grow it back.
     Colours shift as you climb. */
  function slab() {
    var stage = document.querySelector('.sl-stage');
    if (!stage) return;
    var world = stage.querySelector('.sl-world');
    var btn = stage.querySelector('.sl-play');
    var label = stage.querySelector('.sl-play__label');
    var scoreEl = stage.querySelector('.sl-score');
    var msg = stage.querySelector('.sl-msg');
    var live = document.querySelector('.sl-live');
    btn.hidden = false;
    btn.setAttribute('aria-label', 'Play SLAB');

    var SH = 22;
    var PALETTE = [[124, 176, 170], [198, 127, 108], [216, 208, 193]];
    var W, baseW, reach, stack, cur, curEl, dir, side = 1, speed, last, raf = 0, mode = 'idle';
    var score = 0, perfects = 0, best = 0, visible = true;
    try { best = +localStorage.getItem('qs-slab-best') || 0; } catch (e) { best = 0; }

    // the game's three slab colours, in turn; the sky behind them is what drifts as you climb
    function color(i) { return 'rgb(' + PALETTE[i % 3].join(',') + ')'; }
    function slabEl(x, w, i) {
      var s = document.createElement('span');
      s.className = 'sl-slab';
      s.style.left = x + 'px';
      s.style.width = w + 'px';
      s.style.bottom = (i * SH) + 'px';
      s.style.background = color(i);
      world.appendChild(s);
      return s;
    }
    function setMode(m) {
      mode = m;
      stage.setAttribute('data-mode', m);
      var text = m === 'play' ? 'Drop' : m === 'over' ? 'Play again' : 'Play';
      label.textContent = text;
      btn.setAttribute('aria-label', m === 'play' ? 'Drop the slab' : text + ' SLAB');
    }
    function start() {
      world.textContent = '';
      world.style.transform = '';
      W = world.clientWidth;
      baseW = Math.round(Math.min(W * 0.56, 320));
      // the slab sweeps across the stack and a little past it, not the whole field
      reach = Math.min(W / 2, baseW * 0.9);
      stack = [{ x: Math.round((W - baseW) / 2), w: baseW }];
      slabEl(stack[0].x, baseW, 0);
      score = 0; perfects = 0;
      speed = Math.max(150, baseW * 1.05);  // constant: the target shrinks, the speed never changes
      scoreEl.hidden = false; scoreEl.textContent = '0';
      msg.hidden = true;
      stage.style.setProperty('--h', 208);
      setMode('play');
      live.textContent = 'Slab moving. Press to drop it.';
      spawn();
      last = performance.now();
      run();
    }
    function spawn() {
      var top = stack[stack.length - 1];
      side = -side;
      dir = side;
      cur = { x: side > 0 ? lo(top.w) : hi(top.w), w: top.w };
      curEl = slabEl(0, cur.w, stack.length);
      curEl.classList.add('is-moving');
      curEl.style.transform = 'translateX(' + cur.x + 'px)';
    }
    function lo(w) { return Math.max(0, W / 2 - reach - w / 2); }
    function hi(w) { return Math.min(W - w, W / 2 + reach - w / 2); }
    function frame(t) {
      var dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      cur.x += dir * speed * dt;
      if (cur.x <= lo(cur.w)) { cur.x = lo(cur.w); dir = 1; }
      else if (cur.x >= hi(cur.w)) { cur.x = hi(cur.w); dir = -1; }
      curEl.style.transform = 'translateX(' + cur.x + 'px)';
      raf = requestAnimationFrame(frame);
    }
    function run() { if (!raf && mode === 'play' && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function pause() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    function fall(x, w, i, whole) {
      var p = whole ? curEl : slabEl(x, w, i);
      if (whole) { p.classList.remove('is-moving'); p.style.transform = ''; p.style.left = x + 'px'; }
      if (!canAnimate(p)) { p.remove(); return; }
      var spin = (x + w / 2 < W / 2 ? -1 : 1) * 16;
      var anim = still()
        ? p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'linear', fill: 'forwards' })
        : p.animate(
            [{ transform: 'none', opacity: 1 }, { transform: 'translateY(240px) rotate(' + spin + 'deg)', opacity: 0 }],
            { duration: 760, easing: QUART_IN, fill: 'forwards' } // a fall accelerates: gravity, not a UI ease
          );
      anim.onfinish = function () { p.remove(); };
    }
    function flash(el) {
      if (!canAnimate(el)) return;
      el.animate(
        [{ boxShadow: '0 0 0 3px rgba(255,255,255,.95), inset 0 -6px 0 rgba(0,0,0,.22)' },
         { boxShadow: '0 0 0 0 rgba(255,255,255,0), inset 0 -6px 0 rgba(0,0,0,.22)' }],
        { duration: 650, easing: EXPO }
      );
    }
    function note(text) {
      msg.hidden = false;
      msg.textContent = text;
      if (canAnimate(msg)) msg.animate([{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 1100, fill: 'forwards' });
    }

    function drop() {
      var top = stack[stack.length - 1];
      var i = stack.length;
      var d = cur.x - top.x;
      var tol = Math.max(3, W * 0.012);
      var x, w, perfect = false;
      if (Math.abs(d) <= tol) {
        perfect = true;
        perfects++;
        x = top.x; w = top.w;
        if (perfects >= 3 && w < baseW) {
          var g = Math.min(baseW - w, W * 0.06);
          w += g;
          x = Math.max(0, Math.min(W - w, x - g / 2));
          perfects = 0;
        }
      } else {
        perfects = 0;
        var overlap = top.w - Math.abs(d);
        if (overlap <= 0) { pause(); fall(cur.x, cur.w, i, true); return over(); }
        x = d > 0 ? cur.x : top.x;
        w = overlap;
        fall(d > 0 ? top.x + top.w : cur.x, Math.abs(d), i, false);
      }
      curEl.classList.remove('is-moving');
      curEl.style.transform = '';
      curEl.style.left = x + 'px';
      curEl.style.width = w + 'px';
      stack.push({ x: x, w: w });
      score++;
      scoreEl.textContent = String(score);
      stage.style.setProperty('--h', 208 - Math.min(score, 60) * 2.5);
      if (perfect) { flash(curEl); note(perfects === 0 ? 'Perfect. It grew back.' : 'Perfect'); }
      var rows = Math.floor((stage.clientHeight * 0.58) / SH);
      if (stack.length > rows) world.style.transform = 'translateY(' + ((stack.length - rows) * SH) + 'px)';
      spawn();
    }
    function over() {
      if (score > best) { best = score; try { localStorage.setItem('qs-slab-best', String(best)); } catch (e) { /* fine */ } }
      setMode('over');
      msg.hidden = false;
      msg.getAnimations && msg.getAnimations().forEach(function (a) { a.cancel(); });
      msg.textContent = 'Best ' + best;
      live.textContent = 'Missed. Score ' + score + '. Best ' + best + '. Press to play again.';
    }
    function act() {
      if (mode === 'play') drop(); else start();
    }

    // Pointer presses act on the way down (a timing game can't wait for the
    // click); keyboard presses arrive as clicks with no pointer detail.
    btn.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      act();
    });
    btn.addEventListener('click', function (e) { if (e.detail === 0) act(); });

    // The first time the playfield comes into view, one slab slides in and
    // lands a little long, and its overhang is sliced off and falls: the whole
    // game in one second. It runs once. Reduced motion: the still stack stays.
    var demoed = false;
    function idleDemo() {
      demoed = true;
      if (still() || mode !== 'idle') return;
      var kids = world.querySelectorAll('.sl-slab');
      var topEl = kids[kids.length - 1];
      if (!topEl || !canAnimate(topEl)) return;
      W = world.clientWidth;
      var wr = world.getBoundingClientRect(), tr = topEl.getBoundingClientRect();
      var tx = tr.left - wr.left, tw = tr.width, i = kids.length;
      var over = Math.round(tw * 0.16), fx = tx + over;
      var el = slabEl(fx, tw, i);
      var glide = el.animate(
        [{ transform: 'translateX(' + (-(fx + tw + 24)) + 'px)' }, { transform: 'none' }],
        { duration: 1150, delay: 350, easing: EXPO, fill: 'backwards' }
      );
      glide.onfinish = function () {
        if (mode !== 'idle' || !el.isConnected) return;
        el.style.width = (tw - over) + 'px';
        fall(tx + tw, over, i, false);
      };
    }

    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else run(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !demoed && es[0].intersectionRatio > 0.5) idleDemo();
        if (visible) run(); else pause();
      }, { threshold: [0, 0.5, 0.75] }).observe(stage);
    }
  }

  function init() {
    dock();
    tower();
    scoop();
    lockDemo();
    hapax();
    slab();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
