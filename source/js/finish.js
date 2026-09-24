'use strict';
/* ============================================================
   Vista panorámica 360° al cruzar la meta
   ------------------------------------------------------------
   Escena 3D real (no pseudo-3D) alrededor del coche parado tras la
   línea de meta: la cámara da una vuelta completa mientras el público
   celebra. Se reutiliza la cámara del coche 3D (misma proyección que
   Car3D.draw) y el decorado real del circuito junto a la meta.
   Unidades: 1 = largo del coche; x derecha, y arriba, z hacia delante.
   ============================================================ */
(function (TG) {
  const U = TG.U, C = TG.C, Art = TG.Art, C3 = TG.Car3D;
  const F = (TG.Finish = {});
  const NEAR = 0.06;
  F.DELAY = 0.45;  // segundos tras cruzar la meta hasta que empieza la vista
  F.DUR = 7.5;     // una vuelta completa
  const V_CL = 1.8;      // velocidad del coche en la escena (largos de coche por segundo)
  const START = -2.4;    // la escena empieza con el coche justo antes de la línea de meta

  /* ---------------- Escena ---------------- */
  // Todo se sitúa respecto a la línea de meta; el coche avanza y el decorado real del circuito pasa a su lado
  function build(race, p) {
    const CU = TG.Render.CAR_UNITS;
    return { CU, RWc: C.ROAD_W / CU, xr: -U.clamp(p.x, -0.75, 0.75) * (C.ROAD_W / CU), fw: [], fwT: 0.3 };
  }
  function gather(race, sc, carRel) {
    const T = race.track, N = T.N, SEG = C.SEG, CU = sc.CU, xr = sc.xr;
    const objs = [];
    const d0 = Math.floor((carRel * CU) / SEG);
    for (let d = d0 - 45; d <= d0 + 70; d++) {
      const seg = T.segments[((d % N) + N) % N];
      const z = (d * SEG) / CU - carRel + 0.06;
      for (let j = 0; j < seg.sprites.length; j++) {
        const sp = seg.sprites[j];
        const def = race.sprites[sp.name];
        if (!def || (sp.broken && sp.broken.kind === 'shatter')) continue;
        const w = def.w / CU, h = w * def.aspect;
        const ax = def.ax != null ? def.ax : sp.offset < 0 ? 1 : 0;
        const x0 = xr + (sp.offset * C.ROAD_W) / CU - ax * w;
        let kind = 'bill';
        if (sp.center || def.center || /^(board|neon|chev)/.test(sp.name)) kind = 'perp';
        else if (/^(crowd|stand|bld|tower|house|fence|wall|hut|kiosk|tires)/.test(sp.name)) kind = 'par';
        objs.push({ kind, def, sp, x0, x1: x0 + w, xc: x0 + w / 2, z, w, h, side: Math.sign(sp.offset) || 1, crowd: /^(crowd|stand)/.test(sp.name) });
      }
    }
    return objs;
  }

  /* ---------------- Cámara (idéntica a la de Car3D.draw) ---------------- */
  function camera(view, th) {
    const cph = Math.cos(view.pitch), sph = Math.sin(view.pitch), D = view.dist;
    const Cy = 0.1 + D * sph, Cz = 0.45 - D * cph;
    const zcA = Cy * sph - Cz * cph;
    const syA = -(-Cy * cph - Cz * sph) / zcA;
    const k = view.ppl * zcA;
    const ct = Math.cos(th), st = Math.sin(th);
    return {
      k, pitch: view.pitch, ox: view.x, oy: view.y, syA,
      // mundo (girado con la órbita) → cámara
      cam(x, y, z, o) {
        const rz = z - 0.5;
        const wx = ct * x + st * rz, wz = -st * x + ct * rz + 0.5;
        const dy = y - Cy, dz = wz - Cz;
        o[0] = wx; o[1] = dy * cph + dz * sph; o[2] = -dy * sph + dz * cph;
        return o;
      },
      scr(o, out) { out[0] = view.x + (o[0] / o[2]) * k; out[1] = view.y + (-o[1] / o[2] - syA) * k; return out; },
    };
  }

  // recorta un polígono (en coordenadas de cámara) contra el plano cercano
  const CL = [];
  function clipNear(pts, n) {
    CL.length = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const ain = a[2] >= NEAR, bin = b[2] >= NEAR;
      if (ain) CL.push(a);
      if (ain !== bin) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        CL.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
      }
    }
    return CL;
  }
  const TMP = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], SP = [0, 0];
  function quad(ctx, cam, x0, y0, z0, x1, y1, z1, x2, y2, z2, x3, y3, z3, col) {
    cam.cam(x0, y0, z0, TMP[0]); cam.cam(x1, y1, z1, TMP[1]); cam.cam(x2, y2, z2, TMP[2]); cam.cam(x3, y3, z3, TMP[3]);
    if (TMP[0][2] < NEAR && TMP[1][2] < NEAR && TMP[2][2] < NEAR && TMP[3][2] < NEAR) return;
    const pts = clipNear(TMP, 4);
    if (pts.length < 3) return;
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      cam.scr(pts[i], SP);
      if (i === 0) ctx.moveTo(SP[0], SP[1]); else ctx.lineTo(SP[0], SP[1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  // imagen sobre un rectángulo vertical en 3D (en franjas con transformación afín)
  const Q = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], QS = [[0, 0], [0, 0], [0, 0]];
  function texQuad(ctx, cam, img, ax, az, bx, bz, h, strips, alpha) {
    const W = img.width, H = img.height;
    for (let s = 0; s < strips; s++) {
      const u0 = s / strips, u1 = (s + 1) / strips;
      const xa = ax + (bx - ax) * u0, za = az + (bz - az) * u0;
      const xb = ax + (bx - ax) * u1, zb = az + (bz - az) * u1;
      cam.cam(xa, h, za, Q[0]); cam.cam(xb, h, zb, Q[1]); cam.cam(xa, 0, za, Q[2]);
      if (Q[0][2] < NEAR || Q[1][2] < NEAR || Q[2][2] < NEAR) continue;
      cam.scr(Q[0], QS[0]); cam.scr(Q[1], QS[1]); cam.scr(Q[2], QS[2]);
      const sw = W * (u1 - u0), sx0 = W * u0;
      const a = (QS[1][0] - QS[0][0]) / sw, b = (QS[1][1] - QS[0][1]) / sw;
      const c = (QS[2][0] - QS[0][0]) / H, d = (QS[2][1] - QS[0][1]) / H;
      if (!isFinite(a + b + c + d)) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.transform(a, b, c, d, QS[0][0] - a * sx0, QS[0][1] - b * sx0);
      ctx.beginPath(); ctx.rect(sx0 - (s ? 0.8 : 0), 0, sw + (s < strips - 1 ? 1.6 : 0), H); ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
  }

  /* ---------------- Dibujo ---------------- */
  F.draw = function (ctx, race, v, vw, vh, dt) {
    const fin = v.fin;
    const p = v.player;
    if (!fin.scene) fin.scene = build(race, p);
    const sc = fin.scene, th = race.theme;
    const t = fin.t - F.DELAY;
    // órbita: una vuelta completa y después sigue girando despacio
    const u = U.clamp(t / F.DUR, 0, 1);
    const e = U.easeInOutCubic(u);
    const ang = e * Math.PI * 2 + Math.max(0, t - F.DUR) * 0.28;
    const lift = Math.sin(Math.PI * e);
    const view = {
      x: vw / 2, y: vh * (0.7 - 0.04 * lift),
      ppl: Math.min(vh * 0.62, vw * 0.42) * (1 + 0.1 * lift),
      pitch: 0.13 + 0.12 * lift, dist: 2.7 - 0.5 * lift,
    };
    const cam = camera(view, ang);
    const k = cam.k;
    // el ganador sigue rodando: posición respecto a la meta (en largos de coche)
    const carRel = START + V_CL * Math.max(0, t);
    const objs = gather(race, sc, carRel);
    const horizon = view.y + (-Math.tan(view.pitch) - cam.syA) * k;

    // --- cielo y fondo panorámico (gira con la cámara)
    const hz0 = Math.round(vh * 0.45);
    ctx.drawImage(Art.sky(th, vw, vh, hz0), 0, horizon - hz0);
    if (horizon - hz0 > 0) { ctx.fillStyle = th.sky[0]; ctx.fillRect(0, 0, vw, horizon - hz0 + 1); }
    const full = Math.PI * 2 * k;                          // píxeles por vuelta completa
    const offPx = (ang / (Math.PI * 2)) * full;
    const body = th.sun || th.moon;
    if (body) {
      let bx = vw / 2 + (((body.x - 0.5) * 1.4 * k - offPx) % full + full * 1.5) % full - full / 2;
      const by = horizon - (horizon * (1 - body.y)) * 0.9, r = vh * body.r;
      if (bx > -r * 6 && bx < vw + r * 6) {
        ctx.fillStyle = U.rad(ctx, bx, by, 0, r * 6, [0, U.rgba(body.glow || body.c, 0.45), 1, U.rgba(body.glow || body.c, 0)]);
        ctx.fillRect(bx - r * 6, by - r * 6, r * 12, r * 12);
        ctx.fillStyle = body.c; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    const Ls = race.layers;
    for (let i = 0; i < Ls.length; i++) {
      const Ly = Ls[i];
      const dh = vh * Ly.h;
      let dw = Ly.img.width * (dh / Ly.img.height);
      const n = Math.max(1, Math.round(full / dw)); dw = full / n;   // encaja justo en 360°
      const x0 = -((((offPx * Ly.par) % dw) + dw) % dw);
      for (let x = x0; x < vw; x += dw) ctx.drawImage(Ly.img, x, horizon - dh + 1, dw + 1, dh);
    }
    // --- suelo
    const gFar = U.mix(th.grass[0], th.fog, 0.85);
    ctx.fillStyle = U.lin(ctx, 0, horizon, 0, vh, [0, gFar, 0.25, U.mix(th.grass[0], th.fog, 0.35), 1, th.grass[0]]);
    ctx.fillRect(0, horizon, vw, vh - horizon + 1);
    ctx.fillStyle = U.lin(ctx, 0, horizon - vh * 0.05, 0, horizon + 2, [0, U.rgba(th.fog, 0), 1, U.rgba(th.fog, 0.85)]);
    ctx.fillRect(0, horizon - vh * 0.05, vw, vh * 0.05 + 2);

    const RW = sc.RWc, xr = sc.xr, Z0 = -32, Z1 = 55, band = (C.RUMBLE * C.SEG) / sc.CU;
    const zo = -carRel;   // desplazamiento del mundo respecto al coche
    const fogC = (col, z) => U.mix(col, th.fog, U.clamp(Math.abs(z) / 60, 0, 1) * 0.85);
    // arcén
    if (th.shoulder) {
      const w = th.shoulder.w * RW;
      [-1, 1].forEach((s) => {
        for (let z = Z0; z < Z1; z += 4) {
          const xa = xr + s * RW * 1.12, xb = xr + s * (RW * 1.12 + w);
          quad(ctx, cam, xa, 0, z, xb, 0, z, xb, 0, z + 4, xa, 0, z + 4, fogC(th.shoulder.c[0], z));
        }
      });
    }
    // calzada
    for (let z = Z0; z < Z1; z += 3) quad(ctx, cam, xr - RW, 0, z, xr + RW, 0, z, xr + RW, 0, z + 3, xr - RW, 0, z + 3, fogC(th.road[0], z + 1.5));
    // pianos y líneas (se desplazan: el coche avanza)
    let bi = Math.floor((Z0 - zo) / band);
    for (let z = bi * band + zo; z < Z1; z += band, bi++) {
      const col = fogC(th.rumble[((bi % 2) + 2) % 2], z);
      [-1, 1].forEach((s) => {
        const xa = xr + s * RW, xb = xr + s * RW * 1.12;
        quad(ctx, cam, xa, 0, z, xb, 0, z, xb, 0, z + band, xa, 0, z + band, col);
      });
      const lc = fogC(th.lane, z);
      [-1, 1].forEach((s) => {
        const xe = xr + s * RW * 0.92, xe2 = xr + s * RW * 0.95;
        quad(ctx, cam, xe, 0.001, z, xe2, 0.001, z, xe2, 0.001, z + band, xe, 0.001, z + band, fogC(th.edge, z));
        if (bi % 2 === 0) {
          const xl = xr + (s * RW) / 3, lw = RW * 0.022;
          quad(ctx, cam, xl - lw, 0.001, z, xl + lw, 0.001, z, xl + lw, 0.001, z + band, xl - lw, 0.001, z + band, lc);
        }
      });
    }
    const cz = zo, cn = 14, cw = (RW * 2) / cn, ch = 0.12;
    for (let r = 0; r < 2; r++) for (let i = 0; i < cn; i++) {
      const xa = xr - RW + i * cw;
      quad(ctx, cam, xa, 0.002, cz + r * ch, xa + cw, 0.002, cz + r * ch, xa + cw, 0.002, cz + (r + 1) * ch, xa, 0.002, cz + (r + 1) * ch, (i + r) % 2 ? '#15171c' : '#f4f4f4');
    }

    // --- objetos y coche, de lejos a cerca
    const items = [];
    const O = [0, 0, 0];
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (o.kind === 'par') cam.cam(o.xc, o.h * 0.5, o.z, O);
      else if (o.kind === 'perp') cam.cam(o.xc, o.h * 0.5, o.z, O);
      else cam.cam(o.xc, o.h * 0.5, o.z, O);
      if (O[2] < NEAR * 2 || O[2] > 70) continue;
      items.push({ d: O[2], o });
    }
    cam.cam(0, 0.12, 0.5, O);
    const carD = O[2];
    items.push({ d: carD, car: true });
    items.sort((a, b) => b.d - a.d);
    const Rt = TG.Render.t;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.car) { drawCar(ctx, race, p, view, ang, t); continue; }
      const o = it.o, def = o.def;
      // lo que queda entre la cámara y el coche no se dibuja (o se ve muy transparente) para no taparlo
      let alpha = 1;
      if (it.d < carD - 0.2) {
        if (o.kind !== 'bill') continue;
        alpha = U.clamp((it.d - 0.6) / 1.6, 0, 0.55);
        if (alpha <= 0.02) continue;
      }
      const img = def.img2 && ((Rt * (def.fps || 2.4) + (o.sp.ph || 0)) % 2) >= 1 ? def.img2 : def.img;
      const fogA = U.clamp(it.d / 60, 0, 1) * 0.85;
      if (o.kind === 'bill') {
        // siempre de cara a la cámara
        cam.cam(o.xc, 0, o.z, O);
        if (O[2] < NEAR) continue;
        cam.scr(O, SP);
        const w = (o.w * k) / O[2], h = (o.h * k) / O[2];
        if (w < 1 || SP[0] + w / 2 < 0 || SP[0] - w / 2 > vw) continue;
        const fell = o.sp.broken && o.sp.broken.kind === 'fall';
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(SP[0], SP[1]);
        if (fell) ctx.rotate(o.side * 1.42);
        ctx.drawImage(img, -w / 2, -h, w, h);
        if (fogA > 0.04 && def.sil) { ctx.globalAlpha = fogA * alpha; ctx.drawImage(def.sil, -w / 2, -h, w, h); }
        ctx.restore();
        continue;
      }
      if (o.kind === 'perp') texQuad(ctx, cam, img, o.x0, o.z, o.x1, o.z, o.h, 6, 1);
      else {
        // paralelo a la carretera, mirando hacia ella
        const L = Math.min(o.w, 3.4);
        if (o.side > 0) texQuad(ctx, cam, img, o.xc, o.z + L / 2, o.xc, o.z - L / 2, o.h, 6, 1);
        else texQuad(ctx, cam, img, o.xc, o.z - L / 2, o.xc, o.z + L / 2, o.h, 6, 1);
        // flashes de cámaras entre el público
        if (o.crowd && Math.random() < dt * 5) {
          const zz = o.z + U.rand(-0.45, 0.45) * L;
          cam.cam(o.xc, o.h * U.rand(0.35, 0.75), zz, O);
          if (O[2] > NEAR) { cam.scr(O, SP); const r = (0.5 * k) / O[2]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(Art.glow('#ffffff'), SP[0] - r, SP[1] - r, r * 2, r * 2); ctx.restore(); }
        }
      }
      if (fogA > 0.04 && def.sil && o.kind !== 'bill') { /* la niebla del fondo ya los atenúa */ }
    }

    // --- fuegos artificiales y confeti para el ganador
    const win = p.finishPos === 1 && race.mode !== 'time';
    if (win) fireworks(ctx, sc, vw, horizon, dt);
    TG.Render.particles(ctx, race, v, dt, vw, vh);
    // --- postproceso ligero y textos
    if (th.grade) { ctx.globalAlpha = th.grade.a; ctx.globalCompositeOperation = th.grade.op; ctx.fillStyle = th.grade.c; ctx.fillRect(0, 0, vw, vh); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    ctx.drawImage(TG.Render.vignette(vw, vh), 0, 0);
    overlay(ctx, race, p, vw, vh, t, win);
    // transición desde la carrera
    if (t < 0.35) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.35).toFixed(3) + ')'; ctx.fillRect(0, 0, vw, vh); }
  };

  // El sol queda fijo respecto al escenario mientras la cámara da la vuelta: la luz gira con el mundo
  function rotEnv(env, ang) {
    const c = Math.cos(ang), s = Math.sin(ang), L = env.L;
    return Object.assign({}, env, { L: [c * L[0] + s * L[2], L[1], -s * L[0] + c * L[2]] });
  }

  function drawCar(ctx, race, p, view, ang, t) {
    const tt = Math.max(0, t);
    const spin = Math.min(V_CL / (p.c3.wr || 0.08), 15) * tt;
    const env = rotEnv(race.env3d, ang);
    const pose = { yaw: ang, roll: 0.006 * Math.sin(tt * 2.1), pitch: 0, heave: 0.002 * Math.sin(tt * 7), steer: 0.06 * Math.sin(tt * 0.9), spin };
    // modelo de Blender (WebGL) si el coche lo tiene; si no, el coche 3D en Canvas
    if (p.gl && TG.CarGL) {
      C3.draw(ctx, p.model, null, env, pose, { x: view.x, y: view.y, ppl: view.ppl, pitch: view.pitch, dist: view.dist, lod: 1, shadow: 0.75, shadowOnly: true });
      TG.CarGL.drawCar(ctx, p.model.id, p.gl.colors, env, Object.assign({ dmg: p.dmg, seed: p.seed, noWing: p.lostWing }, pose),
        { x: view.x, y: view.y, ppl: view.ppl, pitch: view.pitch, dist: view.dist, lift: 0 },
        { alpha: 1, shadow: 0.6, brake: false, night: race.theme.ambient < 0.75 });
      return;
    }
    // ruedas girando (velocidad angular limitada para que se vea rodar) y un leve vaivén de la dirección
    C3.draw(ctx, p.model, p.c3.tex, env,
      Object.assign({ blur: 0.35, dmg: p.dmg, seed: p.seed, noWing: p.lostWing }, pose),
      { x: view.x, y: view.y, ppl: view.ppl, pitch: view.pitch, dist: view.dist, lod: 0, shadow: 0.75 });
  }

  function fireworks(ctx, sc, vw, horizon, dt) {
    sc.fwT -= dt;
    if (sc.fwT <= 0) {
      sc.fwT = U.rand(0.35, 0.8);
      const col = U.pick(['#ffd21f', '#ff3c8e', '#7fcbe8', '#46d98a', '#ff7a1a', '#ffffff']);
      const x = U.rand(vw * 0.1, vw * 0.9), y = U.rand(horizon * 0.15, horizon * 0.6);
      const n = 34;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, s = U.rand(0.7, 1) * horizon * 0.28;
        sc.fw.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.3, col });
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = Art.glow;
    for (let i = sc.fw.length - 1; i >= 0; i--) {
      const f = sc.fw[i];
      f.life -= dt;
      if (f.life <= 0) { sc.fw[i] = sc.fw[sc.fw.length - 1]; sc.fw.pop(); continue; }
      f.x += f.vx * dt; f.y += f.vy * dt; f.vy += horizon * 0.2 * dt; f.vx *= 0.985; f.vy *= 0.985;
      const r = 3 + 9 * f.life;
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.drawImage(g(f.col), f.x - r, f.y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  const FD = '"DIN Alternate", "DIN Condensed", Bahnschrift, "Roboto Condensed", "Arial Narrow", sans-serif';
  const FT = '"Avenir Next Condensed", "Futura", Bahnschrift, "Arial Narrow", sans-serif';
  function overlay(ctx, race, p, vw, vh, t, win) {
    const s = Math.min(vh / 720, vw / 1280) * (race.views.length > 1 ? 1.2 : 1);
    const a = U.clamp((t - 0.2) / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const title = race.mode === 'time' ? '¡META!' : win ? '¡VICTORIA!' : p.finishPos + 'º PUESTO';
    ctx.font = 'italic 800 ' + Math.round(68 * s) + 'px ' + FT;
    ctx.lineWidth = 8 * s; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.strokeText(title, vw / 2, vh * 0.15);
    ctx.fillStyle = win ? '#ffd21f' : '#f3f5f8';
    ctx.fillText(title, vw / 2, vh * 0.15);
    ctx.font = '700 ' + Math.round(22 * s) + 'px ' + FD;
    const sub = p.model.brand.toUpperCase() + ' ' + p.model.name.toUpperCase() + '  ·  ' + U.time(p.finishTime) + (p.bestLap ? '  ·  MEJOR VUELTA ' + U.time(p.bestLap) : '');
    ctx.strokeText(sub, vw / 2, vh * 0.15 + 50 * s);
    ctx.fillStyle = '#f3f5f8'; ctx.fillText(sub, vw / 2, vh * 0.15 + 50 * s);
    if (t > 1.2) {
      ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(TG.Render.t * 3));
      ctx.font = '700 ' + Math.round(16 * s) + 'px ' + FD;
      ctx.fillStyle = '#f3f5f8';
      ctx.fillText('INTRO  ·  CONTINUAR', vw / 2, vh * 0.94);
    }
    ctx.restore();
  }
})(window.TG);
