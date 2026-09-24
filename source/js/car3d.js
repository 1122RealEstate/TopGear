'use strict';
/* ============================================================
   Coches 3D sobre Canvas 2D
   ------------------------------------------------------------
   · Malla procedural: se rasteriza la silueta lateral (data.side) para
     sacar el techo, los pasos de rueda, las aletas, los cristales y las
     tomas de aire, y se extruye con las anchuras de la vista trasera
     (data.rear).
   · Sombreado por vértice: sol, cielo, luz de relleno y reflejos del
     entorno con Fresnel; degradado por cara para un acabado liso.
   · Ruedas 3D con dirección, llantas (textura del perfil) y pasos de
     rueda; balanceo, cabeceo y suspensión de la carrocería.
   · Los detalles traseros (Art.rearDecal) se proyectan como calcomanía.
   Unidades: 1 = largo del coche. x derecha, y arriba, z hacia delante
   (z = 0 en la cola).
   ============================================================ */
(function (TG) {
  const U = TG.U, Art = TG.Art;
  const C3 = (TG.Car3D = {});
  const GEO = new Map(), ENV = new Map();
  const PW = 500, PH = 190;       // rasterizado del perfil: 500 px por unidad de largo
  const CROWN = 0.008;            // bombeo del capó y de la tapa del maletero
  const WN = 14;                  // lados de cada rueda
  const sm = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rgb = (c) => { const r = U.hex2rgb(c); return [r[0] / 255, r[1] / 255, r[2] / 255]; };

  // Materiales: f0 = reflectancia frontal, refl = fuerza del reflejo del entorno
  const MAT = {
    paint: { f0: 0.05, refl: 0.95, spec: 1.15, shin: 70, diff: 1 },
    sec: { f0: 0.05, refl: 0.9, spec: 1, shin: 60, diff: 1 },
    stripe: { f0: 0.05, refl: 0.9, spec: 1.1, shin: 70, diff: 1 },
    glass: { base: [0.035, 0.05, 0.075], f0: 0.1, refl: 1.05, spec: 1.8, shin: 120, diff: 0.7 },
    black: { base: [0.05, 0.055, 0.065], f0: 0.04, refl: 0.35, spec: 0.35, shin: 25, diff: 1 },
    skirt: { base: [0.07, 0.075, 0.085], f0: 0.04, refl: 0.4, spec: 0.4, shin: 30, diff: 1 },
    carbon: { base: [0.085, 0.09, 0.105], f0: 0.05, refl: 0.6, spec: 0.8, shin: 50, diff: 1 },
    louver: { base: [0.06, 0.068, 0.085], f0: 0.06, refl: 0.6, spec: 0.8, shin: 60, diff: 1 },
    light: { base: [0.7, 0.03, 0.07], f0: 0.08, refl: 0.7, spec: 1.3, shin: 90, diff: 1, emit: 0.18 },
    tire: { base: [0.13, 0.133, 0.145], f0: 0.02, refl: 0.12, spec: 0.12, shin: 12, diff: 1 },
    well: { base: [0.018, 0.02, 0.024], f0: 0, refl: 0, spec: 0, shin: 1, diff: 0.4 },
  };

  /* ---------------- Silueta lateral rasterizada ---------------- */
  function raster(model) {
    const Sd = model.side;
    const S = PW;
    const X = (xs) => (1 - xs) * S;       // columna = z · PW
    const Y = (y) => PH - y * S;
    const P = (arr) => arr.map((p) => [X(p[0]), Y(p[1]), p[2]]);
    const wr = Sd.wheels[2], cl = Sd.cl, ar = wr * 1.13;
    const ctx2 = () => { const c = U.canvas(PW, PH).getContext('2d'); c.globalCompositeOperation = 'lighter'; return c; };
    const poly = (c, pts, col) => { if (!pts) return; c.fillStyle = col; c.beginPath(); U.smoothShape(c, P(pts)); c.fill(); };
    // 1) línea del techo: solo el contorno superior de la carrocería
    const t = ctx2();
    poly(t, Sd.body, '#ff0000');
    // 2) contorno inferior: carrocería + taloneras + aletas, sin los pasos de rueda
    const l = U.canvas(PW, PH).getContext('2d');
    l.fillStyle = '#ff0000';
    l.beginPath(); U.smoothShape(l, P(Sd.body)); l.fill();
    const xr = Math.min(Sd.wheels[1] + ar * 1.4, 0.985), xf = Math.max(Sd.wheels[0] - ar * 1.4, 0.015);
    l.fillRect(X(xr), Y(0.13), X(xf) - X(xr), Y(cl) - Y(0.13));
    l.save();
    l.beginPath(); l.rect(0, 0, PW, Y(cl + 0.01)); l.clip();
    [[Sd.wheels[0], 0.013], [Sd.wheels[1], 0.02]].forEach((w) => { U.ellipse(l, X(w[0]), Y(wr), ar * S * 1.36, (ar + w[1]) * S); l.fill(); });
    l.restore();
    l.globalCompositeOperation = 'destination-out';
    [Sd.wheels[0], Sd.wheels[1]].forEach((xw) => { l.beginPath(); l.arc(X(xw), Y(wr), ar * S * 0.99, 0, Math.PI * 2); l.fill(); });
    // 3) materiales
    const a = ctx2(), b = ctx2();
    poly(a, Sd.glass, '#00ff00');
    poly(a, Sd.intake, '#0000ff');
    poly(b, Sd.two, '#ff0000');
    poly(b, Sd.accent, '#ff0000');
    poly(b, Sd.scoop, '#ff0000');
    poly(b, Sd.tl, '#00ff00');
    poly(b, Sd.fin, '#0000ff');
    const dT = t.getImageData(0, 0, PW, PH).data, dL = l.getImageData(0, 0, PW, PH).data;
    const dA = a.getImageData(0, 0, PW, PH).data, dB = b.getImageData(0, 0, PW, PH).data;
    const top = new Float32Array(PW).fill(-1), bot = new Float32Array(PW).fill(-1);
    const gT = new Float32Array(PW).fill(-1), gB = new Float32Array(PW).fill(-1);
    for (let i = 0; i < PW; i++) {
      for (let j = 0; j < PH; j++) {
        const k = (j * PW + i) * 4;
        if (dT[k] > 110 && top[i] < 0) top[i] = (PH - j) / S;
        if (dL[k + 3] > 110) bot[i] = (PH - j - 1) / S;
        if (dA[k + 1] > 110) { if (gT[i] < 0) gT[i] = (PH - j) / S; gB[i] = (PH - j - 1) / S; }
      }
    }
    let i0 = 0, i1 = PW - 1;
    while (i0 < PW - 1 && top[i0] < 0) i0++;
    while (i1 > 0 && top[i1] < 0) i1--;
    const fillEnds = (arr) => {
      let f = -1, e = -1;
      for (let i = 0; i < PW; i++) if (arr[i] >= 0) { if (f < 0) f = i; e = i; }
      if (f < 0) return;
      for (let i = 0; i < f; i++) arr[i] = arr[f];
      for (let i = e + 1; i < PW; i++) arr[i] = arr[e];
      for (let i = f; i <= e; i++) if (arr[i] < 0) arr[i] = arr[i - 1];
    };
    fillEnds(top);
    fillEnds(bot);
    let g0 = -1, g1 = -1;
    for (let i = 0; i < PW; i++) if (gB[i] >= 0) { if (g0 < 0) g0 = i; g1 = i; }
    const at = (arr, z) => { const f = U.clamp(z * PW - 0.5, 0, PW - 1.001); const i = Math.floor(f), u = f - i; return arr[i] + (arr[i + 1] - arr[i]) * u; };
    const mask = (z, y) => {
      const i = U.clamp(Math.floor(z * PW), 0, PW - 1), j = U.clamp(Math.floor(PH - y * S), 0, PH - 1);
      const k = (j * PW + i) * 4;
      return (dA[k + 1] > 110 ? 1 : 0) | (dA[k + 2] > 110 ? 2 : 0) | (dB[k] > 110 ? 4 : 0) | (dB[k + 1] > 110 ? 8 : 0) | (dB[k + 2] > 110 ? 16 : 0);
    };
    return { top, bot, gB, at, mask, zA: (i0 + 0.5) / PW, zB: (i1 + 0.5) / PW, zG0: (g0 + 0.5) / PW, zG1: (g1 + 0.5) / PW };
  }

  /* ---------------- Geometría (una vez por modelo) ---------------- */
  // lod 0 = detalle alto (coche del jugador), 1 = medio (rivales)
  C3.geometry = function (model, lod) {
    lod = lod ? 1 : 0;
    let g = GEO.get(model.id + lod);
    if (g) return g;
    const Sd = model.side, R = model.rear;
    const pr = raster(model);
    const HW = 0.2125 * R.w;
    const wr = Sd.wheels[2], ar = wr * 1.13;
    const zFw = 1 - Sd.wheels[0], zRw = 1 - Sd.wheels[1];
    const zA = pr.zA, zB = pr.zB;
    const zT = zA + 0.03, zN = zB - 0.035;
    const yTop = (z) => pr.at(pr.top, U.clamp(z, zT, zN));
    const yLowP = (z) => pr.at(pr.bot, U.clamp(z, zT, zN));
    // paragolpes trasero a su altura real: deja ver la parte baja de los neumáticos
    const yLow = (z) => Math.min(yLowP(z), 0.068 + Math.max(0, z - zA - 0.03) * 0.6);
    // línea de cintura: del pie del parabrisas a la tapa trasera
    let zg = pr.zG1 - 0.035, yg = -1;
    for (let d = 0; d < 0.2 && !(yg > 0); d += 0.006) { const i = U.clamp(Math.floor((zg - d) * PW), 0, PW - 1); if (pr.gB[i] > 0) { yg = pr.gB[i]; zg -= d; } }
    if (!(yg > 0)) { zg = 0.6; yg = yTop(0.6) - 0.06; }
    const yT0 = yTop(zT) - CROWN * 0.5;
    const belt = (z) => yT0 + ((yg - yT0) * (z - zT)) / (zg - zT);
    // aletas sobre las ruedas
    const fender = (z) => {
      let y = 0;
      [[zFw, 0.013], [zRw, 0.02]].forEach((w) => { const u = (z - w[0]) / (ar * 1.36); if (Math.abs(u) < 1) y = Math.max(y, wr + (ar + w[1]) * Math.sqrt(1 - u * u)); });
      return y;
    };
    let maxTop = 0;
    for (let i = 0; i < PW; i++) maxTop = Math.max(maxTop, pr.top[i]);
    let zR0 = 1, zR1 = 0;
    for (let i = 0; i < PW; i++) if (pr.top[i] >= maxTop - 0.014) { const z = (i + 0.5) / PW; zR0 = Math.min(zR0, z); zR1 = Math.max(zR1, z); }
    const hip = (R.hip || 0) / 440;
    const hwAt = (z) => HW * (1 + hip * 0.5 * Math.exp(-Math.pow((z - zRw) / 0.14, 2)) + 0.014 * Math.exp(-Math.pow((z - zFw) / 0.1, 2)))
      * (0.9 + 0.1 * sm(0, 0.06, z - zA)) * (0.78 + 0.22 * sm(0, 0.13, zB - z));
    const stripes = !!R.stripes;
    const cabB = HW * R.cabinB, cabT = HW * R.cabinT;
    // puntos de media sección (lado derecho), del faldón al centro del techo.
    // rol: 0 bajos, 1 costado, 2 hombro, 3 repisa de la ventanilla, 4 cabina, 5 techo, 6 franja
    const ROLE = [], KEEP = [];
    [[0, 1], [1, 0], [1, 1], [1, 0], [1, 1], [1, 0], [1, 1], [2, 1], [2, 0], [3, 1], [4, 1], [4, 1], [5, 1], [5, 1]].forEach((q) => { ROLE.push(q[0]); KEEP.push(q[1]); });
    if (stripes) { ROLE.push(6, 5); KEEP.push(1, 1); }
    const IDX = [];
    for (let j = 0; j < ROLE.length; j++) if (lod === 0 || KEEP[j]) IDX.push(j);
    const nH = IDX.length, np = nH * 2 + 1;
    // taloneras sin pasos de rueda (para que el costado sea liso)
    const sill = new Float32Array(PW);
    for (let i = 0; i < PW; i++) sill[i] = pr.bot[i];
    [zFw, zRw].forEach((zw) => {
      const ia = U.clamp(Math.floor((zw - ar * 1.08) * PW), 0, PW - 1), ib = U.clamp(Math.ceil((zw + ar * 1.08) * PW), 0, PW - 1);
      for (let i = ia + 1; i < ib; i++) sill[i] = sill[ia] + ((sill[ib] - sill[ia]) * (i - ia)) / (ib - ia);
    });
    const ySill = (z) => Math.min(pr.at(sill, U.clamp(z, zT, zN)), 0.068 + Math.max(0, z - zA - 0.03) * 0.6);
    const archTop = wr + ar * 0.99;
    const archK = (z) => Math.max(sm(ar * 1.3, ar * 0.72, Math.abs(z - zFw)), sm(ar * 1.3, ar * 0.72, Math.abs(z - zRw)));
    const section = (z) => {
      const hw = hwAt(z), yt = yTop(z), yl = yLow(z), ys = ySill(z);
      const ysh0 = Math.min(yt - CROWN, belt(z));
      const fT = fender(z) - 0.004;
      const ysh = Math.max(ysh0, fT);
      const hC = ysh > ysh0 ? yt - ysh : Math.max(CROWN, yt - ysh);
      const hS = Math.max(0.012, ysh - ys);
      let y1 = ys + hS * 0.24, y2 = ys + hS * 0.58, y3 = ys + hS * 0.86;
      const ak = archK(z);
      if (ak > 0) {
        const room = Math.max(0.006, ysh - archTop);
        y1 = U.lerp(y1, Math.max(y1, archTop + room * 0.22), ak);
        y2 = U.lerp(y2, Math.max(y2, archTop + room * 0.5), ak);
        y3 = U.lerp(y3, Math.max(y3, archTop + room * 0.78), ak);
      }
      y3 = Math.min(y3, ysh - 0.004); y2 = Math.min(y2, y3 - 0.002); y1 = Math.min(y1, y2 - 0.002);
      const y0 = Math.min(yl + 0.003, y1 - 0.002);
      const cb = Math.min(hw * 0.8, cabB), ct = Math.min(cb * 0.94, cabT);
      const all = [
        [hw * 0.9, y0], [hw * 0.955, y0 + (y1 - y0) * 0.5], [hw * 0.985, y1], [hw * 0.997, (y1 + y2) / 2], [hw, y2],
        [hw * 0.993, (y2 + y3) / 2], [hw * 0.978, y3], [hw * 0.95, ysh - 0.0028], [hw * 0.906, ysh - 0.0004], [hw * 0.86, ysh + 0.0012],
        [cb, ysh + (hC > 0 ? Math.min(0.0035, hC * 0.3) : hC * 0.3)], [cb + (ct - cb) * 0.5, ysh + hC * 0.52], [ct, ysh + hC * 0.9], [ct * 0.55, ysh + hC * 0.975],
      ];
      if (stripes) all.push([0.024, ysh + hC * 0.995], [0.0068, yt]);
      return { r: IDX.map((j) => all[j]), yt, hC };
    };

    // estaciones: rejilla gruesa + refinado en los pasos de rueda (solo bandas bajas)
    const st = [];
    const add = (z, c) => st.push({ z: U.clamp(z, zA, zB), c });
    (lod ? [0, 0.012, 0.03, 0.058] : [0, 0.007, 0.018, 0.033, 0.052, 0.078]).forEach((d) => add(zA + d, 1));
    [0.08, 0.042, 0.016, 0].forEach((d) => add(zB - d, 1));
    for (let z = zA + (lod ? 0.1 : 0.11); z < zB - 0.11; z += lod ? 0.07 : 0.045) add(z, 1);
    const nA = lod ? 6 : 8;
    [zFw, zRw].forEach((zw) => { for (let k = 0; k <= nA; k++) add(zw - ar * 1.02 * Math.cos((Math.PI * k) / nA), k % 2); });
    st.sort((p, q) => p.z - q.z);
    const S = [];
    for (const s of st) {
      const p = S[S.length - 1];
      if (p && s.z - p.z < 0.008) { if (s.c && !p.c) S[S.length - 1] = s; } else S.push(s);
    }
    const V = [], secs = [];
    S.forEach((s) => {
      const sc = section(s.z);
      secs.push(sc);
      for (let j = 0; j < nH; j++) V.push(sc.r[j][0], sc.r[j][1], s.z);
      V.push(0, sc.yt, s.z);
      for (let j = nH - 1; j >= 0; j--) V.push(-sc.r[j][0], sc.r[j][1], s.z);
    });
    const vi = (i, k) => i * np + k;
    const F = [];
    const newell = (idx) => {
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < idx.length; i++) {
        const a = idx[i] * 3, b = idx[(i + 1) % idx.length] * 3;
        nx += (V[a + 1] - V[b + 1]) * (V[a + 2] + V[b + 2]);
        ny += (V[a + 2] - V[b + 2]) * (V[a] + V[b]);
        nz += (V[a] - V[b]) * (V[a + 1] + V[b + 1]);
      }
      return [-nx, -ny, -nz];
    };
    const unit = (n) => { const l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
    const quad = (i0, i1, k, kk) => {
      const v = [vi(i0, k), vi(i1, k), vi(i1, k + 1), vi(i0, k + 1)];
      const nn = newell(v);
      if (Math.hypot(nn[0], nn[1], nn[2]) < 1e-9) return;
      const zc = (S[i0].z + S[i1].z) / 2;
      const yc = (V[v[0] * 3 + 1] + V[v[1] * 3 + 1] + V[v[2] * 3 + 1] + V[v[3] * 3 + 1]) / 4;
      const m = pr.mask(zc, yc);
      const role = ROLE[IDX[kk]];
      let mat;
      if (role === 0) mat = m & 2 ? 'black' : 'skirt';
      else if (role === 1) mat = m & 2 ? 'black' : m & 8 ? 'light' : m & 4 ? 'sec' : 'paint';
      else if (role === 2) mat = m & 4 ? 'sec' : 'paint';
      else if (role === 3) mat = pr.mask(zc, yc + 0.012) & 1 ? 'black' : m & 4 ? 'sec' : 'paint';
      else if (role === 4) mat = m & 1 ? 'glass' : m & 4 ? 'sec' : 'paint';
      else {
        const hC = (secs[i0].hC + secs[i1].hC) / 2;
        if (hC > 0.02 && zc < zR0 - 0.004) mat = R.engine === 1 ? 'louver' : 'glass';
        else if (hC > 0.02 && zc > zR1 + 0.004) mat = 'glass';
        else if (R.engine === 1 && hC > 0.012 && zc < zR0) mat = 'louver';
        else if (role === 6) mat = 'stripe';
        else mat = m & 4 ? 'sec' : 'paint';
      }
      F.push({ v, m: mat, n: unit(nn), w: nn, smooth: 1, q: 1 });
    };
    for (let k = 0; k < np - 1; k++) {
      const kk = k < nH ? k : np - 2 - k;
      for (let i = 0; i < S.length - 1; i++) quad(i, i + 1, k, kk);
    }
    // normales suavizadas por vértice
    const nv = V.length / 3;
    const VN = new Float32Array(nv * 3);
    F.forEach((f) => f.v.forEach((i) => { VN[i * 3] += f.w[0]; VN[i * 3 + 1] += f.w[1]; VN[i * 3 + 2] += f.w[2]; }));
    for (let i = 0; i < nv; i++) { const l = Math.hypot(VN[i * 3], VN[i * 3 + 1], VN[i * 3 + 2]) || 1; VN[i * 3] /= l; VN[i * 3 + 1] /= l; VN[i * 3 + 2] /= l; }
    // tapas: panel trasero (con calcomanía) y morro
    const capT = [], capN = [];
    for (let k = 0; k < np; k++) { capT.push(vi(0, k)); capN.push(vi(S.length - 1, k)); }
    const tailSec = pr.mask(zA + 0.012, yTop(zT) * 0.6) & 4 ? 'sec' : 'paint';
    F.push({ v: capT, m: tailSec, n: [0, 0, -1], cap: 1 });
    F.push({ v: capN, m: 'paint', n: [0, 0, 1], flat: 1 });

    // piezas planas (cajas): retrovisores, alerones, aleta, luz de freno central
    const box = (x0, x1, y0, y1, z0, z1, mats, bias) => {
      const b = V.length / 3;
      [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].forEach((p) => V.push(p[0], p[1], p[2]));
      const f = (i, n, m) => { if (m) F.push({ v: i.map((q) => b + q), m, n, flat: 1, bias: bias || 0 }); };
      f([0, 1, 2, 3], [0, 0, -1], mats.back || mats.all);
      f([5, 4, 7, 6], [0, 0, 1], mats.front || mats.all);
      f([4, 0, 3, 7], [-1, 0, 0], mats.side || mats.all);
      f([1, 5, 6, 2], [1, 0, 0], mats.side || mats.all);
      f([3, 2, 6, 7], [0, 1, 0], mats.top || mats.all);
    };
    if (Sd.mirror) {
      const zM = 1 - Sd.mirror[0], yM = Sd.mirror[1];
      const cbM = Math.min(hwAt(zM) * 0.8, cabB);
      [-1, 1].forEach((sd) => {
        const xa = sd * (cbM + 0.006), xb = sd * (cbM + 0.05);
        box(Math.min(xa, xb), Math.max(xa, xb), yM - 0.002, yM + 0.018, zM - 0.01, zM + 0.012, { all: 'paint' }, -0.004);
        const ga = sd * (cbM + 0.011), gb2 = sd * (cbM + 0.045);
        box(Math.min(ga, gb2), Math.max(ga, gb2), yM + 0.002, yM + 0.014, zM - 0.0112, zM - 0.006, { back: 'glass' }, -0.006);
        const sa = sd * (cbM - 0.004), sb = sd * (cbM + 0.008);
        box(Math.min(sa, sb), Math.max(sa, sb), yM - 0.004, yM + 0.004, zM - 0.004, zM + 0.006, { all: 'black' }, -0.002);
      });
    }
    const wing = Sd.wing;
    const spanK = { wing: 0.86, bigwing: 0.96, swan: 0.9, integrated: 0.92, active: 0.62 }[R.spoiler] || 0.8;
    if (wing && !wing.flush) {
      const z0 = Math.max(zA - 0.01, 1 - (wing.x + wing.len)), z1 = 1 - wing.x;
      const th = Math.max(0.009, wing.th * 1.1);
      const span = HW * spanK;
      const matW = wing.integrated || wing.low ? 'paint' : 'carbon';
      box(-span, span, wing.y - th, wing.y, z0, z1, { top: matW, all: wing.integrated || wing.low ? 'black' : 'carbon' }, -0.01);
      if (!wing.integrated && !wing.low) {
        [-1, 1].forEach((sd) => box(sd * span - 0.004, sd * span + 0.004, wing.y - th - 0.022, wing.y + 0.012, z0 - 0.006, z1 + 0.004, { all: 'carbon' }, -0.012));
        const px = HW * ({ bigwing: 0.3, swan: 0.28 }[R.spoiler] || 0.34), zp = (z0 + z1) / 2;
        const yb = yTop(zp) - 0.006;
        [-1, 1].forEach((sd) => box(sd * px - 0.005, sd * px + 0.005, yb, wing.y - th, zp - 0.014, zp + 0.01, { all: 'carbon' }, -0.008));
      }
    } else if (R.spoiler === 'active' || R.spoiler === 'integrated') {
      const yd = yTop(zA + 0.04);
      const span = HW * spanK;
      box(-span, span, yd + 0.003, yd + 0.011, zA + 0.006, zA + 0.07, { top: 'paint', back: 'paint', all: 'black' }, -0.01);
    }
    if (Sd.fin) {
      const pts = Sd.fin.map((p) => [1 - p[0], p[1]]);
      const b = V.length / 3, n = pts.length;
      pts.forEach((p) => V.push(-0.003, p[1], p[0]));
      pts.forEach((p) => V.push(0.003, p[1], p[0]));
      F.push({ v: pts.map((p, i) => b + i), m: 'paint', n: [-1, 0, 0], flat: 1 });
      F.push({ v: pts.map((p, i) => b + n + i), m: 'paint', n: [1, 0, 0], flat: 1 });
    }
    if (R.h > 0.55) {
      const zl = zR0 - 0.006, yl = yTop(zl) - 0.001;
      box(-0.03, 0.03, yl - 0.004, yl + 0.0015, zl - 0.004, zl + 0.004, { back: 'light', top: 'black', all: 'black' }, -0.02);
    }
    // pasos de rueda (fondo oscuro detrás de cada rueda)
    const wheels = [];
    [[zFw, 0.05, 1], [zRw, 0.062, 0]].forEach((w) => {
      [-1, 1].forEach((sd) => {
        const xo = hwAt(w[0]) * 0.93 - 0.004;
        wheels.push({ x: sd * (xo - w[1] / 2), z: w[0], r: wr, w: w[1], side: sd, front: w[2] });
        const b = V.length / 3, xw = sd * hwAt(w[0]) * 0.8;
        const ids = [];
        for (let k = 0; k <= 10; k++) { const a = -0.3 + ((Math.PI + 0.6) * k) / 10; V.push(xw, wr + ar * Math.sin(a), w[0] + ar * Math.cos(a)); ids.push(b + k); }
        F.push({ v: ids, m: 'well', n: [sd, 0, 0], flat: 1, bias: 0.03 });
      });
    });

    // líneas de puerta (se dibujan sobre el costado visible)
    const lines = [];
    const zDoor = 1 - ((Sd.wheels[0] + Sd.wheels[1]) / 2 + 0.03), zDoor2 = zFw - ar * 1.18;
    [zDoor, zDoor2].forEach((zd) => {
      const sc = section(zd);
      [-1, 1].forEach((sd) => {
        const pts = [];
        for (let j = 0; j < sc.r.length && ROLE[IDX[j]] <= 2; j++) pts.push(sd * sc.r[j][0] * 1.003, sc.r[j][1], zd);
        lines.push({ side: sd, pts: new Float32Array(pts.slice(3)) });
      });
    });
    // oclusión ambiental: los bajos quedan más oscuros
    const nAll = V.length / 3;
    const AO = new Float32Array(nAll), VNa = new Float32Array(nAll * 3);
    VNa.set(VN);
    for (let i = 0; i < nAll; i++) AO[i] = 0.5 + 0.5 * sm(0.02, 0.14, V[i * 3 + 1]);
    g = {
      id: model.id, V: new Float32Array(V), VN: VNa, AO, F, wheels, lines, HW, zA, zB, np, nS: S.length,
      hwTail: hwAt(zA), yTail: yTop(zT), wr, ar,
    };
    GEO.set(model.id + lod, g);
    return g;
  };

  /* ---------------- Entorno de iluminación por escenario ---------------- */
  C3.env = function (theme) {
    let e = ENV.get(theme.id);
    if (e) return e;
    const night = theme.ambient < 0.7;
    const sun = theme.sun;
    let L;
    if (sun) {
      const az = (sun.x - 0.5) * 1.4, el = 0.35 + (1 - sun.y) * 0.6;
      L = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    } else L = [-0.35, 0.85, 0.25];
    const l = Math.hypot(L[0], L[1], L[2]);
    e = {
      id: theme.id, night,
      L: [L[0] / l, L[1] / l, L[2] / l],
      sunI: sun ? 0.72 : night ? 0.32 : 0.45,
      sunC: sun ? rgb(U.mix(sun.c, sun.glow || sun.c, 0.35)) : night ? [0.78, 0.82, 1] : [1, 1, 1],
      amb: theme.ambient * (night ? 0.7 : 0.6),
      ambC: rgb(U.mix(theme.sky[1], '#ffffff', 0.55)),
      fill: night ? 0.3 : 0.4,
      zen: rgb(theme.sky[0]),
      hor: rgb(U.mix(theme.sky[2], '#ffffff', night ? 0.05 : 0.2)),
      gnd: rgb(U.mix(theme.road[0], '#000000', 0.45)),
      gndH: rgb(U.mix(theme.fog, theme.grass[0], 0.45)),
    };
    ENV.set(theme.id, e);
    return e;
  };

  /* ---------------- Texturas por coche ---------------- */
  function wheelTex(model, size, blur) {
    const cv = U.canvas(size, size);
    const c = cv.getContext('2d');
    const x = size / 2, y = size / 2, r = size / 2 - 1;
    if (!blur) { Art.drawWheel(c, x, y, r, model.side.rim, model.side.caliper, 0); return cv; }
    c.fillStyle = '#131417';
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    const rr = r * 0.72;
    c.fillStyle = '#2a2c31';
    c.beginPath(); c.arc(x, y, rr * 0.95, 0, Math.PI * 2); c.fill();
    c.fillStyle = model.side.caliper;
    c.beginPath(); c.arc(x, y, rr * 0.84, -Math.PI * 0.42, -Math.PI * 0.02); c.arc(x, y, rr * 0.52, -Math.PI * 0.02, -Math.PI * 0.42, true); c.closePath(); c.fill();
    c.globalAlpha = 0.62;
    c.fillStyle = U.rad(c, x, y, 0, rr, [0, '#d8dce2', 0.3, '#8d939b', 0.75, '#b9bec6', 1, '#6c7178']);
    c.beginPath(); c.arc(x, y, rr * 0.97, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = '#c9cdd3'; c.lineWidth = r * 0.07;
    c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#d6dae0';
    c.beginPath(); c.arc(x, y, rr * 0.17, 0, Math.PI * 2); c.fill();
    return cv;
  }
  // detail: ancho aproximado en px de la calcomanía trasera
  C3.textures = function (model, color, theme, detail) {
    const dw = Math.max(160, Math.round(detail));
    return {
      decal: Art.rearDecal(model, color, { w: dw, light: theme.ambient, shade: theme.shade }),
      rim: wheelTex(model, dw > 500 ? 160 : 96, false),
      blur: wheelTex(model, dw > 500 ? 160 : 96, true),
      paint: rgb(color),
      sec: rgb(model.sec || '#15171b'),
      stripe: rgb(model.rear.stripes || color),
    };
  };

  /* ---------------- Render ---------------- */
  const B = { n: 0 };
  function buffers(n) {
    if (B.n >= n) return B;
    B.n = n;
    ['wx', 'wy', 'wz', 'nx', 'ny', 'nz', 'sx', 'sy', 'zc', 'er', 'eg', 'eb', 'f5', 'df', 'nh', 'sh', 'ry'].forEach((k) => { B[k] = new Float32Array(n); });
    B.lit = new Int32Array(n);
    return B;
  }
  let STAMP = 1;
  const list = [];
  const WX = new Float32Array(4 * WN * 2 + 16), WY = new Float32Array(WX.length), WZ = new Float32Array(WX.length);
  const WSX = new Float32Array(WX.length), WSY = new Float32Array(WX.length), WZC = new Float32Array(WX.length);
  const PX = new Float32Array(64), PY = new Float32Array(64);
  const LPJ = [[0], [0], [0]];

  function matMul(a, b) {
    const r = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    return r;
  }
  const col3 = (r, g, b) => 'rgb(' + (r > 1 ? 255 : r < 0 ? 0 : (r * 255) | 0) + ',' + (g > 1 ? 255 : g < 0 ? 0 : (g * 255) | 0) + ',' + (b > 1 ? 255 : b < 0 ? 0 : (b * 255) | 0) + ')';

  /*
    pose: { yaw, roll, pitch, heave, steer, blur }  (radianes; roll > 0 inclina a la derecha)
    view: { x, y, ppl, pitch, dist, lift, alpha, boundsOnly }
      x, y   = punto de pantalla del centro de la cola a ras de suelo
      ppl    = píxeles por unidad de largo a esa distancia
    Devuelve { lights, exh, x0, y0, x1, y1 } en coordenadas de pantalla.
  */
  C3.draw = function (ctx, model, tex, env, pose, view) {
    const g = C3.geometry(model, view.lod);
    const nv = g.V.length / 3;
    const b = buffers(nv + 8);
    const stamp = ++STAMP;
    // --- matrices
    const cy = Math.cos(pose.yaw || 0), sy = Math.sin(pose.yaw || 0);
    const th = -(pose.roll || 0), cr = Math.cos(th), sr = Math.sin(th);
    const cpp = Math.cos(pose.pitch || 0), spp = Math.sin(pose.pitch || 0);
    const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
    const Rx = [1, 0, 0, 0, cpp, spp, 0, -spp, cpp];
    const Rz = [cr, -sr, 0, sr, cr, 0, 0, 0, 1];
    const M = matMul(Ry, matMul(Rx, Rz));
    const pvx = 0, pvy = 0.1, pvz = 0.5, heave = pose.heave || 0;
    // traslación: Ry·(Pv + heave − Cyaw) + Cyaw
    const tx0 = pvx, ty0 = pvy + heave, tz0 = pvz - 0.5;
    const TX = Ry[0] * tx0 + Ry[1] * ty0 + Ry[2] * tz0, TY = Ry[3] * tx0 + Ry[4] * ty0 + Ry[5] * tz0, TZ = Ry[6] * tx0 + Ry[7] * ty0 + Ry[8] * tz0 + 0.5;
    // --- cámara
    const cph = Math.cos(view.pitch), sph = Math.sin(view.pitch), D = view.dist;
    const Cx = 0, Cy = 0.1 + D * sph, Cz = 0.45 - D * cph;
    const zcA = -(0 - Cy) * sph + (0 - Cz) * cph;
    const sxA = 0, syA = -((0 - Cy) * cph + (0 - Cz) * sph) / zcA;
    const k = view.ppl * zcA;
    const ox = view.x, oy = view.y - (view.lift || 0);
    const V = g.V, VN = g.VN;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < nv; i++) {
      const px = V[i * 3] - pvx, py = V[i * 3 + 1] - pvy, pz = V[i * 3 + 2] - pvz;
      const wx = M[0] * px + M[1] * py + M[2] * pz + TX;
      const wy = M[3] * px + M[4] * py + M[5] * pz + TY;
      const wz = M[6] * px + M[7] * py + M[8] * pz + TZ;
      b.wx[i] = wx; b.wy[i] = wy; b.wz[i] = wz;
      const dx = wx - Cx, dy = wy - Cy, dz = wz - Cz;
      const zc = -dy * sph + dz * cph;
      const yc = dy * cph + dz * sph;
      const X = ox + ((dx / zc) - sxA) * k, Y = oy + ((-yc / zc) - syA) * k;
      b.sx[i] = X; b.sy[i] = Y; b.zc[i] = zc;
      if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
      const nx = VN[i * 3], ny = VN[i * 3 + 1], nz = VN[i * 3 + 2];
      b.nx[i] = M[0] * nx + M[1] * ny + M[2] * nz;
      b.ny[i] = M[3] * nx + M[4] * ny + M[5] * nz;
      b.nz[i] = M[6] * nx + M[7] * ny + M[8] * nz;
    }
    const proj = (wx, wy, wz, out, j) => {
      const dx = wx - Cx, dy = wy - Cy, dz = wz - Cz;
      const zc = -dy * sph + dz * cph, yc = dy * cph + dz * sph;
      out[0][j] = ox + ((dx / zc) - sxA) * k; out[1][j] = oy + ((-yc / zc) - syA) * k; out[2][j] = zc;
    };
    // --- ruedas (no se inclinan con la carrocería)
    const Wo = [WSX, WSY, WZC];
    const wheels = g.wheels;
    for (let w = 0; w < wheels.length; w++) {
      const wh = wheels[w];
      const d = wh.front ? pose.steer || 0 : 0;
      const ax = Math.cos(d), az = -Math.sin(d);     // eje de la rueda
      const fx = Math.sin(d), fz = Math.cos(d);      // hacia delante
      for (let s = 0; s < 2; s++) {
        const off = (s === 0 ? 0.5 : -0.5) * wh.w * wh.side;   // s=0 cara exterior
        for (let q = 0; q < WN; q++) {
          const a = (q / WN) * Math.PI * 2;
          const lx = wh.x + ax * off + fx * Math.cos(a) * wh.r;
          const ly = wh.r + Math.sin(a) * wh.r;
          const lz = wh.z + az * off + fz * Math.cos(a) * wh.r;
          const rx = lx, rz = lz - 0.5;
          const j = w * WN * 2 + s * WN + q;
          WX[j] = Ry[0] * rx + Ry[2] * rz; WY[j] = ly; WZ[j] = Ry[6] * rx + Ry[8] * rz + 0.5;
          proj(WX[j], WY[j], WZ[j], Wo, j);
          const X = WSX[j], Y = WSY[j];
          if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
        }
      }
    }
    // sombra en el suelo (no se eleva con los saltos)
    const SHP = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    if (view.shadow) {
      const w = g.HW * 1.2;
      const gp = (x, z, j) => { const rz = z - 0.5; proj(Ry[0] * x + Ry[2] * rz, 0, Ry[6] * x + Ry[8] * rz + 0.5, SHP, j); SHP[1][j] += view.lift || 0; };
      gp(-w, 1.06, 0); gp(w, 1.06, 1); gp(-w, -0.07, 2);
      const ex = SHP[0][1] + SHP[0][2] - SHP[0][0], ey = SHP[1][1] + SHP[1][2] - SHP[1][0];
      x0 = Math.min(x0, SHP[0][0], SHP[0][1], SHP[0][2], ex); x1 = Math.max(x1, SHP[0][0], SHP[0][1], SHP[0][2], ex);
      y0 = Math.min(y0, SHP[1][0], SHP[1][1], SHP[1][2], ey); y1 = Math.max(y1, SHP[1][0], SHP[1][1], SHP[1][2], ey);
    }
    if (view.boundsOnly) return { x0, y0, x1, y1 };

    // --- iluminación por vértice (solo los que se usan)
    const E = env;
    const Lx = E.L[0], Ly = E.L[1], Lz = E.L[2];
    const light = (i) => {
      if (b.lit[i] === stamp) return;
      b.lit[i] = stamp;
      const nx = b.nx[i], ny = b.ny[i], nz = b.nz[i];
      let vx = Cx - b.wx[i], vy = Cy - b.wy[i], vz = Cz - b.wz[i];
      const vl = Math.sqrt(vx * vx + vy * vy + vz * vz);
      vx /= vl; vy /= vl; vz /= vl;
      let ndv = nx * vx + ny * vy + nz * vz;
      if (ndv < 0) ndv = 0;
      const ry = 2 * ndv * ny - vy;
      b.ry[i] = ry;
      if (ry >= 0) {
        const t = Math.pow(ry, 0.5);
        b.er[i] = E.hor[0] + (E.zen[0] - E.hor[0]) * t; b.eg[i] = E.hor[1] + (E.zen[1] - E.hor[1]) * t; b.eb[i] = E.hor[2] + (E.zen[2] - E.hor[2]) * t;
      } else {
        const t = Math.min(1, -ry * 4);
        b.er[i] = E.gndH[0] + (E.gnd[0] - E.gndH[0]) * t; b.eg[i] = E.gndH[1] + (E.gnd[1] - E.gndH[1]) * t; b.eb[i] = E.gndH[2] + (E.gnd[2] - E.gndH[2]) * t;
      }
      const f = 1 - ndv;
      b.f5[i] = f * f * f * f * f;
      const ndl = nx * Lx + ny * Ly + nz * Lz;
      b.df[i] = ndl > 0 ? ndl : 0;
      let hx = Lx + vx, hy = Ly + vy, hz = Lz + vz;
      const hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
      hx /= hl; hy /= hl; hz /= hl;
      const nh = nx * hx + ny * hy + nz * hz;
      b.nh[i] = nh > 0 ? nh : 0;
      b.sh[i] = ndv;
    };
    const tint = (m) => (m === 'paint' ? tex.paint : m === 'sec' ? tex.sec : m === 'stripe' ? tex.stripe : MAT[m].base);
    // color de un vértice separado en: parte propia (difusa + brillo) y reflejo del entorno
    const SV = new Float32Array(8);
    const shade = (i, m) => {
      light(i);
      const mt = MAT[m], base = tint(m);
      const fres = mt.f0 + (1 - mt.f0) * b.f5[i];
      const dif = mt.diff * (1 - fres * 0.6);
      const amb = E.amb * (0.58 + 0.42 * b.ny[i]);
      const sp = mt.spec ? Math.pow(b.nh[i], mt.shin) * E.sunI * mt.spec : 0;
      const fl = E.fill * b.sh[i];
      const em = mt.emit || 0;
      const dfl = E.sunI * b.df[i];
      SV[0] = base[0] * ((E.ambC[0] * amb + E.sunC[0] * dfl + fl) * dif + em) + sp * E.sunC[0];
      SV[1] = base[1] * ((E.ambC[1] * amb + E.sunC[1] * dfl + fl) * dif + em) + sp * E.sunC[1];
      SV[2] = base[2] * ((E.ambC[2] * amb + E.sunC[2] * dfl + fl) * dif + em) + sp * E.sunC[2];
      const ao = g.AO[i];
      SV[0] *= ao; SV[1] *= ao; SV[2] *= ao;
      SV[3] = fres * mt.refl * (0.55 + 0.45 * ao);
      SV[4] = b.er[i]; SV[5] = b.eg[i]; SV[6] = b.eb[i];
      SV[7] = b.ry[i];
      return SV;
    };
    const EA = new Float32Array(8), EB = new Float32Array(8);
    const edge = (o, i, j, m) => {
      shade(i, m);
      for (let q = 0; q < 8; q++) o[q] = SV[q];
      shade(j, m);
      for (let q = 0; q < 8; q++) o[q] = (o[q] + SV[q]) * 0.5;
    };

    // --- lista de dibujo
    list.length = 0;
    const F = g.F;
    for (let f = 0; f < F.length; f++) {
      const fc = F[f];
      const n = fc.n, a = fc.v[0];
      const wnx = M[0] * n[0] + M[1] * n[1] + M[2] * n[2];
      const wny = M[3] * n[0] + M[4] * n[1] + M[5] * n[2];
      const wnz = M[6] * n[0] + M[7] * n[1] + M[8] * n[2];
      if ((Cx - b.wx[a]) * wnx + (Cy - b.wy[a]) * wny + (Cz - b.wz[a]) * wnz <= 0) continue;
      let d = 0;
      const vv = fc.v;
      for (let q = 0; q < vv.length; q++) d += b.zc[vv[q]];
      d = d / vv.length + (fc.bias || 0);
      list.push({ d, f: fc, nx: wnx, ny: wny, nz: wnz, w: -1 });
    }
    for (let w = 0; w < wheels.length; w++) {
      const wh = wheels[w];
      const base = w * WN * 2;
      const d = wh.front ? pose.steer || 0 : 0;
      // normal exterior de la llanta
      const anx = Math.cos(d) * wh.side, anz = -Math.sin(d) * wh.side;
      const onx = Ry[0] * anx + Ry[2] * anz, onz = Ry[6] * anx + Ry[8] * anz;
      let cxw = 0, cyw = 0, czw = 0, dz = 0;
      for (let q = 0; q < WN; q++) { cxw += WX[base + q]; cyw += WY[base + q]; czw += WZ[base + q]; dz += WZC[base + q]; }
      cxw /= WN; cyw /= WN; czw /= WN; dz /= WN;
      if ((Cx - cxw) * onx + (Cz - czw) * onz > 0) list.push({ d: dz - 0.004, w, disc: 1 });
      for (let q = 0; q < WN; q++) {
        const q1 = (q + 1) % WN;
        const am = ((q + 0.5) / WN) * Math.PI * 2;
        // normal radial (hacia fuera del neumático)
        const rnx0 = Math.sin(d) * Math.cos(am), rnz0 = Math.cos(d) * Math.cos(am), rny = Math.sin(am);
        const rnx = Ry[0] * rnx0 + Ry[2] * rnz0, rnz = Ry[6] * rnx0 + Ry[8] * rnz0;
        const p0 = base + q;
        if ((Cx - WX[p0]) * rnx + (Cy - WY[p0]) * rny + (Cz - WZ[p0]) * rnz <= 0) continue;
        const dd = (WZC[p0] + WZC[base + q1] + WZC[base + WN + q] + WZC[base + WN + q1]) / 4;
        list.push({ d: dd, w, q, q1, nx: rnx, ny: rny, nz: rnz });
      }
    }
    // líneas de puerta del costado visible
    const LN = g.lines;
    for (let l = 0; l < LN.length; l++) {
      const ln = LN[l], P = ln.pts;
      const snx = M[0] * ln.side, snz = M[6] * ln.side;
      const px = P[0] - pvx, py = P[1] - pvy, pz = P[2] - pvz;
      const wx = M[0] * px + M[1] * py + M[2] * pz + TX, wz = M[6] * px + M[7] * py + M[8] * pz + TZ;
      if ((Cx - wx) * snx + (Cz - wz) * snz <= 0.02) continue;
      list.push({ d: -1, line: ln });
    }
    for (let li = 0; li < list.length; li++) {
      const it = list[li];
      if (!it.line) continue;
      const P = it.line.pts, n = P.length / 3;
      const LX = it.lx || (it.lx = new Float32Array(n)), LY = it.ly || (it.ly = new Float32Array(n));
      let d = 0;
      for (let q = 0; q < n; q++) {
        const px = P[q * 3] - pvx, py = P[q * 3 + 1] - pvy, pz = P[q * 3 + 2] - pvz;
        proj(M[0] * px + M[1] * py + M[2] * pz + TX, M[3] * px + M[4] * py + M[5] * pz + TY, M[6] * px + M[7] * py + M[8] * pz + TZ, LPJ, 0);
        LX[q] = LPJ[0][0]; LY[q] = LPJ[1][0]; d += LPJ[2][0];
      }
      it.d = d / n - 0.003;
    }
    list.sort((p, q) => q.d - p.d);

    // --- dibujo
    ctx.save();
    if (view.alpha != null) ctx.globalAlpha = view.alpha;
    if (view.shadow) {
      const sh = Art.fx().shadow;
      const a = (SHP[0][1] - SHP[0][0]) / sh.width, bq = (SHP[1][1] - SHP[1][0]) / sh.width;
      const c = (SHP[0][2] - SHP[0][0]) / sh.height, d = (SHP[1][2] - SHP[1][0]) / sh.height;
      ctx.save();
      ctx.globalAlpha = view.shadow * (view.alpha == null ? 1 : view.alpha);
      ctx.transform(a, bq, c, d, SHP[0][0], SHP[1][0]);
      ctx.drawImage(sh, 0, 0);
      ctx.drawImage(sh, sh.width * 0.12, sh.height * 0.1, sh.width * 0.76, sh.height * 0.8);
      ctx.restore();
    }
    const EXP = view.expand == null ? 0.55 : view.expand;
    const SX = b.sx, SY = b.sy;
    let meta = null;
    for (let li = 0; li < list.length; li++) {
      const it = list[li];
      if (it.line) {
        ctx.strokeStyle = E.night ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = Math.max(0.7, k * 0.0014);
        ctx.beginPath();
        ctx.moveTo(it.lx[0], it.ly[0]);
        for (let q = 1; q < it.lx.length; q++) ctx.lineTo(it.lx[q], it.ly[q]);
        ctx.stroke();
        continue;
      }
      if (it.w >= 0) {
        const wh = wheels[it.w], base = it.w * WN * 2;
        if (it.disc) {
          // llanta con textura (transformación afín)
          const dd = wh.front ? pose.steer || 0 : 0;
          const fxw = Math.sin(dd), fzw = Math.cos(dd);
          let cxw = 0, cyw = 0, czw = 0;
          for (let q = 0; q < WN; q++) { cxw += WX[base + q]; cyw += WY[base + q]; czw += WZ[base + q]; }
          cxw /= WN; cyw /= WN; czw /= WN;
          const fwx = Ry[0] * fxw + Ry[2] * fzw, fwz = Ry[6] * fxw + Ry[8] * fzw;
          const P3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          proj(cxw, cyw, czw, P3, 0);
          proj(cxw + fwx * wh.r, cyw, czw + fwz * wh.r, P3, 1);
          proj(cxw, cyw + wh.r, czw, P3, 2);
          const img = (pose.blur || 0) > 0.5 ? tex.blur : tex.rim;
          const h = img.width / 2;
          const ux = P3[0][1] - P3[0][0], uy = P3[1][1] - P3[1][0];
          const vx = P3[0][2] - P3[0][0], vy = P3[1][2] - P3[1][0];
          const a = ux / h, bb = uy / h, c = -vx / h, dq = -vy / h;
          ctx.save();
          ctx.transform(a, bb, c, dq, P3[0][0] - a * h - c * h, P3[1][0] - bb * h - dq * h);
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        } else {
          const i0 = base + it.q, i1 = base + it.q1, i2 = base + WN + it.q1, i3 = base + WN + it.q;
          PX[0] = WSX[i0]; PY[0] = WSY[i0]; PX[1] = WSX[i1]; PY[1] = WSY[i1]; PX[2] = WSX[i2]; PY[2] = WSY[i2]; PX[3] = WSX[i3]; PY[3] = WSY[i3];
          // neumático: sombreado plano con la normal radial
          const vx = Cx - WX[i0], vy = Cy - WY[i0], vz = Cz - WZ[i0];
          const vl = Math.hypot(vx, vy, vz);
          const ndv = Math.max(0, (it.nx * vx + it.ny * vy + it.nz * vz) / vl);
          const ndl = Math.max(0, it.nx * Lx + it.ny * Ly + it.nz * Lz);
          const t = MAT.tire.base;
          const li2 = E.amb * (0.55 + 0.45 * it.ny) + E.sunI * ndl * 0.8 + E.fill * ndv * 0.8;
          ctx.fillStyle = col3(t[0] * li2 + 0.03, t[1] * li2 + 0.03, t[2] * li2 + 0.034);
          fillPoly(ctx, PX, PY, 4, EXP);
          // canto del neumático (hombro de la goma)
          ctx.strokeStyle = 'rgba(160,166,178,' + (0.1 + 0.2 * ndv).toFixed(2) + ')';
          ctx.lineWidth = Math.max(0.6, k * 0.0016);
          ctx.beginPath(); ctx.moveTo(PX[0], PY[0]); ctx.lineTo(PX[1], PY[1]); ctx.stroke();
        }
        continue;
      }
      const fc = it.f, vv = fc.v, n = vv.length;
      for (let q = 0; q < n; q++) { PX[q] = SX[vv[q]]; PY[q] = SY[vv[q]]; }
      if (fc.q) {
        // cara de la malla: degradado entre las dos aristas longitudinales
        edge(EA, vv[0], vv[1], fc.m);
        edge(EB, vv[3], vv[2], fc.m);
        const r1 = EA[0] + EA[4] * EA[3], g1 = EA[1] + EA[5] * EA[3], b1 = EA[2] + EA[6] * EA[3];
        const r3 = EB[0] + EB[4] * EB[3], g3 = EB[1] + EB[5] * EB[3], b3 = EB[2] + EB[6] * EB[3];
        // ¿cruza la línea del horizonte reflejada? (el filo claro/oscuro típico de la pintura)
        const cross = (EA[7] < 0) !== (EB[7] < 0) && EA[3] + EB[3] > 0.16;
        if (!cross && Math.abs(r1 - r3) + Math.abs(g1 - g3) + Math.abs(b1 - b3) < 0.03) ctx.fillStyle = col3((r1 + r3) / 2, (g1 + g3) / 2, (b1 + b3) / 2);
        else {
          // degradado perpendicular a las aristas largas (las isolíneas siguen la malla)
          const ax0 = (PX[0] + PX[1]) / 2, ay0 = (PY[0] + PY[1]) / 2, ax1 = (PX[2] + PX[3]) / 2, ay1 = (PY[2] + PY[3]) / 2;
          const ex = PX[1] - PX[0] + PX[2] - PX[3], ey = PY[1] - PY[0] + PY[2] - PY[3];
          const el = Math.sqrt(ex * ex + ey * ey) || 1;
          const gnx = -ey / el, gny = ex / el;
          const gd = (ax1 - ax0) * gnx + (ay1 - ay0) * gny;
          if (Math.abs(gd) < 0.4) ctx.fillStyle = col3((r1 + r3) / 2, (g1 + g3) / 2, (b1 + b3) / 2);
          else {
            const gr = ctx.createLinearGradient(ax0, ay0, ax0 + gnx * gd, ay0 + gny * gd);
            gr.addColorStop(0, col3(r1, g1, b1));
            if (cross) {
              const t = U.clamp(EA[7] / (EA[7] - EB[7]), 0.04, 0.96);
              const w = EA[3] + (EB[3] - EA[3]) * t;
              const br = EA[0] + (EB[0] - EA[0]) * t, bg = EA[1] + (EB[1] - EA[1]) * t, bb = EA[2] + (EB[2] - EA[2]) * t;
              const lo = col3(br + E.gndH[0] * w, bg + E.gndH[1] * w, bb + E.gndH[2] * w);
              const hi = col3(br + E.hor[0] * w * 1.12, bg + E.hor[1] * w * 1.12, bb + E.hor[2] * w * 1.12);
              gr.addColorStop(t - 0.035, EA[7] < 0 ? lo : hi);
              gr.addColorStop(t + 0.035, EA[7] < 0 ? hi : lo);
            }
            gr.addColorStop(1, col3(r3, g3, b3));
            ctx.fillStyle = gr;
          }
        }
        fillPoly(ctx, PX, PY, 4, EXP);
        if (fc.m === 'louver') {
          ctx.strokeStyle = 'rgba(0,0,0,0.55)';
          ctx.lineWidth = Math.max(0.6, k * 0.0018);
          ctx.beginPath();
          for (let t = 1; t < 3; t++) {
            const u = t / 3;
            ctx.moveTo(PX[0] + (PX[1] - PX[0]) * u, PY[0] + (PY[1] - PY[0]) * u);
            ctx.lineTo(PX[3] + (PX[2] - PX[3]) * u, PY[3] + (PY[2] - PY[3]) * u);
          }
          ctx.stroke();
        }
        continue;
      }
      // caras planas (tapas, piezas, pasos de rueda)
      const mt = MAT[fc.m], base = tint(fc.m);
      const i0 = vv[0];
      const vx = Cx - b.wx[i0], vy = Cy - b.wy[i0], vz = Cz - b.wz[i0];
      const vl = Math.hypot(vx, vy, vz);
      const ndv = Math.max(0, (it.nx * vx + it.ny * vy + it.nz * vz) / vl);
      const ndl = Math.max(0, it.nx * Lx + it.ny * Ly + it.nz * Lz);
      const fres = mt.f0 + (1 - mt.f0) * Math.pow(1 - ndv, 5);
      const amb = E.amb * (0.58 + 0.42 * it.ny);
      const lf = (c) => E.ambC[c] * amb + E.sunC[c] * E.sunI * ndl + E.fill * ndv;
      const ry = 2 * ndv * it.ny - vy / vl;
      const env = ry >= 0 ? E.hor.map((h, c) => h + (E.zen[c] - h) * Math.sqrt(ry)) : E.gndH.map((h, c) => h + (E.gnd[c] - h) * Math.min(1, -ry * 4));
      const cc = [0, 1, 2].map((c) => base[c] * (lf(c) * mt.diff * (1 - fres * 0.6) + (mt.emit || 0)) + env[c] * fres * mt.refl);
      if (fc.cap) {
        // panel trasero: degradado vertical (simula la curvatura) + calcomanía
        let ty = 1e9, by = -1e9, tx = 0, bx = 0;
        for (let q = 0; q < n; q++) { if (PY[q] < ty) { ty = PY[q]; tx = PX[q]; } if (PY[q] > by) { by = PY[q]; bx = PX[q]; } }
        const gr = ctx.createLinearGradient(tx, ty, bx, by);
        const up = 0.16 * (E.night ? 0.5 : 1);
        gr.addColorStop(0, col3(cc[0] + E.hor[0] * up, cc[1] + E.hor[1] * up, cc[2] + E.hor[2] * up));
        gr.addColorStop(0.35, col3(cc[0] * 1.02, cc[1] * 1.02, cc[2] * 1.02));
        gr.addColorStop(1, col3(cc[0] * 0.62, cc[1] * 0.62, cc[2] * 0.62));
        ctx.fillStyle = gr;
        fillPoly(ctx, PX, PY, n, EXP);
        meta = decal(ctx, g, tex.decal, M, TX, TY, TZ, pvx, pvy, pvz, proj);
      } else {
        ctx.fillStyle = col3(cc[0], cc[1], cc[2]);
        fillPoly(ctx, PX, PY, n, fc.m === 'well' ? 0.2 : EXP);
      }
    }
    ctx.restore();
    if (!meta) meta = decal(null, g, tex.decal, M, TX, TY, TZ, pvx, pvy, pvz, proj);
    meta.x0 = x0; meta.y0 = y0; meta.x1 = x1; meta.y1 = y1;
    meta.k = k;
    return meta;
  };

  function fillPoly(ctx, xs, ys, n, E) {
    let cx = 0, cy = 0;
    for (let i = 0; i < n; i++) { cx += xs[i]; cy += ys[i]; }
    cx /= n; cy /= n;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - cx, dy = ys[i] - cy;
      const l = Math.sqrt(dx * dx + dy * dy) || 1;
      const x = xs[i] + (dx / l) * E, y = ys[i] + (dy / l) * E;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Calcomanía trasera: se dibuja en tres franjas con transformación afín
  const DP = [new Float32Array(8), new Float32Array(8), new Float32Array(8)];
  function decal(ctx, g, dc, M, TX, TY, TZ, pvx, pvy, pvz, proj) {
    const sX = g.hwTail / dc.bw2, sY = g.yTail / (dc.GY - dc.yDeck);
    const zD = g.zA - 0.0015;
    const W = dc.img.width, H = dc.img.height;
    const toW = (u, v, j) => {
      const xa = dc.x0 + u / dc.k, ya = dc.y0 + v / dc.k;
      const px = (xa - dc.cx) * sX - pvx, py = (dc.GY - ya) * sY - pvy, pz = zD - pvz;
      proj(M[0] * px + M[1] * py + M[2] * pz + TX, M[3] * px + M[4] * py + M[5] * pz + TY, M[6] * px + M[7] * py + M[8] * pz + TZ, DP, j);
    };
    if (ctx) {
      const N = 3;
      for (let s = 0; s < N; s++) {
        const u0 = (W * s) / N, u1 = (W * (s + 1)) / N;
        toW(u0, 0, 0); toW(u1, 0, 1); toW(u0, H, 2);
        const du = u1 - u0;
        const a = (DP[0][1] - DP[0][0]) / du, b = (DP[1][1] - DP[1][0]) / du;
        const c = (DP[0][2] - DP[0][0]) / H, d = (DP[1][2] - DP[1][0]) / H;
        ctx.save();
        ctx.transform(a, b, c, d, DP[0][0] - a * u0, DP[1][0] - b * u0);
        ctx.beginPath();
        ctx.rect(u0 - (s ? 0.6 : 0), 0, du + (s < N - 1 ? 1.2 : 0), H);
        ctx.clip();
        ctx.drawImage(dc.img, 0, 0);
        ctx.restore();
      }
    }
    // luces y escapes en pantalla
    const pts = (arr) => arr.map((L) => {
      const u = (L[0] - dc.x0) * dc.k, v = (L[1] - dc.y0) * dc.k;
      toW(u, v, 0);
      const x = DP[0][0], y = DP[1][0];
      toW(u + L[2] * dc.k, v, 0);
      return [x, y, Math.abs(DP[0][0] - x)];
    });
    return { lights: pts(dc.lights), exh: pts(dc.exh) };
  }

  /* ---------------- Imagen cacheada (coches lejanos) ---------------- */
  C3.sprite = function (model, tex, env, yaw, ppl, pitch, dist) {
    const pose = { yaw, roll: 0, pitch: 0, heave: 0, steer: 0, blur: 1 };
    const bb = C3.draw(null, model, tex, env, pose, { x: 0, y: 0, ppl, pitch, dist, boundsOnly: true, shadow: 0.6, lod: 1 });
    const pad = 3;
    const w = Math.ceil(bb.x1 - bb.x0 + pad * 2), h = Math.ceil(bb.y1 - bb.y0 + pad * 2);
    const cv = U.canvas(w, h);
    const ctx = cv.getContext('2d');
    const ax = -bb.x0 + pad, ay = -bb.y0 + pad;
    const meta = C3.draw(ctx, model, tex, env, pose, { x: ax, y: ay, ppl, pitch, dist, expand: 0.45, shadow: 0.6, lod: 1 });
    const rel = (arr) => arr.map((p) => [p[0] - ax, p[1] - ay, p[2]]);
    return { img: cv, ax, ay, ppl, lights: rel(meta.lights), exh: rel(meta.exh) };
  };
})(window.TG);
