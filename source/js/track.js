'use strict';
/* ============================================================
   Generación de circuitos pseudo-3D
   ============================================================ */
(function (TG) {
  const U = TG.U, C = TG.C;
  const Track = (TG.Track = {});

  Track.build = function (def, opts) {
    opts = opts || {};
    const theme = TG.THEMES[def.theme];
    const rng = U.rng(def.seed);
    const SEG = C.SEG;
    const segs = [];
    const lastY = () => (segs.length ? segs[segs.length - 1].p2.world.y : 0);
    const addSeg = (curve, y) => {
      const n = segs.length;
      segs.push({
        index: n, curve,
        p1: { world: { x: 0, y: lastY(), z: n * SEG }, camera: {}, screen: {} },
        p2: { world: { x: 0, y, z: (n + 1) * SEG }, camera: {}, screen: {} },
        sprites: [], cars: [], pickups: [], band: 0, fog: 1, clip: 0, vis: false,
      });
    };
    const addRoad = (enter, hold, leave, curve, height) => {
      const startY = lastY(), endY = startY + (height || 0) * SEG, total = enter + hold + leave;
      for (let n = 0; n < enter; n++) addSeg(U.easeIn(0, curve, n / enter), U.easeInOut(startY, endY, (n + 1) / total));
      for (let n = 0; n < hold; n++) addSeg(curve, U.easeInOut(startY, endY, (enter + n + 1) / total));
      for (let n = 0; n < leave; n++) addSeg(U.easeInOut(curve, 0, n / leave), U.easeInOut(startY, endY, (enter + hold + n + 1) / total));
    };

    const target = def.segments;
    const maxC = def.maxCurve, maxH = def.maxHill;
    const curvy = def.curvy, hilly = def.hilly;
    const FULL = Math.PI * 2 * SEG; // suma de curvas de una vuelta completa
    let turn = 0;
    const countTurn = (from) => { for (let i = from; i < segs.length; i++) turn += segs[i].curve; };
    const hill = () => {
      if (rng() > hilly) return 0;
      const y = lastY() / SEG;
      let h = rng.range(maxH * 0.3, maxH) * (rng() < 0.5 ? -1 : 1);
      if (y + h > maxH * 1.5) h = -Math.abs(h);
      if (y + h < -maxH * 1.5) h = Math.abs(h);
      return h;
    };

    addRoad(0, 44, 0, 0, 0); // recta de salida
    let guard = 0;
    while (segs.length < target - 190 && guard++ < 400) {
      const from = segs.length;
      const prog = segs.length / target;
      const bias = U.clamp((prog * FULL - turn) / (FULL * 0.25), -1, 1);
      const dir = rng() < 0.5 + bias * 0.42 ? 1 : -1;
      const pStraight = 0.3 - curvy * 0.16;
      const r = rng();
      if (r < pStraight) {
        const h = hill();
        if (h) addRoad(20, rng.int(15, 50), 20, 0, h);
        else addRoad(0, rng.int(25, 80), 0, 0, 0);
      } else if (r < pStraight + 0.3) {
        const c = dir * rng.range(maxC * (0.38 + curvy * 0.22), maxC);
        addRoad(rng.int(15, 30), rng.int(20, 70), rng.int(15, 30), c, hill());
      } else if (r < pStraight + 0.5) {
        const c = rng.range(maxC * 0.45, maxC * 0.9);
        addRoad(rng.int(14, 24), rng.int(12, 40), rng.int(14, 24), dir * c, hill());
        addRoad(rng.int(14, 24), rng.int(12, 40), rng.int(14, 24), -dir * c * rng.range(0.7, 1.05), hill());
      } else if (r < pStraight + 0.61) {
        addRoad(rng.int(30, 50), rng.int(60, 120), rng.int(30, 50), dir * rng.range(maxC * 0.25, maxC * 0.5), hill());
      } else if (r < pStraight + 0.72) {
        const n = rng.int(2, 4);
        for (let i = 0; i < n; i++) {
          const h = rng.range(maxH * 0.15, maxH * 0.42) * (0.4 + hilly);
          addRoad(12, 10, 12, 0, h);
          addRoad(12, 10, 12, 0, -h);
        }
      } else if (r < pStraight + 0.83) {
        const c = rng.range(maxC * 0.6, maxC);
        addRoad(8, rng.int(8, 14), 8, dir * c, 0);
        addRoad(8, rng.int(8, 14), 8, -dir * c, 0);
      } else {
        const c = dir * Math.min(maxC * 1.12, 7.4);
        addRoad(rng.int(20, 30), rng.int(35, 75), rng.int(20, 30), c, hill());
      }
      countTurn(from);
    }
    // volver a altura 0
    const y = lastY() / SEG;
    if (Math.abs(y) > 0.01) addRoad(40, Math.round(20 + Math.abs(y)), 40, 0, -y);
    addRoad(0, Math.max(60, target - segs.length), 0, 0, 0); // recta de meta (parrilla)
    segs[segs.length - 1].p2.world.y = 0;
    segs.forEach((s, i) => { s.band = Math.floor(i / C.RUMBLE) % 2; });

    const track = {
      def, theme, segments: segs, N: segs.length, length: segs.length * SEG,
      coins: opts.coins !== false,
    };
    track.findSegment = (z) => segs[Math.floor(z / SEG) % segs.length];
    placeScenery(track, U.rng(def.seed * 7 + 3));
    placePickups(track, U.rng(def.seed * 13 + 5), opts);
    track.map = minimap(segs);
    return track;
  };

  function placeScenery(track, rng) {
    const segs = track.segments, N = track.N, th = track.theme;
    const put = (i, name, offset, extra) => { segs[i].sprites.push(Object.assign({ name, offset }, extra || {})); };
    const free = (i, off, minD) => {
      for (let k = Math.max(0, i - 2); k <= Math.min(N - 1, i + 2); k++) {
        const list = segs[k].sprites;
        for (let j = 0; j < list.length; j++) {
          const s = list[j];
          if (s.center) continue;
          if (Math.sign(s.offset) === Math.sign(off) && Math.abs(s.offset - off) < minD) return false;
        }
      }
      return true;
    };
    put(1, 'gantry', 0, { center: true });
    if (th.id === 'kyoto' || th.id === 'fuji') {
      for (let i = 160; i < N - 100; i += th.id === 'kyoto' ? 180 : 320) {
        let ok = true;
        for (let k = i - 5; k < i + 5; k++) if (Math.abs(segs[k].curve) > 1.5) ok = false;
        if (ok) put(i, 'torii', 0, { center: true });
      }
    }
    // chevrones en el exterior de las curvas
    for (let i = 0; i < N; i++) {
      const c = segs[i].curve;
      if (Math.abs(c) >= 2.6 && i % 9 === 0) put(i, c > 0 ? 'chevR' : 'chevL', (c > 0 ? -1 : 1) * 1.3);
    }
    th.scenery.forEach((rule) => {
      const place = (i, sd) => {
        const off = Array.isArray(rule.off) ? rng.range(rule.off[0], rule.off[1]) : rule.off;
        const o = sd * off;
        let name = rng.pick(rule.s);
        if (rule.lr) name += sd < 0 ? 'L' : 'R';
        if (!free(i, o, rule.every ? 0.34 : 0.5)) return;
        put(i, name, o);
      };
      for (let i = 6; i < N - 3; i++) {
        if (rule.every) {
          if ((i + (rule.phase || 0)) % rule.every !== 0) continue;
          if (rule.near && i > rule.near && i < N - rule.near) continue;
          if (rule.both) { place(i, -1); place(i, 1); }
          else place(i, rng() < 0.5 ? -1 : 1);
        } else {
          if (rng() < rule.p) place(i, -1);
          if (rng() < rule.p) place(i, 1);
        }
      }
    });
    // ordenar de fuera hacia dentro para el pintado
    segs.forEach((s) => s.sprites.sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset)));
  }

  function placePickups(track, rng, opts) {
    const segs = track.segments, N = track.N;
    const calm = (i) => {
      for (let k = i - 12; k < i + 40; k++) if (Math.abs(segs[((k % N) + N) % N].curve) > 3.2) return false;
      return true;
    };
    const lanes = [-0.62, 0, 0.62];
    const add = (i, type, x) => segs[((i % N) + N) % N].pickups.push({ type, x, taken: [-99, -99], spin: rng() * 6 });
    const spot = (frac) => {
      const base = Math.floor(N * frac);
      for (let d = 0; d < N * 0.2; d += 5) {
        for (const s of [1, -1]) {
          const i = base + s * d;
          if (i > 70 && i < N - 90 && calm(i)) return i;
        }
      }
      return base;
    };
    if (opts.fuel !== false) [0.3, 0.72].forEach((f) => add(spot(f), 'fuel', rng.pick(lanes)));
    add(spot(0.52), 'nitro', rng.pick(lanes));
    if (opts.coins !== false) {
      [0.14, 0.42, 0.62, 0.86].forEach((f) => {
        const i = spot(f);
        let lane = rng.int(0, 2);
        for (let k = 0; k < 6; k++) {
          if (k === 3 && rng() < 0.5) lane = U.clamp(lane + (rng() < 0.5 ? -1 : 1), 0, 2);
          add(i + k * 6, 'coin', lanes[lane]);
        }
      });
    }
  }

  function minimap(segs) {
    const N = segs.length;
    let H = 0;
    for (let i = 0; i < N; i++) H += segs[i].curve / C.SEG;
    const target = (H >= 0 ? 1 : -1) * Math.PI * 2;
    const corr = (target - H) / N;
    const pts = new Float32Array(N * 2);
    let th = 0, x = 0, y = 0;
    for (let i = 0; i < N; i++) {
      pts[i * 2] = x; pts[i * 2 + 1] = y;
      th += segs[i].curve / C.SEG + corr;
      x += Math.sin(th); y -= Math.cos(th);
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < N; i++) {
      const t = i / N;
      pts[i * 2] -= x * t; pts[i * 2 + 1] -= y * t;
      minX = Math.min(minX, pts[i * 2]); maxX = Math.max(maxX, pts[i * 2]);
      minY = Math.min(minY, pts[i * 2 + 1]); maxY = Math.max(maxY, pts[i * 2 + 1]);
    }
    const span = Math.max(maxX - minX, maxY - minY) || 1;
    for (let i = 0; i < N; i++) {
      pts[i * 2] = (pts[i * 2] - (minX + maxX) / 2) / span;
      pts[i * 2 + 1] = (pts[i * 2 + 1] - (minY + maxY) / 2) / span;
    }
    return { pts, w: (maxX - minX) / span, h: (maxY - minY) / span };
  }
})(window.TG);
