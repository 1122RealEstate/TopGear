'use strict';
/* ============================================================
   Teclado: estado, pulsaciones y perfiles de controles
   ============================================================ */
(function (TG) {
  const I = (TG.Input = { down: new Set(), queue: [], pressed: new Set(), listeners: [], labels: {} });

  I.ACTIONS = ['accel', 'brake', 'left', 'right', 'nitro', 'gearUp', 'gearDown'];
  I.ACTION_LABEL = { accel: 'Acelerar', brake: 'Frenar', left: 'Girar a la izquierda', right: 'Girar a la derecha', nitro: 'Nitro', gearUp: 'Subir marcha (manual)', gearDown: 'Bajar marcha (manual)' };
  I.PROFILES = ['solo', 'p1', 'p2'];
  I.PROFILE_LABEL = { solo: '1 jugador', p1: 'Jugador 1 (2J)', p2: 'Jugador 2 (2J)' };

  I.defaultKeys = function () {
    return {
      solo: { accel: ['ArrowUp', 'KeyW'], brake: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], nitro: ['Space', 'ShiftLeft'], gearUp: ['KeyE', 'KeyX'], gearDown: ['KeyQ', 'KeyZ'] },
      p1: { accel: ['KeyW'], brake: ['KeyS'], left: ['KeyA'], right: ['KeyD'], nitro: ['ShiftLeft'], gearUp: ['KeyE'], gearDown: ['KeyQ'] },
      p2: { accel: ['ArrowUp'], brake: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], nitro: ['ShiftRight'], gearUp: ['Period'], gearDown: ['Comma'] },
    };
  };
  I.mergeKeys = function (k) {
    const d = I.defaultKeys();
    if (!k || typeof k !== 'object') return d;
    I.PROFILES.forEach((p) => {
      if (!k[p]) return;
      I.ACTIONS.forEach((a) => {
        if (Array.isArray(k[p][a])) {
          const n = p === 'solo' ? 2 : 1;
          const arr = k[p][a].slice(0, n).map((x) => (typeof x === 'string' ? x : ''));
          while (arr.length < n) arr.push('');
          d[p][a] = arr;
        }
      });
    });
    return d;
  };

  I.init = function () {
    window.addEventListener('keydown', (e) => {
      const code = e.code || e.key;
      if (e.key && e.key.length === 1) I.labels[code] = e.key.toUpperCase();
      if (!e.repeat) I.queue.push(code);
      I.down.add(code);
      for (let i = I.listeners.length - 1; i >= 0; i--) {
        if (I.listeners[i](e, code) === true) { e.preventDefault(); return; }
      }
      const fkey = /^F\d+$/.test(code);
      if (!e.metaKey && !fkey && !(e.ctrlKey && !/^Control/.test(code))) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { I.down.delete(e.code || e.key); });
    window.addEventListener('blur', () => { I.down.clear(); });
  };
  I.on = (fn) => { I.listeners.push(fn); return () => { const i = I.listeners.indexOf(fn); if (i >= 0) I.listeners.splice(i, 1); }; };
  I.frame = function () {
    I.pressed = new Set(I.queue);
    I.queue.length = 0;
  };
  I.keysFor = (profile, act) => ((TG.Save.data.keys[profile] || {})[act] || []);
  I.action = function (profile, act) {
    const keys = I.keysFor(profile, act);
    for (let i = 0; i < keys.length; i++) if (keys[i] && I.down.has(keys[i])) return true;
    return false;
  };
  I.hit = function (profile, act) {
    const keys = I.keysFor(profile, act);
    for (let i = 0; i < keys.length; i++) if (keys[i] && I.pressed.has(keys[i])) return true;
    return false;
  };

  const NAMES = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Espacio', Enter: 'Intro', Escape: 'Esc',
    ShiftLeft: 'Mayús izq.', ShiftRight: 'Mayús der.', ControlLeft: 'Ctrl izq.', ControlRight: 'Ctrl der.',
    AltLeft: 'Alt izq.', AltRight: 'Alt der.', MetaLeft: 'Cmd izq.', MetaRight: 'Cmd der.', Tab: 'Tab', Backspace: 'Borrar',
    CapsLock: 'Bloq Mayús', Period: '.', Comma: ',', Slash: '/', Semicolon: 'Ñ', Quote: '´', BracketLeft: '`', BracketRight: '+',
    Backslash: 'Ç', Minus: "'", Equal: '¡', IntlBackslash: '<', Backquote: 'º',
  };
  I.keyName = function (code) {
    if (!code) return '—';
    if (NAMES[code]) return NAMES[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
    if (I.labels[code]) return I.labels[code];
    return code;
  };
  I.RESERVED = new Set(['Escape', 'KeyP', 'KeyM', 'Enter']);
})(window.TG);
