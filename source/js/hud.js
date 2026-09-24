'use strict';
/* ============================================================
   HUD de carrera
   ============================================================ */
(function (TG) {
  const U = TG.U, C = TG.C;
  const HUD = (TG.HUD = {});
  const F_DATA = '"DIN Alternate", "DIN Condensed", Bahnschrift, "Roboto Condensed", "Arial Narrow", sans-serif';
  const F_DISP = '"Avenir Next Condensed", "Futura", Bahnschrift, "Arial Narrow", sans-serif';
  const F_BODY = '"Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  const ORANGE = '#ff7a1a', GULF = '#7fcbe8', CHALK = '#f3f5f8', SIGNAL = '#ff3b3b';

  const font = (w, px, fam, it) => (it ? 'italic ' : '') + w + ' ' + Math.round(px) + 'px ' + fam;

  function panel(ctx, x, y, w, h, s, accent) {
    ctx.fillStyle = 'rgba(12,14,20,0.62)';
    U.rr(ctx, x, y, w, h, 10 * s);
    ctx.fill();
    ctx.fillStyle = accent || ORANGE;
    ctx.fillRect(x + 10 * s, y, w - 20 * s, 3 * s);
    ctx.fillStyle = GULF;
    ctx.fillRect(x + 10 * s, y + 3 * s, (w - 20 * s) * 0.18, 2 * s);
  }
  function txt(ctx, t, x, y, f, col, align, base) {
    ctx.font = f;
    ctx.fillStyle = col;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = base || 'alphabetic';
    ctx.fillText(t, x, y);
  }

  HUD.msg = function (v, text, o) {
    o = o || {};
    v.msgs = v.msgs.filter((m) => m.slot !== (o.slot || 'main'));
    v.msgs.push({ text, sub: o.sub || '', t: 0, dur: o.dur || 1.6, col: o.col || CHALK, slot: o.slot || 'main', big: o.big || 1 });
  };
  HUD.float = function (v, text, col) {
    v.floats = v.floats || [];
    v.floats.push({ text, col: col || '#ffd21f', t: 0 });
  };

  HUD.mapImage = function (race, size) {
    const key = size;
    if (race._map && race._map.key === key) return race._map.img;
    const cv = U.canvas(size, size);
    const c = cv.getContext('2d');
    const pts = race.track.map.pts, N = race.track.N;
    const pad = size * 0.1, S = size - pad * 2;
    c.lineJoin = 'round'; c.lineCap = 'round';
    const path = () => {
      c.beginPath();
      for (let i = 0; i < N; i += 2) {
        const x = pad + (pts[i * 2] + 0.5) * S, y = pad + (pts[i * 2 + 1] + 0.5) * S;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    };
    path(); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = size * 0.06; c.stroke();
    path(); c.strokeStyle = 'rgba(243,245,248,0.85)'; c.lineWidth = size * 0.022; c.stroke();
    const sx = pad + (pts[0] + 0.5) * S, sy = pad + (pts[1] + 0.5) * S;
    c.fillStyle = ORANGE; c.fillRect(sx - size * 0.03, sy - size * 0.012, size * 0.06, size * 0.024);
    race._map = { key, img: cv, pad, S };
    return cv;
  };

  function tach(ctx, cx, cy, r, car, race, s) {
    const eng = car.model.eng;
    const red = eng.red;
    const maxR = Math.ceil((red * 1.1) / 1000) * 1000;
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    const ang = (rpm) => a0 + (a1 - a0) * U.clamp(rpm / maxR, 0, 1);
    ctx.fillStyle = U.rad(ctx, cx, cy, r * 0.2, r * 1.12, [0, 'rgba(18,20,28,0.8)', 1, 'rgba(8,9,13,0.72)']);
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2); ctx.stroke();
    // zona de salida perfecta
    if (race.phase === 'count' || race.phase === 'intro') {
      ctx.strokeStyle = 'rgba(70,217,138,0.85)'; ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, ang(red * 0.55), ang(red * 0.84)); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,59,59,0.9)'; ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.93, ang(red * 0.94), a1); ctx.stroke();
    // arco de progreso
    const rp = car.rpm;
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, GULF); grad.addColorStop(0.65, ORANGE); grad.addColorStop(1, SIGNAL);
    ctx.strokeStyle = grad; ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, a0, ang(rp)); ctx.stroke();
    // marcas
    ctx.strokeStyle = 'rgba(243,245,248,0.8)';
    for (let v = 0; v <= maxR; v += 500) {
      const a = ang(v), major = v % 1000 === 0;
      const r0 = r * (major ? 0.7 : 0.75), r1 = r * 0.84;
      ctx.lineWidth = (major ? 3 : 1.5) * s;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      if (major) txt(ctx, String(v / 1000), cx + Math.cos(a) * r * 0.56, cy + Math.sin(a) * r * 0.56, font(700, r * 0.15, F_DATA), v >= red * 0.94 ? SIGNAL : 'rgba(243,245,248,0.85)', 'center', 'middle');
    }
    // aguja
    const a = ang(rp);
    ctx.strokeStyle = '#ff5a2a'; ctx.lineWidth = 4 * s;
    ctx.shadowColor = '#ff5a2a'; ctx.shadowBlur = 10 * s;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * r * 0.12, cy - Math.sin(a) * r * 0.12); ctx.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#20232c'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2); ctx.fill();
    // velocidad
    const units = TG.Save.data.settings.units;
    const kmh = car.speed / C.KMH;
    const val = Math.round(units === 'mph' ? kmh * 0.6214 : kmh);
    txt(ctx, String(val), cx, cy + r * 0.44, font(700, r * 0.46, F_DATA), CHALK, 'center', 'middle');
    txt(ctx, units === 'mph' ? 'MPH' : 'KM/H', cx, cy + r * 0.74, font(700, r * 0.13, F_DATA), 'rgba(243,245,248,0.6)', 'center', 'middle');
    // marcha
    const gx = cx + r * 0.62, gy = cy + r * 0.62;
    const shiftNow = car.manual && car.rpm > red * 0.93;
    ctx.fillStyle = shiftNow ? (Math.floor(R_t() * 10) % 2 ? SIGNAL : ORANGE) : 'rgba(255,122,26,0.18)';
    U.rr(ctx, gx - r * 0.2, gy - r * 0.2, r * 0.4, r * 0.4, 6 * s); ctx.fill();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 2 * s; ctx.stroke();
    const gtxt = race.phase === 'race' || race.phase === 'done' ? String(car.gear) : 'N';
    txt(ctx, gtxt, gx, gy + r * 0.02, font(700, r * 0.3, F_DATA), shiftNow ? '#111' : CHALK, 'center', 'middle');
    if (car.manual) txt(ctx, 'MAN', gx, gy + r * 0.3, font(700, r * 0.1, F_DATA), GULF, 'center', 'middle');
  }
  const R_t = () => (TG.Render ? TG.Render.t : 0);
  // color según el daño: verde → amarillo → naranja → rojo
  const dmgCol = (v) => (v < 0.15 ? '#46d98a' : v < 0.4 ? '#ffd21f' : v < 0.7 ? '#ff8a2a' : '#ff3b3b');

  HUD.draw = function (ctx, race, v, vw, vh, dt) {
    const p = v.player;
    const split = race.views.length > 1;
    const s = Math.min(vh / 720, vw / 1280) * (split ? 1.3 : 1);
    const m = 22 * s;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const showRace = race.phase !== 'intro';

    if (showRace) {
      // --- posición y vuelta
      const pw = 190 * s, ph = 108 * s;
      panel(ctx, m, m, pw, ph, s);
      txt(ctx, 'POSICIÓN', m + 16 * s, m + 26 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)');
      txt(ctx, String(p.pos), m + 14 * s, m + 88 * s, font(700, 62 * s, F_DATA), CHALK);
      ctx.font = font(700, 62 * s, F_DATA);
      const wpos = ctx.measureText(String(p.pos)).width;
      txt(ctx, '/' + race.cars.length, m + 18 * s + wpos, m + 88 * s, font(700, 24 * s, F_DATA), 'rgba(243,245,248,0.55)');
      const lapN = U.clamp(p.lapsDone + 1, 1, race.laps);
      txt(ctx, 'VUELTA', m + pw - 14 * s, m + 26 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)', 'right');
      txt(ctx, lapN + '/' + race.laps, m + pw - 14 * s, m + 58 * s, font(700, 30 * s, F_DATA), p.finished ? ORANGE : CHALK, 'right');
      if (p.draft > 0.5 && !p.finished) {
        txt(ctx, 'REBUFO', m + pw - 14 * s, m + 88 * s, font(700, 15 * s, F_DATA), GULF, 'right');
      }
      // --- flechas de cambio de posición
      (v.msgs || []).forEach((mm) => {
        if (mm.slot !== 'pos') return;
        const k = 1 - mm.t / mm.dur;
        ctx.globalAlpha = Math.min(1, k * 3);
        txt(ctx, mm.text, m + pw + 12 * s, m + 70 * s - (1 - k) * 12 * s, font(700, 26 * s, F_DATA), mm.col);
        ctx.globalAlpha = 1;
      });

      // --- tiempos
      const tw = 230 * s, th = split ? 96 * s : 120 * s;
      const tx = vw - m - tw;
      panel(ctx, tx, m, tw, th, s, GULF);
      txt(ctx, 'TIEMPO', tx + 16 * s, m + 26 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)');
      txt(ctx, U.timeShort(p.finished ? p.finishTime : race.time), tx + tw - 16 * s, m + 30 * s, font(700, 26 * s, F_DATA), CHALK, 'right');
      const cur = p.finished ? p.lastLap : race.phase === 'race' || race.phase === 'done' ? race.time - p.lapStart : 0;
      txt(ctx, 'VUELTA', tx + 16 * s, m + 58 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)');
      txt(ctx, U.timeShort(p.lapsDone < 0 && race.phase !== 'race' ? 0 : cur), tx + tw - 16 * s, m + 60 * s, font(700, 20 * s, F_DATA), CHALK, 'right');
      txt(ctx, 'MEJOR', tx + 16 * s, m + 86 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)');
      txt(ctx, U.timeShort(p.bestLap), tx + tw - 16 * s, m + 88 * s, font(700, 20 * s, F_DATA), GULF, 'right');
      if (race.mode === 'time' && race.ghostData) {
        const gy = m + th + 34 * s;
        ctx.fillStyle = 'rgba(12,14,20,0.62)';
        U.rr(ctx, vw - m - 210 * s, gy - 26 * s, 210 * s, 36 * s, 8 * s); ctx.fill();
        txt(ctx, 'FANTASMA', vw - m - 196 * s, gy - 2 * s, font(700, 13 * s, F_DATA), race.ghostCar && race.ghostCar.visible ? GULF : 'rgba(243,245,248,0.5)');
        txt(ctx, U.timeShort(race.ghostData.time), vw - m - 14 * s, gy, font(700, 20 * s, F_DATA), CHALK, 'right');
      }
      if (race.track.coins) {
        const my = m + th + 34 * s;
        ctx.fillStyle = 'rgba(12,14,20,0.62)';
        U.rr(ctx, vw - m - 150 * s, my - 26 * s, 150 * s, 36 * s, 8 * s); ctx.fill();
        ctx.fillStyle = '#ffcc1a'; ctx.beginPath(); ctx.arc(vw - m - 128 * s, my - 8 * s, 10 * s, 0, Math.PI * 2); ctx.fill();
        txt(ctx, '$', vw - m - 128 * s, my - 7 * s, font(900, 13 * s, F_DISP), '#8a5a00', 'center', 'middle');
        txt(ctx, U.money(p.coinMoney).replace('$', ''), vw - m - 14 * s, my, font(700, 22 * s, F_DATA), '#ffd21f', 'right');
      }

      // --- tacómetro
      const r = (split ? 78 : 104) * s;
      const cx = vw - m - r * 1.1, cy = vh - m - r * 1.05;
      tach(ctx, cx, cy, r, p, race, s);

      // --- nitro y combustible
      const bx = cx - r * 1.1 - 22 * s - 170 * s, by = vh - m - (split ? 74 : 92) * s;
      const bw = 170 * s;
      panel(ctx, bx, by, bw, (split ? 74 : 92) * s, s, GULF);
      txt(ctx, 'NITRO', bx + 14 * s, by + 24 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)');
      const maxN = Math.max(p.st.nitroN, p.nitroN);
      const pillW = Math.min(18 * s, (bw - 90 * s) / Math.max(1, maxN));
      for (let i = 0; i < maxN; i++) {
        const px = bx + 70 * s + i * (pillW + 4 * s);
        ctx.fillStyle = i < p.nitroN ? '#3aa0ff' : 'rgba(255,255,255,0.12)';
        U.rr(ctx, px, by + 12 * s, pillW, 14 * s, 4 * s); ctx.fill();
      }
      if (p.nitroT > 0) {
        ctx.fillStyle = 'rgba(58,160,255,0.3)'; ctx.fillRect(bx + 14 * s, by + 32 * s, bw - 28 * s, 5 * s);
        ctx.fillStyle = '#7fd0ff'; ctx.fillRect(bx + 14 * s, by + 32 * s, (bw - 28 * s) * U.clamp(p.nitroT / p.st.nitroDur, 0, 1), 5 * s);
      }
      if (!race.demo) {
        const fy = by + (split ? 52 : 64) * s;
        txt(ctx, 'GASOLINA', bx + 14 * s, fy, font(700, 13 * s, F_DATA), p.fuel < 20 && Math.floor(R_t() * 3) % 2 ? SIGNAL : 'rgba(243,245,248,0.6)');
        const gx0 = bx + 86 * s, gw = bw - 100 * s;
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; U.rr(ctx, gx0, fy - 11 * s, gw, 12 * s, 4 * s); ctx.fill();
        const fcol = p.fuel < 20 ? SIGNAL : p.fuel < 45 ? '#ffd21f' : '#46d98a';
        ctx.fillStyle = fcol; U.rr(ctx, gx0, fy - 11 * s, Math.max(4 * s, gw * (p.fuel / 100)), 12 * s, 4 * s); ctx.fill();
      }

      // --- daños: silueta del coche vista desde arriba con cada zona coloreada
      if (!race.demo && p.dmgT > 0.005) {
        const dh = (split ? 38 : 44) * s, dy = by - dh - 8 * s;
        ctx.fillStyle = 'rgba(12,14,20,0.62)';
        U.rr(ctx, bx, dy, bw, dh, 8 * s); ctx.fill();
        txt(ctx, 'DAÑOS', bx + 14 * s, dy + dh / 2 + 5 * s, font(700, 13 * s, F_DATA), 'rgba(243,245,248,0.6)');
        const pct = Math.round(p.dmgT * 100);
        txt(ctx, pct + '%', bx + bw - 14 * s, dy + dh / 2 + 7 * s, font(700, 20 * s, F_DATA), dmgCol(p.dmgT), 'right');
        // coche en planta (el morro hacia arriba)
        const cw = 16 * s, chh = dh - 12 * s, ccx = bx + 88 * s, ccy = dy + 6 * s;
        const d = p.dmg;
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; U.rr(ctx, ccx - cw / 2, ccy, cw, chh, 5 * s); ctx.fill();
        ctx.fillStyle = dmgCol(d.f); U.rr(ctx, ccx - cw / 2 + 2 * s, ccy + 1 * s, cw - 4 * s, chh * 0.22, 3 * s); ctx.fill();
        ctx.fillStyle = dmgCol(d.r); U.rr(ctx, ccx - cw / 2 + 2 * s, ccy + chh * 0.77, cw - 4 * s, chh * 0.22, 3 * s); ctx.fill();
        ctx.fillStyle = dmgCol(d.l); ctx.fillRect(ccx - cw / 2 - 1 * s, ccy + chh * 0.26, 3 * s, chh * 0.48);
        ctx.fillStyle = dmgCol(d.rt); ctx.fillRect(ccx + cw / 2 - 2 * s, ccy + chh * 0.26, 3 * s, chh * 0.48);
        ctx.fillStyle = dmgCol(d.roof); U.rr(ctx, ccx - cw * 0.28, ccy + chh * 0.34, cw * 0.56, chh * 0.32, 2 * s); ctx.fill();
      }

      // --- minimapa
      const ms = (split ? 120 : 170) * s;
      const mx = m, my2 = vh - m - ms;
      ctx.fillStyle = 'rgba(12,14,20,0.5)';
      U.rr(ctx, mx, my2, ms, ms, 12 * s); ctx.fill();
      const mapSize = Math.round(ms);
      const img = HUD.mapImage(race, mapSize);
      ctx.drawImage(img, mx, my2, ms, ms);
      const mp = race._map;
      const pts = race.track.map.pts;
      const sc = ms / mapSize;
      const dot = (car, rad, col) => {
        const i = Math.floor(car.z / C.SEG) % race.track.N;
        const x = mx + (mp.pad + (pts[i * 2] + 0.5) * mp.S) * sc, y = my2 + (mp.pad + (pts[i * 2 + 1] + 0.5) * mp.S) * sc;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      };
      race.cars.forEach((c) => { if (!c.isPlayer) dot(c, 3 * s, c.pos === 1 ? '#ffd21f' : 'rgba(243,245,248,0.75)'); });
      race.players.forEach((c) => {
        const col = c.pIndex === 0 ? ORANGE : GULF;
        if (c === p) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(R_t() * 6); dot(c, 9 * s, col); ctx.globalAlpha = 1; }
        dot(c, 5 * s, col);
      });
    }

    // --- semáforo / cuenta atrás
    if (race.phase === 'count') {
      const n = 3 - Math.floor(race.phaseT);
      const lx = vw / 2, ly = vh * 0.2;
      const lw = 300 * s, lh = 70 * s;
      ctx.fillStyle = 'rgba(10,11,15,0.8)';
      U.rr(ctx, lx - lw / 2, ly - lh / 2, lw, lh, 16 * s); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const on = i < Math.round(((race.phaseT) / 3) * 5 + 0.49);
        const x = lx - lw / 2 + 36 * s + i * 57 * s;
        ctx.fillStyle = on ? SIGNAL : '#3a1014';
        if (on) { ctx.shadowColor = SIGNAL; ctx.shadowBlur = 18 * s; }
        ctx.beginPath(); ctx.arc(x, ly, 20 * s, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      const k = race.phaseT % 1;
      ctx.globalAlpha = 1 - k * 0.6;
      txt(ctx, String(Math.max(1, n)), vw / 2, vh * 0.44, font(800, (130 + k * 40) * s, F_DISP, true), CHALK, 'center', 'middle');
      ctx.globalAlpha = 1;
      if (!p.autopilot) txt(ctx, 'Mantén las revoluciones en la zona verde', vw / 2, vh * 0.56, font(600, 17 * s, F_BODY), 'rgba(243,245,248,0.8)', 'center', 'middle');
    }
    if (race.phase === 'race' && race.phaseT < 1) {
      const k = race.phaseT;
      ctx.globalAlpha = 1 - k;
      txt(ctx, '¡YA!', vw / 2, vh * 0.44, font(800, (150 + k * 80) * s, F_DISP, true), '#46d98a', 'center', 'middle');
      ctx.globalAlpha = 1;
    }
    // --- presentación del circuito
    if (race.phase === 'intro') {
      const k = U.clamp(race.phaseT / 0.5, 0, 1) * U.clamp((2.6 - race.phaseT) / 0.4, 0, 1);
      ctx.globalAlpha = k;
      const y = vh * 0.72;
      ctx.fillStyle = 'rgba(10,11,15,0.72)';
      ctx.fillRect(0, y - 70 * s, vw, 140 * s);
      ctx.fillStyle = ORANGE; ctx.fillRect(0, y - 70 * s, vw, 4 * s);
      ctx.fillStyle = GULF; ctx.fillRect(0, y - 64 * s, vw * 0.3, 2 * s);
      txt(ctx, race.cup.name.toUpperCase() + '  ·  ' + (race.mode === 'career' ? 'CARRERA ' + (race.def.index + 1) + ' DE 4' : race.mode === 'time' ? 'CONTRARRELOJ' : race.mode === 'versus' ? '2 JUGADORES' : 'CARRERA RÁPIDA'), vw / 2, y - 30 * s, font(700, 17 * s, F_DATA), GULF, 'center', 'middle');
      txt(ctx, race.def.name.toUpperCase(), vw / 2, y + 12 * s, font(800, 54 * s, F_DISP, true), CHALK, 'center', 'middle');
      txt(ctx, race.laps + ' VUELTAS  ·  ' + TG.TIME_LABEL[race.theme.time].toUpperCase() + '  ·  ' + TG.WEATHER_LABEL[race.theme.weather].toUpperCase(), vw / 2, y + 50 * s, font(700, 16 * s, F_DATA), 'rgba(243,245,248,0.75)', 'center', 'middle');
      ctx.globalAlpha = 1;
    }

    // --- mensajes centrales
    v.msgs = (v.msgs || []).filter((mm) => (mm.t += dt) < mm.dur);
    v.msgs.forEach((mm) => {
      if (mm.slot === 'pos') return;
      const k = mm.t / mm.dur;
      const inK = U.clamp(mm.t / 0.18, 0, 1), outK = U.clamp((mm.dur - mm.t) / 0.3, 0, 1);
      ctx.globalAlpha = Math.min(inK, outK);
      const sc = (0.8 + 0.2 * U.easeOutCubic(inK)) * mm.big;
      const y = mm.slot === 'low' ? vh * 0.36 : vh * 0.27;
      ctx.save();
      ctx.translate(vw / 2, y);
      ctx.scale(sc, sc);
      ctx.lineWidth = 6 * s; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineJoin = 'round';
      ctx.font = font(800, (mm.slot === 'low' ? 30 : 46) * s, F_DISP, true);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(mm.text, 0, 0);
      ctx.fillStyle = mm.col; ctx.fillText(mm.text, 0, 0);
      if (mm.sub) {
        ctx.font = font(700, 18 * s, F_DATA);
        ctx.strokeText(mm.sub, 0, 36 * s);
        ctx.fillStyle = CHALK; ctx.fillText(mm.sub, 0, 36 * s);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      void k;
    });
    // --- textos flotantes (monedas)
    if (v.floats && v.carScreen) {
      v.floats = v.floats.filter((f) => (f.t += dt) < 1);
      v.floats.forEach((f) => {
        ctx.globalAlpha = 1 - f.t;
        txt(ctx, f.text, v.carScreen.x, v.carScreen.y - v.carScreen.h * 0.9 - f.t * 60 * s, font(700, 24 * s, F_DATA), f.col, 'center', 'middle');
      });
      ctx.globalAlpha = 1;
    }
    // --- meta
    if (p.finished) {
      const k = U.clamp((race.time - p.finishTime) / 0.4, 0, 1);
      ctx.globalAlpha = k;
      txt(ctx, p.finishPos === 1 && race.mode !== 'time' ? '¡VICTORIA!' : '¡META!', vw / 2, vh * 0.3, font(800, 64 * s, F_DISP, true), p.finishPos === 1 ? '#ffd21f' : CHALK, 'center', 'middle');
      if (race.mode !== 'time') txt(ctx, 'Terminas ' + p.pos + 'º', vw / 2, vh * 0.3 + 52 * s, font(700, 26 * s, F_DATA), CHALK, 'center', 'middle');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
})(window.TG);
