'use strict';
/* ============================================================
   Arte procedural del mundo: decorados, fondos, cielo, efectos
   ============================================================ */
(function (TG) {
  const U = TG.U;
  const Art = (TG.Art = TG.Art || {});
  const cache = { themes: {}, layers: {}, glow: {}, previews: {}, fx: null };
  Art._cache = cache;

  function mk(w, h, q, fn) {
    const cv = U.canvas(w * q, h * q);
    const c = cv.getContext('2d');
    c.scale(q, q);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    fn(c, w, h);
    return cv;
  }
  Art.mk = mk;

  function info(theme, q) {
    const dim = (1 - theme.ambient) * 0.85;
    return {
      theme, q,
      night: theme.time === 'night',
      dark: theme.time === 'night' || theme.time === 'dusk',
      lamps: !!theme.lamps,
      t: (c) => (dim <= 0.001 ? c : U.mix(c, theme.shade, dim)),
      rng: U.rng((U.hash(theme.id) ^ 0x5bd1e995) >>> 0),
      flora: theme.flora, city: theme.city, house: theme.house,
    };
  }

  /* ================= DECORADOS ================= */
  function frond(c, x0, y0, a, len, droop, col, dark) {
    const pts = [];
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([x0 + Math.cos(a) * len * t, y0 + Math.sin(a) * len * t + droop * t * t]);
    }
    c.beginPath();
    c.moveTo(x0, y0);
    for (let i = 1; i <= n; i++) {
      const t = i / n, p = pts[i], q = pts[i - 1];
      const dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1;
      const w = 15 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (i % 2 ? 1 : 0.55);
      c.lineTo(p[0] - (dy / l) * w, p[1] + (dx / l) * w);
    }
    for (let i = n; i >= 1; i--) {
      const t = i / n, p = pts[i], q = pts[i - 1];
      const dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy) || 1;
      const w = 15 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (i % 2 ? 0.55 : 1);
      c.lineTo(p[0] + (dy / l) * w, p[1] - (dx / l) * w);
    }
    c.closePath();
    c.fillStyle = col;
    c.fill();
    c.strokeStyle = dark;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(x0, y0);
    for (let i = 1; i <= n; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
  }

  function palm(I) {
    const lean = I.rng.range(-45, 45);
    const img = mk(320, 580, I.q, (c, W, H) => {
      const trunkC = I.t(I.flora.trunk), leaf = I.flora.leaf.map(I.t);
      const topX = W / 2 + lean, topY = 150;
      c.beginPath();
      c.moveTo(W / 2 - 17, H);
      c.quadraticCurveTo(W / 2 + lean * 0.15 - 13, H * 0.55, topX - 8, topY);
      c.lineTo(topX + 8, topY);
      c.quadraticCurveTo(W / 2 + lean * 0.15 + 13, H * 0.55, W / 2 + 17, H);
      c.closePath();
      c.fillStyle = U.lin(c, W / 2 - 22, 0, W / 2 + 22, 0, [0, U.shade(trunkC, 0.25), 0.5, trunkC, 1, U.shade(trunkC, -0.4)]);
      c.fill();
      c.strokeStyle = U.rgba(U.shade(trunkC, -0.5), 0.6);
      c.lineWidth = 2;
      for (let i = 1; i < 18; i++) {
        const t = i / 18, y = H - t * (H - topY);
        const x = U.lerp(W / 2, topX, t * t);
        c.beginPath(); c.moveTo(x - 14 + t * 5, y + 2); c.lineTo(x + 14 - t * 5, y - 3); c.stroke();
      }
      const n = 10;
      const order = [];
      for (let i = 0; i < n; i++) order.push(i);
      order.sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
      order.forEach((i) => {
        const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * Math.PI * 1.55 + I.rng.range(-0.08, 0.08);
        const len = I.rng.range(118, 158);
        const droop = 40 + Math.abs(Math.cos(a)) * 70;
        const col = leaf[(i + 1) % 3];
        frond(c, topX, topY, a, len, droop, col, U.shade(col, -0.35));
      });
      c.fillStyle = I.t('#5a3a1e');
      [[-10, 10], [6, 14], [-2, 20]].forEach((d) => { c.beginPath(); c.arc(topX + d[0], topY + d[1], 9, 0, Math.PI * 2); c.fill(); });
    });
    return { img, w: 1550, col: [[0.42, 0.58]] };
  }

  function pine(I, snow) {
    const img = mk(280, 560, I.q, (c, W, H) => {
      const leaf = (snow ? I.flora.leaf : I.flora.leaf).map(I.t);
      c.fillStyle = I.t(I.flora.trunk);
      c.fillRect(W / 2 - 11, H - 74, 22, 74);
      const tiers = 5;
      for (let i = 0; i < tiers; i++) {
        const t = i / (tiers - 1);
        const yb = H - 54 - t * (H - 150);
        const h = 150 - t * 30;
        const w = (W / 2 - 6) * (1 - t * 0.68);
        const jag = (side) => {
          const pts = [];
          const k = 5;
          for (let j = 0; j <= k; j++) {
            const u = j / k;
            pts.push([W / 2 + side * w * (1 - u), yb - (j % 2 ? 12 : 0) + u * 4]);
          }
          return pts;
        };
        // mitad iluminada
        c.beginPath(); c.moveTo(W / 2, yb - h);
        jag(-1).forEach((p) => c.lineTo(p[0], p[1]));
        c.closePath();
        c.fillStyle = leaf[1]; c.fill();
        // mitad en sombra
        c.beginPath(); c.moveTo(W / 2, yb - h);
        jag(1).forEach((p) => c.lineTo(p[0], p[1]));
        c.closePath();
        c.fillStyle = leaf[2]; c.fill();
        if (snow) {
          c.fillStyle = I.t('#f4f8fc');
          c.beginPath(); c.moveTo(W / 2, yb - h);
          c.lineTo(W / 2 - w * 0.55, yb - h * 0.42); c.lineTo(W / 2 - w * 0.3, yb - h * 0.5);
          c.lineTo(W / 2 - w * 0.1, yb - h * 0.38); c.lineTo(W / 2 + w * 0.2, yb - h * 0.52);
          c.lineTo(W / 2 + w * 0.42, yb - h * 0.46);
          c.closePath(); c.fill();
          c.fillStyle = I.t('#c8d8ea');
          c.beginPath(); c.moveTo(W / 2 + w * 0.05, yb - h * 0.85); c.lineTo(W / 2 + w * 0.42, yb - h * 0.46); c.lineTo(W / 2 + w * 0.2, yb - h * 0.52); c.closePath(); c.fill();
        }
      }
    });
    return { img, w: 1350, col: [[0.42, 0.58]] };
  }

  function roundTree(I, leafCols, opt) {
    opt = opt || {};
    const img = mk(360, 440, I.q, (c, W, H) => {
      const leaf = leafCols.map(I.t);
      const trunk = I.t(opt.trunk || I.flora.trunk);
      c.fillStyle = U.lin(c, W / 2 - 16, 0, W / 2 + 16, 0, [0, U.shade(trunk, 0.2), 1, U.shade(trunk, -0.35)]);
      c.beginPath();
      c.moveTo(W / 2 - 16, H); c.lineTo(W / 2 - 9, H * 0.52); c.lineTo(W / 2 - 50, H * 0.36); c.lineTo(W / 2 - 42, H * 0.33);
      c.lineTo(W / 2 - 2, H * 0.47); c.lineTo(W / 2 + 36, H * 0.3); c.lineTo(W / 2 + 44, H * 0.33); c.lineTo(W / 2 + 9, H * 0.52); c.lineTo(W / 2 + 16, H);
      c.closePath(); c.fill();
      const blobs = [];
      for (let i = 0; i < 11; i++) {
        const a = I.rng.range(0, Math.PI * 2), d = I.rng.range(0, 1);
        blobs.push([W / 2 + Math.cos(a) * d * 95, H * 0.34 + Math.sin(a) * d * 70 - 10, I.rng.range(52, 80)]);
      }
      blobs.sort((a, b) => a[1] - b[1]);
      blobs.forEach((b) => { c.fillStyle = leaf[2]; c.beginPath(); c.arc(b[0] + 6, b[1] + 8, b[2], 0, Math.PI * 2); c.fill(); });
      blobs.forEach((b) => { c.fillStyle = leaf[0]; c.beginPath(); c.arc(b[0], b[1], b[2] * 0.92, 0, Math.PI * 2); c.fill(); });
      blobs.forEach((b) => {
        c.fillStyle = U.rad(c, b[0] - b[2] * 0.35, b[1] - b[2] * 0.4, 0, b[2] * 0.9, [0, U.rgba(leaf[1], 0.95), 1, U.rgba(leaf[1], 0)]);
        c.beginPath(); c.arc(b[0], b[1], b[2] * 0.9, 0, Math.PI * 2); c.fill();
      });
      if (opt.petals) {
        for (let i = 0; i < 70; i++) {
          c.fillStyle = U.rgba(I.t(opt.petals), I.rng.range(0.5, 1));
          c.beginPath(); c.arc(W / 2 + I.rng.range(-130, 130), H * 0.34 + I.rng.range(-110, 90), I.rng.range(2, 5), 0, Math.PI * 2); c.fill();
        }
      }
    });
    return { img, w: 1950, col: [[0.44, 0.56]] };
  }

  function cypress(I) {
    const img = mk(140, 520, I.q, (c, W, H) => {
      const leaf = I.flora.leaf.map(I.t);
      c.fillStyle = I.t(I.flora.trunk); c.fillRect(W / 2 - 6, H - 40, 12, 40);
      c.beginPath();
      c.moveTo(W / 2, 8);
      c.bezierCurveTo(W / 2 + 40, 120, W - 8, H * 0.55, W / 2 + 12, H - 30);
      c.lineTo(W / 2 - 12, H - 30);
      c.bezierCurveTo(8, H * 0.55, W / 2 - 40, 120, W / 2, 8);
      c.fillStyle = U.lin(c, 10, 0, W - 10, 0, [0, leaf[1], 0.45, leaf[0], 1, leaf[2]]);
      c.fill();
      c.strokeStyle = U.rgba(U.shade(leaf[2], -0.3), 0.5); c.lineWidth = 3;
      for (let y = 60; y < H - 50; y += 26) { c.beginPath(); c.moveTo(W / 2 - 18, y); c.quadraticCurveTo(W / 2, y + 10, W / 2 + 16, y + 2); c.stroke(); }
    });
    return { img, w: 680, col: [[0.3, 0.7]] };
  }

  function stonepine(I) {
    const img = mk(420, 420, I.q, (c, W, H) => {
      const leaf = I.flora.leaf.map(I.t), trunk = I.t(I.flora.trunk);
      c.strokeStyle = trunk; c.lineWidth = 16;
      c.beginPath(); c.moveTo(W / 2, H); c.quadraticCurveTo(W / 2 + 30, H * 0.6, W / 2 + 12, H * 0.28); c.stroke();
      c.lineWidth = 9;
      c.beginPath(); c.moveTo(W / 2 + 16, H * 0.42); c.quadraticCurveTo(W / 2 - 50, H * 0.3, W / 2 - 90, H * 0.24); c.stroke();
      c.beginPath(); c.moveTo(W / 2 + 18, H * 0.36); c.quadraticCurveTo(W / 2 + 80, H * 0.28, W / 2 + 110, H * 0.22); c.stroke();
      const blobs = [];
      for (let i = 0; i < 12; i++) blobs.push([W / 2 + I.rng.range(-160, 160), H * 0.18 + I.rng.range(-26, 22), I.rng.range(50, 80), I.rng.range(26, 38)]);
      blobs.forEach((b) => { c.fillStyle = leaf[2]; U.ellipse(c, b[0] + 4, b[1] + 10, b[2], b[3]); c.fill(); });
      blobs.forEach((b) => { c.fillStyle = leaf[0]; U.ellipse(c, b[0], b[1], b[2] * 0.94, b[3] * 0.9); c.fill(); });
      blobs.forEach((b) => { c.fillStyle = U.rgba(leaf[1], 0.8); U.ellipse(c, b[0] - b[2] * 0.2, b[1] - b[3] * 0.35, b[2] * 0.6, b[3] * 0.45); c.fill(); });
    });
    return { img, w: 2500, col: [[0.47, 0.55]] };
  }

  function jungle(I) {
    const img = mk(400, 480, I.q, (c, W, H) => {
      const leaf = I.flora.leaf.map(I.t), trunk = I.t(I.flora.trunk);
      c.strokeStyle = trunk; c.lineWidth = 18;
      c.beginPath(); c.moveTo(W / 2 - 20, H); c.quadraticCurveTo(W / 2 - 40, H * 0.6, W / 2 - 10, H * 0.35); c.stroke();
      c.lineWidth = 12;
      c.beginPath(); c.moveTo(W / 2 + 10, H); c.quadraticCurveTo(W / 2 + 40, H * 0.65, W / 2 + 30, H * 0.4); c.stroke();
      for (let i = 0; i < 26; i++) {
        const x = W / 2 + I.rng.range(-170, 170), y = H * 0.3 + I.rng.range(-120, 70);
        const a = I.rng.range(0, Math.PI), col = leaf[i % 3];
        c.fillStyle = col;
        U.ellipse(c, x, y, I.rng.range(40, 70), I.rng.range(18, 30), a); c.fill();
      }
      c.strokeStyle = U.rgba(leaf[2], 0.9); c.lineWidth = 3;
      for (let i = 0; i < 6; i++) { const x = W / 2 + I.rng.range(-140, 140); c.beginPath(); c.moveTo(x, H * 0.35); c.quadraticCurveTo(x + 10, H * 0.55, x - 4, H * 0.7); c.stroke(); }
    });
    return { img, w: 2400, col: [[0.4, 0.58]] };
  }

  function bush(I, flowers) {
    const img = mk(300, 170, I.q, (c, W, H) => {
      const leaf = I.flora.leaf.map(I.t);
      const blobs = [];
      for (let i = 0; i < 7; i++) blobs.push([30 + (i / 6) * (W - 60) + I.rng.range(-10, 10), H - 45 - I.rng.range(0, 40), I.rng.range(40, 62)]);
      blobs.forEach((b) => { c.fillStyle = leaf[2]; c.beginPath(); c.arc(b[0], b[1] + 8, b[2], 0, Math.PI * 2); c.fill(); });
      blobs.forEach((b) => { c.fillStyle = leaf[0]; c.beginPath(); c.arc(b[0] - 4, b[1], b[2] * 0.86, 0, Math.PI * 2); c.fill(); });
      blobs.forEach((b) => { c.fillStyle = U.rgba(leaf[1], 0.9); c.beginPath(); c.arc(b[0] - b[2] * 0.3, b[1] - b[2] * 0.35, b[2] * 0.45, 0, Math.PI * 2); c.fill(); });
      if (flowers) {
        for (let i = 0; i < 60; i++) { c.fillStyle = I.t(I.rng.pick(flowers)); c.beginPath(); c.arc(I.rng.range(20, W - 20), I.rng.range(30, H - 40), I.rng.range(2, 5), 0, Math.PI * 2); c.fill(); }
      }
      c.fillStyle = 'rgba(0,0,0,0.001)';
    });
    return { img, w: 1050, col: null };
  }

  function cactus(I) {
    const img = mk(180, 340, I.q, (c, W, H) => {
      const g = I.t('#3f7a3a'), gl = I.t('#5f9a52'), gd = I.t('#2a5a2a');
      const col = (x, y0, y1, w) => {
        c.fillStyle = U.lin(c, x - w / 2, 0, x + w / 2, 0, [0, gl, 0.5, g, 1, gd]);
        U.rr(c, x - w / 2, y0, w, y1 - y0, w / 2); c.fill();
        c.strokeStyle = U.rgba(gd, 0.7); c.lineWidth = 2;
        c.beginPath(); c.moveTo(x - w * 0.18, y0 + 10); c.lineTo(x - w * 0.18, y1 - 6); c.moveTo(x + w * 0.18, y0 + 10); c.lineTo(x + w * 0.18, y1 - 6); c.stroke();
      };
      col(W / 2, 20, H, 46);
      c.fillStyle = g; U.rr(c, W / 2 - 60, H * 0.52, 60, 26, 13); c.fill();
      col(W / 2 - 55, H * 0.25, H * 0.6, 30);
      c.fillStyle = g; U.rr(c, W / 2, H * 0.42, 58, 24, 12); c.fill();
      col(W / 2 + 52, H * 0.18, H * 0.48, 28);
    });
    return { img, w: 760, col: [[0.35, 0.65]], brk: 'fall' };
  }

  function rock(I, tall) {
    const w = tall ? 220 : 280, h = tall ? 320 : 190;
    const img = mk(w, h, I.q, (c, W, H) => {
      const base = I.t(tall ? '#8a8a86' : I.rng.pick(['#8c8478', '#7e7a74', '#948a7a']));
      const pts = [];
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI;
        const rx = W * 0.46 * I.rng.range(0.75, 1), ry = (tall ? H * 0.92 : H * 0.88) * I.rng.range(0.7, 1);
        pts.push([W / 2 + Math.cos(a) * rx, H + Math.sin(a) * ry]);
      }
      c.beginPath(); c.moveTo(pts[0][0], H);
      pts.forEach((p) => c.lineTo(p[0], p[1]));
      c.lineTo(pts[n - 1][0], H); c.closePath();
      c.fillStyle = U.shade(base, -0.15); c.fill();
      // facetas
      const top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
      c.fillStyle = U.shade(base, 0.2);
      c.beginPath(); c.moveTo(pts[0][0], H); for (let i = 0; i < n / 2; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(top[0], top[1]); c.lineTo(W * 0.45, H * 0.6); c.closePath(); c.fill();
      c.fillStyle = U.shade(base, -0.35);
      c.beginPath(); c.moveTo(pts[n - 1][0], H); for (let i = n - 1; i > n / 2; i--) c.lineTo(pts[i][0], pts[i][1]); c.lineTo(W * 0.62, H * 0.55); c.lineTo(W * 0.6, H); c.closePath(); c.fill();
      if (tall) {
        c.fillStyle = U.rgba(I.t('#b8c070'), 0.35);
        for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(I.rng.range(W * 0.2, W * 0.8), I.rng.range(H * 0.2, H * 0.9), I.rng.range(3, 9), 0, Math.PI * 2); c.fill(); }
      }
    });
    return { img, w: tall ? 950 : 1150, col: [[0.12, 0.88]] };
  }

  function animal(I, kind) {
    const sizes = { llama: [220, 260], sheep: [240, 180], reindeer: [260, 290], snowman: [160, 240] };
    const [w, h] = sizes[kind];
    const img = mk(w, h, I.q, (c, W, H) => {
      if (kind === 'snowman') {
        const sn = I.t('#f5f8fc'), sh = I.t('#b8c8dc');
        [[W / 2, H - 50, 50], [W / 2, H - 125, 36], [W / 2, H - 180, 26]].forEach((b) => {
          c.fillStyle = U.rad(c, b[0] - b[2] * 0.3, b[1] - b[2] * 0.3, 0, b[2] * 1.2, [0, sn, 1, sh]);
          c.beginPath(); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); c.fill();
        });
        c.fillStyle = I.t('#1a1a1e'); c.fillRect(W / 2 - 22, H - 212, 44, 8); c.fillRect(W / 2 - 15, H - 245, 30, 36);
        c.fillStyle = I.t('#ff7a1a'); c.beginPath(); c.moveTo(W / 2, H - 182); c.lineTo(W / 2 + 26, H - 178); c.lineTo(W / 2, H - 174); c.fill();
        c.fillStyle = I.t('#c8102e'); c.fillRect(W / 2 - 28, H - 160, 56, 12); c.fillRect(W / 2 + 10, H - 152, 12, 30);
        c.fillStyle = '#111'; [[-8, -190], [8, -190], [0, -130], [0, -115], [0, -100]].forEach((d) => { c.beginPath(); c.arc(W / 2 + d[0], H + d[1], 3.5, 0, Math.PI * 2); c.fill(); });
        return;
      }
      if (kind === 'sheep') {
        const wool = I.t('#f2f0ea'), ws = I.t('#cfc8bc'), dark = I.t('#26221f');
        c.fillStyle = dark; [60, 90, 150, 180].forEach((x) => c.fillRect(x, H - 55, 12, 55));
        for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? wool : ws; c.beginPath(); c.arc(60 + I.rng.range(0, 120), H - 95 + I.rng.range(-26, 18), I.rng.range(26, 36), 0, Math.PI * 2); c.fill(); }
        c.fillStyle = wool; U.ellipse(c, 120, H - 95, 80, 42); c.fill();
        c.fillStyle = dark; U.ellipse(c, 205, H - 118, 24, 18, 0.3); c.fill();
        c.fillStyle = I.t('#e8e2d6'); U.ellipse(c, 196, H - 136, 22, 12); c.fill();
        return;
      }
      if (kind === 'llama') {
        const fur = I.t('#e8dcc4'), fs = I.t('#b8a888'), dark = I.t('#3a3028');
        c.fillStyle = fs; [70, 92, 150, 172].forEach((x) => c.fillRect(x, H - 90, 14, 90));
        c.fillStyle = fur; U.ellipse(c, 120, H - 110, 72, 38); c.fill();
        c.fillStyle = U.lin(c, 150, 0, 190, 0, [0, fur, 1, fs]); c.fillRect(150, H - 225, 34, 120);
        U.ellipse(c, 175, H - 228, 30, 20); c.fill();
        c.fillStyle = fur; c.beginPath(); c.moveTo(160, H - 245); c.lineTo(165, H - 270); c.lineTo(172, H - 245); c.fill();
        c.beginPath(); c.moveTo(178, H - 245); c.lineTo(184, H - 268); c.lineTo(190, H - 244); c.fill();
        c.fillStyle = dark; c.beginPath(); c.arc(185, H - 232, 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = I.t('#c8403a'); c.fillRect(150, H - 150, 34, 10);
        return;
      }
      // reno
      const fur = I.t('#8a5e3c'), fs = I.t('#5e3e28'), light = I.t('#d8c4a8');
      c.fillStyle = fs; [70, 90, 160, 180].forEach((x) => c.fillRect(x, H - 100, 12, 100));
      c.fillStyle = fur; U.ellipse(c, 125, H - 120, 78, 36); c.fill();
      c.fillStyle = light; U.ellipse(c, 125, H - 105, 60, 16); c.fill();
      c.fillStyle = fur; c.beginPath(); c.moveTo(170, H - 140); c.lineTo(200, H - 210); c.lineTo(222, H - 200); c.lineTo(200, H - 128); c.fill();
      U.ellipse(c, 220, H - 208, 26, 14, 0.4); c.fill();
      c.strokeStyle = I.t('#d8c8a8'); c.lineWidth = 5;
      c.beginPath(); c.moveTo(210, H - 220); c.lineTo(195, H - 270); c.lineTo(180, H - 280); c.moveTo(198, H - 258); c.lineTo(214, H - 280);
      c.moveTo(222, H - 220); c.lineTo(236, H - 262); c.lineTo(250, H - 272); c.moveTo(234, H - 252); c.lineTo(226, H - 276); c.stroke();
    });
    const worldW = { llama: 780, sheep: 760, reindeer: 900, snowman: 620 }[kind];
    return { img, w: worldW, col: [[0.2, 0.8]], brk: kind === 'snowman' ? 'shatter' : null };
  }

  /* ---- Ventanas ---- */
  function windows(c, x0, y0, x1, y1, cols, rows, opt) {
    const cw = (x1 - x0) / cols, rh = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const x = x0 + k * cw + cw * opt.pad, y = y0 + r * rh + rh * opt.padY;
        const w = cw * (1 - opt.pad * 2), h = rh * (1 - opt.padY * 2);
        const lit = opt.night && opt.rng() < opt.litP;
        if (lit) {
          c.fillStyle = opt.lit;
          c.fillRect(x, y, w, h);
          c.fillStyle = 'rgba(255,255,255,0.35)';
          c.fillRect(x, y, w, h * 0.35);
        } else {
          c.fillStyle = U.lin(c, 0, y, 0, y + h, [0, opt.win2 || U.shade(opt.win, 0.25), 1, opt.win]);
          c.fillRect(x, y, w, h);
        }
        if (opt.arch) {
          c.fillStyle = lit ? opt.lit : opt.win;
          c.beginPath(); c.arc(x + w / 2, y, w / 2, Math.PI, 0); c.fill();
        }
        if (opt.frame) { c.strokeStyle = opt.frame; c.lineWidth = 2; c.strokeRect(x, y, w, h); }
        if (opt.shutter) { c.fillStyle = opt.shutter; c.fillRect(x - w * 0.35, y, w * 0.3, h); c.fillRect(x + w * 1.05, y, w * 0.3, h); }
      }
    }
  }

  function building(I, idx, tall) {
    const city = I.city;
    const r = U.rng((U.hash(I.theme.id + 'b' + idx + (tall ? 't' : '')) >>> 0));
    const hr = tall ? r.range(U.lerp(city.h[0], city.h[1], 0.55), city.h[1]) : r.range(city.h[0], U.lerp(city.h[0], city.h[1], 0.6));
    const W = 360, H = Math.round(360 * hr);
    const style = city.style;
    const wallBase = r.pick(city.walls);
    const img = mk(W, H, I.q, (c) => {
      const wall = I.t(wallBase);
      const night = I.dark;
      const common = { night, rng: r, lit: city.lit, win: I.t(city.win), pad: 0.18, padY: 0.2, litP: 0.5 };
      if (style === 'glass') {
        const gl = I.t(city.glass);
        c.fillStyle = U.lin(c, 0, 0, 0, H, [0, U.shade(gl, 0.35), 0.5, gl, 1, U.shade(gl, -0.35)]);
        c.fillRect(10, 30, W - 20, H - 30);
        c.fillStyle = U.lin(c, 10, 0, W - 10, 0, [0, 'rgba(255,255,255,0.18)', 0.3, 'rgba(255,255,255,0)', 0.7, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.25)']);
        c.fillRect(10, 30, W - 20, H - 30);
        if (night) windows(c, 16, 40, W - 16, H - 10, 10, Math.floor(H / 26), Object.assign({}, common, { pad: 0.08, padY: 0.12, litP: 0.4 }));
        c.strokeStyle = U.rgba(U.shade(gl, -0.5), 0.6); c.lineWidth = 2;
        for (let x = 10; x <= W - 10; x += 34) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x, H); c.stroke(); }
        for (let y = 30; y < H; y += 26) { c.beginPath(); c.moveTo(10, y); c.lineTo(W - 10, y); c.stroke(); }
        c.fillStyle = I.t('#2a2e36'); c.fillRect(30, 12, W - 60, 20);
        c.fillRect(W / 2 - 3, -20, 6, 34);
        return;
      }
      if (style === 'neon') {
        c.fillStyle = U.lin(c, 0, 0, W, 0, [0, U.shade(wall, 0.12), 1, U.shade(wall, -0.2)]);
        c.fillRect(8, 20, W - 16, H - 20);
        windows(c, 20, 40, W - 20, H - 20, 7, Math.floor(H / 34), Object.assign({}, common, { litP: 0.55, lit: r.chance(0.5) ? city.lit : '#9fd8ff' }));
        const neon = ['#ff3cac', '#38e1ff', '#b4ff4d', '#ffe14d'];
        const nc = r.pick(neon);
        c.shadowColor = nc; c.shadowBlur = 18;
        c.fillStyle = nc;
        const nx = r.chance(0.5) ? 22 : W - 42;
        c.fillRect(nx, 60, 20, Math.min(H * 0.5, 320));
        c.fillRect(20, 26, W - 40, 6);
        c.shadowBlur = 0;
        return;
      }
      // estilos de fachada
      c.fillStyle = U.lin(c, 0, 0, W, 0, [0, U.shade(wall, 0.1), 0.18, wall, 1, U.shade(wall, -0.18)]);
      c.fillRect(6, 24, W - 12, H - 24);
      if (style === 'brick') {
        c.strokeStyle = U.rgba(U.shade(wall, -0.3), 0.35); c.lineWidth = 1;
        for (let y = 30; y < H; y += 9) { c.beginPath(); c.moveTo(6, y); c.lineTo(W - 6, y); c.stroke(); }
      }
      const rows = Math.max(3, Math.floor((H - 70) / 58));
      const opt = Object.assign({}, common, {
        frame: style === 'brick' || style === 'classic' ? I.t('#e8e4dc') : null,
        shutter: style === 'ochre' ? I.t('#3a6a4a') : null,
        arch: style === 'pastel' || (style === 'classic' && r.chance(0.4)),
        pad: 0.22, padY: 0.22,
      });
      windows(c, 18, 52, W - 18, H - 58, style === 'classic' ? 5 : 6, rows, opt);
      if (style === 'classic') {
        c.strokeStyle = I.t('#2a2a30'); c.lineWidth = 3;
        [0.35, 0.7].forEach((t) => { const y = 52 + (H - 110) * t; c.beginPath(); c.moveTo(14, y); c.lineTo(W - 14, y); c.stroke(); });
        c.fillStyle = I.t('#4a5260');
        c.beginPath(); c.moveTo(0, 30); c.lineTo(30, -10); c.lineTo(W - 30, -10); c.lineTo(W, 30); c.closePath(); c.fill();
      } else if (style === 'ochre' || style === 'pastel') {
        c.fillStyle = I.t('#b8583a'); c.fillRect(0, 16, W, 14);
        c.fillStyle = I.t('#e8e0d0'); c.fillRect(0, 28, W, 6);
      } else {
        c.fillStyle = I.t(U.shade(wallBase, -0.3)); c.fillRect(0, 16, W, 12);
        if (r.chance(0.5)) { c.fillRect(W * 0.7, -10, 26, 30); }
      }
      // planta baja: tiendas
      const gy = H - 58;
      c.fillStyle = I.t('#20242c'); c.fillRect(6, gy, W - 12, 58);
      for (let i = 0; i < 3; i++) {
        const x = 18 + i * ((W - 36) / 3);
        c.fillStyle = night ? U.rgba(city.lit, 0.85) : I.t('#5a7890');
        c.fillRect(x + 6, gy + 12, (W - 36) / 3 - 12, 40);
      }
      if (night) { c.fillStyle = U.rgba(city.lit, 0.25); c.fillRect(6, gy - 6, W - 12, 6); }
      c.fillStyle = I.t(r.pick(['#c8403a', '#2a6a9a', '#3a8a4a', '#d8a030']));
      c.fillRect(10, gy - 4, W - 20, 10);
    });
    return { img, w: r.range(5200, 6400), col: [[0.02, 0.98]] };
  }

  function house(I, idx) {
    const hs = I.house;
    const r = U.rng((U.hash(I.theme.id + 'h' + idx) >>> 0));
    const img = mk(400, 330, I.q, (c, W, H) => {
      const wall = I.t(r.pick(hs.walls)), roof = I.t(r.pick(hs.roof));
      const wy = hs.chalet ? 150 : 130;
      c.fillStyle = U.lin(c, 0, 0, W, 0, [0, U.shade(wall, 0.08), 1, U.shade(wall, -0.15)]);
      c.fillRect(40, wy, W - 80, H - wy);
      if (hs.victorian) {
        c.fillStyle = U.shade(wall, -0.08); c.fillRect(60, wy - 20, 110, H - wy + 20);
        c.fillStyle = I.t('#f4f0e6'); for (let x = 60; x < 170; x += 22) c.fillRect(x, wy - 26, 12, 8);
      }
      // tejado
      c.fillStyle = roof;
      c.beginPath();
      if (hs.chalet) { c.moveTo(0, wy + 10); c.lineTo(W / 2, 30); c.lineTo(W, wy + 10); c.lineTo(W - 20, wy + 24); c.lineTo(W / 2, 54); c.lineTo(20, wy + 24); }
      else { c.moveTo(20, wy + 6); c.lineTo(W / 2 - 20, 40); c.lineTo(W / 2 + 20, 40); c.lineTo(W - 20, wy + 6); }
      c.closePath(); c.fill();
      c.fillStyle = U.shade(roof, -0.25);
      c.fillRect(W * 0.66, 50, 26, 50);
      if (hs.snow) {
        c.fillStyle = I.t('#f4f8fc');
        c.beginPath();
        if (hs.chalet) { c.moveTo(0, wy + 10); c.lineTo(W / 2, 30); c.lineTo(W, wy + 10); c.lineTo(W - 16, wy + 4); c.lineTo(W / 2, 40); c.lineTo(16, wy + 4); }
        else { c.moveTo(20, wy + 6); c.lineTo(W / 2 - 20, 40); c.lineTo(W / 2 + 20, 40); c.lineTo(W - 20, wy + 6); c.lineTo(W - 34, wy - 4); c.lineTo(W / 2 + 12, 54); c.lineTo(W / 2 - 12, 54); c.lineTo(34, wy - 4); }
        c.closePath(); c.fill();
      }
      if (hs.chalet) {
        c.fillStyle = I.t('#6a4028'); c.fillRect(46, wy + 60, W - 92, 10);
        for (let x = 50; x < W - 50; x += 16) c.fillRect(x, wy + 70, 6, 30);
      }
      const win = { night: I.dark, rng: r, lit: '#ffd27a', win: I.t('#3a4a5a'), pad: 0.2, padY: 0.2, litP: 0.7, frame: I.t('#f4f0e6') };
      windows(c, 60, wy + 22, W - 60, H - 20, 3, 2, win);
      c.fillStyle = I.t('#5a3a28'); c.fillRect(W / 2 - 22, H - 70, 44, 70);
    });
    return { img, w: 3300, col: [[0.1, 0.9]] };
  }

  function hut(I) {
    const img = mk(380, 320, I.q, (c, W, H) => {
      const wood = I.t('#7a5a3a'), straw = I.t('#c8a860');
      c.fillStyle = U.shade(wood, -0.2);
      [60, 140, 240, 320].forEach((x) => c.fillRect(x, 200, 12, H - 200));
      c.fillStyle = wood; c.fillRect(40, 190, W - 80, 16);
      c.fillStyle = I.t('#a8885a'); c.fillRect(70, 110, W - 140, 82);
      c.fillStyle = I.t('#2a2018'); c.fillRect(W / 2 - 20, 130, 40, 62);
      c.fillStyle = straw; c.beginPath(); c.moveTo(20, 120); c.lineTo(W / 2, 20); c.lineTo(W - 20, 120); c.closePath(); c.fill();
      c.strokeStyle = U.shade(straw, -0.3); c.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const t = i / 17; c.beginPath(); c.moveTo(W / 2, 24); c.lineTo(20 + t * (W - 40), 120); c.stroke(); }
    });
    return { img, w: 2700, col: [[0.12, 0.88]] };
  }

  function kiosk(I) {
    const img = mk(320, 300, I.q, (c, W, H) => {
      c.fillStyle = I.t('#2f5a4a'); c.fillRect(40, 110, W - 80, H - 110);
      c.fillStyle = I.dark ? U.rgba('#ffd27a', 0.9) : I.t('#8aa8b8'); c.fillRect(60, 130, W - 120, 70);
      for (let i = 0; i < 8; i++) {
        c.fillStyle = I.t(i % 2 ? '#f4f0e6' : '#c8403a');
        c.beginPath(); c.moveTo(20 + i * 35, 100); c.lineTo(20 + (i + 1) * 35, 100); c.lineTo(20 + (i + 1) * 35 - 4, 130); c.lineTo(20 + i * 35 - 4, 130); c.closePath(); c.fill();
      }
      c.fillStyle = I.t('#1f3a30'); c.fillRect(30, 60, W - 60, 40);
      c.fillStyle = I.t('#ffd21f'); c.font = 'italic 900 30px "Avenir Next Condensed", Futura, sans-serif'; c.textAlign = 'center'; c.fillText('KIOSKO', W / 2, 91);
    });
    return { img, w: 1700, col: [[0.1, 0.9]] };
  }

  function lamp(I, side) {
    const ornate = I.theme.lampStyle === 'ornate';
    if (ornate) {
      const img = mk(120, 560, I.q, (c, W, H) => {
        const iron = I.t('#1c2026');
        c.fillStyle = iron;
        c.fillRect(W / 2 - 6, 90, 12, H - 120);
        U.rr(c, W / 2 - 20, H - 60, 40, 60, 8); c.fill();
        c.fillRect(W / 2 - 14, H - 120, 28, 70);
        c.fillStyle = I.dark ? '#ffe2a0' : I.t('#d8d4c0');
        c.beginPath(); c.moveTo(W / 2 - 26, 40); c.lineTo(W / 2 + 26, 40); c.lineTo(W / 2 + 18, 96); c.lineTo(W / 2 - 18, 96); c.closePath(); c.fill();
        c.fillStyle = iron;
        c.beginPath(); c.moveTo(W / 2 - 32, 44); c.lineTo(W / 2, 12); c.lineTo(W / 2 + 32, 44); c.closePath(); c.fill();
        c.fillRect(W / 2 - 22, 94, 44, 8);
      });
      return { img, w: 520, ax: 0.5, col: [[0.38, 0.62]], light: [[0.5, 70 / 560, 1.0, 'lamp']], brk: 'fall' };
    }
    const img = mk(240, 640, I.q, (c, W, H) => {
      const metal = I.t('#8a9098'), dark = I.t('#4a5058');
      const px = side === 'R' ? W * 0.86 : W * 0.14;
      const ex = side === 'R' ? W * 0.08 : W * 0.92;
      c.fillStyle = U.lin(c, px - 8, 0, px + 8, 0, [0, U.shade(metal, 0.25), 1, dark]);
      c.fillRect(px - 7, 60, 14, H - 60);
      c.fillRect(px - 12, H - 40, 24, 40);
      c.strokeStyle = metal; c.lineWidth = 9;
      c.beginPath(); c.moveTo(px, 90); c.quadraticCurveTo(px, 40, (px + ex) / 2, 40); c.lineTo(ex, 44); c.stroke();
      c.fillStyle = dark;
      U.rr(c, Math.min(ex, ex + (side === 'R' ? 0 : -46)) - (side === 'R' ? 8 : 0), 36, 54, 18, 8); c.fill();
      c.fillStyle = I.dark ? '#fff4d0' : I.t('#dfe6ee');
      U.rr(c, Math.min(ex, ex + (side === 'R' ? 0 : -46)) - (side === 'R' ? 4 : -4), 50, 46, 8, 4); c.fill();
    });
    const ax = side === 'R' ? 0.86 : 0.14;
    const lx = side === 'R' ? 0.16 : 0.84;
    return { img, w: 1500, ax, col: [[ax - 0.05, ax + 0.05]], light: [[lx, 58 / 640, 1.0, 'lamp']], brk: 'fall' };
  }

  const BOARD_BRANDS = [
    { t: 'TURBOIL', sub: 'MOTOR OIL', bg: ['#ff5a1a', '#b8200a'], fg: '#ffffff' },
    { t: 'APEX', sub: 'TYRES', bg: ['#16181c', '#000000'], fg: '#ffd21f' },
    { t: 'NITRO X', sub: 'ENERGY', bg: ['#1b6fd6', '#0a2a6a'], fg: '#ffffff' },
    { t: 'VELOCE', sub: 'CARBON PARTS', bg: ['#e8e8e8', '#b8bcc4'], fg: '#c8102e' },
    { t: 'GULF-STAR', sub: 'RACING FUEL', bg: ['#7fcbe8', '#3a8ab8'], fg: '#ff7a1a' },
    { t: 'TOP GEAR', sub: 'SUPERCAR LEGENDS', bg: ['#1a1238', '#050310'], fg: '#ff7a1a' },
  ];
  function board(I, idx) {
    const r = U.rng((U.hash(I.theme.id + 'bd' + idx) >>> 0));
    const br = BOARD_BRANDS[(idx + (U.hash(I.theme.id) % BOARD_BRANDS.length)) % BOARD_BRANDS.length];
    const img = mk(600, 420, I.q, (c, W, H) => {
      c.fillStyle = I.t('#3a3e46');
      c.fillRect(W * 0.25 - 8, 240, 16, H - 240); c.fillRect(W * 0.75 - 8, 240, 16, H - 240);
      const bg = br.bg.map((x) => (I.dark ? U.mix(x, '#000', 0.2) : I.t(x)));
      c.fillStyle = U.lin(c, 0, 0, W, 250, [0, bg[0], 1, bg[1]]);
      c.fillRect(0, 0, W, 250);
      c.strokeStyle = I.t('#20242a'); c.lineWidth = 10; c.strokeRect(5, 5, W - 10, 240);
      c.fillStyle = U.rgba(br.fg, 0.18);
      c.beginPath(); c.moveTo(W * 0.62, 10); c.lineTo(W * 0.9, 10); c.lineTo(W * 0.7, 240); c.lineTo(W * 0.42, 240); c.closePath(); c.fill();
      c.fillStyle = br.fg;
      c.font = 'italic 900 96px "Avenir Next Condensed", Futura, "Arial Black", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(br.t, W / 2, 110);
      c.font = '700 34px "DIN Alternate", "DIN Condensed", Bahnschrift, sans-serif';
      c.fillText(br.sub, W / 2, 190);
      if (I.dark) {
        c.fillStyle = U.lin(c, 0, 0, 0, 250, [0, 'rgba(255,240,200,0.35)', 1, 'rgba(255,240,200,0)']);
        c.fillRect(0, 0, W, 250);
      }
    });
    return { img, w: 3800, col: [[0.22, 0.28], [0.72, 0.78]], light: I.dark ? [[0.3, 0.02, 1.4, 'lamp'], [0.7, 0.02, 1.4, 'lamp']] : null, brk: 'fall' };
  }

  function neon(I, idx) {
    const tokyo = I.theme.id === 'tokyo' || I.theme.id === 'yokohama';
    const r = U.rng((U.hash(I.theme.id + 'n' + idx) >>> 0));
    const cols = ['#ff3cac', '#38e1ff', '#ffe14d', '#b4ff4d'];
    const img = mk(420, 560, I.q, (c, W, H) => {
      c.fillStyle = I.t('#20242c');
      c.fillRect(W * 0.2 - 8, 300, 16, H - 300); c.fillRect(W * 0.8 - 8, 300, 16, H - 300);
      c.fillStyle = '#0c0a18';
      U.rr(c, 10, 20, W - 20, 290, 18); c.fill();
      const c1 = cols[idx % 4], c2 = cols[(idx + 1) % 4];
      c.lineWidth = 10;
      c.shadowBlur = 22;
      c.strokeStyle = c1; c.shadowColor = c1;
      U.rr(c, 26, 36, W - 52, 258, 14); c.stroke();
      c.shadowColor = c2; c.fillStyle = c2;
      if (tokyo) {
        const jp = ['東京', 'ラーメン', 'カラオケ', '寿司', 'ネオン', '夜の街'];
        const wd = jp[(idx + U.hash(I.theme.id)) % jp.length];
        const fs = wd.length > 3 ? 64 : wd.length > 2 ? 84 : 116;
        c.font = '900 ' + fs + 'px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(wd, W / 2, 150);
        c.fillStyle = c1; c.shadowColor = c1;
        for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(60 + i * 38, 262, 6, 0, Math.PI * 2); c.fill(); }
      } else {
        const words = ['CASINO', 'MOTEL', 'DINER', '★ BAR ★', 'JACKPOT', 'LUCKY 7'];
        c.font = 'italic 900 86px "Avenir Next Condensed", Futura, "Arial Black", sans-serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(words[(idx + U.hash(I.theme.id)) % words.length], W / 2, 150);
        c.fillStyle = c1; c.shadowColor = c1;
        for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(60 + i * 38, 245, 7, 0, Math.PI * 2); c.fill(); }
      }
      c.shadowBlur = 0;
    });
    return { img, w: 2500, col: [[0.17, 0.23], [0.77, 0.83]], brk: 'fall' };
  }

  function chevron(I, dir) {
    const circuit = !!I.theme.circuit;
    const img = mk(360, 250, I.q, (c, W, H) => {
      c.fillStyle = I.t('#3a3e46');
      c.fillRect(40, 150, 14, H - 150); c.fillRect(W - 54, 150, 14, H - 150);
      const bg = I.t(circuit ? '#c8102e' : '#16181c'), fg = circuit ? I.t('#f4f4f4') : (I.dark ? '#ffd21f' : I.t('#ffd21f'));
      c.fillStyle = bg; U.rr(c, 4, 4, W - 8, 150, 10); c.fill();
      c.strokeStyle = I.t('#f4f4f4'); c.lineWidth = 5; U.rr(c, 8, 8, W - 16, 142, 8); c.stroke();
      c.fillStyle = fg;
      for (let i = 0; i < 3; i++) {
        const x = 70 + i * 100;
        c.beginPath();
        if (dir > 0) { c.moveTo(x - 30, 24); c.lineTo(x + 5, 24); c.lineTo(x + 45, 79); c.lineTo(x + 5, 134); c.lineTo(x - 30, 134); c.lineTo(x + 10, 79); }
        else { c.moveTo(x + 45, 24); c.lineTo(x + 10, 24); c.lineTo(x - 30, 79); c.lineTo(x + 10, 134); c.lineTo(x + 45, 134); c.lineTo(x + 5, 79); }
        c.closePath(); c.fill();
      }
    });
    return { img, w: 1700, col: [[0.06, 0.94]], brk: 'shatter' };
  }

  function gantry(I) {
    const img = mk(1200, 520, I.q, (c, W, H) => {
      const steel = I.t('#8e959e'), dark = I.t('#3a3f47');
      [[0, 80], [W - 80, W]].forEach((p) => {
        c.fillStyle = U.lin(c, p[0], 0, p[1], 0, [0, U.shade(steel, 0.2), 1, dark]);
        c.fillRect(p[0], 40, p[1] - p[0], H - 40);
        c.fillStyle = I.t('#ff7a1a'); c.fillRect(p[0], 250, p[1] - p[0], 40);
        c.fillStyle = I.t('#7fcbe8'); c.fillRect(p[0], 290, p[1] - p[0], 12);
      });
      c.fillStyle = I.t('#15171c'); c.fillRect(40, 30, W - 80, 150);
      const sq = 18;
      for (let row = 0; row < 2; row++) for (let x = 40; x < W - 40; x += sq) {
        c.fillStyle = ((x / sq + row) | 0) % 2 ? I.t('#f4f4f4') : I.t('#111');
        c.fillRect(x, row ? 162 : 30, sq, sq);
      }
      c.fillStyle = I.t('#ffffff');
      c.font = 'italic 900 92px "Avenir Next Condensed", Futura, "Arial Black", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('SALIDA · META', W / 2, 106);
      c.fillStyle = I.t('#20242a'); c.fillRect(W / 2 - 150, 184, 300, 46);
      for (let i = 0; i < 5; i++) { c.fillStyle = I.dark ? '#5a0a10' : I.t('#4a0a10'); c.beginPath(); c.arc(W / 2 - 120 + i * 60, 207, 16, 0, Math.PI * 2); c.fill(); }
    });
    return { img, w: 5600, ax: 0.5, center: true, col: [[0, 0.07], [0.93, 1]] };
  }

  function torii(I) {
    const img = mk(1000, 620, I.q, (c, W, H) => {
      const red = I.t('#d0301e'), black = I.t('#1a1614');
      c.fillStyle = U.lin(c, 0, 0, 60, 0, [0, U.shade(red, 0.15), 1, U.shade(red, -0.2)]);
      c.fillRect(70, 120, 56, H - 120); c.fillRect(W - 126, 120, 56, H - 120);
      c.fillStyle = red; c.fillRect(40, 190, W - 80, 36);
      c.fillStyle = black;
      c.beginPath(); c.moveTo(0, 70); c.quadraticCurveTo(W / 2, 100, W, 70); c.lineTo(W - 20, 118); c.quadraticCurveTo(W / 2, 138, 20, 118); c.closePath(); c.fill();
      c.fillStyle = red; c.beginPath(); c.moveTo(20, 118); c.quadraticCurveTo(W / 2, 138, W - 20, 118); c.lineTo(W - 34, 150); c.quadraticCurveTo(W / 2, 168, 34, 150); c.closePath(); c.fill();
      c.fillStyle = black; c.fillRect(W / 2 - 40, 150, 80, 70);
      c.fillStyle = I.t('#c8a040'); c.fillRect(W / 2 - 30, 160, 60, 50);
    });
    return { img, w: 5800, ax: 0.5, center: true, col: [[0.06, 0.13], [0.87, 0.94]] };
  }

  function grandstand(I) {
    const mkStand = (up) => { const r = U.rng((U.hash(I.theme.id + 'st') >>> 0)); return mk(900, 380, I.q, (c, W, H) => {
      c.fillStyle = I.t('#5a616c'); c.fillRect(0, 90, W, H - 90);
      for (let i = 0; i < 7; i++) {
        const y = 110 + i * 36;
        c.fillStyle = I.t(i % 2 ? '#8a929e' : '#7a828e'); c.fillRect(10, y, W - 20, 30);
        for (let x = 16; x < W - 16; x += 9) {
          const bob = up && r() < 0.5 ? -3 : 0;
          c.fillStyle = I.t(r.pick(['#e8d0b0', '#c8403a', '#2a6a9a', '#f4f4f4', '#ffd21f', '#3a8a4a', '#1a1a1e', '#ff7a1a']));
          c.fillRect(x, y + 4 + bob + r.range(-2, 2), 6, 10);
          c.fillStyle = I.t('#d8b898'); c.fillRect(x + 1, y + 1 + bob + r.range(-1, 1), 4, 4);
        }
      }
      c.fillStyle = I.t('#2a2e36');
      c.beginPath(); c.moveTo(0, 90); c.lineTo(W, 60); c.lineTo(W, 80); c.lineTo(0, 108); c.closePath(); c.fill();
      for (let x = 30; x < W; x += 170) c.fillRect(x, 70, 8, H - 70);
      c.fillStyle = I.t('#ff7a1a'); c.fillRect(0, H - 30, W, 14);
      c.fillStyle = I.t('#f4f4f4'); c.font = 'italic 900 22px "Avenir Next Condensed", Futura, sans-serif'; c.textAlign = 'center';
      c.fillText('TOP GEAR · SUPERCAR LEGENDS · TOP GEAR · SUPERCAR LEGENDS', W / 2, H - 16);
    }); };
    return { img: mkStand(false), img2: mkStand(true), w: 7400, col: [[0, 1]], fps: 2.2 };
  }

  // Público de pie tras una barrera: dos fotogramas (brazos arriba / abajo) para animarlo
  function crowd(I, idx) {
    const r = U.rng((U.hash(I.theme.id + 'crowd' + idx) >>> 0));
    const cold = I.theme.weather === 'snow' || /helsinki|oslo|lapland|stockholm|alps|lochness/.test(I.theme.id);
    const skins = ['#f1c8a6', '#e0ac85', '#c68a62', '#9a6444', '#6e4630', '#f6d6bc'];
    const shirts = cold ? ['#1b3fa6', '#c8102e', '#2a2e36', '#5a616c', '#0f5a3c', '#ff7a1a', '#f4f4f4']
      : ['#c8102e', '#ffd21f', '#1b3fa6', '#f4f4f4', '#ff7a1a', '#3a8a4a', '#7fcbe8', '#ff3c8e', '#1a1a1e'];
    const hair = ['#1a1410', '#3a2a1e', '#6a4a2e', '#c8a060', '#2a2a2e', '#8a8a8a'];
    const flags = [['#c8102e', '#f4f4f4'], ['#1b3fa6', '#ffd21f'], ['#ff7a1a', '#7fcbe8'], ['#1a1a1e', '#f4f4f4']];
    const W = 900, H = 330;
    const people = [];
    for (let row = 0; row < 3; row++) {
      const n = 24 - row * 2;
      for (let i = 0; i < n; i++) {
        people.push({
          x: 16 + (i + (row % 2) * 0.5) * ((W - 32) / n) + r.range(-6, 6), row,
          s: 1 - row * 0.12 + r.range(-0.05, 0.05), skin: r.pick(skins), shirt: r.pick(shirts), hair: r.pick(hair),
          hat: cold ? r.chance(0.6) : r.chance(0.2), hatC: r.pick(shirts), arms: r.range(0, 1), flag: r.chance(0.12) ? r.pick(flags) : null,
          ph: r.chance(0.5), cam: r.chance(0.06),
        });
      }
    }
    const draw = (up) => mk(W, H, I.q, (c) => {
      c.fillStyle = I.t('#3a3e46'); c.fillRect(0, H - 150, W, 150);
      people.sort((a, b) => a.row - b.row === 0 ? a.x - b.x : b.row - a.row);
      for (const p of people) {
        const base = H - 64 - p.row * 44, sc = p.s * 1.25;
        const lift = up && p.ph ? -5 : 0;
        const x = p.x, y = base + lift;
        // cuerpo
        c.fillStyle = I.t(p.shirt);
        U.rr(c, x - 11 * sc, y - 34 * sc, 22 * sc, 36 * sc, 7 * sc); c.fill();
        // brazos: arriba celebrando o abajo
        c.strokeStyle = I.t(p.shirt); c.lineWidth = 6 * sc;
        const armUp = (up ? p.arms > 0.35 : p.arms > 0.8);
        c.beginPath();
        if (armUp) { c.moveTo(x - 9 * sc, y - 28 * sc); c.lineTo(x - 17 * sc, y - 52 * sc); c.moveTo(x + 9 * sc, y - 28 * sc); c.lineTo(x + 17 * sc, y - 52 * sc); }
        else { c.moveTo(x - 10 * sc, y - 28 * sc); c.lineTo(x - 14 * sc, y - 8 * sc); c.moveTo(x + 10 * sc, y - 28 * sc); c.lineTo(x + 14 * sc, y - 8 * sc); }
        c.stroke();
        if (armUp) { c.fillStyle = I.t(p.skin); [[-17, -54], [17, -54]].forEach((h) => { c.beginPath(); c.arc(x + h[0] * sc, y + h[1] * sc, 3.6 * sc, 0, Math.PI * 2); c.fill(); }); }
        // cabeza, pelo y gorro
        c.fillStyle = I.t(p.skin); c.beginPath(); c.arc(x, y - 43 * sc, 9 * sc, 0, Math.PI * 2); c.fill();
        c.fillStyle = I.t(p.hair); c.beginPath(); c.arc(x, y - 45 * sc, 9 * sc, Math.PI * 1.05, Math.PI * 1.95); c.fill();
        if (p.hat) { c.fillStyle = I.t(p.hatC); c.beginPath(); c.arc(x, y - 47 * sc, 9.5 * sc, Math.PI, 0); c.fill(); if (cold) { c.fillStyle = I.t('#f4f4f4'); c.beginPath(); c.arc(x, y - 57 * sc, 3 * sc, 0, Math.PI * 2); c.fill(); } }
        // bandera ondeando
        if (p.flag) {
          const fx = x + 16 * sc, fy = y - 70 * sc, wv = up ? 6 : -6;
          c.strokeStyle = I.t('#d8dce2'); c.lineWidth = 2 * sc;
          c.beginPath(); c.moveTo(x + 14 * sc, y - 30 * sc); c.lineTo(fx, fy); c.stroke();
          c.fillStyle = I.t(p.flag[0]);
          c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + 18 * sc, fy + wv * sc, fx + 36 * sc, fy + 2 * sc); c.lineTo(fx + 36 * sc, fy + 22 * sc); c.quadraticCurveTo(fx + 18 * sc, fy + 20 * sc + wv * sc, fx, fy + 20 * sc); c.closePath(); c.fill();
          c.fillStyle = I.t(p.flag[1]); c.fillRect(fx + 2 * sc, fy + 8 * sc, 33 * sc, 5 * sc);
        }
        // flash de cámara (de noche se ve más)
        if (p.cam && up) { c.fillStyle = 'rgba(255,255,240,0.95)'; c.beginPath(); c.arc(x + 6 * sc, y - 40 * sc, 5 * sc, 0, Math.PI * 2); c.fill(); }
      }
      // barrera de protección
      c.fillStyle = I.t('#d8dce2'); c.fillRect(0, H - 60, W, 8);
      for (let x = 0; x < W; x += 40) { c.fillStyle = I.t((x / 40) % 2 ? '#f4f4f4' : '#c8102e'); c.fillRect(x, H - 52, 40, 22); }
      c.fillStyle = I.t('#5a616c'); for (let x = 20; x < W; x += 150) c.fillRect(x, H - 52, 8, 52);
      c.fillStyle = I.t('#8a9098'); c.fillRect(0, H - 30, W, 4);
    });
    return { img: draw(false), img2: draw(true), w: 3600, col: [[0.01, 0.99]], fps: 2.6 };
  }

  function tires(I) {
    const img = mk(300, 150, I.q, (c, W, H) => {
      for (let s = 0; s < 3; s++) for (let t = 0; t < 3; t++) {
        const x = 50 + s * 100, y = H - 22 - t * 44;
        c.fillStyle = I.t('#111214'); U.ellipse(c, x, y, 48, 24); c.fill();
        c.fillStyle = I.t((s + t) % 2 ? '#f4f4f4' : '#c8102e'); U.ellipse(c, x, y - 4, 46, 14); c.fill();
        c.fillStyle = I.t('#1a1b1e'); U.ellipse(c, x, y - 8, 30, 9); c.fill();
      }
    });
    return { img, w: 1450, col: [[0.02, 0.98]], soft: true, brk: 'shatter' };
  }

  function fence(I) {
    const img = mk(600, 160, I.q, (c, W, H) => {
      c.strokeStyle = I.t('#8a9098'); c.lineWidth = 1.5;
      c.globalAlpha = 0.55;
      for (let x = -H; x < W; x += 12) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x + H, H); c.stroke(); c.beginPath(); c.moveTo(x + H, 20); c.lineTo(x, H); c.stroke(); }
      c.globalAlpha = 1;
      c.fillStyle = I.t('#5a616c');
      for (let x = 0; x <= W; x += 100) c.fillRect(Math.min(W - 8, x), 10, 8, H - 10);
      c.fillRect(0, 12, W, 6);
      c.fillStyle = I.t('#c8102e'); c.fillRect(0, H - 26, W, 12);
      c.fillStyle = I.t('#f4f4f4'); for (let x = 0; x < W; x += 60) c.fillRect(x, H - 26, 30, 12);
    });
    return { img, w: 3300, col: [[0, 1]], soft: true, brk: 'shatter' };
  }

  function flag(I) {
    const r = U.rng((U.hash(I.theme.id + 'fl') >>> 0));
    const pal = r.pick([['#c8102e', '#f4f4f4'], ['#1b3fa6', '#ffd21f'], ['#111', '#f4f4f4'], ['#ff7a1a', '#7fcbe8']]);
    const img = mk(170, 440, I.q, (c, W, H) => {
      c.fillStyle = I.t('#c8ccd2'); c.fillRect(16, 10, 8, H - 10);
      c.beginPath(); c.moveTo(24, 20);
      c.bezierCurveTo(70, 0, 110, 50, W - 4, 26);
      c.lineTo(W - 8, 126);
      c.bezierCurveTo(110, 150, 70, 100, 24, 120);
      c.closePath();
      c.fillStyle = I.t(pal[0]); c.fill();
      c.save(); c.clip();
      c.fillStyle = I.t(pal[1]); c.fillRect(24, 56, W, 30);
      c.restore();
    });
    return { img, w: 820, col: [[0.06, 0.16]], brk: 'fall' };
  }

  function pagoda(I) {
    const img = mk(360, 660, I.q, (c, W, H) => {
      const wood = I.t('#8a2a1e'), roof = I.t('#2a2a30'), gold = I.t('#c8a040');
      c.fillStyle = gold; c.fillRect(W / 2 - 4, 0, 8, 90);
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const y = H - 20 - i * 115;
        const w = (W - 80) * (1 - t * 0.45);
        c.fillStyle = wood; c.fillRect(W / 2 - w * 0.36, y - 80, w * 0.72, 80);
        c.fillStyle = I.dark ? U.rgba('#ffcf7a', 0.8) : I.t('#3a2020');
        c.fillRect(W / 2 - w * 0.2, y - 64, w * 0.4, 40);
        c.fillStyle = roof;
        c.beginPath(); c.moveTo(W / 2 - w / 2 - 10, y - 70); c.quadraticCurveTo(W / 2, y - 110, W / 2 + w / 2 + 10, y - 70);
        c.lineTo(W / 2 + w / 2 - 12, y - 86); c.quadraticCurveTo(W / 2, y - 124, W / 2 - w / 2 + 12, y - 86); c.closePath(); c.fill();
        c.fillRect(W / 2 - w * 0.44, y - 92, w * 0.88, 10);
      }
    });
    return { img, w: 3700, col: [[0.2, 0.8]] };
  }

  function stoneLantern(I) {
    const img = mk(140, 270, I.q, (c, W, H) => {
      const st = I.t('#9a968e'), sd = I.t('#6a665e');
      c.fillStyle = sd; c.fillRect(W / 2 - 40, H - 24, 80, 24);
      c.fillStyle = st; c.fillRect(W / 2 - 14, H - 130, 28, 110);
      c.fillStyle = sd; c.fillRect(W / 2 - 36, H - 150, 72, 20);
      c.fillStyle = st; c.fillRect(W / 2 - 28, H - 200, 56, 50);
      c.fillStyle = I.dark ? '#ffcf7a' : I.t('#2a2622'); c.fillRect(W / 2 - 14, H - 192, 28, 32);
      c.fillStyle = sd; c.beginPath(); c.moveTo(W / 2 - 56, H - 196); c.lineTo(W / 2, H - 246); c.lineTo(W / 2 + 56, H - 196); c.closePath(); c.fill();
      c.fillStyle = st; c.beginPath(); c.arc(W / 2, H - 252, 10, 0, Math.PI * 2); c.fill();
    });
    return { img, w: 640, col: [[0.25, 0.75]], light: I.dark ? [[0.5, (270 - 176) / 270, 0.5, 'lamp']] : null, brk: 'shatter' };
  }

  function column(I) {
    const broken = I.rng.chance(0.4);
    const img = mk(170, 540, I.q, (c, W, H) => {
      const m = I.t('#e8e0d0'), md = I.t('#b8ae9c');
      c.fillStyle = md; c.fillRect(10, H - 40, W - 20, 40);
      const top = broken ? 200 : 70;
      c.fillStyle = U.lin(c, 30, 0, W - 30, 0, [0, U.shade(m, 0.1), 0.5, m, 1, md]);
      c.fillRect(34, top, W - 68, H - 40 - top);
      c.strokeStyle = U.rgba(U.shade(md, -0.2), 0.6); c.lineWidth = 3;
      for (let x = 44; x < W - 40; x += 14) { c.beginPath(); c.moveTo(x, top + 6); c.lineTo(x, H - 44); c.stroke(); }
      if (!broken) {
        c.fillStyle = m; c.fillRect(14, 40, W - 28, 32);
        c.beginPath(); c.arc(28, 58, 16, 0, Math.PI * 2); c.arc(W - 28, 58, 16, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = m; c.beginPath(); c.moveTo(34, top); c.lineTo(60, top - 30); c.lineTo(90, top - 8); c.lineTo(W - 34, top - 36); c.lineTo(W - 34, top); c.closePath(); c.fill();
      }
    });
    return { img, w: 950, col: [[0.2, 0.8]] };
  }

  function phonebox(I) {
    const img = mk(160, 380, I.q, (c, W, H) => {
      const red = I.t('#c8102e');
      c.fillStyle = U.lin(c, 0, 0, W, 0, [0, U.shade(red, 0.15), 1, U.shade(red, -0.25)]);
      U.rr(c, 14, 30, W - 28, H - 30, 10); c.fill();
      c.beginPath(); c.arc(W / 2, 40, W / 2 - 14, Math.PI, 0); c.fill();
      c.fillStyle = I.t('#f4f4f4'); c.fillRect(26, 50, W - 52, 20);
      c.fillStyle = I.dark ? U.rgba('#ffe6b0', 0.9) : I.t('#3a4a5a');
      for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) c.fillRect(32 + k * 34, 86 + r * 38, 28, 30);
    });
    return { img, w: 720, col: [[0.08, 0.92]], light: I.dark ? [[0.5, 0.45, 0.6, 'lamp']] : null, brk: 'shatter' };
  }

  function mooringPole(I) {
    const img = mk(80, 440, I.q, (c, W, H) => {
      c.fillStyle = I.t('#f4f4f4'); c.fillRect(W / 2 - 12, 30, 24, H - 30);
      c.save(); c.beginPath(); c.rect(W / 2 - 12, 30, 24, H - 30); c.clip();
      c.fillStyle = I.t('#1b3fa6');
      for (let y = 0; y < H; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y - 26); c.lineTo(W, y - 6); c.lineTo(0, y + 20); c.closePath(); c.fill(); }
      c.restore();
      c.fillStyle = I.t('#c8a040'); c.beginPath(); c.arc(W / 2, 28, 16, 0, Math.PI * 2); c.fill();
    });
    return { img, w: 380, col: [[0.2, 0.8]], brk: 'fall' };
  }

  function lighthouse(I) {
    const img = mk(210, 660, I.q, (c, W, H) => {
      c.save();
      c.beginPath(); c.moveTo(60, H); c.lineTo(78, 150); c.lineTo(W - 78, 150); c.lineTo(W - 60, H); c.closePath(); c.clip();
      for (let i = 0; i < 6; i++) { c.fillStyle = I.t(i % 2 ? '#c8102e' : '#f4f4f4'); c.fillRect(0, 150 + i * 85, W, 85); }
      c.fillStyle = U.lin(c, 60, 0, W - 60, 0, [0, 'rgba(255,255,255,0.2)', 1, 'rgba(0,0,0,0.3)']); c.fillRect(0, 0, W, H);
      c.restore();
      c.fillStyle = I.t('#2a2e36'); c.fillRect(56, 136, W - 112, 16);
      c.fillStyle = I.dark ? '#fff4c0' : I.t('#a8c8d8'); c.fillRect(76, 80, W - 152, 56);
      c.fillStyle = I.t('#c8102e'); c.beginPath(); c.moveTo(66, 82); c.lineTo(W / 2, 30); c.lineTo(W - 66, 82); c.closePath(); c.fill();
    });
    return { img, w: 1700, col: [[0.3, 0.7]], light: I.dark ? [[0.5, 108 / 660, 3, 'lamp']] : null };
  }

  function stoneWall(I) {
    const img = mk(600, 110, I.q, (c, W, H) => {
      c.fillStyle = I.t('#6a665e'); c.fillRect(0, 30, W, H - 30);
      for (let row = 0; row < 3; row++) for (let x = (row % 2) * 20; x < W; x += 44) {
        c.fillStyle = I.t(I.rng.pick(['#9a968e', '#8a867e', '#a8a298', '#7e7a72']));
        U.rr(c, x + 2, 32 + row * 26, 40, 22, 8); c.fill();
      }
      c.fillStyle = I.t('#4f7a3a'); c.fillRect(0, 26, W, 8);
    });
    return { img, w: 3300, col: [[0, 1]], soft: true, brk: 'shatter' };
  }

  /* ---- Objetos recogibles ---- */
  function coin(q) {
    const img = mk(128, 128, q, (c, W, H) => {
      c.fillStyle = U.rad(c, W / 2, H / 2, 0, 62, [0, 'rgba(255,220,80,0.5)', 1, 'rgba(255,220,80,0)']);
      c.fillRect(0, 0, W, H);
      c.fillStyle = U.lin(c, 0, 14, 0, 114, [0, '#fff6b0', 0.4, '#ffcc1a', 1, '#b07400']);
      c.beginPath(); c.arc(W / 2, H / 2, 48, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#8a5a00'; c.lineWidth = 5; c.stroke();
      c.strokeStyle = '#ffe680'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, H / 2, 38, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#9a6400';
      c.font = '900 58px "Avenir Next Condensed", Futura, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('$', W / 2 + 2, H / 2 + 4);
      c.fillStyle = '#fff4c0'; c.fillText('$', W / 2, H / 2 + 1);
    });
    return { img, w: 420, ax: 0.5 };
  }
  function fuel(q) {
    const img = mk(150, 190, q, (c, W, H) => {
      c.fillStyle = U.rad(c, W / 2, H / 2, 0, 90, [0, 'rgba(255,80,60,0.45)', 1, 'rgba(255,80,60,0)']);
      c.fillRect(0, 0, W, H);
      c.fillStyle = U.lin(c, 20, 0, W - 20, 0, [0, '#ff5a4a', 0.5, '#d8141e', 1, '#8a0a10']);
      U.rr(c, 22, 40, W - 44, H - 56, 16); c.fill();
      c.fillStyle = '#1a1a1e'; U.rr(c, 40, 22, 50, 26, 8); c.fill();
      c.fillStyle = U.lin(c, 0, 20, 0, 50, [0, '#ff6a5a', 1, '#b8101a']); U.rr(c, 48, 16, 34, 20, 6); c.fill();
      c.fillStyle = '#8a8a90'; c.fillRect(W - 50, 10, 16, 36);
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(42, 70); c.lineTo(W - 42, H - 30); c.moveTo(W - 42, 70); c.lineTo(42, H - 30); c.stroke();
      c.fillStyle = '#fff'; c.font = '900 30px "Avenir Next Condensed", Futura, sans-serif'; c.textAlign = 'center';
      c.fillText('FUEL', W / 2, H - 12);
    });
    return { img, w: 520, ax: 0.5 };
  }
  function nitro(q) {
    const img = mk(130, 210, q, (c, W, H) => {
      c.fillStyle = U.rad(c, W / 2, H / 2, 0, 100, [0, 'rgba(60,180,255,0.5)', 1, 'rgba(60,180,255,0)']);
      c.fillRect(0, 0, W, H);
      c.fillStyle = U.lin(c, 24, 0, W - 24, 0, [0, '#6ad0ff', 0.45, '#1a78d8', 1, '#0a3a8a']);
      U.rr(c, 26, 44, W - 52, H - 60, 24); c.fill();
      c.fillStyle = '#c8ccd2'; U.rr(c, 44, 18, W - 88, 30, 6); c.fill();
      c.fillStyle = '#ffffff'; c.font = '900 30px "Avenir Next Condensed", Futura, sans-serif'; c.textAlign = 'center';
      c.fillText('N₂O', W / 2, 108);
      c.fillStyle = '#ffe14d';
      c.beginPath(); c.moveTo(70, 118); c.lineTo(50, 158); c.lineTo(66, 158); c.lineTo(58, 188); c.lineTo(84, 142); c.lineTo(68, 142); c.lineTo(78, 118); c.closePath(); c.fill();
    });
    return { img, w: 460, ax: 0.5 };
  }

  /* ---- Registro ---- */
  function genSprite(name, I) {
    const m = name.match(/^([a-zA-Z]+?)(\d+)?$/);
    const base = m ? m[1] : name, idx = m && m[2] ? +m[2] : 0;
    switch (base) {
      case 'palm': return palm(I);
      case 'pine': return pine(I, false);
      case 'pineSnow': return pine(I, true);
      case 'tree': return roundTree(I, I.flora.leaf);
      case 'sakura': return roundTree(I, ['#f29ab8', '#ffc8da', '#d0789a'], { trunk: '#4a3030', petals: '#ffe0ea' });
      case 'jacaranda': return roundTree(I, ['#8a5ac8', '#b08ae8', '#6a3fa8'], { trunk: '#4a3a34', petals: '#d8c0f8' });
      case 'cypress': return cypress(I);
      case 'stonepine': return stonepine(I);
      case 'jungle': return jungle(I);
      case 'bush': return bush(I, null);
      case 'heather': return bush(I, ['#a85aa8', '#c878c8', '#8a4a9a']);
      case 'cactus': return cactus(I);
      case 'rock': return rock(I, false);
      case 'megalith': return rock(I, true);
      case 'llama': case 'sheep': case 'reindeer': case 'snowman': return animal(I, base);
      case 'bld': return building(I, idx, false);
      case 'tower': return building(I, idx + 10, true);
      case 'house': return house(I, idx);
      case 'hut': return hut(I);
      case 'kiosk': return kiosk(I);
      case 'lampL': return lamp(I, 'L');
      case 'lampR': return lamp(I, 'R');
      case 'board': return board(I, idx);
      case 'neon': return neon(I, idx);
      case 'chevL': return chevron(I, -1);
      case 'chevR': return chevron(I, 1);
      case 'gantry': return gantry(I);
      case 'torii': return torii(I);
      case 'stand': return grandstand(I);
      case 'crowd': return crowd(I, idx);
      case 'tires': return tires(I);
      case 'fence': return fence(I);
      case 'flag': return flag(I);
      case 'pagoda': return pagoda(I);
      case 'lantern': return stoneLantern(I);
      case 'column': return column(I);
      case 'phonebox': return phonebox(I);
      case 'pole': return mooringPole(I);
      case 'lighthouse': return lighthouse(I);
      case 'wall': return stoneWall(I);
      case 'coin': return coin(I.q);
      case 'fuel': return fuel(I.q);
      case 'nitro': return nitro(I.q);
      default: return bush(I, null);
    }
  }

  function silhouette(img, color) {
    const s = U.canvas(Math.ceil(img.width / 2), Math.ceil(img.height / 2));
    const c = s.getContext('2d');
    c.drawImage(img, 0, 0, s.width, s.height);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = color;
    c.fillRect(0, 0, s.width, s.height);
    return s;
  }

  Art.spriteNames = function (theme) {
    const names = new Set(['chevL', 'chevR', 'gantry', 'coin', 'fuel', 'nitro', 'crowd0', 'crowd1']);
    theme.scenery.forEach((r) => r.s.forEach((n) => {
      if (r.lr) { names.add(n + 'L'); names.add(n + 'R'); } else names.add(n);
    }));
    if (theme.id === 'kyoto' || theme.id === 'fuji') names.add('torii');
    return names;
  };

  Art.themeSprites = function (theme, q) {
    const key = theme.id + '@' + q;
    if (cache.themes[key]) return cache.themes[key];
    // limitar memoria: conservar solo los 2 últimos temas
    const keys = Object.keys(cache.themes);
    if (keys.length >= 2) delete cache.themes[keys[0]];
    const I = info(theme, q);
    const S = {};
    Art.spriteNames(theme).forEach((n) => {
      const sp = genSprite(n, I);
      sp.name = n;
      sp.aspect = sp.img.height / sp.img.width;
      if (!/^(coin|fuel|nitro)$/.test(n)) sp.sil = silhouette(sp.img, theme.fog);
      S[n] = sp;
    });
    cache.themes[key] = S;
    return S;
  };

  /* ================= FONDOS (parallax) ================= */
  const FILL = 0.62;

  function hazeOverlay(c, W, H, haze, top) {
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = U.lin(c, 0, top, 0, H, [0, U.rgba(haze, 0), 1, U.rgba(haze, 0.85)]);
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }

  function ridgeFill(c, W, H, fn, color, haze) {
    c.beginPath();
    c.moveTo(0, H);
    let minY = H;
    for (let x = 0; x <= W; x += 3) {
      const y = fn(x / W);
      if (y < minY) minY = y;
      c.lineTo(x, y);
    }
    c.lineTo(W, H);
    c.closePath();
    c.fillStyle = U.lin(c, 0, minY, 0, H, [0, color, 1, U.mix(color, haze, 0.7)]);
    c.fill();
    return minY;
  }

  const LM = {};
  LM.vegastower = (c, x, base, H, col, I) => {
    c.fillStyle = col;
    c.fillRect(x - 5, base - H * 0.86, 10, H * 0.86);
    U.ellipse(c, x, base - H * 0.78, 30, 14); c.fill();
    c.fillRect(x - 2, base - H * 0.98, 4, H * 0.14);
    if (I.dark) { c.fillStyle = '#ff3cac'; c.shadowColor = '#ff3cac'; c.shadowBlur = 12; c.fillRect(x - 28, base - H * 0.785, 56, 3); c.shadowBlur = 0; }
  };
  LM.empire = (c, x, base, H, col) => {
    c.fillStyle = col;
    c.fillRect(x - 34, base - H * 0.42, 68, H * 0.42);
    c.fillRect(x - 24, base - H * 0.66, 48, H * 0.25);
    c.fillRect(x - 15, base - H * 0.8, 30, H * 0.15);
    c.fillRect(x - 8, base - H * 0.88, 16, H * 0.09);
    c.fillRect(x - 2, base - H, 4, H * 0.13);
  };
  LM.goldengate = (c, x, base, H, col, I) => {
    const red = U.mix(I.t('#c0402c'), col, 0.35);
    c.strokeStyle = red; c.fillStyle = red; c.lineWidth = 3;
    const t1 = x, t2 = x + 420;
    [t1, t2].forEach((tx) => { c.fillRect(tx - 9, base - H * 0.62, 6, H * 0.62); c.fillRect(tx + 3, base - H * 0.62, 6, H * 0.62); for (let k = 1; k < 4; k++) c.fillRect(tx - 9, base - H * 0.62 * (k / 4), 18, 4); });
    c.beginPath(); c.moveTo(t1 - 240, base - H * 0.2); c.quadraticCurveTo(t1 - 120, base - H * 0.3, t1, base - H * 0.6);
    c.quadraticCurveTo((t1 + t2) / 2, base - H * 0.12, t2, base - H * 0.6); c.quadraticCurveTo(t2 + 120, base - H * 0.3, t2 + 240, base - H * 0.2); c.stroke();
    c.fillRect(t1 - 260, base - H * 0.2, 780, 6);
  };
  LM.obelisk = (c, x, base, H, col, I) => {
    c.fillStyle = I.dark ? U.mix(col, '#f4e8d0', 0.5) : U.mix(col, '#f4f0e8', 0.35);
    c.beginPath(); c.moveTo(x - 14, base); c.lineTo(x - 9, base - H * 0.78); c.lineTo(x, base - H * 0.86); c.lineTo(x + 9, base - H * 0.78); c.lineTo(x + 14, base); c.closePath(); c.fill();
  };
  LM.tokyotower = (c, x, base, H, col, I) => {
    const t = I.dark ? '#ff7a2a' : U.mix('#d8402a', col, 0.3);
    c.strokeStyle = t; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 60, base); c.quadraticCurveTo(x - 14, base - H * 0.4, x - 3, base - H * 0.95); c.moveTo(x + 60, base); c.quadraticCurveTo(x + 14, base - H * 0.4, x + 3, base - H * 0.95); c.stroke();
    for (let k = 1; k < 8; k++) { const y = base - H * 0.95 * (k / 8); const w = 60 * Math.pow(1 - k / 8, 1.6) + 3; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
    c.fillStyle = t; c.fillRect(x - 26, base - H * 0.42, 52, 12); c.fillRect(x - 14, base - H * 0.7, 28, 9);
    c.fillRect(x - 1.5, base - H, 3, H * 0.1);
    if (I.dark) { c.shadowColor = t; c.shadowBlur = 16; c.fillRect(x - 26, base - H * 0.42, 52, 4); c.shadowBlur = 0; }
  };
  LM.wheel = (c, x, base, H, col, I) => {
    const R = H * 0.34, cy = base - R - H * 0.06;
    c.strokeStyle = col; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - R * 0.5, base); c.lineTo(x, cy); c.lineTo(x + R * 0.5, base); c.stroke();
    c.beginPath(); c.arc(x, cy, R, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; c.beginPath(); c.moveTo(x, cy); c.lineTo(x + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
    if (I.dark) {
      for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; c.fillStyle = ['#38e1ff', '#ff3cac', '#ffe14d'][i % 3]; c.beginPath(); c.arc(x + Math.cos(a) * R, cy + Math.sin(a) * R, 3, 0, Math.PI * 2); c.fill(); }
    }
  };
  LM.tvtower = (c, x, base, H, col, I) => {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(x - 12, base); c.lineTo(x - 5, base - H * 0.66); c.lineTo(x + 5, base - H * 0.66); c.lineTo(x + 12, base); c.closePath(); c.fill();
    c.beginPath(); c.arc(x, base - H * 0.7, 22, 0, Math.PI * 2); c.fill();
    c.fillRect(x - 4, base - H * 0.94, 8, H * 0.24);
    c.fillStyle = U.mix('#c8303a', col, 0.4); c.fillRect(x - 2, base - H, 4, H * 0.08);
    if (I.dark) { c.fillStyle = '#ffd27a'; for (let i = 0; i < 6; i++) c.fillRect(x - 18 + i * 7, base - H * 0.7, 3, 3); }
  };
  LM.eiffel = (c, x, base, H, col, I) => {
    const lit = I.dark;
    const t = lit ? '#e8b04a' : col;
    c.fillStyle = t;
    c.beginPath();
    c.moveTo(x - 90, base); c.quadraticCurveTo(x - 40, base - H * 0.3, x - 14, base - H * 0.6); c.lineTo(x - 5, base - H * 0.9);
    c.lineTo(x + 5, base - H * 0.9); c.lineTo(x + 14, base - H * 0.6); c.quadraticCurveTo(x + 40, base - H * 0.3, x + 90, base);
    c.lineTo(x + 60, base); c.quadraticCurveTo(x, base - H * 0.24, x - 60, base); c.closePath(); c.fill();
    c.fillRect(x - 58, base - H * 0.25, 116, 7); c.fillRect(x - 30, base - H * 0.52, 60, 6);
    c.fillRect(x - 2, base - H, 4, H * 0.12);
    if (lit) {
      c.shadowColor = '#ffd27a'; c.shadowBlur = 20; c.fillRect(x - 4, base - H * 0.9, 8, 6); c.shadowBlur = 0;
      c.fillStyle = '#fff6d0';
      for (let i = 0; i < 40; i++) { const yy = base - Math.random() * H * 0.9; const hw = 70 * Math.pow(1 - (base - yy) / (H * 0.9), 1.8); c.fillRect(x + (Math.random() - 0.5) * hw * 2, yy, 2, 2); }
    }
  };
  LM.colosseum = (c, x, base, H, col, I) => {
    c.fillStyle = U.mix(I.t('#c89a70'), col, 0.45);
    c.beginPath(); c.moveTo(x - 170, base); c.lineTo(x - 170, base - H * 0.34); c.quadraticCurveTo(x, base - H * 0.42, x + 170, base - H * 0.24); c.lineTo(x + 170, base); c.closePath(); c.fill();
    c.fillStyle = U.shade(col, -0.35);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) {
      const ax = x - 160 + i * 21, top = base - H * (0.3 - row * 0.09) + (i / 16) * H * 0.05 * (row === 0 ? 1.6 : 1);
      if (row === 0 && i > 11) continue;
      c.beginPath(); c.moveTo(ax, top + H * 0.07); c.lineTo(ax, top + 8); c.arc(ax + 6, top + 8, 6, Math.PI, 0); c.lineTo(ax + 12, top + H * 0.07); c.closePath(); c.fill();
    }
  };
  LM.pisa = (c, x, base, H, col, I) => {
    c.save(); c.translate(x, base); c.rotate(0.09);
    c.fillStyle = U.mix(I.t('#f0e8d8'), col, 0.3);
    U.rr(c, -22, -H * 0.62, 44, H * 0.62, 6); c.fill();
    c.fillStyle = U.shade(col, -0.2);
    for (let k = 1; k < 8; k++) c.fillRect(-22, -H * 0.62 * (k / 8), 44, 2);
    c.fillStyle = U.mix(I.t('#f0e8d8'), col, 0.3); U.rr(c, -15, -H * 0.72, 30, H * 0.12, 5); c.fill();
    c.restore();
  };
  LM.campanile = (c, x, base, H, col, I) => {
    c.fillStyle = U.mix(I.t('#b8583a'), col, 0.4);
    c.fillRect(x - 20, base - H * 0.62, 40, H * 0.62);
    c.fillStyle = U.mix(I.t('#f0e8d8'), col, 0.3); c.fillRect(x - 22, base - H * 0.72, 44, H * 0.1);
    c.fillStyle = U.mix(I.t('#4a8a6a'), col, 0.4);
    c.beginPath(); c.moveTo(x - 22, base - H * 0.72); c.lineTo(x, base - H * 0.95); c.lineTo(x + 22, base - H * 0.72); c.closePath(); c.fill();
  };
  LM.bigben = (c, x, base, H, col, I) => {
    c.fillStyle = col;
    c.fillRect(x - 170, base - H * 0.25, 150, H * 0.25);
    for (let i = 0; i < 8; i++) c.fillRect(x - 168 + i * 19, base - H * 0.3, 6, H * 0.06);
    c.fillRect(x - 20, base - H * 0.68, 40, H * 0.68);
    c.beginPath(); c.moveTo(x - 24, base - H * 0.68); c.lineTo(x, base - H * 0.97); c.lineTo(x + 24, base - H * 0.68); c.closePath(); c.fill();
    c.fillStyle = I.dark ? '#fff0c0' : U.mix(col, '#f4f0e0', 0.5);
    if (I.dark) { c.shadowColor = '#ffe6a0'; c.shadowBlur = 18; }
    c.beginPath(); c.arc(x, base - H * 0.6, 13, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    LM.wheel(c, x + 260, base, H * 0.7, col, I);
  };
  LM.nessie = (c, x, base, H, col) => {
    c.fillStyle = U.shade(col, -0.35);
    [[-60, 16], [0, 22], [55, 14]].forEach((d) => { c.beginPath(); c.arc(x + d[0], base, d[1], Math.PI, 0); c.fill(); });
    c.beginPath(); c.moveTo(x + 70, base); c.quadraticCurveTo(x + 95, base - 30, x + 110, base - 60); c.lineTo(x + 124, base - 58); c.quadraticCurveTo(x + 110, base - 26, x + 84, base); c.closePath(); c.fill();
    U.ellipse(c, x + 124, base - 60, 14, 7); c.fill();
  };
  LM.stonehenge = (c, x, base, H, col) => {
    c.fillStyle = U.shade(col, -0.25);
    const hs = H * 0.16;
    for (let i = 0; i < 9; i++) {
      const sx = x - 120 + i * 30;
      c.fillRect(sx, base - hs, 16, hs);
      if (i % 2 === 0 && i < 8) c.fillRect(sx - 2, base - hs - 7, 50, 8);
    }
  };

  const LAYER = {};
  LAYER.mountains = (c, W, H, sp, I) => {
    const r = U.rng(sp.seed);
    const n = U.periodicNoise(r, [[1, 0.34], [2, 0.24], [3, 0.16], [5, 0.1], [9, 0.07], [17, 0.04], [31, 0.02]]);
    const top = H * (1 - FILL);
    const fn = (t) => { const v = U.clamp((n(t) / 0.97 + 1) / 2, 0, 1); return H - (H * FILL) * (0.3 + 0.7 * Math.pow(v, 1.25 + (sp.rough || 0.5))); };
    ridgeFill(c, W, H, fn, I.t(sp.c), sp.haze);
    c.strokeStyle = U.rgba(U.shade(sp.c, 0.35), 0.35); c.lineWidth = 2;
    c.beginPath(); for (let x = 0; x <= W; x += 3) { const y = fn(x / W); if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    return top;
  };
  LAYER.hills = (c, W, H, sp, I) => {
    const r = U.rng(sp.seed);
    const n = U.periodicNoise(r, [[1, 0.4], [2, 0.3], [3, 0.16], [5, 0.08], [8, 0.04]]);
    const fn = (t) => { const v = U.clamp((n(t) / 0.98 + 1) / 2, 0, 1); return H - H * FILL * (0.25 + 0.55 * v); };
    const col = sp.snow ? I.t('#eef2f8') : I.t(sp.c);
    ridgeFill(c, W, H, fn, sp.snow ? U.mix(col, sp.c, 0.25) : col, sp.haze);
    if (sp.trees) {
      const tc = U.shade(I.t(sp.c), -0.18);
      c.fillStyle = tc;
      for (let x = 6; x < W - 6; x += r.int(8, 22)) {
        if (sp.landmark && Math.abs(x - W * 0.33) < 200) continue;
        const y = fn(x / W) + 2;
        const h = r.range(12, 30);
        if (sp.trees === 'palm') {
          c.fillRect(x - 1, y - h, 2, h);
          for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.6; c.beginPath(); c.ellipse(x + Math.cos(a) * 7, y - h + Math.sin(a) * 4 + 2, 8, 2, a, 0, Math.PI * 2); c.fill(); }
        } else if (sp.trees === 'cypress') {
          U.ellipse(c, x, y - h * 0.6, 3.5, h * 0.62); c.fill();
        } else if (sp.trees === 'pagoda') {
          if (r.chance(0.08)) { for (let k = 0; k < 4; k++) c.fillRect(x - 10 + k * 2, y - 12 - k * 10, 20 - k * 4, 4); c.fillRect(x - 1, y - 56, 2, 56); }
          else { c.beginPath(); c.arc(x, y - 6, r.range(5, 10), 0, Math.PI * 2); c.fill(); }
        } else {
          c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x, y - h); c.lineTo(x + 6, y); c.closePath(); c.fill();
        }
      }
    }
    if (sp.landmark && LM[sp.landmark]) LM[sp.landmark](c, W * 0.33, fn(0.33) + 4, H * 0.9, U.shade(I.t(sp.c), -0.12), I);
    return 0;
  };
  LAYER.lowpoly = (c, W, H, sp, I) => {
    const r = U.rng(sp.seed);
    const peaks = sp.peaks || 9;
    const N = peaks * 2;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W + (i % N === 0 ? 0 : r.range(-0.28, 0.28) * (W / N));
      const peak = i % 2 === 1;
      const h = peak ? r.range(0.62, 1) : r.range(0.2, 0.46);
      pts.push([x, H - h * H * FILL]);
    }
    pts[N][1] = pts[0][1];
    const c1 = I.t(sp.c), c2 = I.t(sp.c2 || U.shade(sp.c, 0.2));
    c.fillStyle = U.mix(c1, sp.haze, 0.35);
    c.beginPath(); c.moveTo(0, H); pts.forEach((p) => c.lineTo(p[0], p[1])); c.lineTo(W, H); c.closePath(); c.fill();
    for (let i = 1; i < N; i += 2) {
      const a = pts[i - 1], p = pts[i], b = pts[i + 1];
      const m = [p[0] + r.range(-20, 20), H - (H - p[1]) * r.range(0.15, 0.35)];
      c.fillStyle = c2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(p[0], p[1]); c.lineTo(m[0], m[1]); c.closePath(); c.fill();
      c.fillStyle = c1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(b[0], b[1]); c.lineTo(m[0], m[1]); c.closePath(); c.fill();
      c.fillStyle = U.mix(c1, c2, 0.5); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(m[0], m[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0], H); c.lineTo(a[0], H); c.closePath(); c.fill();
      if (sp.snow && (H - p[1]) / (H * FILL) > sp.snow) {
        const sh = (p[1] - H) * -0.28;
        c.fillStyle = I.t('#f6f9fc');
        c.beginPath(); c.moveTo(p[0], p[1]);
        c.lineTo(U.lerp(p[0], a[0], 0.3), p[1] + sh); c.lineTo(U.lerp(p[0], a[0], 0.18), p[1] + sh * 0.7);
        c.lineTo(U.lerp(p[0], m[0], 0.3), p[1] + sh * 0.95); c.lineTo(U.lerp(p[0], b[0], 0.2), p[1] + sh * 0.75); c.lineTo(U.lerp(p[0], b[0], 0.3), p[1] + sh);
        c.closePath(); c.fill();
        c.fillStyle = I.t('#c8d6e8');
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(U.lerp(p[0], m[0], 0.3), p[1] + sh * 0.95); c.lineTo(U.lerp(p[0], b[0], 0.2), p[1] + sh * 0.75); c.lineTo(U.lerp(p[0], b[0], 0.3), p[1] + sh); c.closePath(); c.fill();
      }
    }
    hazeOverlay(c, W, H, sp.haze, H * (1 - FILL));
    return 0;
  };
  LAYER.city = (c, W, H, sp, I) => {
    const r = U.rng(sp.seed);
    const col = I.t(sp.c);
    const dense = sp.dense || 0.8;
    const bl = [];
    let x = 0;
    while (x < W) {
      const w = r.range(16, 58);
      const h = H * FILL * r.range(0.2, 0.95) * (sp.far ? 1.08 : 0.9) * (0.7 + dense * 0.3);
      bl.push({ x, w, h });
      x += w + r.range(0, 5 * (1.2 - dense));
    }
    if (sp.landmark && LM[sp.landmark]) LM[sp.landmark](c, W * 0.34, H, H * 0.92, U.shade(col, -0.06), I);
    const drawB = (b, off) => {
      const bx = b.x + off, by = H - b.h;
      c.fillStyle = U.shade(col, r.range(-0.08, 0.08));
      if (sp.classic && r.chance(0.4)) { c.beginPath(); c.moveTo(bx, by + 6); c.lineTo(bx + 4, by); c.lineTo(bx + b.w - 4, by); c.lineTo(bx + b.w, by + 6); c.lineTo(bx + b.w, H); c.lineTo(bx, H); c.closePath(); c.fill(); }
      else c.fillRect(bx, by, b.w, b.h);
      if (sp.domes && r.chance(0.18)) { c.beginPath(); c.arc(bx + b.w / 2, by, b.w * 0.36, Math.PI, 0); c.fill(); }
      if (!sp.classic && r.chance(0.25)) c.fillRect(bx + b.w * 0.45, by - 14, 2, 14);
      const litP = I.dark ? 0.32 : 0.1;
      for (let wy = by + 5; wy < H - 4; wy += 7) for (let wx = bx + 3; wx < bx + b.w - 4; wx += 6) {
        if (r() < litP) { c.fillStyle = I.dark ? U.rgba(sp.lit, r.range(0.5, 1)) : U.rgba('#ffffff', 0.12); c.fillRect(wx, wy, 3, 3); }
      }
      if (sp.neon && I.dark && r.chance(0.2)) {
        const nc = r.pick(sp.neon);
        c.fillStyle = nc; c.shadowColor = nc; c.shadowBlur = 10;
        c.fillRect(bx + (r.chance(0.5) ? 2 : b.w - 5), by + 10, 3, Math.min(b.h - 14, 60));
        c.shadowBlur = 0;
      }
    };
    bl.forEach((b) => { drawB(b, 0); if (b.x + b.w > W) drawB(b, -W); });
    hazeOverlay(c, W, H, U.mix(sp.c, I.theme.fog, 0.6), H * (1 - FILL * 0.9));
    return 0;
  };
  LAYER.forest = (c, W, H, sp, I) => {
    const r = U.rng(sp.seed);
    const n = U.periodicNoise(r, [[1, 0.5], [3, 0.3], [7, 0.2]]);
    const col = I.t(sp.c);
    c.fillStyle = col;
    c.fillRect(0, H - H * FILL * 0.28, W, H * FILL * 0.28);
    const drawT = (x, h) => {
      const y = H - H * FILL * 0.22;
      c.fillStyle = U.shade(col, r.range(-0.06, 0.06));
      if (sp.kind === 'pine') { c.beginPath(); c.moveTo(x - h * 0.22, y); c.lineTo(x, y - h); c.lineTo(x + h * 0.22, y); c.closePath(); c.fill(); }
      else if (sp.kind === 'jungle') { for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + r.range(-8, 8), y - h * r.range(0.5, 0.9), h * 0.28, 0, Math.PI * 2); c.fill(); } }
      else { c.beginPath(); c.arc(x, y - h * 0.55, h * 0.36, 0, Math.PI * 2); c.fill(); c.fillRect(x - 2, y - h * 0.3, 4, h * 0.3); }
    };
    for (let x = -10; x < W + 10; x += r.range(5, 12)) {
      const v = U.clamp((n(((x % W) + W) % W / W) + 1) / 2, 0, 1);
      drawT(x, H * FILL * (0.28 + 0.5 * v) * r.range(0.75, 1.05));
    }
    hazeOverlay(c, W, H, sp.haze, H * (1 - FILL));
    return 0;
  };
  LAYER.sea = (c, W, H, sp, I) => {
    const c1 = I.t(sp.c), c2 = I.t(sp.c2 || U.shade(sp.c, 0.3));
    c.fillStyle = U.lin(c, 0, 0, 0, H, [0, c2, 1, c1]);
    c.fillRect(0, 0, W, H);
    const r = U.rng(99);
    if (sp.glitter || !I.dark) {
      for (let i = 0; i < 260; i++) { c.fillStyle = 'rgba(255,255,255,' + r.range(0.1, 0.5).toFixed(2) + ')'; c.fillRect(r.range(0, W), r.range(0, H), r.range(4, 22), 1.5); }
    }
    if (sp.lights) {
      for (let i = 0; i < 90; i++) {
        const lx = r.range(0, W), col = r.pick(['#ffd27a', '#ffffff', '#38e1ff', '#ff5a6a']);
        c.fillStyle = col; c.fillRect(lx, 1, 2, 2);
        c.fillStyle = U.rgba(col, 0.35); c.fillRect(lx, 3, 1.5, H * r.range(0.3, 0.9));
      }
    }
    if (sp.landmark && LM[sp.landmark]) LM[sp.landmark](c, W * 0.6, H * 0.6, H * 3, c1, I);
    return 0;
  };
  LAYER.lake = LAYER.sea;
  LAYER.sugarloaf = (c, W, H, sp, I) => {
    const col = I.t(sp.c);
    LAYER.lowpoly(c, W, H, { seed: sp.seed, c: U.shade(sp.c, 0.1), c2: U.shade(sp.c, 0.25), haze: sp.haze, peaks: 6 }, I);
    const dome = (x, w, h) => {
      c.fillStyle = U.lin(c, x - w, 0, x + w, 0, [0, U.shade(col, 0.2), 1, U.shade(col, -0.25)]);
      c.beginPath(); c.moveTo(x - w, H); c.bezierCurveTo(x - w, H - h * 1.2, x + w * 0.4, H - h * 1.3, x + w, H); c.closePath(); c.fill();
    };
    dome(W * 0.22, 120, H * 0.78);
    dome(W * 0.3, 70, H * 0.42);
    const px = W * 0.62;
    c.fillStyle = U.shade(col, -0.05);
    c.beginPath(); c.moveTo(px - 180, H); c.lineTo(px - 20, H - H * 0.8); c.quadraticCurveTo(px, H - H * 0.86, px + 20, H - H * 0.8); c.lineTo(px + 200, H); c.closePath(); c.fill();
    c.fillStyle = I.t('#f0f0ea');
    c.fillRect(px - 2, H - H * 0.93, 4, H * 0.08); c.fillRect(px - 12, H - H * 0.9, 24, 3);
    hazeOverlay(c, W, H, sp.haze, H * 0.2);
    return 0;
  };
  LAYER.fuji = (c, W, H, sp, I) => {
    LAYER.hills(c, W, H, { seed: sp.seed, c: U.shade(sp.c, -0.05), haze: sp.haze }, I);
    const x = W * 0.36, col = I.t(sp.c);
    const top = H * 0.06, bw = W * 0.26;
    c.fillStyle = U.lin(c, x - bw, 0, x + bw, 0, [0, U.shade(col, 0.15), 1, U.shade(col, -0.2)]);
    c.beginPath(); c.moveTo(x - bw, H); c.quadraticCurveTo(x - bw * 0.35, H * 0.55, x - 40, top); c.lineTo(x + 40, top); c.quadraticCurveTo(x + bw * 0.35, H * 0.55, x + bw, H); c.closePath(); c.fill();
    c.fillStyle = I.t('#f6f8fc');
    c.beginPath(); c.moveTo(x - 40, top); c.lineTo(x + 40, top); c.quadraticCurveTo(x + 90, H * 0.26, x + 120, H * 0.34);
    for (let k = 0; k < 9; k++) { const t = k / 8; c.lineTo(x + 120 - t * 240, H * 0.34 + (k % 2 ? 26 : -4) + Math.sin(k) * 6); }
    c.quadraticCurveTo(x - 90, H * 0.26, x - 40, top); c.closePath(); c.fill();
    c.fillStyle = I.t('#c8d6ea');
    c.beginPath(); c.moveTo(x + 10, top); c.lineTo(x + 40, top); c.quadraticCurveTo(x + 90, H * 0.26, x + 120, H * 0.34); c.lineTo(x + 40, H * 0.36); c.closePath(); c.fill();
    hazeOverlay(c, W, H, sp.haze, H * 0.3);
    return 0;
  };

  Art.layers = function (theme, q) {
    const key = theme.id + '@' + q;
    if (cache.layers[key]) return cache.layers[key];
    const ks = Object.keys(cache.layers);
    if (ks.length >= 3) delete cache.layers[ks[0]];
    const I = info(theme, 1);
    const out = [];
    theme.layers.forEach((sp) => {
      const band = sp.type === 'sea' || sp.type === 'lake';
      const LW = Math.round(2048 * q), LH = Math.round((band ? 96 : 512) * q);
      const cv = U.canvas(LW, LH);
      const c = cv.getContext('2d');
      c.scale(q, q);
      const fn = LAYER[sp.type] || LAYER.mountains;
      fn(c, 2048, band ? 96 : 512, sp, I);
      out.push({ img: cv, par: sp.par || 1, h: band ? sp.h : sp.h / FILL, band });
    });
    // nubes
    if (theme.clouds) {
      const cl = theme.clouds;
      const cw = Math.round(2048 * q), ch = Math.round(300 * q);
      const cv = U.canvas(cw, ch);
      const c = cv.getContext('2d');
      c.scale(q, q);
      const r = U.rng(U.hash(theme.id + 'clouds'));
      for (let i = 0; i < cl.n; i++) {
        const x = r.range(0, 2048), y = r.range(60, 240), s = r.range(0.6, 1.4);
        const puffs = r.int(5, 9);
        for (const off of [0, -2048, 2048]) {
          for (let k = 0; k < puffs; k++) {
            const px = x + off + (k - puffs / 2) * 34 * s, py = y + Math.sin(k * 1.7) * 10 * s - (k > 1 && k < puffs - 2 ? 16 * s : 0);
            const rr = r.range(30, 52) * s;
            c.fillStyle = U.rad(c, px, py - rr * 0.2, 0, rr, [0, U.rgba(cl.c, cl.a), 0.7, U.rgba(U.mix(cl.c, cl.shade, 0.5), cl.a * 0.7), 1, U.rgba(cl.shade, 0)]);
            c.beginPath(); c.arc(px, py, rr, 0, Math.PI * 2); c.fill();
          }
        }
      }
      out.clouds = { img: cv, y: cl.y };
    }
    cache.layers[key] = out;
    return out;
  };

  /* ================= CIELO ================= */
  Art.sky = function (theme, w, h, horizon) {
    const key = theme.id + '|' + w + 'x' + h + '|' + Math.round(horizon);
    cache.sky = cache.sky || {};
    if (cache.sky[key]) return cache.sky[key];
    const sk = Object.keys(cache.sky);
    if (sk.length >= 4) delete cache.sky[sk[0]];
    const cv = U.canvas(w, h);
    const c = cv.getContext('2d');
    c.fillStyle = U.lin(c, 0, 0, 0, horizon, [0, theme.sky[0], 0.55, theme.sky[1], 1, theme.sky[2]]);
    c.fillRect(0, 0, w, horizon + 2);
    if (theme.stars) {
      const r = U.rng(77);
      const n = Math.round(260 * theme.stars * (w / 1400));
      for (let i = 0; i < n; i++) {
        const y = r.range(0, horizon * 0.85);
        c.fillStyle = 'rgba(255,255,255,' + (r.range(0.3, 1) * (1 - y / horizon)).toFixed(2) + ')';
        const s = r.range(0.6, 1.8) * (w / 1400);
        c.fillRect(r.range(0, w), y, s, s);
      }
    }
    c.fillStyle = theme.fog;
    c.fillRect(0, horizon, w, h - horizon);
    cache.sky[key] = cv;
    return cv;
  };

  /* ================= EFECTOS ================= */
  Art.glow = function (color) {
    if (cache.glow[color]) return cache.glow[color];
    const cv = U.canvas(128, 128);
    const c = cv.getContext('2d');
    c.fillStyle = U.rad(c, 64, 64, 0, 64, [0, U.rgba('#ffffff', 1), 0.12, U.rgba(color, 0.9), 0.4, U.rgba(color, 0.3), 1, U.rgba(color, 0)]);
    c.fillRect(0, 0, 128, 128);
    cache.glow[color] = cv;
    return cv;
  };
  Art.fx = function () {
    if (cache.fx) return cache.fx;
    const fx = {};
    fx.shadow = U.canvas(128, 40);
    let c = fx.shadow.getContext('2d');
    c.save(); c.translate(64, 20); c.scale(1, 0.3);
    c.fillStyle = U.rad(c, 0, 0, 0, 64, [0, 'rgba(0,0,0,0.7)', 0.6, 'rgba(0,0,0,0.4)', 1, 'rgba(0,0,0,0)']);
    c.beginPath(); c.arc(0, 0, 64, 0, Math.PI * 2); c.fill(); c.restore();
    fx.smoke = U.canvas(64, 64);
    c = fx.smoke.getContext('2d');
    c.fillStyle = U.rad(c, 32, 32, 0, 32, [0, 'rgba(255,255,255,0.8)', 0.5, 'rgba(255,255,255,0.35)', 1, 'rgba(255,255,255,0)']);
    c.fillRect(0, 0, 64, 64);
    fx.flame = U.canvas(64, 180);
    c = fx.flame.getContext('2d');
    c.fillStyle = U.lin(c, 0, 0, 0, 180, [0, 'rgba(255,255,255,1)', 0.15, 'rgba(120,200,255,1)', 0.45, 'rgba(60,110,255,0.85)', 0.7, 'rgba(255,120,40,0.55)', 1, 'rgba(255,60,20,0)']);
    c.beginPath(); c.moveTo(32, 0); c.bezierCurveTo(62, 40, 50, 120, 32, 180); c.bezierCurveTo(14, 120, 2, 40, 32, 0); c.fill();
    fx.cone = U.canvas(256, 256);
    c = fx.cone.getContext('2d');
    for (let i = 0; i < 14; i++) {
      const k = i / 13;
      c.fillStyle = U.rad(c, 128, 256, 0, 270, [0, 'rgba(255,246,215,0.1)', 0.5, 'rgba(255,246,215,0.04)', 1, 'rgba(255,246,215,0)']);
      c.beginPath(); c.moveTo(18 + k * 70, 256); c.lineTo(104 + k * 14, 8 + k * 20); c.lineTo(152 - k * 14, 8 + k * 20); c.lineTo(238 - k * 70, 256); c.closePath(); c.fill();
    }
    fx.streak = U.canvas(16, 128);
    c = fx.streak.getContext('2d');
    c.fillStyle = U.lin(c, 0, 0, 0, 128, [0, 'rgba(255,255,255,0.9)', 0.3, 'rgba(255,255,255,0.35)', 1, 'rgba(255,255,255,0)']);
    c.fillRect(0, 0, 16, 128);
    fx.aurora = U.canvas(4, 128);
    c = fx.aurora.getContext('2d');
    c.fillStyle = U.lin(c, 0, 0, 0, 128, [0, 'rgba(150,80,255,0)', 0.35, 'rgba(150,80,255,0.5)', 0.7, 'rgba(60,255,170,0.9)', 1, 'rgba(60,255,170,0)']);
    c.fillRect(0, 0, 4, 128);
    cache.fx = fx;
    return fx;
  };

  /* ================= BANDERAS ================= */
  Art.flag = function (ctx, id, x, y, w, h) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const band = (cols, vertical) => cols.forEach((col, i) => { ctx.fillStyle = col; if (vertical) ctx.fillRect(x + (w * i) / cols.length, y, w / cols.length + 1, h); else ctx.fillRect(x, y + (h * i) / cols.length, w, h / cols.length + 1); });
    switch (id) {
      case 'us':
        for (let i = 0; i < 13; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#b22234'; ctx.fillRect(x, y + (h * i) / 13, w, h / 13 + 1); }
        ctx.fillStyle = '#3c3b6e'; ctx.fillRect(x, y, w * 0.42, h * 0.54);
        ctx.fillStyle = '#fff';
        for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) ctx.fillRect(x + w * 0.035 + k * w * 0.065, y + h * 0.06 + r * h * 0.1, Math.max(1, w * 0.02), Math.max(1, w * 0.02));
        break;
      case 'br':
        ctx.fillStyle = '#009c3b'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#ffdf00'; ctx.beginPath(); ctx.moveTo(x + w * 0.08, y + h / 2); ctx.lineTo(x + w / 2, y + h * 0.1); ctx.lineTo(x + w * 0.92, y + h / 2); ctx.lineTo(x + w / 2, y + h * 0.9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#002776'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.24, 0, Math.PI * 2); ctx.fill();
        break;
      case 'jp':
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#bc002d'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'de': band(['#000000', '#dd0000', '#ffce00']); break;
      case 'se':
        ctx.fillStyle = '#006aa7'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#fecc00'; ctx.fillRect(x + w * 0.3, y, w * 0.13, h); ctx.fillRect(x, y + h * 0.4, w, h * 0.2);
        break;
      case 'fr': band(['#0055a4', '#ffffff', '#ef4135'], true); break;
      case 'it': band(['#009246', '#ffffff', '#ce2b37'], true); break;
      case 'gb': {
        ctx.fillStyle = '#012169'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = h * 0.22;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
        ctx.strokeStyle = '#c8102e'; ctx.lineWidth = h * 0.08;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillRect(x + w * 0.42, y, w * 0.16, h); ctx.fillRect(x, y + h * 0.36, w, h * 0.28);
        ctx.fillStyle = '#c8102e'; ctx.fillRect(x + w * 0.45, y, w * 0.1, h); ctx.fillRect(x, y + h * 0.4, w, h * 0.2);
        break;
      }
      default: ctx.fillStyle = '#888'; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  };

  /* ================= MINIATURAS DE ESCENARIO ================= */
  Art.themePreview = function (theme, w, h) {
    const key = theme.id + '|' + w + 'x' + h;
    if (cache.previews[key]) return cache.previews[key];
    const cv = U.canvas(w, h);
    const c = cv.getContext('2d');
    const hz = h * 0.55;
    c.fillStyle = U.lin(c, 0, 0, 0, hz, [0, theme.sky[0], 0.55, theme.sky[1], 1, theme.sky[2]]);
    c.fillRect(0, 0, w, hz + 1);
    if (theme.stars) { const r = U.rng(5); for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,255,255,' + r.range(0.3, 0.9).toFixed(2) + ')'; c.fillRect(r.range(0, w), r.range(0, hz * 0.7), 1.2, 1.2); } }
    if (theme.aurora) { c.globalCompositeOperation = 'lighter'; c.fillStyle = U.lin(c, 0, 0, 0, hz, [0, 'rgba(60,255,170,0)', 0.4, 'rgba(60,255,170,0.35)', 0.7, 'rgba(120,80,255,0.15)', 1, 'rgba(60,255,170,0)']); c.fillRect(0, 0, w, hz); c.globalCompositeOperation = 'source-over'; }
    const sun = theme.sun || theme.moon;
    if (sun) {
      const sx = w * sun.x, sy = hz * sun.y, sr = h * (sun.r || 0.03) * 2.2;
      c.fillStyle = U.rad(c, sx, sy, 0, sr * 5, [0, U.rgba(sun.glow || sun.c, 0.6), 1, U.rgba(sun.glow || sun.c, 0)]);
      c.fillRect(0, 0, w, hz);
      c.fillStyle = sun.c; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    }
    const layers = Art.layers(theme, 0.25);
    layers.forEach((L) => {
      const dh = h * L.h * 0.95, dw = L.img.width * (dh / L.img.height);
      for (let x = -dw * 0.2; x < w; x += dw) c.drawImage(L.img, x, hz - dh + 1, dw, dh);
    });
    delete cache.layers[theme.id + '@0.25'];
    c.fillStyle = theme.grass[0]; c.fillRect(0, hz, w, h - hz);
    if (theme.shoulder) { c.fillStyle = theme.shoulder.c[0]; c.beginPath(); c.moveTo(w / 2 - 4, hz); c.lineTo(w / 2 + 4, hz); c.lineTo(w * 1.1, h); c.lineTo(-w * 0.1, h); c.closePath(); c.fill(); }
    c.fillStyle = theme.rumble[1]; c.beginPath(); c.moveTo(w / 2 - 3, hz); c.lineTo(w / 2 + 3, hz); c.lineTo(w * 0.98, h); c.lineTo(w * 0.02, h); c.closePath(); c.fill();
    c.fillStyle = theme.road[0]; c.beginPath(); c.moveTo(w / 2 - 2.5, hz); c.lineTo(w / 2 + 2.5, hz); c.lineTo(w * 0.93, h); c.lineTo(w * 0.07, h); c.closePath(); c.fill();
    c.strokeStyle = theme.lane; c.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const t0 = Math.pow(i / 6, 2), t1 = Math.pow((i + 0.5) / 6, 2); c.beginPath(); c.moveTo(w / 2, hz + (h - hz) * t0); c.lineTo(w / 2, hz + (h - hz) * t1); c.stroke(); }
    c.fillStyle = U.lin(c, 0, hz - 4, 0, hz + 18, [0, U.rgba(theme.fog, 0), 0.4, U.rgba(theme.fog, 0.7), 1, U.rgba(theme.fog, 0)]);
    c.fillRect(0, hz - 4, w, 22);
    if (theme.weather === 'rain') { c.strokeStyle = 'rgba(200,210,230,0.35)'; c.lineWidth = 1; const r = U.rng(3); for (let i = 0; i < 60; i++) { const x = r.range(0, w), y = r.range(0, h); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 9); c.stroke(); } }
    if (theme.weather === 'snow') { c.fillStyle = 'rgba(255,255,255,0.8)'; const r = U.rng(4); for (let i = 0; i < 60; i++) { c.beginPath(); c.arc(r.range(0, w), r.range(0, h), r.range(0.8, 2), 0, Math.PI * 2); c.fill(); } }
    if (theme.weather === 'fog') { c.fillStyle = U.rgba(theme.fog, 0.35); c.fillRect(0, 0, w, h); }
    if (theme.grade) { c.globalAlpha = theme.grade.a * 1.5; c.globalCompositeOperation = theme.grade.op; c.fillStyle = theme.grade.c; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    cache.previews[key] = cv;
    return cv;
  };
})(window.TG);
