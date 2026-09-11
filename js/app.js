/* ============ Power Rangers DBG — Vida y Energía ============ */
(() => {
  'use strict';

  const LIFE_MAX = 30;
  const ENERGY_MAX = 20;
  const LIFE_START = 30;
  const ENERGY_START = 0;
  const STORAGE = 'pr-dbg-tracker-v1';

  // ---------- Idiomas ----------
  const I18N = {
    es: {
      chooseLang: 'Elegí el idioma',
      life: 'VIDA', energy: 'ENERGÍA',
      reset: 'REINICIAR', atZero: '0 ❤ · subí + para revivir',
      lifeMax: 'Vida 30', energyMax: 'Energía 20',
      pickColor: 'Nombre y color', ok: 'Listo',
      p1: 'Jugador 1', p2: 'Jugador 2',
      confirmReset: '¿Reiniciar la partida? Vida a 30 y energía a 0 para ambos.'
    },
    en: {
      chooseLang: 'Choose language',
      life: 'LIFE', energy: 'ENERGY',
      reset: 'RESET', atZero: '0 ❤ · tap + to revive',
      lifeMax: 'Life 30', energyMax: 'Energy 20',
      pickColor: 'Name and color', ok: 'Done',
      p1: 'Player 1', p2: 'Player 2',
      confirmReset: 'Reset the game? Life to 30 and energy to 0 for both.'
    }
  };

  // ---------- Colores Ranger ----------
  const COLORS = [
    { key:'red',    c:'#ff4d4d' },
    { key:'blue',   c:'#2b8fff' },
    { key:'green',  c:'#2fbf62' },
    { key:'pink',   c:'#ff5fb0' },
    { key:'yellow', c:'#ffcf3f' },
    { key:'black',  c:'#5a5f78' },
    { key:'white',  c:'#dfe3ff' },
    { key:'purple', c:'#a86bff' }
  ];

  // ---------- Estado ----------
  const defaults = () => ({
    lang: null,
    players: {
      1: { life: LIFE_START, energy: ENERGY_START, name: null, color: '#ff4d4d' },
      2: { life: LIFE_START, energy: ENERGY_START, name: null, color: '#2fbf62' }
    }
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (_) {}
    return defaults();
  }
  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (_) {}
  }

  // ---------- Sonido (tick sintetizado) ----------
  let actx = null;
  function tick(type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle';
      o.frequency.value = type === 'up' ? 620 : type === 'down' ? 380 : 500;
      g.gain.setValueAtTime(.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(.09, actx.currentTime + .01);
      g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + .12);
      o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + .13);
    } catch (_) {}
  }

  // ---------- Referencias DOM ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const langGate = $('#lang-gate');
  const board = $('#board');
  const palette = $('#palette');

  // deltas acumulados por (jugador+stat)
  const deltaAcc = {};
  const deltaTimers = {};

  // ---------- i18n ----------
  function t(k) { return (I18N[state.lang] || I18N.es)[k] || k; }
  function applyLang() {
    document.documentElement.lang = state.lang || 'es';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    // nombres por defecto si no fueron editados
    for (const p of [1, 2]) {
      const nameEl = $(`.player[data-player="${p}"] .p-name-txt`);
      if (nameEl && !state.players[p].name) nameEl.textContent = t('p' + p);
    }
  }

  // ---------- Render ----------
  function renderPlayer(p) {
    const pl = state.players[p];
    const sec = $(`.player[data-player="${p}"]`);
    sec.style.setProperty('--accent', pl.color);
    $('.life-num', sec).textContent = pl.life;
    $('.energy-num', sec).textContent = pl.energy;
    const nameEl = $('.p-name-txt', sec);
    nameEl.textContent = pl.name || t('p' + p);
    // vida baja
    sec.classList.toggle('low', pl.life > 0 && pl.life <= 5);
    // sin vida (0): panel opaco pero reversible, se puede volver a subir
    const out = pl.life <= 0;
    $('.p-out', sec).hidden = !out;
    sec.classList.toggle('dead', out);
  }
  function render() {
    renderPlayer(1);
    renderPlayer(2);
    applyLang();
  }

  // ---------- Cambiar valores ----------
  function change(p, stat, dir) {
    const pl = state.players[p];
    if (pl.life <= 0 && stat === 'life' && dir < 0) return; // ya en 0
    const max = stat === 'life' ? LIFE_MAX : ENERGY_MAX;
    const before = pl[stat];
    let next = before + dir;
    next = Math.max(0, Math.min(max, next));
    if (next === before) return;
    pl[stat] = next;

    showDelta(p, stat, dir);
    tick(dir > 0 ? 'up' : 'down');
    renderPlayer(p);
    save();
  }

  function showDelta(p, stat, dir) {
    const id = p + stat;
    deltaAcc[id] = (deltaAcc[id] || 0) + dir;
    const sec = $(`.player[data-player="${p}"]`);
    const el = $(`.${stat}-delta`, sec);
    const v = deltaAcc[id];
    if (v === 0) { el.classList.remove('show'); return; }
    el.textContent = (v > 0 ? '+' : '') + v;
    el.classList.toggle('up', v > 0);
    el.classList.toggle('down', v < 0);
    el.classList.add('show');
    clearTimeout(deltaTimers[id]);
    deltaTimers[id] = setTimeout(() => {
      el.classList.remove('show');
      deltaAcc[id] = 0;
    }, 1600);
  }

  // ---------- Reiniciar ----------
  function resetGame() {
    for (const p of [1, 2]) {
      state.players[p].life = LIFE_START;
      state.players[p].energy = ENERGY_START;
    }
    Object.keys(deltaAcc).forEach(k => deltaAcc[k] = 0);
    $$('.delta').forEach(d => d.classList.remove('show'));
    render();
    save();
  }

  // ---------- Pulsación con auto-repetición ----------
  function bindHold(btn, fn) {
    let to = null, iv = null;
    const start = (e) => {
      e.preventDefault();
      fn();
      to = setTimeout(() => { iv = setInterval(fn, 90); }, 420);
    };
    const stop = () => { clearTimeout(to); clearInterval(iv); to = iv = null; };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  }

  // ---------- Paleta de color ----------
  let palTarget = null;
  function openPalette(p) {
    palTarget = p;
    const pl = state.players[p];
    $('#pal-input').value = pl.name || t('p' + p);
    const wrap = $('#pal-swatches');
    wrap.innerHTML = '';
    COLORS.forEach(col => {
      const b = document.createElement('button');
      b.className = 'pal-sw' + (col.c === pl.color ? ' sel' : '');
      b.style.setProperty('--c', col.c);
      b.addEventListener('click', () => {
        pl.color = col.c;
        $$('.pal-sw', wrap).forEach(s => s.classList.remove('sel'));
        b.classList.add('sel');
        renderPlayer(p);
        save();
      });
      wrap.appendChild(b);
    });
    palette.hidden = false;
  }
  function closePalette() {
    if (palTarget) {
      const name = $('#pal-input').value.trim();
      state.players[palTarget].name = name || null;
      renderPlayer(palTarget);
      save();
    }
    palette.hidden = true;
    palTarget = null;
  }

  // ---------- Inicio ----------
  function showBoard() {
    langGate.hidden = true;
    board.hidden = false;
    render();
  }

  // ---------- Eventos ----------
  function init() {
    // idioma
    $$('.lg-btn').forEach(b => b.addEventListener('click', () => {
      state.lang = b.dataset.lang;
      save();
      tick();
      showBoard();
    }));

    // controles + / -
    $$('.ctrl').forEach(btn => {
      const p = +btn.closest('.player').dataset.player;
      const stat = btn.dataset.act;
      const dir = +btn.dataset.dir;
      bindHold(btn, () => change(p, stat, dir));
    });

    // nombre / color
    $$('.p-name').forEach(btn => {
      btn.addEventListener('click', () => openPalette(+btn.closest('.player').dataset.player));
    });
    $('#pal-close').addEventListener('click', closePalette);
    palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });

    // hub
    $('#btn-reset').addEventListener('click', () => {
      if (confirm(t('confirmReset'))) resetGame();
    });
    $('#btn-lang').addEventListener('click', () => {
      state.lang = state.lang === 'es' ? 'en' : 'es';
      save(); applyLang();
    });

    // arranque: si ya hay idioma elegido, saltar la puerta
    if (state.lang) showBoard();
    else applyLang();
  }

  document.addEventListener('DOMContentLoaded', init);

  // ---------- Service worker (PWA offline) ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
