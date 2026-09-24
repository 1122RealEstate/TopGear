'use strict';
/* ============================================================
   Interfaz: pantallas de menú con navegación por teclado
   ============================================================ */
(function (TG) {
  const U = TG.U;
  const UI = (TG.UI = { cur: null, capture: null });
  const S = () => TG.Save.data;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const root = () => document.getElementById('ui');
  const SCREENS = {};
  UI.SCREENS = SCREENS;

  /* ---------- Núcleo ---------- */
  UI.init = function () {
    TG.Input.on((e, code) => UI.onKey(e, code));
  };

  UI.show = function (name, params) {
    const def = SCREENS[name];
    if (!def) return;
    if (UI.cur && UI.cur.leave) { try { UI.cur.leave(); } catch (e) { /* ok */ } }
    UI.capture = null;
    const r = root();
    r.innerHTML = '';
    const el = document.createElement('section');
    el.className = 'screen scr-' + name + (def.studio ? ' studio' : '') + (def.overlay ? ' overlay' : '');
    r.appendChild(el);
    const ctx = { name, params: params || {}, el, def, focused: null, modal: null };
    UI.cur = ctx;
    document.body.classList.toggle('menu', def.dim !== false);
    document.body.classList.toggle('studio-on', !!def.studio);
    def.render(ctx);
    UI.wire(el);
    const first = ctx.initial ? $(ctx.initial, el) : null;
    UI.focus(first || UI.focusables(ctx)[0]);
    if (TG.Game && TG.Game.onScreen) TG.Game.onScreen(name, def);
  };
  UI.refresh = function (keepSel) {
    const ctx = UI.cur;
    if (!ctx) return;
    const idx = ctx.focused ? ctx.focused.dataset.key : null;
    const scroll = {};
    $$('[data-scroll]', ctx.el).forEach((s) => { scroll[s.dataset.scroll] = s.scrollTop; });
    ctx.el.innerHTML = '';
    ctx.modal = null;
    ctx.def.render(ctx);
    UI.wire(ctx.el);
    $$('[data-scroll]', ctx.el).forEach((s) => { if (scroll[s.dataset.scroll] != null) s.scrollTop = scroll[s.dataset.scroll]; });
    const sel = keepSel || (idx != null ? '[data-key="' + idx + '"]' : null);
    const el = sel ? $(sel, ctx.el) : null;
    UI.focus(el || UI.focusables(ctx)[0], true);
  };
  UI.hide = function () {
    if (UI.cur && UI.cur.leave) { try { UI.cur.leave(); } catch (e) { /* ok */ } }
    root().innerHTML = '';
    UI.cur = null;
    UI.capture = null;
    document.body.classList.remove('menu', 'studio-on');
  };
  UI.wire = function (el) {
    $$('[data-nav]', el).forEach((n) => {
      if (n._wired) return;
      n._wired = true;
      n.addEventListener('mouseenter', () => { if (UI.cur && (!UI.cur.modal || UI.cur.modal.contains(n))) UI.focus(n); });
    });
    $$('[data-arrow]', el).forEach((a) => {
      if (a._wired) return;
      a._wired = true;
      a.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = a.closest('[data-nav]');
        if (row && row._adjust) { row._adjust(+a.dataset.arrow); TG.Audio.play('nav'); }
      });
    });
  };
  UI.focusables = function (ctx) {
    const scope = ctx.modal || ctx.el;
    return $$('[data-nav]', scope).filter((n) => n.offsetParent !== null && !n.hasAttribute('data-off'));
  };
  UI.focus = function (el, silent) {
    const ctx = UI.cur;
    if (!ctx || !el) return;
    if (ctx.focused && ctx.focused !== el) ctx.focused.classList.remove('focus');
    ctx.focused = el;
    el.classList.add('focus');
    if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (ctx.onFocus) ctx.onFocus(el, silent);
  };
  UI.move = function (dir) {
    const ctx = UI.cur;
    const list = UI.focusables(ctx);
    const cur = ctx.focused;
    if (!cur || list.indexOf(cur) < 0) { UI.focus(list[0]); return; }
    const r0 = cur.getBoundingClientRect();
    const c0x = r0.left + r0.width / 2, c0y = r0.top + r0.height / 2;
    let best = null, bs = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = cx - c0x, dy = cy - c0y;
      let main, cross;
      if (dir === 'up') { if (dy >= -4) continue; main = -dy; cross = Math.abs(dx); }
      else if (dir === 'down') { if (dy <= 4) continue; main = dy; cross = Math.abs(dx); }
      else if (dir === 'left') { if (dx >= -4) continue; main = -dx; cross = Math.abs(dy); }
      else { if (dx <= 4) continue; main = dx; cross = Math.abs(dy); }
      const sc = main + cross * 2.4;
      if (sc < bs) { bs = sc; best = el; }
    }
    if (!best && (dir === 'up' || dir === 'down') && ctx.wrap !== false) {
      const col = list.filter((el) => Math.abs(el.getBoundingClientRect().left - r0.left) < 40);
      if (col.length > 1) best = dir === 'down' ? col[0] : col[col.length - 1];
      if (best === cur) best = null;
    }
    if (best) { UI.focus(best); TG.Audio.play('nav'); }
  };
  UI.step = function (d) {
    const ctx = UI.cur;
    const list = UI.focusables(ctx);
    if (!list.length) return;
    let i = list.indexOf(ctx.focused);
    i = i < 0 ? 0 : (i + d + list.length) % list.length;
    UI.focus(list[i]);
    TG.Audio.play('nav');
  };
  UI.onKey = function (e, code) {
    if (!UI.cur) return false;
    TG.Audio.init();
    if (UI.capture) return UI.capture(code, e);
    const ctx = UI.cur;
    if (ctx.onKey && ctx.onKey(code, e) === true) return true;
    const f = ctx.focused;
    switch (code) {
      case 'ArrowUp': case 'KeyW': if (ctx.linear && !ctx.modal) UI.step(-1); else UI.move('up'); return true;
      case 'ArrowDown': case 'KeyS': if (ctx.linear && !ctx.modal) UI.step(1); else UI.move('down'); return true;
      case 'ArrowLeft': case 'KeyA':
        if (f && f._adjust) { f._adjust(-1); TG.Audio.play('nav'); return true; }
        UI.move('left'); return true;
      case 'ArrowRight': case 'KeyD':
        if (f && f._adjust) { f._adjust(1); TG.Audio.play('nav'); return true; }
        UI.move('right'); return true;
      case 'Enter': case 'NumpadEnter': case 'Space':
        if (f) { if (!f._silent) TG.Audio.play('select'); f.click(); }
        return true;
      case 'Escape': case 'Backspace':
        UI.back(); return true;
      default: return false;
    }
  };
  UI.back = function () {
    const ctx = UI.cur;
    if (!ctx) return;
    if (ctx.modal) { UI.closeModal(); TG.Audio.play('back'); return; }
    if (ctx.onBack) { TG.Audio.play('back'); ctx.onBack(); }
  };
  UI.modal = function (html, buttons, opt) {
    const ctx = UI.cur;
    opt = opt || {};
    const wrap = U.el('div', 'modal-wrap');
    wrap.innerHTML = '<div class="modal">' + html + '<div class="modal-btns">' + buttons.map((b, i) => '<button class="btn ' + (b.cls || '') + '" data-nav data-mb="' + i + '">' + b.label + '</button>').join('') + '</div></div>';
    ctx.el.appendChild(wrap);
    ctx.prevFocus = ctx.focused;
    ctx.modal = wrap;
    buttons.forEach((b, i) => { $('[data-mb="' + i + '"]', wrap).addEventListener('click', () => { UI.closeModal(); if (b.fn) b.fn(); }); });
    UI.wire(wrap);
    UI.focus($('[data-mb="' + (opt.focus || 0) + '"]', wrap), true);
  };
  UI.closeModal = function () {
    const ctx = UI.cur;
    if (!ctx || !ctx.modal) return;
    ctx.modal.remove();
    ctx.modal = null;
    if (ctx.prevFocus && ctx.el.contains(ctx.prevFocus)) UI.focus(ctx.prevFocus, true);
    else UI.focus(UI.focusables(ctx)[0], true);
  };
  UI.toast = function (text, kind) {
    const t = document.getElementById('toast');
    const n = U.el('div', 'toast ' + (kind || ''), text);
    t.appendChild(n);
    setTimeout(() => n.classList.add('out'), 2200);
    setTimeout(() => n.remove(), 2700);
  };

  /* ---------- Piezas reutilizables ---------- */
  const esc = U.esc;
  const money = (n) => U.money(n);
  function header(title, eyebrow) {
    return '<header class="head"><div class="head-title">' + (eyebrow ? '<span class="eyebrow">' + esc(eyebrow) + '</span>' : '') +
      '<h1>' + esc(title) + '</h1></div><div class="wallet"><span class="wallet-label">Saldo</span><span class="wallet-val">' + money(S().money) + '</span></div></header>';
  }
  function hints(list) {
    return '<footer class="hints">' + list.map((h) => '<span><kbd>' + h[0] + '</kbd>' + esc(h[1]) + '</span>').join('') + '</footer>';
  }
  const HINTS = [['↑↓←→', 'Navegar'], ['Intro', 'Elegir'], ['Esc', 'Volver']];
  function speedTxt(kmh) {
    return S().settings.units === 'mph' ? Math.round(kmh * 0.6214) + ' mph' : Math.round(kmh) + ' km/h';
  }
  function bars(v, v2) {
    let h = '';
    for (let i = 0; i < 20; i++) {
      const t = (i + 0.5) / 20;
      h += '<i class="' + (t <= v ? 'on' : v2 && t <= v2 ? 'nx' : '') + '"></i>';
    }
    return h;
  }
  function statBlock(st, st2) {
    const b = TG.statBars(st), b2 = st2 ? TG.statBars(st2) : null;
    const row = (label, key, val, val2) => '<div class="stat"><span class="stat-l">' + label + '</span><span class="stat-bar">' + bars(b[key], b2 && b2[key] > b[key] + 0.001 ? b2[key] : 0) + '</span><span class="stat-v">' + val + (val2 && val2 !== val ? ' <em>→ ' + val2 + '</em>' : '') + '</span></div>';
    const grip = (s) => Math.round(U.clamp((s.grip - 0.9) / 0.65, 0, 1) * 100) + '';
    return '<div class="stats">' +
      row('Velocidad', 'speed', speedTxt(st.top), st2 ? speedTxt(st2.top) : null) +
      row('Aceleración', 'accel', '0-100 ' + st.t0100.toFixed(1) + ' s', st2 ? '0-100 ' + st2.t0100.toFixed(1) + ' s' : null) +
      row('Manejo', 'grip', grip(st) + '/100', st2 ? grip(st2) + '/100' : null) +
      row('Nitro', 'nitro', st.nitroN + ' cargas', st2 ? st2.nitroN + ' cargas' : null) + '</div>';
  }
  function adjRow(key, label, valueHtml, fn, extraCls) {
    return { html: '<div class="row ' + (extraCls || '') + '" data-nav data-key="' + key + '" data-adj="1"><span class="row-label">' + label + '</span><span class="row-val"><i class="arr" data-arrow="-1">◀</i><b class="row-b">' + valueHtml + '</b><i class="arr" data-arrow="1">▶</i></span></div>', key, fn };
  }
  function bindAdj(el, rows) {
    rows.forEach((r) => {
      const n = $('[data-key="' + r.key + '"]', el);
      if (n) n._adjust = r.fn;
    });
  }
  // expositor: el coche 3D gira despacio en la plataforma (si hay WebGL)
  UI.showAng = 2.2;
  function showroomInto(canvas, model, color) {
    if (canvas._raf) cancelAnimationFrame(canvas._raf);
    requestAnimationFrame(() => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(200, Math.round(r.width * dpr));
      canvas.height = Math.max(100, Math.round(r.height * dpr));
      let last = performance.now();
      const frame = (t) => {
        if (!canvas.isConnected) return;
        const CG = TG.CarGL;
        const gl = CG && CG.has(model.id);
        if (gl) UI.showAng += Math.min(0.1, (t - last) / 1000) * 0.3;
        last = t;
        TG.Art.showroom(canvas, model, color, gl ? { angle: UI.showAng } : {});
        if (gl || (CG && CG.ok && !CG.ready)) canvas._raf = requestAnimationFrame(frame);
      };
      frame(last);
    });
  }
  function flagCanvas(id, w, h) {
    const c = U.canvas(w * 2, h * 2);
    TG.Art.flag(c.getContext('2d'), id, 0, 0, w * 2, h * 2);
    c.className = 'flag';
    c.style.width = w + 'px'; c.style.height = h + 'px';
    return c;
  }
  function thumbInto(canvas, themeId) {
    const img = TG.Art.themePreview(TG.THEMES[themeId], canvas.width, canvas.height);
    canvas.getContext('2d').drawImage(img, 0, 0);
  }
  // coches ordenados por precio (el orden de TG.CARS no se toca: las copas usan sus índices)
  const byPrice = () => TG._byPrice || (TG._byPrice = TG.CARS.slice().sort((a, b) => a.price - b.price || a.index - b.index));
  const ownedIds = () => byPrice().filter((c) => S().cars[c.id]).map((c) => c.id);
  function unlockedTracks() {
    const list = [];
    TG.CUPS.forEach((cup, ci) => { if (ci < S().unlocked) cup.tracks.forEach((t) => list.push(t.id)); });
    return list;
  }
  function carCfg(carId, profile, name) {
    const c = S().cars[carId];
    return { carId, color: c.color, up: Object.assign({}, c.up), profile, manual: S().settings.trans === 'manual', name };
  }
  UI.carCfg = carCfg;

  /* ================= PANTALLAS ================= */
  SCREENS.title = {
    overlay: false,
    render(ctx) {
      ctx.el.innerHTML =
        '<div class="title-wrap">' +
        '<div class="logo"><div class="logo-top">TOP</div><div class="logo-gear">GEAR</div>' +
        '<div class="logo-stripe"><i></i><i></i><i></i></div><div class="logo-sub">SUPERCAR LEGENDS</div></div>' +
        '<button class="press" data-nav>Pulsa <kbd>Intro</kbd> para arrancar</button></div>' +
        '<div class="title-foot"><span><kbd>↑↓←→</kbd> / <kbd>WASD</kbd> conducir</span><span><kbd>Espacio</kbd> nitro</span><span><kbd>Esc</kbd> pausa</span><span><kbd>M</kbd> música</span></div>';
      $('.press', ctx.el).addEventListener('click', () => {
        TG.Audio.init();
        TG.Music.play('menu');
        UI.show('main');
      });
    },
  };

  SCREENS.main = {
    render(ctx) {
      ctx.linear = true;
      const items = [
        ['career', 'Campeonato', '8 copas · 32 circuitos · premios en metálico'],
        ['quick', 'Carrera rápida', 'Elige circuito, vueltas y rivales'],
        ['versus', '2 jugadores', 'Pantalla dividida en el mismo teclado'],
        ['time', 'Contrarreloj', 'Bate tus récords de vuelta'],
        ['garage', 'Garaje', 'Tus coches, mejoras y pintura'],
        ['dealer', 'Concesionario', 'Bugatti, Ferrari, Lamborghini, Aston Martin…'],
        ['options', 'Opciones', 'Sonido, gráficos y controles'],
      ];
      const model = TG.Save.activeModel(), car = TG.Save.car();
      const st = TG.carStats(model, car.up);
      ctx.el.innerHTML = header('Menú principal', 'Top Gear · Supercar Legends') +
        '<div class="main-grid"><nav class="slabs">' +
        items.map((it) => '<button class="slab" data-nav data-key="' + it[0] + '"><span class="slab-t">' + it[1] + '</span><small>' + it[2] + '</small></button>').join('') +
        '</nav><aside class="card current">' +
        '<div class="card-eyebrow">Coche activo</div><div class="car-name"><span>' + esc(model.brand) + '</span>' + esc(model.name) + '</div>' +
        '<canvas class="show-sm"></canvas>' + statBlock(st) +
        '<div class="mini-stats"><div><b>' + S().stats.races + '</b><span>carreras</span></div><div><b>' + S().stats.wins + '</b><span>victorias</span></div><div><b>' + Object.keys(S().cars).length + '/' + TG.CARS.length + '</b><span>coches</span></div></div>' +
        '</aside></div>' + hints([['↑↓', 'Navegar'], ['Intro', 'Elegir'], ['Esc', 'Pantalla de título']]);
      items.forEach((it) => $('[data-key="' + it[0] + '"]', ctx.el).addEventListener('click', () => UI.show(it[0])));
      showroomInto($('.show-sm', ctx.el), model, car.color);
      ctx.onBack = () => UI.show('title');
      ctx.initial = ctx.params.focus ? '[data-key="' + ctx.params.focus + '"]' : null;
    },
  };

  /* ---------- Campeonato ---------- */
  SCREENS.career = {
    render(ctx) {
      const d = S();
      ctx.el.innerHTML = header('Campeonato', 'Gana dinero · desbloquea copas') +
        '<p class="lead-copy">Termina cada copa entre los tres primeros para desbloquear la siguiente. Puedes repetir cualquier copa desbloqueada para ganar más dinero.</p>' +
        '<div class="cups" data-scroll="cups">' + TG.CUPS.map((cup, i) => {
          const locked = i >= d.unlocked;
          const st = d.cups[i];
          const trophy = st.trophy ? '<span class="trophy t' + st.trophy + '" title="Trofeo"></span>' : '';
          const run = st.run ? '<span class="tag live">En curso · ' + (st.run.race + 1) + '/4</span>' : '';
          return '<button class="cup ' + (locked ? 'locked' : '') + '" data-nav data-key="cup' + i + '" data-i="' + i + '">' +
            '<canvas class="cup-thumb" width="320" height="170"></canvas>' +
            '<div class="cup-info"><span class="flag-slot"></span><div class="cup-txt"><div class="cup-name">' + esc(cup.name) + '</div>' +
            '<div class="cup-meta">1º puesto: ' + money(cup.prize) + ' · Rivales ' + TG.cupSpeed(cup) + ' km/h</div></div>' + trophy + '</div>' + run +
            (locked ? '<div class="cup-lock"><span>Bloqueada</span><small>Podio en ' + esc(TG.CUPS[i - 1].name) + '</small></div>' : '') +
            '</button>';
        }).join('') + '</div>' + hints(HINTS);
      $$('.cup', ctx.el).forEach((b) => {
        const i = +b.dataset.i;
        thumbInto($('.cup-thumb', b), TG.CUPS[i].tracks[0].theme);
        $('.flag-slot', b).appendChild(flagCanvas(TG.CUPS[i].flag, 30, 20));
        b.addEventListener('click', () => {
          if (i >= S().unlocked) { TG.Audio.play('error'); UI.toast('Copa bloqueada: termina en el podio de ' + TG.CUPS[i - 1].name + '.', 'warn'); return; }
          UI.show('cup', { i });
        });
      });
      ctx.onBack = () => UI.show('main', { focus: 'career' });
      ctx.initial = '[data-key="cup' + (ctx.params.i != null ? ctx.params.i : Math.min(S().unlocked - 1, TG.CUPS.length - 1)) + '"]';
    },
  };

  function standings(run) {
    const rows = run.drivers.map((dv) => ({ name: dv.name, car: TG.CAR[dv.carId], pts: run.points[dv.id] || 0, me: false }));
    rows.push({ name: 'Tú', car: TG.Save.activeModel(), pts: run.points.player || 0, me: true });
    rows.sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
    return rows;
  }
  UI.standings = standings;

  function carPicker(ctx, key, label, getId, setId) {
    const ids = ownedIds();
    const id = getId();
    const m = TG.CAR[id];
    return adjRow(key, label, esc(m.brand + ' ' + m.name), (dlt) => {
      const list = ownedIds();
      let i = list.indexOf(getId());
      i = (i + dlt + list.length) % list.length;
      setId(list[i]);
      TG.Save.save();
      UI.refresh();
    }, ids.length < 2 ? 'single' : '');
  }

  // nivel de los rivales (1-10) de un circuito según el avance y la dificultad elegida
  function rivalLevel(t) {
    const D = TG.DIFFICULTY[S().settings.difficulty] || TG.DIFFICULTY.normal;
    return 1 + Math.round(U.clamp(TG.raceLevel(t) + D.off, 0, 1) * 9);
  }
  function lvlBar(t) {
    const n = rivalLevel(t);
    const D = TG.DIFFICULTY[S().settings.difficulty] || TG.DIFFICULTY.normal;
    const up = TG.aiUpgrades(U.clamp(TG.raceLevel(t) + D.off, 0, 1));
    const parts = up.motor + up.turbo + up.tires > 0 ? '<em>Motor ' + up.motor + ' · Turbo ' + up.turbo + ' · Neum. ' + up.tires + '</em>' : '<em>Piezas de serie</em>';
    return '<span class="lvl" title="Nivel y piezas de los rivales">Rivales <i style="--l:' + n * 10 + '%"></i><b>' + n + '/10</b>' + parts + '</span>';
  }

  SCREENS.cup = {
    render(ctx) {
      ctx.linear = true;
      const i = ctx.params.i;
      const cup = TG.CUPS[i];
      const st = S().cups[i];
      const run = st.run;
      const model = TG.Save.activeModel(), car = TG.Save.car();
      const cst = TG.carStats(model, car.up);
      const nextIdx = run ? run.race : 0;
      const recs = S().records;
      const trackRows = cup.tracks.map((t, ti) => {
        const th = TG.THEMES[t.theme];
        const done = run && ti < run.race;
        const res = run && run.results[ti];
        const rec = recs[t.id];
        return '<div class="track-row ' + (ti === nextIdx ? 'next' : '') + (done ? ' done' : '') + '">' +
          '<canvas class="tr-thumb" width="200" height="112" data-theme="' + t.theme + '"></canvas>' +
          '<div class="tr-body"><div class="tr-num">Carrera ' + (ti + 1) + '</div><div class="tr-name">' + esc(t.name) + '</div>' +
          '<div class="tr-meta">' + TG.TIME_LABEL[th.time] + ' · ' + TG.WEATHER_LABEL[th.weather] + ' · 3 vueltas</div>' + lvlBar(t) + '</div>' +
          '<div class="tr-res">' + (done ? '<b>' + res + 'º</b><span>resultado</span>' : rec && rec.lap ? '<b>' + U.timeShort(rec.lap) + '</b><span>mejor vuelta</span>' : '<span class="muted">—</span>') + '</div></div>';
      }).join('');
      let right = '';
      if (run) {
        const rows = standings(run).slice(0, 10);
        right = '<div class="card"><div class="card-eyebrow">Clasificación de la copa</div><table class="tbl"><tbody>' +
          rows.map((r, k) => '<tr class="' + (r.me ? 'me' : '') + '"><td class="pos">' + (k + 1) + '</td><td>' + esc(r.name) + '</td><td class="muted">' + esc(r.car.brand) + '</td><td class="num">' + r.pts + '</td></tr>').join('') +
          '</tbody></table></div>';
      } else {
        const pct = TG.ECON.prizePct;
        right = '<div class="card"><div class="card-eyebrow">Premios por carrera</div><div class="prize-list">' +
          [0, 1, 2, 3, 4].map((k) => '<div><span>' + (k + 1) + 'º</span><b>' + money(Math.round((cup.prize * pct[k]) / 50) * 50) + '</b></div>').join('') +
          '</div><div class="card-eyebrow" style="margin-top:14px">Bonus final de copa</div><div class="prize-list">' +
          TG.ECON.cupBonus.map((b, k) => '<div><span>' + (k + 1) + 'º</span><b>' + money(Math.round((cup.prize * b) / 50) * 50) + '</b></div>').join('') +
          '</div><p class="small muted">Puntos: 25-18-15-12-10-8-6-4-2-1 · Moneda: ' + money(cup.coin) + '</p></div>';
      }
      const pick = carPicker(ctx, 'car', 'Coche', () => S().active, (id) => { S().active = id; });
      const next = cup.tracks[nextIdx];
      ctx.el.innerHTML = header(cup.name, 'Copa ' + (i + 1) + ' de ' + TG.CUPS.length) +
        '<div class="cup-grid"><div class="tracks">' + trackRows + '</div><div class="cup-side">' + right +
        '<div class="card"><div class="card-eyebrow">Tu coche</div>' + pick.html + statBlock(cst) +
        (cst.top < TG.cupSpeed(cup) * 0.97 ? '<p class="warn-txt">Tus rivales alcanzan ' + speedTxt(TG.cupSpeed(cup)) + ' y mejoran sus piezas en cada carrera. Mejora el motor o compra un coche más rápido.</p>' : '') + '</div>' +
        '<button class="btn primary big" data-nav data-key="go">' + (run ? 'Continuar · ' + esc(next.name) : 'Empezar copa · ' + esc(next.name)) + '</button>' +
        (run ? '<button class="btn ghost" data-nav data-key="reset">Reiniciar copa</button>' : '') +
        '<button class="btn ghost" data-nav data-key="garage">Ir al garaje</button>' +
        '</div></div>' + hints([['↑↓', 'Navegar'], ['←→', 'Cambiar coche'], ['Intro', 'Elegir'], ['Esc', 'Volver']]);
      bindAdj(ctx.el, [pick]);
      $$('.tr-thumb', ctx.el).forEach((c) => thumbInto(c, c.dataset.theme));
      $('[data-key="go"]', ctx.el).addEventListener('click', () => {
        const d = S();
        if (!d.cups[i].run) {
          const seed = (Date.now() & 0xffff) + i * 97;
          d.cups[i].run = { race: 0, points: {}, results: [], drivers: TG.Race.makeDrivers(cup, 15, seed) };
          TG.Save.save();
        }
        const r = d.cups[i].run;
        TG.Game.startRace({
          mode: 'career', trackId: cup.tracks[r.race].id, laps: 3, rivals: 15, drivers: r.drivers, cupIndex: i,
          players: [carCfg(d.active, 'solo', 'Tú')],
        });
      });
      const rs = $('[data-key="reset"]', ctx.el);
      if (rs) rs.addEventListener('click', () => UI.modal('<h2>¿Reiniciar la copa?</h2><p>Perderás los puntos acumulados en esta copa. El dinero ganado se conserva.</p>', [
        { label: 'Reiniciar', cls: 'primary', fn: () => { S().cups[i].run = null; TG.Save.save(); UI.refresh(); } },
        { label: 'Cancelar', cls: 'ghost' },
      ], { focus: 1 }));
      $('[data-key="garage"]', ctx.el).addEventListener('click', () => UI.show('garage', { from: { name: 'cup', params: { i } } }));
      ctx.onBack = () => UI.show('career', { i });
      ctx.initial = '[data-key="go"]';
    },
  };

  /* ---------- Carrera rápida / Contrarreloj / 2 jugadores ---------- */
  function trackPicker(key, getId, setId) {
    const t = TG.TRACKS[getId()];
    const cup = TG.CUPS[t.cup];
    return adjRow(key, 'Circuito', esc(t.name) + ' <small>' + esc(cup.name) + '</small>', (dl) => {
      const list = unlockedTracks();
      let i = list.indexOf(getId());
      if (i < 0) i = 0;
      i = (i + dl + list.length) % list.length;
      setId(list[i]);
      TG.Save.save();
      UI.refresh();
    });
  }
  function trackPreview(tid) {
    const t = TG.TRACKS[tid], th = TG.THEMES[t.theme], cup = TG.CUPS[t.cup];
    return '<div class="card preview"><canvas class="pv" width="640" height="340" data-theme="' + t.theme + '"></canvas>' +
      '<div class="pv-info"><span class="flag-slot" data-flag="' + cup.flag + '"></span><div><div class="pv-name">' + esc(t.name) + '</div><div class="pv-meta">' +
      esc(cup.name) + ' · ' + TG.TIME_LABEL[th.time] + ' · ' + TG.WEATHER_LABEL[th.weather] + '</div>' + lvlBar(t) + '</div></div></div>';
  }
  function fillPreview(el) {
    $$('.pv', el).forEach((c) => thumbInto(c, c.dataset.theme));
    $$('[data-flag]', el).forEach((s) => s.appendChild(flagCanvas(s.dataset.flag, 30, 20)));
  }
  function ensureTrack(obj) {
    const list = unlockedTracks();
    if (list.indexOf(obj.track) < 0) obj.track = list[0];
  }

  SCREENS.quick = {
    render(ctx) {
      ctx.linear = true;
      const q = S().quick;
      ensureTrack(q);
      const rows = [
        trackPicker('track', () => q.track, (id) => { q.track = id; }),
        adjRow('laps', 'Vueltas', q.laps, (d) => { q.laps = U.clamp(q.laps + d, 1, 6); TG.Save.save(); UI.refresh(); }),
        adjRow('rivals', 'Rivales', q.rivals, (d) => { const o = [0, 3, 5, 7, 9, 11, 15]; let i = o.indexOf(q.rivals); i = U.clamp((i < 0 ? 5 : i) + d, 0, o.length - 1); q.rivals = o[i]; TG.Save.save(); UI.refresh(); }),
        carPicker(ctx, 'car', 'Coche', () => S().active, (id) => { S().active = id; }),
      ];
      const cup = TG.CUPS[TG.TRACKS[q.track].cup];
      ctx.el.innerHTML = header('Carrera rápida', 'Una carrera suelta') +
        '<div class="setup-grid"><div class="setup-rows">' + rows.map((r) => r.html).join('') +
        '<p class="small muted">Premio de carrera rápida: 75% del premio de la copa ' + esc(cup.name) + ' (1º: ' + money(Math.round((cup.prize * 0.75) / 50) * 50) + ') más las monedas que recojas.</p>' +
        '<button class="btn primary big" data-nav data-key="go">¡Correr!</button></div>' + trackPreview(q.track) + '</div>' + hints([['↑↓', 'Navegar'], ['←→', 'Cambiar'], ['Intro', 'Correr'], ['Esc', 'Volver']]);
      bindAdj(ctx.el, rows);
      fillPreview(ctx.el);
      $('[data-key="go"]', ctx.el).addEventListener('click', () => TG.Game.startRace({ mode: 'quick', trackId: q.track, laps: q.laps, rivals: q.rivals, players: [carCfg(S().active, 'solo', 'Tú')] }));
      ctx.onBack = () => UI.show('main', { focus: 'quick' });
      ctx.initial = ctx.params.focus || null;
    },
  };

  SCREENS.time = {
    render(ctx) {
      ctx.linear = true;
      const q = S().quick;
      ensureTrack(q);
      const rows = [
        trackPicker('track', () => q.track, (id) => { q.track = id; }),
        carPicker(ctx, 'car', 'Coche', () => S().active, (id) => { S().active = id; }),
      ];
      const rec = S().records[q.track] || {};
      ctx.el.innerHTML = header('Contrarreloj', 'Tú contra el crono') +
        '<div class="setup-grid"><div class="setup-rows">' + rows.map((r) => r.html).join('') +
        '<div class="card records"><div class="card-eyebrow">Récords del circuito</div><div class="rec"><span>Mejor vuelta</span><b>' + U.time(rec.lap) + '</b></div>' +
        '<div class="rec"><span>Mejor carrera (3 vueltas)</span><b>' + U.time(rec.race) + '</b></div>' +
        (rec.lapCar && TG.CAR[rec.lapCar] ? '<div class="rec"><span>Coche del récord</span><b>' + esc(TG.CAR[rec.lapCar].brand + ' ' + TG.CAR[rec.lapCar].name) + '</b></div>' : '') +
        '<div class="rec"><span>Coche fantasma</span><b>' + (S().ghosts[q.track] ? 'Tu mejor vuelta (' + U.timeShort(S().ghosts[q.track].time) + ')' : 'Se crea al completar una vuelta') + '</b></div></div>' +
        '<button class="btn primary big" data-nav data-key="go">Salir a pista</button></div>' + trackPreview(q.track) + '</div>' + hints([['↑↓', 'Navegar'], ['←→', 'Cambiar'], ['Intro', 'Correr'], ['Esc', 'Volver']]);
      bindAdj(ctx.el, rows);
      fillPreview(ctx.el);
      $('[data-key="go"]', ctx.el).addEventListener('click', () => TG.Game.startRace({ mode: 'time', trackId: q.track, laps: 3, rivals: 0, players: [carCfg(S().active, 'solo', 'Tú')] }));
      ctx.onBack = () => UI.show('main', { focus: 'time' });
    },
  };

  SCREENS.versus = {
    render(ctx) {
      ctx.linear = true;
      const q = S().versus;
      ensureTrack(q);
      if (!S().cars[q.car2]) q.car2 = S().active;
      const k = S().keys;
      const kn = TG.Input.keyName;
      const rows = [
        trackPicker('track', () => q.track, (id) => { q.track = id; }),
        adjRow('laps', 'Vueltas', q.laps, (d) => { q.laps = U.clamp(q.laps + d, 1, 6); TG.Save.save(); UI.refresh(); }),
        adjRow('rivals', 'Rivales CPU', q.rivals, (d) => { q.rivals = U.clamp(q.rivals + d, 0, 9); TG.Save.save(); UI.refresh(); }),
        carPicker(ctx, 'car1', 'Coche J1', () => S().active, (id) => { S().active = id; }),
        carPicker(ctx, 'car2', 'Coche J2', () => q.car2, (id) => { q.car2 = id; }),
      ];
      const keysTxt = (p) => kn(k[p].accel[0]) + ' ' + kn(k[p].left[0]) + ' ' + kn(k[p].brake[0]) + ' ' + kn(k[p].right[0]) + ' · nitro ' + kn(k[p].nitro[0]);
      ctx.el.innerHTML = header('2 jugadores', 'Pantalla dividida') +
        '<div class="setup-grid"><div class="setup-rows">' + rows.map((r) => r.html).join('') +
        '<div class="card keys2"><div><span class="pl p1">J1 · arriba</span><b>' + esc(keysTxt('p1')) + '</b></div><div><span class="pl p2">J2 · abajo</span><b>' + esc(keysTxt('p2')) + '</b></div></div>' +
        '<button class="btn primary big" data-nav data-key="go">¡A correr!</button></div>' + trackPreview(q.track) + '</div>' + hints([['↑↓', 'Navegar'], ['←→', 'Cambiar'], ['Intro', 'Correr'], ['Esc', 'Volver']]);
      bindAdj(ctx.el, rows);
      fillPreview(ctx.el);
      $('[data-key="go"]', ctx.el).addEventListener('click', () => {
        const p1 = carCfg(S().active, 'p1', 'Jugador 1');
        const p2 = carCfg(q.car2, 'p2', 'Jugador 2');
        if (p2.carId === p1.carId && p2.color === p1.color) {
          const alt = TG.PAINTS.find((pp) => pp.c !== p1.color && U.lum(pp.c) > 0.2);
          p2.color = alt ? alt.c : '#ff7a1a';
        }
        TG.Game.startRace({ mode: 'versus', trackId: q.track, laps: q.laps, rivals: q.rivals, players: [p1, p2] });
      });
      ctx.onBack = () => UI.show('main', { focus: 'versus' });
    },
  };

  /* ---------- Garaje ---------- */
  SCREENS.garage = {
    studio: true,
    render(ctx) {
      ctx.linear = true;
      const ids = ownedIds();
      if (ctx.sel == null || ids.indexOf(ctx.sel) < 0) ctx.sel = ctx.params.car && ids.indexOf(ctx.params.car) >= 0 ? ctx.params.car : S().active;
      const id = ctx.sel, model = TG.CAR[id], car = S().cars[id];
      const st = TG.carStats(model, car.up);
      const lv = TG.UPGRADES.reduce((a, u) => a + (car.up[u.id] || 0), 0);
      const maxLv = TG.UPGRADES.reduce((a, u) => a + u.max, 0);
      const active = S().active === id;
      ctx.el.innerHTML = header('Garaje', ids.length + ' de ' + TG.CARS.length + ' coches') +
        '<div class="studio-grid"><div class="stage"><div class="stage-bg">' + esc(model.brand.toUpperCase()) + '</div><canvas class="show-lg"></canvas>' +
        '<div class="carousel" data-nav data-key="car" data-adj="1"><i class="arr" data-arrow="-1">◀</i><div class="car-name big"><span>' + esc(model.brand) + '</span>' + esc(model.name) + '</div><i class="arr" data-arrow="1">▶</i></div>' +
        '<div class="dots">' + ids.map((x) => '<i class="' + (x === id ? 'on' : '') + '"></i>').join('') + '</div></div>' +
        '<div class="studio-side"><div class="card"><div class="card-eyebrow">Rendimiento</div>' + statBlock(st) +
        '<div class="up-meter"><span>Mejoras instaladas</span><b>' + lv + '/' + maxLv + '</b></div></div>' +
        '<p class="desc">' + esc(model.desc) + '</p>' +
        (active ? '<div class="badge-active">En uso para competir</div>' : '<button class="btn primary" data-nav data-key="use">Usar este coche</button>') +
        '<button class="btn" data-nav data-key="shop">Taller de mejoras</button>' +
        '<button class="btn" data-nav data-key="paint">Pintura</button>' +
        '<button class="btn ghost" data-nav data-key="dealer">Concesionario</button>' +
        '</div></div>' + hints([['←→', 'Cambiar de coche'], ['↑↓', 'Navegar'], ['Intro', 'Elegir'], ['Esc', 'Volver']]);
      const carEl = $('[data-key="car"]', ctx.el);
      carEl._adjust = (d) => { let i = ids.indexOf(ctx.sel); i = (i + d + ids.length) % ids.length; ctx.sel = ids[i]; UI.refresh(); };
      carEl._silent = true;
      ctx.onKey = (code) => {
        if (ctx.modal) return false;
        const d = code === 'ArrowLeft' || code === 'KeyA' ? -1 : code === 'ArrowRight' || code === 'KeyD' ? 1 : 0;
        if (d && ids.length > 1) { carEl._adjust(d); TG.Audio.play('nav'); return true; }
        return d !== 0;
      };
      showroomInto($('.show-lg', ctx.el), model, car.color);
      const use = $('[data-key="use"]', ctx.el);
      if (use) use.addEventListener('click', () => { S().active = id; TG.Save.save(); UI.toast(model.brand + ' ' + model.name + ' listo para competir', 'ok'); UI.refresh('[data-key="shop"]'); });
      $('[data-key="shop"]', ctx.el).addEventListener('click', () => UI.show('shop', { car: id, back: ctx.params.from }));
      $('[data-key="paint"]', ctx.el).addEventListener('click', () => UI.show('paint', { car: id, back: ctx.params.from }));
      $('[data-key="dealer"]', ctx.el).addEventListener('click', () => UI.show('dealer'));
      ctx.onBack = () => (ctx.params.from ? UI.show(ctx.params.from.name, ctx.params.from.params) : UI.show('main', { focus: 'garage' }));
      ctx.initial = ctx.initial || '[data-key="car"]';
    },
  };

  SCREENS.shop = {
    studio: true,
    render(ctx) {
      ctx.linear = true;
      const id = S().cars[ctx.params.car] ? ctx.params.car : S().active, model = TG.CAR[id], car = S().cars[id];
      const st = TG.carStats(model, car.up);
      const foc = ctx.focusUp || TG.UPGRADES[0].id;
      const fu = TG.UPGRADES.find((u) => u.id === foc);
      let st2 = null;
      if (fu && (car.up[fu.id] || 0) < fu.max) { const up2 = Object.assign({}, car.up); up2[fu.id] = (up2[fu.id] || 0) + 1; st2 = TG.carStats(model, up2); }
      ctx.el.innerHTML = header('Taller de mejoras', model.brand + ' ' + model.name) +
        '<div class="shop-grid"><div class="up-list">' + TG.UPGRADES.map((u) => {
          const l = car.up[u.id] || 0;
          const maxed = l >= u.max;
          const cost = maxed ? 0 : TG.upgradeCost(model, u, l);
          const can = !maxed && S().money >= cost;
          let pips = '';
          for (let k = 0; k < u.max; k++) pips += '<i class="' + (k < l ? 'on' : '') + '"></i>';
          return '<button class="up ' + (maxed ? 'maxed' : can ? '' : 'poor') + '" data-nav data-key="' + u.id + '"><div class="up-main"><div class="up-name">' + u.name + '<span class="pips">' + pips + '</span></div>' +
            '<div class="up-desc">' + esc(u.desc) + '</div></div><div class="up-cost">' + (maxed ? '<b>Máximo</b>' : '<span>Nivel ' + (l + 1) + '</span><b>' + money(cost) + '</b>') + '</div></button>';
        }).join('') + '</div>' +
        '<div class="studio-side"><canvas class="show-md"></canvas><div class="card"><div class="card-eyebrow">' + (st2 ? 'Con la mejora seleccionada' : 'Rendimiento') + '</div>' + statBlock(st, st2) + '</div></div></div>' +
        hints([['↑↓', 'Elegir pieza'], ['Intro', 'Comprar'], ['Esc', 'Volver']]);
      showroomInto($('.show-md', ctx.el), model, car.color);
      TG.UPGRADES.forEach((u) => {
        const b = $('[data-key="' + u.id + '"]', ctx.el);
        b._silent = true;
        b.addEventListener('click', () => {
          const l = car.up[u.id] || 0;
          if (l >= u.max) { TG.Audio.play('error'); UI.toast(u.name + ': ya está al máximo.'); return; }
          const cost = TG.upgradeCost(model, u, l);
          if (S().money < cost) { TG.Audio.play('error'); UI.toast('Te faltan ' + money(cost - S().money) + ' para ' + u.name.toLowerCase() + ' nivel ' + (l + 1) + '.', 'warn'); return; }
          S().money -= cost;
          car.up[u.id] = l + 1;
          TG.Save.save();
          TG.Audio.play('upgrade');
          UI.toast(u.name + ' nivel ' + (l + 1) + ' instalado', 'ok');
          ctx.focusUp = u.id;
          UI.refresh('[data-key="' + u.id + '"]');
        });
      });
      ctx.onFocus = (el) => {
        const k = el.dataset.key;
        if (k && k !== ctx.focusUp) { ctx.focusUp = k; UI.refresh('[data-key="' + k + '"]'); }
      };
      ctx.initial = '[data-key="' + foc + '"]';
      ctx.onBack = () => UI.show('garage', { car: id, from: ctx.params.back });
    },
  };

  SCREENS.paint = {
    studio: true,
    render(ctx) {
      const id = S().cars[ctx.params.car] ? ctx.params.car : S().active, model = TG.CAR[id], car = S().cars[id];
      if (ctx.preview == null) ctx.preview = car.color;
      const opts = [{ name: 'De fábrica', c: model.color }].concat(TG.PAINTS);
      ctx.el.innerHTML = header('Pintura', model.brand + ' ' + model.name) +
        '<div class="studio-grid"><div class="stage"><canvas class="show-lg"></canvas><div class="paint-name">' + esc((opts.find((o) => o.c === ctx.preview) || { name: '' }).name) + '</div></div>' +
        '<div class="studio-side"><div class="swatches">' + opts.map((o, k) => '<button class="sw ' + (o.c === car.color ? 'cur' : '') + '" data-nav data-key="sw' + k + '" data-c="' + o.c + '" title="' + esc(o.name) + '"><i style="background:' + o.c + '"></i></button>').join('') + '</div>' +
        '<p class="small muted">La pintura es gratis. Pulsa Intro para aplicar el color.</p></div></div>' + hints([['↑↓←→', 'Color'], ['Intro', 'Aplicar'], ['Esc', 'Volver']]);
      const cv = $('.show-lg', ctx.el);
      showroomInto(cv, model, ctx.preview);
      $$('.sw', ctx.el).forEach((b) => b.addEventListener('click', () => {
        car.color = b.dataset.c;
        TG.Save.save();
        TG.Audio.play('buy');
        UI.toast('Pintura aplicada', 'ok');
        UI.show('garage', { car: id, from: ctx.params.back });
      }));
      ctx.onFocus = (el) => {
        const c = el.dataset.c;
        if (c && c !== ctx.preview) {
          ctx.preview = c;
          showroomInto(cv, model, c);
          const nm = opts.find((o) => o.c === c);
          $('.paint-name', ctx.el).textContent = nm ? nm.name : '';
        }
      };
      const curIdx = Math.max(0, opts.findIndex((o) => o.c === car.color));
      ctx.initial = '[data-key="sw' + curIdx + '"]';
      ctx.onBack = () => UI.show('garage', { car: id, from: ctx.params.back });
    },
  };

  /* ---------- Concesionario ---------- */
  SCREENS.dealer = {
    studio: true,
    render(ctx) {
      ctx.linear = true;
      if (ctx.sel == null) {
        const firstNew = byPrice().find((c) => !S().cars[c.id]);
        ctx.sel = ctx.params.car || (firstNew ? firstNew.id : byPrice()[0].id);
      }
      const model = TG.CAR[ctx.sel];
      const owned = !!S().cars[model.id];
      const st = TG.carStats(model, owned ? S().cars[model.id].up : {});
      const can = S().money >= model.price;
      const list = byPrice();
      const idx = list.indexOf(model);
      ctx.el.innerHTML = header('Concesionario', (idx + 1) + ' / ' + list.length) +
        '<div class="studio-grid"><div class="stage"><div class="stage-bg">' + esc(model.brand.toUpperCase()) + '</div><canvas class="show-lg"></canvas>' +
        '<div class="carousel" data-nav data-key="car" data-adj="1"><i class="arr" data-arrow="-1">◀</i><div class="car-name big"><span>' + esc(model.brand) + '</span>' + esc(model.name) + '</div><i class="arr" data-arrow="1">▶</i></div>' +
        '<div class="dots">' + list.map((c) => '<i class="' + (c.id === model.id ? 'on' : '') + (S().cars[c.id] ? ' own' : '') + '"></i>').join('') + '</div></div>' +
        '<div class="studio-side"><div class="price-tag ' + (owned ? 'own' : can ? '' : 'poor') + '"><span>' + (owned ? 'En tu garaje' : 'Precio') + '</span><b>' + (owned ? '✓' : model.price === 0 ? 'Gratis' : money(model.price)) + '</b></div>' +
        '<div class="card"><div class="card-eyebrow">Ficha técnica · de serie</div>' + statBlock(TG.carStats(model, {})) + '</div>' +
        '<p class="desc">' + esc(model.desc) + '</p>' +
        (owned ? '<button class="btn" data-nav data-key="garage">Ver en el garaje</button>' : '<button class="btn primary" data-nav data-key="buy">Comprar por ' + money(model.price) + '</button>') +
        (!owned && !can ? '<p class="warn-txt">Te faltan ' + money(model.price - S().money) + '. Gana carreras para conseguirlo.</p>' : '') +
        '</div></div>' + hints([['←→', 'Cambiar de coche'], ['↑↓', 'Navegar'], ['Intro', 'Elegir'], ['Esc', 'Volver']]);
      void st;
      const carEl = $('[data-key="car"]', ctx.el);
      carEl._silent = true;
      carEl._adjust = (d) => { const i = (idx + d + list.length) % list.length; ctx.sel = list[i].id; UI.refresh(); };
      ctx.onKey = (code) => {
        if (ctx.modal) return false;
        const d = code === 'ArrowLeft' || code === 'KeyA' ? -1 : code === 'ArrowRight' || code === 'KeyD' ? 1 : 0;
        if (d) { carEl._adjust(d); TG.Audio.play('nav'); return true; }
        return false;
      };
      showroomInto($('.show-lg', ctx.el), model, model.color);
      const buy = $('[data-key="buy"]', ctx.el);
      if (buy) {
        buy._silent = true;
        buy.addEventListener('click', () => {
          if (S().money < model.price) { TG.Audio.play('error'); UI.toast('Te faltan ' + money(model.price - S().money) + ' para el ' + model.name + '.', 'warn'); return; }
          TG.Audio.play('select');
          UI.modal('<h2>' + esc(model.brand + ' ' + model.name) + '</h2><p>¿Comprarlo por <b>' + money(model.price) + '</b>? Te quedarán ' + money(S().money - model.price) + '.</p>', [
            { label: 'Comprar', cls: 'primary', fn: () => {
              S().money -= model.price;
              S().cars[model.id] = { color: model.color, up: {} };
              S().active = model.id;
              TG.Save.save();
              TG.Audio.play('buy');
              UI.toast('¡Enhorabuena! ' + model.brand + ' ' + model.name + ' ya es tuyo', 'ok');
              UI.refresh('[data-key="car"]');
            } },
            { label: 'Cancelar', cls: 'ghost' },
          ]);
        });
      }
      const gar = $('[data-key="garage"]', ctx.el);
      if (gar) gar.addEventListener('click', () => UI.show('garage', { car: model.id }));
      ctx.onBack = () => UI.show('main', { focus: 'dealer' });
      ctx.initial = '[data-key="car"]';
    },
  };

  /* ---------- Opciones ---------- */
  // Indicador discreto de «Partida guardada»
  UI.saved = function () {
    let el = document.getElementById('saveBadge');
    if (!el) { el = U.el('div', 'save-badge', '<i></i>Partida guardada'); el.id = 'saveBadge'; document.body.appendChild(el); }
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(UI._sbT); UI._sbT = setTimeout(() => el.classList.remove('on'), 1600);
  };
  function exportSave() {
    const text = TG.Save.exportText();
    try {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tgApp) { window.webkit.messageHandlers.tgApp.postMessage('export:' + text); return; }
    } catch (e) { /* navegador */ }
    const a = document.createElement('a');
    const d = new Date();
    a.download = 'TopGear-partida-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '.json';
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    UI.toast('Partida exportada: guarda el archivo para recuperarla cuando quieras.', 'ok');
  }
  function importSave() {
    try {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tgApp) { window.webkit.messageHandlers.tgApp.postMessage('import'); return; }
    } catch (e) { /* navegador */ }
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => UI.importDone(TG.Save.importText(String(r.result)));
      r.readAsText(f);
    };
    inp.click();
  }
  UI.importDone = function (ok) {
    if (ok) { UI.toast('Partida importada correctamente.', 'ok'); UI.refresh(); }
    else UI.toast('Ese archivo no es una partida válida de Top Gear.', 'warn');
  };

  SCREENS.options = {
    render(ctx) {
      ctx.linear = true;
      const st = S().settings;
      const cyc = (key, list, d) => { const i = list.indexOf(st[key]); st[key] = list[(i + d + list.length) % list.length]; };
      const QL = { low: 'Baja', medium: 'Media', high: 'Alta', ultra: 'Ultra' };
      const vol = (v) => '<span class="vol">' + bars(v, 0) + '</span>' + Math.round(v * 10);
      const rows = [
        adjRow('music', 'Volumen de música', vol(st.music), (d) => { st.music = U.clamp(Math.round((st.music + d * 0.1) * 10) / 10, 0, 1); TG.Audio.apply(); TG.Save.save(); UI.refresh(); }),
        adjRow('sfx', 'Volumen de efectos', vol(st.sfx), (d) => { st.sfx = U.clamp(Math.round((st.sfx + d * 0.1) * 10) / 10, 0, 1); TG.Audio.apply(); TG.Audio.play('coin'); TG.Save.save(); UI.refresh(); }),
        adjRow('quality', 'Calidad gráfica', QL[st.quality], (d) => { cyc('quality', ['low', 'medium', 'high', 'ultra'], d); TG.Save.save(); TG.Render.resize(); TG.Game.qualityChanged(); UI.refresh(); }),
        adjRow('units', 'Unidades', st.units === 'mph' ? 'mph' : 'km/h', (d) => { cyc('units', ['kmh', 'mph'], d); TG.Save.save(); UI.refresh(); }),
        adjRow('difficulty', 'Dificultad de los rivales', (TG.DIFFICULTY[st.difficulty] || TG.DIFFICULTY.normal).name, (d) => { cyc('difficulty', ['easy', 'normal', 'hard'], d); TG.Save.save(); UI.refresh(); }),
        adjRow('trans', 'Cambio de marchas', st.trans === 'manual' ? 'Manual' : 'Automático', (d) => { cyc('trans', ['auto', 'manual'], d); TG.Save.save(); UI.refresh(); }),
        adjRow('camera', 'Cámara', st.camera === 'far' ? 'Lejana' : 'Cercana', (d) => { cyc('camera', ['near', 'far'], d); TG.Save.save(); UI.refresh(); }),
        adjRow('fps', 'Mostrar FPS', st.fps ? 'Sí' : 'No', () => { st.fps = !st.fps; TG.Save.save(); UI.refresh(); }),
      ];
      ctx.el.innerHTML = header('Opciones', 'Ajustes') +
        '<div class="opt-grid"><div class="setup-rows scroll-y" data-scroll="opts">' + rows.map((r) => r.html).join('') + '</div>' +
        '<div class="opt-side"><button class="btn" data-nav data-key="controls">Configurar controles del teclado</button>' +
        '<button class="btn" data-nav data-key="full">Pantalla completa</button>' +
        '<div class="card help"><div class="card-eyebrow">Consejos</div><ul>' +
        '<li><b>Dificultad</b>: los rivales mejoran poco a poco con cada carrera del campeonato; aquí eliges el punto de partida.</li>' +
        '<li><b>Calidad</b>: si notas tirones, baja a Media o Baja.</li><li><b>Cambio manual</b>: sube de marcha cerca del corte (la marcha parpadea) para ganar aceleración.</li>' +
        '<li><b>Cámara lejana</b>: ves mejor las curvas que vienen.</li><li>Pulsa <kbd>M</kbd> en cualquier momento para silenciar la música.</li></ul></div>' +
        '<div class="opt-save"><button class="btn" data-nav data-key="export">Exportar partida</button><button class="btn" data-nav data-key="import">Importar partida</button></div>' +
        '<p class="small muted opt-note">La partida se guarda sola (autoguardado). Exporta una copia para llevarla a otro navegador u ordenador.</p>' +
        '<button class="btn danger" data-nav data-key="reset">Borrar la partida</button></div></div>' +
        hints([['↑↓', 'Navegar'], ['←→', 'Cambiar'], ['Esc', 'Volver']]);
      bindAdj(ctx.el, rows);
      $('[data-key="controls"]', ctx.el).addEventListener('click', () => UI.show('controls', { back: ctx.params.back }));
      $('[data-key="full"]', ctx.el).addEventListener('click', () => TG.Game.toggleFullscreen());
      $('[data-key="export"]', ctx.el).addEventListener('click', exportSave);
      $('[data-key="import"]', ctx.el).addEventListener('click', importSave);
      $('[data-key="reset"]', ctx.el).addEventListener('click', () => UI.modal('<h2>¿Borrar toda la partida?</h2><p>Perderás el dinero, los coches comprados, las mejoras, las copas y los récords. Esta acción no se puede deshacer.</p>', [
        { label: 'Borrar todo', cls: 'danger', fn: () => { TG.Save.reset(); UI.toast('Partida borrada. ¡A empezar de cero!', 'ok'); UI.refresh(); } },
        { label: 'Cancelar', cls: 'ghost' },
      ], { focus: 1 }));
      ctx.onBack = () => (ctx.params.back ? ctx.params.back() : UI.show('main', { focus: 'options' }));
    },
  };

  SCREENS.controls = {
    render(ctx) {
      const I = TG.Input;
      if (!ctx.prof) ctx.prof = 'solo';
      const keys = S().keys[ctx.prof];
      const slots = ctx.prof === 'solo' ? 2 : 1;
      ctx.el.innerHTML = header('Controles', 'Teclado') + '<div class="scroll-y" data-scroll="keys">' +
        '<div class="tabs">' + I.PROFILES.map((p) => '<button class="tab ' + (p === ctx.prof ? 'on' : '') + '" data-nav data-key="tab_' + p + '">' + I.PROFILE_LABEL[p] + '</button>').join('') + '</div>' +
        '<div class="keys-table">' + I.ACTIONS.map((a) => {
          let cells = '';
          for (let k = 0; k < slots; k++) cells += '<button class="keycap" data-nav data-key="k_' + a + '_' + k + '" data-a="' + a + '" data-s="' + k + '">' + esc(I.keyName(keys[a][k])) + '</button>';
          return '<div class="krow"><span>' + I.ACTION_LABEL[a] + '</span><div class="kcells">' + cells + '</div></div>';
        }).join('') + '</div>' +
        '<div class="krow fixed"><span>Pausa · Silenciar música</span><div class="kcells"><span class="keycap static">Esc / P</span><span class="keycap static">M</span></div></div>' +
        '<div class="row-btns"><button class="btn ghost" data-nav data-key="defaults">Restaurar teclas por defecto</button></div></div>' +
        hints([['↑↓←→', 'Navegar'], ['Intro', 'Cambiar tecla'], ['Esc', 'Volver']]);
      I.PROFILES.forEach((p) => $('[data-key="tab_' + p + '"]', ctx.el).addEventListener('click', () => { ctx.prof = p; UI.refresh('[data-key="tab_' + p + '"]'); }));
      $$('.keycap[data-a]', ctx.el).forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.a, s = +b.dataset.s;
        b.classList.add('listening');
        b.textContent = 'Pulsa una tecla…';
        UI.capture = (code) => {
          UI.capture = null;
          if (code === 'Escape') { TG.Audio.play('back'); UI.refresh('[data-key="k_' + a + '_' + s + '"]'); return true; }
          if (I.RESERVED.has(code) && code !== 'Enter') { TG.Audio.play('error'); UI.toast('Esa tecla está reservada (pausa o música).', 'warn'); UI.refresh('[data-key="k_' + a + '_' + s + '"]'); return true; }
          const prof = S().keys[ctx.prof];
          I.ACTIONS.forEach((a2) => prof[a2].forEach((kk, j) => { if (kk === code) prof[a2][j] = ''; }));
          prof[a][s] = code;
          TG.Save.save();
          TG.Audio.play('select');
          UI.refresh('[data-key="k_' + a + '_' + s + '"]');
          return true;
        };
      }));
      $('[data-key="defaults"]', ctx.el).addEventListener('click', () => { S().keys = I.defaultKeys(); TG.Save.save(); UI.toast('Teclas restauradas', 'ok'); UI.refresh('[data-key="defaults"]'); });
      const grid = [I.PROFILES.map((p) => $('[data-key="tab_' + p + '"]', ctx.el))];
      I.ACTIONS.forEach((a) => { const row = []; for (let k = 0; k < slots; k++) row.push($('[data-key="k_' + a + '_' + k + '"]', ctx.el)); grid.push(row); });
      grid.push([$('[data-key="defaults"]', ctx.el)]);
      ctx.onKey = (code) => {
        if (ctx.modal) return false;
        const dir = { ArrowUp: [-1, 0], KeyW: [-1, 0], ArrowDown: [1, 0], KeyS: [1, 0], ArrowLeft: [0, -1], KeyA: [0, -1], ArrowRight: [0, 1], KeyD: [0, 1] }[code];
        if (!dir) return false;
        let r = 0, c = 0;
        grid.forEach((row, ri) => row.forEach((el, ci) => { if (el === ctx.focused) { r = ri; c = ci; } }));
        if (dir[0]) { r = (r + dir[0] + grid.length) % grid.length; c = Math.min(c, grid[r].length - 1); }
        else c = U.clamp(c + dir[1], 0, grid[r].length - 1);
        UI.focus(grid[r][c]);
        TG.Audio.play('nav');
        return true;
      };
      ctx.initial = ctx.initial || '[data-key="k_accel_0"]';
      ctx.onBack = () => UI.show('options', { back: ctx.params.back });
    },
  };

  /* ---------- Carga / pausa / resultados ---------- */
  SCREENS.loading = {
    overlay: true, dim: false,
    render(ctx) {
      const cfg = ctx.params.cfg;
      const t = TG.TRACKS[cfg.trackId], th = TG.THEMES[t.theme], cup = TG.CUPS[t.cup];
      ctx.el.innerHTML = '<div class="loading"><canvas class="ld-bg" width="960" height="510"></canvas><div class="ld-info"><span class="flag-slot"></span>' +
        '<div class="eyebrow">' + esc(cup.name) + '</div><h1>' + esc(t.name) + '</h1><div class="ld-meta">' + TG.TIME_LABEL[th.time] + ' · ' + TG.WEATHER_LABEL[th.weather] + ' · ' + (cfg.laps || 3) + ' vueltas</div>' +
        '<div class="ld-bar"><i></i></div><p class="tip">' + esc(U.pick(TG.TIPS)) + '</p></div></div>';
      thumbInto($('.ld-bg', ctx.el), t.theme);
      $('.flag-slot', ctx.el).appendChild(flagCanvas(cup.flag, 42, 28));
    },
  };

  SCREENS.pause = {
    overlay: true,
    render(ctx) {
      ctx.linear = true;
      const race = TG.Game.race;
      ctx.el.innerHTML = '<div class="pause"><div class="eyebrow">' + esc(race ? race.def.name : '') + '</div><h1>Pausa</h1>' +
        '<button class="btn primary" data-nav data-key="resume">Continuar</button>' +
        '<button class="btn" data-nav data-key="restart">Reiniciar carrera</button>' +
        '<button class="btn" data-nav data-key="opts">Opciones</button>' +
        '<button class="btn ghost" data-nav data-key="quit">Abandonar</button></div>';
      $('[data-key="resume"]', ctx.el).addEventListener('click', () => TG.Game.resume());
      $('[data-key="restart"]', ctx.el).addEventListener('click', () => TG.Game.restart());
      $('[data-key="opts"]', ctx.el).addEventListener('click', () => UI.show('options', { back: () => UI.show('pause') }));
      $('[data-key="quit"]', ctx.el).addEventListener('click', () => UI.modal('<h2>¿Abandonar la carrera?</h2><p>No ganarás premio en esta carrera. En el campeonato podrás repetirla.</p>', [
        { label: 'Abandonar', cls: 'danger', fn: () => TG.Game.quitRace() }, { label: 'Seguir corriendo', cls: 'ghost' },
      ], { focus: 1 }));
      ctx.onBack = () => TG.Game.resume();
    },
  };

  SCREENS.results = {
    overlay: true,
    render(ctx) {
      ctx.linear = true;
      const d = ctx.params;
      const res = d.res;
      const win = res[0].time;
      const mode = d.mode;
      const rows = res.map((r) => {
        const tm = r.pos === 1 ? U.time(r.time) : '+' + (r.time - win).toFixed(2) + ' s';
        const who = r.isPlayer ? (mode === 'versus' ? r.name : 'Tú') : r.name;
        return '<tr class="' + (r.isPlayer ? 'me p' + r.pIndex : '') + '"><td class="pos">' + r.pos + '</td><td>' + esc(who) + '</td><td class="muted">' + esc(r.model.brand + ' ' + r.model.name) + '</td><td class="num">' + (r.finished ? tm : '<span class="muted">' + tm + '</span>') + '</td></tr>';
      }).join('');
      let side = '';
      const e = d.earnings;
      if (e) {
        side = '<div class="card earn"><div class="card-eyebrow">Ganancias</div>' +
          '<div class="erow"><span>Premio por ' + e.pos + 'º puesto</span><b data-count="' + e.prize + '">$0</b></div>' +
          '<div class="erow"><span>Monedas recogidas</span><b data-count="' + e.coins + '">$0</b></div>' +
          (e.clean ? '<div class="erow"><span>Bonus carrera limpia</span><b data-count="' + e.clean + '">$0</b></div>' : '') +
          (e.record ? '<div class="erow"><span>Récord de vuelta</span><b data-count="' + e.record + '">$0</b></div>' : '') +
          (e.repair ? '<div class="erow neg"><span>Reparación de daños (' + e.dmg + '%)</span><b>−' + money(e.repair) + '</b></div>' : '') +
          '<div class="erow total"><span>Total</span><b data-count="' + e.total + '">$0</b></div>' +
          '<div class="erow bal"><span>Saldo</span><b>' + money(S().money) + '</b></div></div>';
      } else if (mode === 'time') {
        const p = d.race.players[0];
        side = '<div class="card earn"><div class="card-eyebrow">Tus tiempos</div>' +
          (p.laps.map((l, k) => '<div class="erow"><span>Vuelta ' + (k + 1) + '</span><b>' + U.time(l) + '</b></div>').join('') || '<p class="muted">Sin vueltas completas.</p>') +
          '<div class="erow total"><span>Mejor vuelta</span><b>' + U.time(p.bestLap) + '</b></div>' +
          (d.newRecord ? '<div class="erow rec"><span>¡Nuevo récord del circuito!</span><b>★</b></div>' : '') +
          (d.newGhost ? '<div class="erow"><span>Fantasma guardado para la próxima vez</span><b>👻</b></div>' : '') + '</div>';
      } else if (mode === 'versus') {
        const w = res.find((r) => r.isPlayer);
        side = '<div class="card earn"><div class="card-eyebrow">Duelo</div><div class="winner p' + w.pIndex + '">¡Gana ' + esc(w.name) + '!</div></div>';
      }
      let cupInfo = '';
      if (d.cupRun) {
        cupInfo = '<p class="small muted">Copa ' + esc(d.cup.name) + ': carrera ' + d.cupRun.race + ' de 4 completada · tienes ' + (d.cupRun.points.player || 0) + ' puntos.</p>';
      }
      const title = mode === 'time' ? 'Contrarreloj' : res.find((r) => r.isPlayer).pos === 1 ? '¡Victoria!' : 'Resultados';
      ctx.el.innerHTML = '<div class="results"><div class="res-head"><div><div class="eyebrow">' + esc(d.def.name + ' · ' + d.cup.name) + '</div><h1>' + title + '</h1></div></div>' +
        '<div class="res-grid"><div class="card tbl-wrap" data-scroll="res"><table class="tbl res"><thead><tr><th>#</th><th>Piloto</th><th>Coche</th><th class="num">Tiempo</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="res-side">' + side + cupInfo +
        '<button class="btn primary big" data-nav data-key="next">' + (d.cupEnd ? 'Ver clasificación final' : d.cupRun ? 'Siguiente carrera' : 'Continuar') + '</button>' +
        (!d.cupRun && !d.cupEnd ? '<button class="btn" data-nav data-key="again">Repetir carrera</button>' : '') +
        '<button class="btn ghost" data-nav data-key="menu">Menú principal</button></div></div></div>';
      // contador animado
      const counters = $$('[data-count]', ctx.el);
      const t0 = performance.now();
      const anim = (now) => {
        const k = U.clamp((now - t0) / 1100, 0, 1);
        counters.forEach((c) => { c.textContent = money(+c.dataset.count * U.easeOutCubic(k)); });
        if (k < 1 && UI.cur === ctx) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
      $('[data-key="next"]', ctx.el).addEventListener('click', () => {
        if (d.cupEnd) UI.show('cupEnd', d.cupEnd);
        else if (d.cupRun) { TG.Game.toDemo(); UI.show('cup', { i: d.cup.index }); }
        else TG.Game.backToMenu(mode);
      });
      const ag = $('[data-key="again"]', ctx.el);
      if (ag) ag.addEventListener('click', () => TG.Game.startRace(d.race.cfg));
      $('[data-key="menu"]', ctx.el).addEventListener('click', () => TG.Game.backToMenu());
      ctx.onBack = () => {};
    },
  };

  SCREENS.cupEnd = {
    overlay: true,
    render(ctx) {
      ctx.linear = true;
      const d = ctx.params;
      const rows = d.table.map((r, k) => '<tr class="' + (r.me ? 'me' : '') + '"><td class="pos">' + (k + 1) + '</td><td>' + esc(r.name) + '</td><td class="muted">' + esc(r.car.brand + ' ' + r.car.name) + '</td><td class="num">' + r.pts + '</td></tr>').join('');
      const tNames = ['', 'Oro', 'Plata', 'Bronce'];
      ctx.el.innerHTML = '<div class="results"><div class="res-head"><div><div class="eyebrow">Copa ' + esc(d.cup.name) + ' · clasificación final</div><h1>' + (d.rank === 1 ? '¡Campeón!' : d.rank <= 3 ? '¡Al podio!' : 'Copa terminada') + '</h1></div>' +
        (d.rank <= 3 ? '<div class="big-trophy t' + d.rank + '"><span>' + tNames[d.rank] + '</span></div>' : '') + '</div>' +
        '<div class="res-grid"><div class="card tbl-wrap" data-scroll="cupend"><table class="tbl res"><thead><tr><th>#</th><th>Piloto</th><th>Coche</th><th class="num">Puntos</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="res-side"><div class="card earn"><div class="card-eyebrow">Recompensa</div>' +
        '<div class="erow"><span>Posición final</span><b>' + d.rank + 'º</b></div>' +
        '<div class="erow total"><span>Bonus de copa</span><b>' + money(d.bonus) + '</b></div>' +
        '<div class="erow bal"><span>Saldo</span><b>' + money(S().money) + '</b></div></div>' +
        (d.unlocked ? '<div class="unlock"><span>Nueva copa desbloqueada</span><b>' + esc(d.unlocked) + '</b></div>' : '') +
        (d.rank > 3 ? '<p class="warn-txt">Necesitas terminar entre los 3 primeros para desbloquear la siguiente copa. Mejora tu coche y vuelve a intentarlo.</p>' : '') +
        (d.done ? '<div class="unlock gold"><span>Has completado el campeonato</span><b>¡Leyenda de Top Gear!</b></div>' : '') +
        '<button class="btn primary big" data-nav data-key="ok">Continuar</button></div></div></div>';
      if (d.rank <= 3) TG.Audio.play('trophy');
      $('[data-key="ok"]', ctx.el).addEventListener('click', () => { TG.Game.toDemo(); UI.show('career', { i: d.cup.index }); });
      ctx.onBack = () => {};
    },
  };
})(window.TG);
