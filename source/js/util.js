'use strict';
/* ============================================================
   TOP GEAR · Supercar Legends — utilidades
   ============================================================ */
window.TG = window.TG || {};
(function (TG) {
  const U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  U.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (arr, r) => arr[Math.floor((r ? r() : Math.random()) * arr.length)];
  U.smooth = (t) => t * t * (3 - 2 * t);
  U.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  U.easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Generador pseudoaleatorio con semilla (mulberry32)
  U.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    const f = function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (a, b) => a + f() * (b - a);
    f.int = (a, b) => Math.floor(a + f() * (b - a + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.chance = (p) => f() < p;
    f.sign = () => (f() < 0.5 ? -1 : 1);
    return f;
  };
  U.hash = function (str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // Helpers clásicos de pseudo-3D
  U.increase = function (start, inc, max) {
    let r = start + inc;
    while (r >= max) r -= max;
    while (r < 0) r += max;
    return r;
  };
  U.percentRemaining = (n, total) => (n % total) / total;
  U.easeIn = (a, b, p) => a + (b - a) * p * p;
  U.easeOut = (a, b, p) => a + (b - a) * (1 - (1 - p) * (1 - p));
  U.easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
  U.expFog = (d, density) => 1 / Math.exp(d * d * density);

  // ---------- Colores ----------
  const hexCache = new Map();
  U.hex2rgb = function (hex) {
    if (Array.isArray(hex)) return hex;
    let v = hexCache.get(hex);
    if (v) return v;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(hex, v);
    return v;
  };
  U.rgb2hex = function (c) {
    let s = '#';
    for (let i = 0; i < 3; i++) {
      const v = U.clamp(Math.round(c[i]), 0, 255);
      s += (v < 16 ? '0' : '') + v.toString(16);
    }
    return s;
  };
  U.mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  U.mix = (c1, c2, t) => U.rgb2hex(U.mixRgb(U.hex2rgb(c1), U.hex2rgb(c2), U.clamp(t, 0, 1)));
  U.shade = (c, amt) => (amt >= 0 ? U.mix(c, '#ffffff', amt) : U.mix(c, '#000000', -amt));
  U.rgba = (c, a) => {
    const r = U.hex2rgb(c);
    return 'rgba(' + (r[0] | 0) + ',' + (r[1] | 0) + ',' + (r[2] | 0) + ',' + a + ')';
  };
  U.lum = (c) => {
    const r = U.hex2rgb(c);
    return (0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]) / 255;
  };
  U.saturate = function (c, amt) {
    const r = U.hex2rgb(c);
    const g = (r[0] + r[1] + r[2]) / 3;
    return U.rgb2hex([g + (r[0] - g) * (1 + amt), g + (r[1] - g) * (1 + amt), g + (r[2] - g) * (1 + amt)]);
  };

  // ---------- Formatos ----------
  U.money = function (n) {
    const neg = n < 0;
    const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-$' : '$') + s;
  };
  U.time = function (s) {
    if (s == null || !isFinite(s)) return '-:--.---';
    const m = Math.floor(s / 60);
    const sec = s - m * 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(3);
  };
  U.timeShort = function (s) {
    if (s == null || !isFinite(s)) return '-:--.--';
    const m = Math.floor(s / 60);
    const sec = s - m * 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec.toFixed(2);
  };

  // ---------- Canvas ----------
  U.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };
  U.rr = function (ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };
  U.poly = function (ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
  };
  // Forma suave a partir de puntos [[x,y,esquina?],...]
  U.smoothShape = function (ctx, pts, closed) {
    const n = pts.length;
    const M = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed === false) {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const p = pts[i];
        if (p[2]) ctx.lineTo(p[0], p[1]);
        else {
          const q = pts[i + 1];
          const m = q[2] || i === n - 2 ? q : M(p, q);
          ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
        }
      }
      ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
      return;
    }
    let startIdx;
    if (pts[0][2]) { ctx.moveTo(pts[0][0], pts[0][1]); startIdx = 1; }
    else { const m = M(pts[n - 1], pts[0]); ctx.moveTo(m[0], m[1]); startIdx = 0; }
    for (let k = startIdx; k < n; k++) {
      const p = pts[k], q = pts[(k + 1) % n];
      if (p[2]) ctx.lineTo(p[0], p[1]);
      else {
        const m = q[2] ? q : M(p, q);
        ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      }
    }
    ctx.closePath();
  };
  U.lin = function (ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  };
  U.rad = function (ctx, x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    for (let i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
    return g;
  };
  U.ellipse = function (ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
  };

  // Ruido periódico 1D (suma de senos) para siluetas enlosables
  U.periodicNoise = function (rng, octaves) {
    const comps = [];
    for (let i = 0; i < octaves.length; i++) {
      const o = octaves[i];
      comps.push({ f: o[0], a: o[1], p: rng() * Math.PI * 2 });
    }
    return function (t) { // t en [0,1)
      let v = 0;
      for (let i = 0; i < comps.length; i++) v += Math.sin(t * Math.PI * 2 * comps[i].f + comps[i].p) * comps[i].a;
      return v;
    };
  };

  U.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  TG.U = U;
})(window.TG);
