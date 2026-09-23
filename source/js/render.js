'use strict';
/* ============================================================
   Renderizador pseudo-3D
   ============================================================ */
(function (TG) {
  const U = TG.U, C = TG.C, Art = TG.Art;
  const R = (TG.Render = { t: 0, carSegs: [], carCache: new Map(), tintCache: new Map() });

  R.init = function (canvas) {
    R.canvas = canvas;
    R.ctx = canvas.getContext('2d', { alpha: false });
    R.resize();
    window.addEventListener('resize', () => { clearTimeout(R._rz); R._rz = setTimeout(R.resize, 80); });
  };
  R.quality = () => TG.Save.data.settings.quality || 'high';
  R.qScale = () => ({ low: 0.6, medium: 0.8, high: 1, ultra: 1.25 }[R.quality()] || 1);
  R.resize = function () {
    const cap = { low: 0.75, medium: 1, high: 1.5, ultra: 2 }[R.quality()] || 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    R.dpr = dpr;
    R.W = Math.max(320, Math.round(window.innerWidth * dpr));
    R.H = Math.max(200, Math.round(window.innerHeight * dpr));
    R.canvas.width = R.W;
    R.canvas.height = R.H;
    R.vig = {};
    R.drawDist = C.DRAW[R.quality()] || 300;
  };

  R.carSprites = function (model, color, w, light, shade) {
    const key = model.id + color + w + '|' + light + shade;
    let s = R.carCache.get(key);
    if (s) return s;
    if (R.carCache.size > 70) R.carCache.clear();
    s = {
      L: Art.carRear(model, color, { w, flank: -0.7, light, shade }),
      C: Art.carRear(model, color, { w, flank: 0, light, shade }),
      R: Art.carRear(model, color, { w, flank: 0.7, light, shade }),
    };
    R.carCache.set(key, s);
    return s;
  };

  R.prepare = function (race) {
    const q = R.qScale();
    race.sprites = Art.themeSprites(race.theme, q);
    race.layers = Art.layers(race.theme, q);
    const light = race.theme.ambient, shade = race.theme.shade;
    const baseW = Math.round(380 * q + 80);
    race.cars.forEach((car) => {
      const w = car.isPlayer ? Math.round(baseW * 1.55) : baseW;
      car.spr = R.carSprites(car.model, car.color, w, light, shade);
    });
    if (race.ghostCar) race.ghostCar.spr = R.carSprites(race.ghostCar.model, race.ghostCar.color, baseW, light, shade);
    race.views.forEach((v) => { v.parts = []; v.rain = null; v.snow = null; v.skyOff = 0; v.flash = 0; v.nextBolt = 6 + Math.random() * 8; });
    R.drawDist = C.DRAW[R.quality()] || 300;
  };

  R.palette = function (theme) {
    if (R._pal && R._pal.id === theme.id) return R._pal;
    const ramp = (c) => { const a = []; for (let i = 0; i < 64; i++) a.push(U.mix(c, theme.fog, i / 63)); return a; };
    R._pal = {
      id: theme.id,
      grass: [ramp(theme.grass[0]), ramp(theme.grass[1])],
      road: [ramp(theme.road[0]), ramp(theme.road[1])],
      rumble: [ramp(theme.rumble[0]), ramp(theme.rumble[1])],
      edge: ramp(theme.edge), lane: ramp(theme.lane),
      shoulder: theme.shoulder ? [ramp(theme.shoulder.c[0]), ramp(theme.shoulder.c[1])] : null,
      check: [ramp('#f4f4f4'), ramp('#15171c')],
    };
    return R._pal;
  };

  R.tinted = function (img, color) {
    const key = color;
    let t = R.tintCache.get(key);
    if (t) return t;
    t = U.canvas(img.width, img.height);
    const c = t.getContext('2d');
    c.drawImage(img, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = color;
    c.fillRect(0, 0, t.width, t.height);
    R.tintCache.set(key, t);
    return t;
  };

  function poly4(ctx, x1, y1, x2, y2, x3, y3, x4, y4, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function proj(p, cx, cy, cz, depth, vw, horizon, K) {
    const c = p.camera, s = p.screen;
    c.x = -cx; c.y = p.world.y - cy; c.z = p.world.z - cz;
    const sc = depth / c.z;
    s.scale = sc;
    s.x = vw / 2 + sc * c.x * K;
    s.y = Math.round(horizon - sc * c.y * K);
    s.w = sc * C.ROAD_W * K;
  }

  R.segment = function (ctx, vw, seg, maxy, pal, theme) {
    const s1 = seg.p1.screen, s2 = seg.p2.screen;
    let x1 = s1.x, y1 = s1.y, w1 = s1.w;
    const x2 = s2.x, y2 = s2.y, w2 = s2.w;
    if (y1 > maxy) {
      const t = (y1 - maxy) / (y1 - y2);
      x1 += (x2 - x1) * t; w1 += (w2 - w1) * t; y1 = maxy;
    }
    const f = seg.fogI, b = seg.band;
    ctx.fillStyle = pal.grass[b][f];
    ctx.fillRect(0, y2, vw, y1 - y2);
    const r1 = w1 * 0.12, r2 = w2 * 0.12;
    if (pal.shoulder) {
      const k = 1.12 + theme.shoulder.w;
      const col = pal.shoulder[b][f];
      poly4(ctx, x1 - w1 * k, y1, x1 - w1 - r1, y1, x2 - w2 - r2, y2, x2 - w2 * k, y2, col);
      poly4(ctx, x1 + w1 * k, y1, x1 + w1 + r1, y1, x2 + w2 + r2, y2, x2 + w2 * k, y2, col);
    }
    const rc = pal.rumble[b][f];
    poly4(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, rc);
    poly4(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, rc);
    if (seg.index <= 1) {
      // línea de salida a cuadros
      const n = 14;
      for (let i = 0; i < n; i++) {
        const t0 = -1 + (2 * i) / n, t1 = -1 + (2 * (i + 1)) / n;
        poly4(ctx, x1 + w1 * t0, y1, x1 + w1 * t1, y1, x2 + w2 * t1, y2, x2 + w2 * t0, y2, pal.check[(i + seg.index) % 2][f]);
      }
      return;
    }
    poly4(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, pal.road[b][f]);
    if (w1 > 30) {
      const e1 = w1 * 0.03, e2 = w2 * 0.03, o1 = w1 * 0.05, o2 = w2 * 0.05;
      const ec = pal.edge[f];
      poly4(ctx, x1 - w1 + o1, y1, x1 - w1 + o1 + e1, y1, x2 - w2 + o2 + e2, y2, x2 - w2 + o2, y2, ec);
      poly4(ctx, x1 + w1 - o1, y1, x1 + w1 - o1 - e1, y1, x2 + w2 - o2 - e2, y2, x2 + w2 - o2, y2, ec);
      if (b === 1) {
        const l1 = w1 * 0.022, l2 = w2 * 0.022, lc = pal.lane[f];
        for (let k = -1; k <= 1; k += 2) {
          const c1 = x1 + (w1 * k) / 3, c2 = x2 + (w2 * k) / 3;
          poly4(ctx, c1 - l1, y1, c1 + l1, y1, c2 + l2, y2, c2 - l2, y2, lc);
        }
      }
    }
  };

  R.sprite = function (ctx, def, x, y, w, h, clipY, fogA) {
    let clipH = 0;
    if (y + h > clipY) clipH = y + h - clipY;
    if (clipH >= h) return false;
    const img = def.img;
    const k = 1 - clipH / h;
    ctx.drawImage(img, 0, 0, img.width, img.height * k, x, y, w, h - clipH);
    if (fogA > 0.04 && def.sil) {
      ctx.globalAlpha = Math.min(1, fogA);
      ctx.drawImage(def.sil, 0, 0, def.sil.width, def.sil.height * k, x, y, w, h - clipH);
      ctx.globalAlpha = 1;
    }
    return clipH === 0;
  };

  R.clearCars = function (race) {
    for (let i = 0; i < R.carSegs.length; i++) R.carSegs[i].cars.length = 0;
    R.carSegs.length = 0;
    const T = race.track;
    for (let i = 0; i < race.cars.length; i++) {
      const car = race.cars[i];
      const s = T.findSegment(car.z);
      if (s.cars.length === 0) R.carSegs.push(s);
      s.cars.push(car);
    }
    const g = race.ghostCar;
    if (g && g.visible && g.spr) {
      const s = T.findSegment(g.z);
      if (s.cars.length === 0) R.carSegs.push(s);
      s.cars.push(g);
    }
    for (let i = 0; i < R.carSegs.length; i++) if (R.carSegs[i].cars.length > 1) R.carSegs[i].cars.sort((a, b) => b.z - a.z);
  };

  R.frame = function (race, dt) {
    R.t += dt;
    const ctx = R.ctx, W = R.W, H = R.H;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    R.clearCars(race);
    if (race.views.length === 1) R.view(race, race.views[0], 0, 0, W, H, dt);
    else {
      const h2 = Math.floor(H / 2);
      R.view(race, race.views[0], 0, 0, W, h2, dt);
      R.view(race, race.views[1], 0, H - h2, W, h2, dt);
      ctx.fillStyle = '#0f1116';
      ctx.fillRect(0, h2 - 3 * R.dpr, W, H - 2 * h2 + 6 * R.dpr);
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(0, H / 2 - R.dpr, W, 2 * R.dpr);
    }
  };

  R.view = function (race, v, vx, vy, vw, vh, dt) {
    const ctx = R.ctx;
    const T = race.track, theme = race.theme, segs = T.segments, N = T.N, L = T.length;
    const p = v.player, cam = v.cam;
    const depth = 1 / Math.tan(((cam.fov / 2) * Math.PI) / 180);
    const K = Math.min(vh * 0.5, vw * 0.32);
    const horizon = Math.round(vh * C.HORIZON);
    const playerZ = cam.h * depth * C.CAM_DIST + cam.extra;
    const camZ = U.increase(p.z, -playerZ, L);
    const base = T.findSegment(camZ);
    const basePct = U.percentRemaining(camZ, C.SEG);
    const pSeg = T.findSegment(p.z), pPct = U.percentRemaining(p.z, C.SEG);
    const roadY = U.lerp(pSeg.p1.world.y, pSeg.p2.world.y, pPct);
    const camY = roadY + cam.h;
    const camX = cam.x * C.ROAD_W;
    const dd = R.drawDist;
    v.K = K; v.horizon = horizon; v.vw = vw; v.vh = vh;
    v.skyOff = (v.skyOff || 0) + pSeg.curve * ((p.speed * dt) / C.SEG) * 0.0016;

    ctx.save();
    ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
    ctx.translate(vx, vy);
    ctx.save();
    if (cam.shake > 0) ctx.translate((Math.random() - 0.5) * cam.shake * vh * 0.018, (Math.random() - 0.5) * cam.shake * vh * 0.018);

    R.background(ctx, race, v, vw, vh, horizon);

    // ---------- carretera
    const pal = R.palette(theme);
    let x = 0, dx = -(base.curve * basePct), maxy = vh;
    const fogD = theme.fogD;
    for (let n = 0; n < dd; n++) {
      const seg = segs[(base.index + n) % N];
      const looped = seg.index < base.index;
      const cz = camZ - (looped ? L : 0);
      seg.fogI = Math.min(63, Math.round((1 - U.expFog(n / dd, fogD)) * 63));
      seg.clip = maxy;
      proj(seg.p1, camX - x, camY, cz, depth, vw, horizon, K);
      proj(seg.p2, camX - x - dx, camY, cz, depth, vw, horizon, K);
      x += dx; dx += seg.curve;
      seg.vis = seg.p1.camera.z > depth;
      if (seg.p1.camera.z <= depth || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;
      R.segment(ctx, vw, seg, maxy, pal, theme);
      maxy = seg.p2.screen.y;
    }

    // ---------- sprites, objetos y coches (de lejos a cerca)
    const night = theme.ambient < 0.75;
    const lampsOn = theme.lamps;
    const wet = theme.wet;
    const fx = Art.fx();
    const glowLamp = Art.glow('#ffd79a');
    const RW = C.ROAD_W;
    for (let n = dd - 1; n > 0; n--) {
      const seg = segs[(base.index + n) % N];
      if (!seg.vis) continue;
      const s1 = seg.p1.screen;
      const scale = s1.scale;
      const fogA = seg.fogI / 63;
      const sprs = seg.sprites;
      for (let i = 0; i < sprs.length; i++) {
        const sp = sprs[i];
        const def = race.sprites[sp.name];
        if (!def) continue;
        const w = def.w * scale * K;
        if (w < 1.2) continue;
        const h = w * def.aspect;
        const ax = def.ax != null ? def.ax : sp.offset < 0 ? 1 : 0;
        const sx = s1.x + scale * sp.offset * RW * K - w * ax;
        if (sx > vw || sx + w < 0) continue;
        const sy = s1.y - h;
        const full = R.sprite(ctx, def, sx, sy, w, h, seg.clip, fogA);
        if (lampsOn && def.light && full && fogA < 0.9) {
          ctx.globalCompositeOperation = 'lighter';
          for (let j = 0; j < def.light.length; j++) {
            const Lt = def.light[j];
            const lx = sx + Lt[0] * w, ly = sy + Lt[1] * h, r = w * 0.32 * Lt[2];
            ctx.globalAlpha = 0.85 * (1 - fogA);
            ctx.drawImage(glowLamp, lx - r, ly - r, r * 2, r * 2);
            if (Lt[3] === 'lamp' && def.ax != null) {
              const pw = w * 0.9, ph = pw * 0.22;
              ctx.globalAlpha = 0.3 * (1 - fogA);
              ctx.drawImage(glowLamp, lx - pw / 2, s1.y - ph / 2, pw, ph);
              if (wet) { ctx.globalAlpha = 0.28 * (1 - fogA); ctx.drawImage(R.tinted(fx.streak, '#ffd79a'), lx - w * 0.03, s1.y, w * 0.06, (s1.y - ly) * 0.8); }
            }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // objetos recogibles
      const pks = seg.pickups;
      for (let i = 0; i < pks.length; i++) {
        const pk = pks[i];
        if (pk.taken[p.pIndex] === p.lapsDone && !race.demo) continue;
        if (race.demo && pk.type !== 'fuel' && pk.type !== 'nitro') continue;
        const def = race.sprites[pk.type];
        if (!def) continue;
        const w = def.w * scale * K;
        if (w < 1.5) continue;
        const h = w * def.aspect;
        const bob = Math.sin(R.t * 3.2 + pk.spin) * h * 0.1;
        const cx = s1.x + scale * pk.x * RW * K;
        const sy = s1.y - h * 1.35 - bob;
        if (sy + h > seg.clip) continue;
        const spin = pk.type === 'coin' ? Math.max(0.12, Math.abs(Math.cos(R.t * 3 + pk.spin))) : 1;
        ctx.globalAlpha = 1 - fogA * 0.8;
        ctx.drawImage(def.img, cx - (w * spin) / 2, sy, w * spin, h);
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.35 * (1 - fogA);
        ctx.drawImage(fx.shadow, cx - w * 0.4, s1.y - w * 0.06, w * 0.8, w * 0.12);
        ctx.globalAlpha = 1;
      }
      // coches
      const cars = seg.cars;
      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        let dz = car.z - camZ;
        if (dz < 0) dz += L;
        if (dz < 340 || dz > dd * C.SEG) continue;
        const s2 = seg.p2.screen;
        const pct = U.percentRemaining(car.z, C.SEG);
        const sc = U.lerp(s1.scale, s2.scale, pct);
        const rx = U.lerp(s1.x, s2.x, pct);
        const ry = U.lerp(s1.y, s2.y, pct);
        const hw = U.lerp(s1.w, s2.w, pct);
        R.car(ctx, race, v, car, rx + car.x * hw, ry, sc * K, seg.clip, fogA, car === p, night, wet, vw, horizon);
      }
    }

    R.particles(ctx, race, v, dt, vw, vh);
    R.weather(ctx, race, v, dt, vw, vh, horizon);
    R.post(ctx, race, v, vw, vh, horizon, dt);
    ctx.restore(); // shake
    if (!race.demo && TG.HUD) TG.HUD.draw(ctx, race, v, vw, vh, dt);
    ctx.restore();
  };

  R.background = function (ctx, race, v, vw, vh, horizon) {
    const theme = race.theme;
    ctx.drawImage(Art.sky(theme, vw, vh, horizon), 0, 0);
    const offPx = v.skyOff * vw * 2;
    const body = theme.sun || theme.moon;
    if (body) {
      const P = vw * 3;
      let sx = body.x * vw - offPx;
      sx = ((sx % P) + P) % P;
      if (sx > vw * 1.6) sx -= P;
      const sy = horizon * body.y;
      const r = vh * body.r;
      if (sx > -vh * 0.6 && sx < vw + vh * 0.6) {
        if (theme.sun) {
          ctx.fillStyle = U.rad(ctx, sx, sy, 0, vh * 0.55, [0, U.rgba(body.glow, (body.a || 0.5) * 0.55), 0.35, U.rgba(body.glow, (body.a || 0.5) * 0.18), 1, U.rgba(body.glow, 0)]);
          ctx.fillRect(sx - vh * 0.55, sy - vh * 0.55, vh * 1.1, vh * 1.1);
          ctx.fillStyle = U.rad(ctx, sx, sy, r * 0.6, r * 2.4, [0, U.rgba('#ffffff', 0.9), 1, U.rgba(body.glow, 0)]);
          ctx.fillRect(sx - r * 2.4, sy - r * 2.4, r * 4.8, r * 4.8);
          ctx.fillStyle = body.c;
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
          v.sunX = sx; v.sunY = sy;
        } else {
          ctx.fillStyle = U.rad(ctx, sx, sy, 0, r * 7, [0, 'rgba(220,235,255,0.35)', 1, 'rgba(220,235,255,0)']);
          ctx.fillRect(sx - r * 7, sy - r * 7, r * 14, r * 14);
          ctx.fillStyle = U.rad(ctx, sx - r * 0.3, sy - r * 0.3, 0, r * 1.2, [0, '#ffffff', 1, body.c]);
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(160,170,190,0.35)';
          [[0.3, -0.2, 0.22], [-0.3, 0.25, 0.16], [0.1, 0.45, 0.12]].forEach((c) => { ctx.beginPath(); ctx.arc(sx + c[0] * r, sy + c[1] * r, c[2] * r, 0, Math.PI * 2); ctx.fill(); });
          v.sunX = null;
        }
      } else v.sunX = null;
    } else v.sunX = null;
    if (theme.aurora) {
      const fx = Art.fx();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) {
        const baseY = horizon * (0.22 + b * 0.13);
        for (let x = 0; x < vw; x += 5 * R.dpr) {
          const t = R.t * 0.25 + b * 2.1;
          const wx = x + offPx * 0.6;
          const y = baseY + Math.sin(wx * 0.0035 + t + b) * horizon * 0.07 + Math.sin(wx * 0.009 - t * 1.4) * horizon * 0.03;
          const h = horizon * (0.16 + 0.1 * Math.sin(wx * 0.005 + t * 0.8));
          ctx.globalAlpha = Math.max(0, 0.12 + 0.1 * Math.sin(wx * 0.012 + t * 2.3)) * (1 - b * 0.25);
          ctx.drawImage(fx.aurora, x, y - h, 5 * R.dpr + 1, h);
        }
      }
      ctx.restore();
    }
    const Ls = race.layers;
    if (Ls.clouds) {
      const img = Ls.clouds.img;
      const dh = vh * 0.32, dw = img.width * (dh / img.height);
      const y = horizon * Ls.clouds.y - dh * 0.5;
      const x0 = -((((offPx * 0.7 + R.t * vw * 0.004) % dw) + dw) % dw);
      for (let x = x0; x < vw; x += dw) ctx.drawImage(img, x, y, dw + 1, dh);
    }
    for (let i = 0; i < Ls.length; i++) {
      const Ly = Ls[i];
      const dh = vh * Ly.h;
      const dw = Ly.img.width * (dh / Ly.img.height);
      const y = horizon - dh + 1;
      const x0 = -((((offPx * Ly.par) % dw) + dw) % dw);
      for (let x = x0; x < vw; x += dw) ctx.drawImage(Ly.img, x, y, dw + 1, dh);
    }
    ctx.fillStyle = U.lin(ctx, 0, horizon - vh * 0.07, 0, horizon + 2, [0, U.rgba(theme.fog, 0), 1, U.rgba(theme.fog, 0.9)]);
    ctx.fillRect(0, horizon - vh * 0.07, vw, vh * 0.07 + 2);
    ctx.fillStyle = theme.fog;
    ctx.fillRect(0, horizon, vw, vh - horizon);
  };

  R.car = function (ctx, race, v, car, cx, cy, sK, clipY, fogA, isView, night, wet, vw, horizon) {
    const imgW = ((C.CAR_W * C.ROAD_W) / 0.88) * sK;
    if (imgW < 2 || !car.spr) return;
    const rel = (cx - vw / 2) / (vw / 2);
    const f = -rel * 1.1 - car.steerVis * 0.5;
    const spr = f > 0.33 ? car.spr.R : f < -0.33 ? car.spr.L : car.spr.C;
    const img = spr.img;
    const dh = imgW * (img.height / img.width);
    const lift = car.air * sK;
    const bounce = car.offroad && car.speed > 200 ? Math.sin(R.t * 45 + car.z) * imgW * 0.008 : Math.sin(R.t * 30 + car.z * 0.01) * imgW * 0.0015 * Math.min(1, car.speed / 3000);
    const x = cx - imgW / 2, y = cy - dh * spr.ground - lift + bounce;
    if (y > clipY) return;
    const fx = Art.fx();
    const alpha = (1 - fogA * 0.85) * (car.ghost ? 0.42 : 1);
    // sombra
    if (!car.ghost) {
      ctx.globalAlpha = 0.6 * alpha * (1 - Math.min(0.6, car.air / 500));
      ctx.drawImage(fx.shadow, cx - imgW * 0.56, cy - imgW * 0.075, imgW * 1.12, imgW * 0.17);
    }
    // faros del coche del jugador (noche)
    if (isView && night && race.theme.headlights) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55;
      const topY = horizon + (cy - horizon) * 0.1;
      const botY = cy - dh * 0.42;
      const bw = imgW * 2.2;
      ctx.drawImage(fx.cone, cx - bw / 2, topY, bw, botY - topY);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = alpha;
    let clipH = 0;
    if (y + dh > clipY) clipH = y + dh - clipY;
    if (isView && clipH === 0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(car.steer * 0.022 + (car.crashT > 0 ? Math.sin(R.t * 50) * 0.02 : 0));
      ctx.drawImage(img, -imgW / 2, -dh * spr.ground - lift + bounce, imgW, dh);
      ctx.restore();
      v.carScreen = { x: cx, y: cy - lift, w: imgW, h: dh, gy: spr.ground, exh: spr.exh.map((E) => [x + E[0] * imgW, y + E[1] * dh]) };
    } else {
      ctx.drawImage(img, 0, 0, img.width, img.height * (1 - clipH / dh), x, y, imgW, dh - clipH);
    }
    ctx.globalAlpha = 1;
    if (clipH > dh * 0.3 || car.ghost) return;
    // luces traseras / freno
    const brake = car.braking;
    if (night || brake) {
      ctx.globalCompositeOperation = 'lighter';
      const g = Art.glow('#ff2438');
      ctx.globalAlpha = (brake ? 0.95 : 0.5) * alpha;
      for (let i = 0; i < spr.lights.length; i++) {
        const Lt = spr.lights[i];
        const lx = x + Lt[0] * imgW, ly = y + Lt[1] * dh, r = Lt[2] * imgW * (brake ? 2.4 : 1.7);
        ctx.drawImage(g, lx - r, ly - r, r * 2, r * 2);
        if (wet && night) {
          ctx.globalAlpha = 0.22 * alpha;
          ctx.drawImage(R.tinted(fx.streak, '#ff3040'), lx - r * 0.2, cy, r * 0.4, imgW * 0.45);
          ctx.globalAlpha = (brake ? 0.95 : 0.5) * alpha;
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    // llamas de nitro
    if (car.nitroT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const gb = Art.glow('#3a8aff');
      for (let i = 0; i < spr.exh.length; i++) {
        const E = spr.exh[i];
        const ex = x + E[0] * imgW, ey = y + E[1] * dh;
        const wid = E[2] * imgW * 2.6;
        const len = imgW * (0.14 + Math.random() * 0.1);
        ctx.globalAlpha = 0.85 * alpha;
        ctx.drawImage(gb, ex - wid * 1.8, ey - wid * 1.8, wid * 3.6, wid * 3.6);
        ctx.drawImage(fx.flame, ex - wid / 2, ey - wid * 0.2, wid, len);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  /* ---------- Partículas ---------- */
  R.spawn = function (v, o) {
    if (v.parts.length > 420) return;
    o.max = o.life;
    v.parts.push(o);
  };
  R.burst = function (v, kind, n) {
    const cs = v.carScreen;
    if (!cs) return;
    const u = cs.w;
    for (let i = 0; i < (n || 20); i++) {
      if (kind === 'spark') R.spawn(v, { k: 'spark', x: cs.x + U.rand(-0.4, 0.4) * u, y: cs.y - cs.h * 0.4, vx: U.rand(-1, 1) * u * 3, vy: U.rand(-1.8, 0.2) * u * 2, g: u * 6, life: U.rand(0.25, 0.6), s: u * 0.01 });
      else if (kind === 'coin') R.spawn(v, { k: 'spark', c: '#ffe066', x: cs.x + U.rand(-0.2, 0.2) * u, y: cs.y - cs.h * 0.6, vx: U.rand(-1, 1) * u * 1.5, vy: U.rand(-2, -0.5) * u, g: u * 3, life: U.rand(0.3, 0.6), s: u * 0.012 });
      else if (kind === 'nitro') R.spawn(v, { k: 'spark', c: '#7fd0ff', x: cs.x + U.rand(-0.3, 0.3) * u, y: cs.y - cs.h * 0.3, vx: U.rand(-1, 1) * u * 1.2, vy: U.rand(0, 1.5) * u, g: u, life: U.rand(0.2, 0.5), s: u * 0.01 });
      else if (kind === 'smoke') R.spawn(v, { k: 'smoke', c: '#e8e8e8', x: cs.x + U.rand(-0.45, 0.45) * u, y: cs.y - u * 0.04, vx: U.rand(-0.5, 0.5) * u, vy: U.rand(0.1, 0.6) * u, life: U.rand(0.5, 1), s: u * 0.3, gr: u * 0.8, a: 0.5 });
      else if (kind === 'confetti') R.spawn(v, { k: 'conf', c: U.pick(['#ff7a1a', '#7fcbe8', '#ffd21f', '#ff3c8e', '#ffffff']), x: U.rand(0, v.vw), y: U.rand(-v.vh * 0.3, 0), vx: U.rand(-40, 40), vy: U.rand(80, 220) * R.dpr, life: U.rand(2.5, 4), s: U.rand(5, 10) * R.dpr, r: U.rand(0, 6) });
    }
  };
  R.particles = function (ctx, race, v, dt, vw, vh) {
    const p = v.player, cs = v.carScreen;
    if (cs && !race.demo && race.phase !== 'intro') {
      const u = cs.w;
      const sp = p.speed / p.st.vmax;
      if ((p.slip > 0.35 && sp > 0.3) || p.spinT > 0 || (race.phase === 'count' && p.rpm > p.model.eng.red * 0.9)) {
        for (let k = -1; k <= 1; k += 2) if (Math.random() < 0.8) R.spawn(v, { k: 'smoke', c: '#e6e6e6', x: cs.x + k * u * 0.33, y: cs.y - u * 0.03, vx: k * u * U.rand(0.1, 0.5), vy: u * U.rand(0.2, 0.6), life: U.rand(0.5, 0.9), s: u * 0.18, gr: u * 0.9, a: 0.45 });
      }
      if (p.offroad && p.speed > 250) {
        const snow = U.lum(race.theme.grass[0]) > 0.72;
        const col = snow ? '#ffffff' : U.shade(race.theme.grass[1], -0.1);
        for (let k = -1; k <= 1; k += 2) R.spawn(v, { k: 'smoke', c: col, x: cs.x + k * u * 0.36, y: cs.y - u * 0.02, vx: k * u * U.rand(0.2, 0.9), vy: u * U.rand(-0.2, 0.4), life: U.rand(0.35, 0.7), s: u * 0.14, gr: u * 0.7, a: 0.7 });
      }
      if (race.theme.wet && sp > 0.35) {
        for (let k = -1; k <= 1; k += 2) if (Math.random() < 0.55 * sp) R.spawn(v, { k: 'smoke', c: '#b8c4d4', x: cs.x + k * u * U.rand(0.25, 0.4), y: cs.y - u * 0.04, vx: k * u * U.rand(0.4, 1.2), vy: u * U.rand(0.4, 1.1), life: U.rand(0.3, 0.5), s: u * 0.2, gr: u * 2.4, a: 0.14 * sp });
      }
      if (p.nitroT > 0 && cs.exh && Math.random() < 0.7) {
        const e = U.pick(cs.exh);
        R.spawn(v, { k: 'spark', c: '#8fd8ff', x: e[0] + U.rand(-2, 2), y: e[1], vx: U.rand(-0.4, 0.4) * u, vy: U.rand(0.8, 1.8) * u, g: u, life: U.rand(0.12, 0.3), s: u * 0.008 });
      }
    }
    const parts = v.parts;
    const fx = Art.fx();
    for (let i = parts.length - 1; i >= 0; i--) {
      const o = parts[i];
      o.life -= dt;
      if (o.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.g) o.vy += o.g * dt;
      if (o.gr) o.s += o.gr * dt;
      const t = o.life / o.max;
      if (o.k === 'smoke') {
        ctx.globalAlpha = (o.a || 0.5) * t;
        const img = R.tinted(fx.smoke, o.c || '#ffffff');
        ctx.drawImage(img, o.x - o.s / 2, o.y - o.s / 2, o.s, o.s);
      } else if (o.k === 'spark') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, t * 1.5);
        ctx.strokeStyle = o.c || '#ffc24a';
        ctx.lineWidth = Math.max(1, o.s);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - o.vx * 0.03, o.y - o.vy * 0.03); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (o.k === 'conf') {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = o.c;
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.r + R.t * 4); ctx.fillRect(-o.s / 2, -o.s / 4, o.s, o.s / 2); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- Clima ---------- */
  R.weather = function (ctx, race, v, dt, vw, vh, horizon) {
    const th = race.theme, p = v.player;
    const sp = Math.min(1.4, p.speed / p.st.vmax);
    if (th.weather === 'rain') {
      if (!v.rain) { v.rain = []; for (let i = 0; i < 170; i++) v.rain.push({ x: Math.random(), y: Math.random(), l: U.rand(0.03, 0.07), s: U.rand(1.1, 1.8) }); }
      ctx.strokeStyle = 'rgba(200,214,236,0.38)';
      ctx.lineWidth = 1.3 * R.dpr;
      ctx.beginPath();
      for (const d of v.rain) {
        d.y += d.s * dt * (1 + sp * 0.6);
        d.x += (d.x - 0.5) * dt * sp * 1.2;
        if (d.y > 1.05 || d.x < -0.05 || d.x > 1.05) { d.y = U.rand(-0.15, 0.1); d.x = U.rand(0, 1); }
        const X = d.x * vw, Y = d.y * vh;
        ctx.moveTo(X, Y);
        ctx.lineTo(X + (d.x - 0.5) * vw * 0.03 * (0.3 + sp), Y + d.l * vh * (1 + sp * 0.4));
      }
      ctx.stroke();
      if (th.time === 'night' || th.time === 'overcast') {
        v.nextBolt -= dt;
        if (v.nextBolt <= 0) { v.flash = 1; v.nextBolt = U.rand(8, 16); if (TG.Audio) setTimeout(() => TG.Audio.play('thunder'), U.rand(400, 1400)); }
      }
    } else if (th.weather === 'snow') {
      if (!v.snow) { v.snow = []; for (let i = 0; i < 140; i++) v.snow.push({ x: Math.random(), y: Math.random(), r: U.rand(1, 3.2), ph: Math.random() * 6, s: U.rand(0.05, 0.14) }); }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      const hz = horizon / vh;
      for (const f of v.snow) {
        const dxc = f.x - 0.5, dyc = f.y - hz;
        f.x += (dxc * sp * 1.4 + Math.sin(R.t * 1.5 + f.ph) * 0.02) * dt;
        f.y += (f.s + Math.max(0, dyc) * sp * 1.2) * dt;
        if (f.y > 1.02 || f.x < -0.02 || f.x > 1.02) { f.x = U.rand(0.1, 0.9); f.y = U.rand(0, hz + 0.1); }
        const r = f.r * R.dpr * (0.6 + Math.max(0, f.y - hz) * 1.5);
        ctx.moveTo(f.x * vw + r, f.y * vh);
        ctx.arc(f.x * vw, f.y * vh, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    if (th.weather === 'fog') {
      ctx.fillStyle = U.lin(ctx, 0, horizon - vh * 0.1, 0, vh, [0, U.rgba(th.fog, 0.55), 0.5, U.rgba(th.fog, 0.18), 1, U.rgba(th.fog, 0.05)]);
      ctx.fillRect(0, horizon - vh * 0.1, vw, vh);
    }
  };

  /* ---------- Postproceso ---------- */
  R.vignette = function (vw, vh) {
    const key = vw + 'x' + vh;
    if (R.vig[key]) return R.vig[key];
    const cv = U.canvas(vw, vh);
    const c = cv.getContext('2d');
    const r = Math.hypot(vw, vh) / 2;
    c.fillStyle = U.rad(c, vw / 2, vh * 0.55, r * 0.45, r, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.5)']);
    c.fillRect(0, 0, vw, vh);
    R.vig[key] = cv;
    return cv;
  };
  R.post = function (ctx, race, v, vw, vh, horizon, dt) {
    const th = race.theme, p = v.player;
    const sp = p.speed / p.st.vmax;
    // líneas de velocidad
    const nit = p.nitroT > 0;
    if (!race.demo && (nit || sp > 0.9)) {
      const k = nit ? 1 : U.clamp((sp - 0.9) / 0.1, 0, 1) * 0.55;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = nit ? 'rgba(160,210,255,' + (0.22 * k).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.14 * k).toFixed(3) + ')';
      ctx.lineWidth = 2 * R.dpr;
      ctx.beginPath();
      const cx = vw / 2, cy = horizon;
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2 + i * 1.7;
        const ph = (R.t * 2.4 + i * 0.37) % 1;
        const r0 = (0.3 + ph * 0.9) * vh, r1 = r0 + vh * 0.16 * (0.4 + k);
        const ca = Math.cos(a), sa = Math.sin(a) * 0.62;
        ctx.moveTo(cx + ca * r0, cy + sa * r0);
        ctx.lineTo(cx + ca * r1, cy + sa * r1);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    // destello de lente
    if (v.sunX != null && th.sun && !th.weather.match(/rain|fog/)) {
      ctx.globalCompositeOperation = 'lighter';
      const dx = vw / 2 - v.sunX, dy = vh / 2 - v.sunY;
      [[0.35, 0.05, 0.1], [0.62, 0.03, 0.07], [0.9, 0.09, 0.05], [1.25, 0.05, 0.08]].forEach((f) => {
        const fxp = v.sunX + dx * f[0], fyp = v.sunY + dy * f[0], rr = vh * f[1];
        ctx.fillStyle = U.rad(ctx, fxp, fyp, 0, rr, [0, U.rgba(th.sun.glow, f[2]), 1, U.rgba(th.sun.glow, 0)]);
        ctx.fillRect(fxp - rr, fyp - rr, rr * 2, rr * 2);
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    if (th.grade) {
      ctx.globalAlpha = th.grade.a;
      ctx.globalCompositeOperation = th.grade.op;
      ctx.fillStyle = th.grade.c;
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(R.vignette(vw, vh), 0, 0);
    if (nit) {
      ctx.fillStyle = U.rad(ctx, vw / 2, vh / 2, vh * 0.3, Math.hypot(vw, vh) * 0.6, [0, 'rgba(40,120,255,0)', 1, 'rgba(40,120,255,0.28)']);
      ctx.fillRect(0, 0, vw, vh);
    }
    if (v.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,40,40,' + (v.hitFlash * 0.22).toFixed(3) + ')';
      ctx.fillRect(0, 0, vw, vh);
    }
    if (v.flash > 0) {
      ctx.fillStyle = 'rgba(235,240,255,' + (v.flash * 0.55).toFixed(3) + ')';
      ctx.fillRect(0, 0, vw, vh);
      v.flash = Math.max(0, v.flash - dt * 3.5);
    }
  };
})(window.TG);
