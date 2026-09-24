'use strict';
/* ============================================================
   Partida guardada (localStorage + puente nativo de la app macOS)
   ============================================================ */
(function (TG) {
  const U = TG.U;
  const KEY = 'topgear_supercar_legends_v1', BAK = KEY + '_bak';
  const S = (TG.Save = { data: null, last: '', lastT: 0 });

  S.defaults = function () {
    return {
      v: 1,
      money: TG.ECON.start,
      cars: { mustang: { color: TG.CAR.mustang.color, up: {} } },
      active: 'mustang',
      unlocked: 1,
      cups: TG.CUPS.map(() => ({ trophy: 0, run: null })),
      records: {},
      ghosts: {},
      settings: { music: 0.6, sfx: 0.85, quality: 'high', units: 'kmh', trans: 'auto', camera: 'near', fps: false, difficulty: 'normal' },
      keys: TG.Input.defaultKeys(),
      stats: { races: 0, wins: 0, earned: 0 },
      quick: { track: 'vegas', laps: 3, rivals: 11 },
      versus: { track: 'vegas', laps: 3, rivals: 5, car2: 'mustang' },
    };
  };

  const parse = (raw) => {
    if (typeof raw !== 'string' || raw.length < 3) return null;
    try { const d = JSON.parse(raw); return d && typeof d === 'object' && d.cars ? d : null; } catch (e) { return null; }
  };
  // Carga la partida más reciente que sea válida (disco de la app, navegador o copias de seguridad)
  S.load = function () {
    const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const nat = () => { try { return window.__TG_NATIVE_SAVE; } catch (e) { return null; } };
    const natB = () => { try { return window.__TG_NATIVE_BAK; } catch (e) { return null; } };
    const main = [parse(nat()), parse(get(KEY))].filter(Boolean);
    main.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    let d = main[0] || null;
    if (!d) d = parse(natB()) || parse(get(BAK));
    S.data = S.migrate(d);
    S.last = JSON.stringify(Object.assign({}, S.data, { savedAt: 0 }));
    // pedir al navegador que no borre los datos del juego
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* no disponible */ }
  };

  S.migrate = function (d) {
    const def = S.defaults();
    if (!d || typeof d !== 'object') return def;
    const out = Object.assign({}, def, d);
    out.settings = Object.assign({}, def.settings, d.settings || {});
    out.cups = def.cups.map((c, i) => Object.assign({}, c, (Array.isArray(d.cups) && d.cups[i]) || {}));
    out.cars = {};
    if (d.cars && typeof d.cars === 'object') {
      Object.keys(d.cars).forEach((id) => {
        if (!TG.CAR[id]) return;
        const c = d.cars[id] || {};
        out.cars[id] = { color: typeof c.color === 'string' ? c.color : TG.CAR[id].color, up: Object.assign({}, c.up || {}) };
        TG.UPGRADES.forEach((u) => { out.cars[id].up[u.id] = U.clamp(out.cars[id].up[u.id] | 0, 0, u.max); });
      });
    }
    if (!Object.keys(out.cars).length) out.cars = def.cars;
    if (!out.cars[out.active]) out.active = Object.keys(out.cars)[0];
    out.keys = TG.Input.mergeKeys(d.keys);
    out.records = d.records && typeof d.records === 'object' ? d.records : {};
    out.ghosts = d.ghosts && typeof d.ghosts === 'object' ? d.ghosts : {};
    out.stats = Object.assign({}, def.stats, d.stats || {});
    out.quick = Object.assign({}, def.quick, d.quick || {});
    out.versus = Object.assign({}, def.versus, d.versus || {});
    out.unlocked = U.clamp((d.unlocked | 0) || 1, 1, TG.CUPS.length);
    out.money = Math.max(0, Math.round(+d.money || 0));
    if (!isFinite(out.money)) out.money = def.money;
    return out;
  };

  S.save = function (why) {
    if (!S.data) return;
    S.data.savedAt = Date.now();
    const s = JSON.stringify(S.data);
    try {
      // copia de seguridad de la versión anterior (como mucho una por minuto)
      const now = Date.now();
      if (now - S.lastT > 60000) { const prev = localStorage.getItem(KEY); if (prev) localStorage.setItem(BAK, prev); }
      localStorage.setItem(KEY, s);
    } catch (e) { /* almacenamiento no disponible */ }
    try {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tgSave) window.webkit.messageHandlers.tgSave.postMessage(s);
    } catch (e) { /* sin puente nativo */ }
    S.last = JSON.stringify(Object.assign({}, S.data, { savedAt: 0 }));
    S.lastT = Date.now();
    if (S.onSaved) S.onSaved(why);
  };
  // Autoguardado: guarda si algo ha cambiado desde la última vez
  S.autosave = function (why) {
    if (!S.data) return false;
    const cur = JSON.stringify(Object.assign({}, S.data, { savedAt: 0 }));
    if (cur === S.last) return false;
    S.save(why || 'auto');
    return true;
  };
  // Exportar / importar la partida (para copiarla a otro navegador u ordenador)
  S.exportText = () => JSON.stringify(Object.assign({ game: 'TopGear Supercar Legends' }, S.data), null, 1);
  S.importText = function (text) {
    const d = parse(text);
    if (!d) return false;
    S.data = S.migrate(d);
    S.save('import');
    return true;
  };

  S.reset = function () {
    const keys = S.data ? S.data.keys : null;
    const settings = S.data ? S.data.settings : null;
    S.data = S.defaults();
    if (keys) S.data.keys = keys;
    if (settings) S.data.settings = settings;
    S.save();
  };

  S.car = (id) => S.data.cars[id || S.data.active];
  S.activeModel = () => TG.CAR[S.data.active];
})(window.TG);
