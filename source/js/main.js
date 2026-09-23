'use strict';
/* ============================================================
   Controlador principal
   ============================================================ */
(function (TG) {
  const U = TG.U;
  const G = (TG.Game = { race: null, paused: false, last: 0, demoT: 0, skipRender: false, fpsAcc: 0, fpsN: 0 });
  const S = () => TG.Save.data;

  G.boot = function () {
    TG.Save.load();
    TG.Input.init();
    TG.Render.init(document.getElementById('game'));
    TG.UI.init();
    TG.Input.on(G.onKey);
    G.startDemo();
    TG.UI.show('title');
    window.addEventListener('blur', () => G.autoPause());
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.autoPause(); });
    window.addEventListener('pointerdown', () => TG.Audio.init());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    requestAnimationFrame(G.loop);
    try { if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tgApp) window.webkit.messageHandlers.tgApp.postMessage('ready'); } catch (e) { /* navegador */ }
    window.__tgReady = true;
  };

  G.startDemo = function () {
    const ids = Object.keys(TG.TRACKS);
    let tid = U.pick(ids);
    if (G.race && G.race.demo && ids.length > 1) while (tid === G.race.def.id) tid = U.pick(ids);
    const car = U.pick(TG.CARS.filter((c) => c.price >= 200000));
    const race = new TG.Race({ mode: 'demo', trackId: tid, rivals: 9, players: [{ carId: car.id, color: car.color, up: {}, profile: 'solo', autopilot: true, name: '' }] });
    TG.Render.prepare(race);
    G.race = race;
    G.paused = false;
    G.demoT = 0;
  };
  G.toDemo = function () {
    TG.Audio.raceStop();
    G.startDemo();
    TG.Music.play('menu');
  };
  G.backToMenu = function (mode) {
    G.toDemo();
    const focus = mode === 'quick' ? 'quick' : mode === 'time' ? 'time' : mode === 'versus' ? 'versus' : mode === 'career' ? 'career' : null;
    if (mode === 'quick' || mode === 'time' || mode === 'versus') TG.UI.show(mode);
    else TG.UI.show('main', { focus });
  };

  G.startRace = function (cfg) {
    TG.Audio.init();
    TG.Audio.raceStop();
    TG.UI.show('loading', { cfg });
    G.skipRender = true;
    setTimeout(() => {
      try {
        const race = new TG.Race(cfg);
        TG.Render.prepare(race);
        G.race = race;
        G.paused = false;
        G.skipRender = false;
        TG.UI.hide();
        TG.Music.play(race.theme.music || 'race1');
        TG.Audio.raceStart(race);
      } catch (err) {
        console.error(err);
        G.skipRender = false;
        TG.UI.toast('No se pudo preparar la carrera.', 'warn');
        G.toDemo();
        TG.UI.show('main');
      }
    }, 80);
  };

  G.onScreen = function (name, def) {
    G.skipRender = !!def.studio;
  };

  G.qualityChanged = function () {
    TG.Render.carCache.clear();
    if (G.race) TG.Render.prepare(G.race);
  };

  G.toggleFullscreen = function () {
    try {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.tgApp) { window.webkit.messageHandlers.tgApp.postMessage('fullscreen'); return; }
    } catch (e) { /* sin puente */ }
    const d = document;
    const quiet = (p) => { if (p && p.catch) p.catch(() => TG.UI.toast('Tu navegador no permite la pantalla completa aquí. Prueba con F11.')); };
    try {
      if (!d.fullscreenElement && !d.webkitFullscreenElement) {
        const el = d.documentElement;
        quiet((el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el));
      } else {
        quiet((d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d));
      }
    } catch (e) { /* no disponible */ }
  };

  G.onKey = function (e, code) {
    const UI = TG.UI;
    if (UI.capture) return false;
    if (code === 'KeyM') {
      TG.Audio.init();
      TG.Audio.musicMuted = !TG.Audio.musicMuted;
      TG.Audio.apply();
      UI.toast(TG.Audio.musicMuted ? 'Música silenciada' : 'Música activada');
      return true;
    }
    if (code === 'F11' || (code === 'KeyF' && (e.metaKey || e.ctrlKey))) { G.toggleFullscreen(); return true; }
    const race = G.race;
    if (race && !race.demo && !UI.cur && (code === 'Escape' || code === 'KeyP')) { G.pause(); return true; }
    if (race && !race.demo && G.paused && UI.cur && UI.cur.name === 'pause' && code === 'KeyP') { G.resume(); return true; }
    return false;
  };

  G.pause = function () {
    const race = G.race;
    if (!race || race.demo || G.paused || race.ended) return;
    G.paused = true;
    TG.Audio.play('pause');
    TG.UI.show('pause');
  };
  G.autoPause = function () {
    if (G.race && !G.race.demo && !G.paused && !TG.UI.cur && G.race.phase !== 'done') G.pause();
  };
  G.resume = function () {
    G.paused = false;
    TG.UI.hide();
    TG.Input.down.clear();
  };
  G.restart = function () {
    const cfg = G.race.cfg;
    G.paused = false;
    G.startRace(cfg);
  };
  G.quitRace = function () {
    G.paused = false;
    G.toDemo();
    TG.UI.show('main');
  };

  /* ---------- Eventos de carrera ---------- */
  G.handleEvents = function (race) {
    if (!race.events.length) return;
    const evs = race.events;
    race.events = [];
    const A = TG.Audio, H = TG.HUD, R = TG.Render;
    for (const e of evs) {
      const v = e.car ? race.views.find((vv) => vv.player === e.car) : null;
      if (race.demo && e.type !== 'end') continue;
      switch (e.type) {
        case 'count': A.play('count'); break;
        case 'go': A.play('go'); break;
        case 'perfect': A.play('perfect'); if (v) H.msg(v, '¡SALIDA PERFECTA!', { col: '#46d98a', dur: 1.6 }); break;
        case 'spin': if (v) H.msg(v, 'PATINAS: DEMASIADAS RPM', { col: '#ff3b3b', slot: 'low', dur: 1.4 }); break;
        case 'nitro': A.play('nitro'); if (v) { H.msg(v, 'NITRO', { col: '#7fd0ff', dur: 0.9 }); v.cam.shake = Math.max(v.cam.shake, 0.35); } break;
        case 'shift': A.play('shift'); break;
        case 'lap': {
          if (!v) break;
          const n = e.car.laps.length;
          const rec = e.best && n > 1;
          A.play(rec ? 'record' : 'lap');
          H.msg(v, 'VUELTA ' + n, { sub: U.time(e.time) + (rec ? '  ·  MEJOR VUELTA' : ''), slot: 'low', dur: 2 });
          break;
        }
        case 'finalLap': A.play('finalLap'); if (v) H.msg(v, '¡ÚLTIMA VUELTA!', { col: '#ff7a1a', dur: 2 }); break;
        case 'finish':
          A.play('finish');
          if (v && e.car.finishPos === 1 && race.mode !== 'time') R.burst(v, 'confetti', 140);
          break;
        case 'crash':
          A.play(e.soft ? 'soft' : 'crash');
          if (v) { v.cam.shake = e.soft ? 0.45 : 1; v.hitFlash = e.soft ? 0.35 : 1; R.burst(v, 'spark', e.soft ? 8 : 28); if (!e.soft) R.burst(v, 'smoke', 8); }
          break;
        case 'bump':
          A.play('bump', U.clamp(0.4 + e.strength * 2, 0.4, 1));
          if (v) { v.cam.shake = Math.max(v.cam.shake, 0.4); R.burst(v, 'spark', 10); }
          break;
        case 'pickup':
          if (!v) break;
          if (e.kind === 'coin') { A.play('coin'); H.float(v, '+' + U.money(e.value)); R.burst(v, 'coin', 10); }
          else if (e.kind === 'fuel') { A.play('fuel'); H.msg(v, '+ GASOLINA', { col: '#ff6a5a', slot: 'low', dur: 1.2 }); }
          else if (e.kind === 'nitro') { A.play('nitroPick'); H.msg(v, '+1 NITRO', { col: '#7fd0ff', slot: 'low', dur: 1.2 }); }
          break;
        case 'lowfuel': A.play('lowfuel'); if (v) H.msg(v, 'GASOLINA BAJA', { col: '#ff3b3b', slot: 'low', dur: 2.2 }); break;
        case 'posUp': A.play('posUp'); if (v) H.msg(v, '▲ ' + e.pos + 'º', { slot: 'pos', col: '#46d98a', dur: 1.2 }); break;
        case 'posDown': A.play('posDown'); if (v) H.msg(v, '▼ ' + e.pos + 'º', { slot: 'pos', col: '#ff3b3b', dur: 1.2 }); break;
        case 'land': A.play('land'); if (v) v.cam.shake = Math.max(v.cam.shake, 0.3); break;
        case 'end': if (!race.demo) G.raceEnd(race); break;
        default: break;
      }
    }
  };

  /* ---------- Final de carrera y economía ---------- */
  G.raceEnd = function (race) {
    const d = S();
    const res = race.results();
    const data = { race, res, mode: race.mode, cup: race.cup, def: race.def };
    const round50 = (x) => Math.round(x / 50) * 50;
    if (race.mode === 'career' || race.mode === 'quick') {
      const p = race.players[0];
      const pr = res.find((r) => r.isPlayer);
      const pos = pr.pos;
      const factor = race.mode === 'quick' ? 0.75 : 1;
      const prize = round50(race.cup.prize * (TG.ECON.prizePct[pos - 1] || 0.01) * factor);
      const coins = p.coinMoney;
      const clean = p.crashes === 0 && p.finished ? round50(race.cup.prize * TG.ECON.clean) : 0;
      const rec = d.records[race.def.id] || {};
      let record = 0;
      if (p.bestLap && (!rec.lap || p.bestLap < rec.lap)) {
        if (rec.lap) record = round50(race.cup.prize * TG.ECON.record);
        rec.lap = p.bestLap; rec.lapCar = p.model.id;
      }
      if (p.finished && (!rec.race || p.finishTime < rec.race)) rec.race = p.finishTime;
      d.records[race.def.id] = rec;
      const total = prize + coins + clean + record;
      d.money += total;
      d.stats.races++;
      if (pos === 1) d.stats.wins++;
      d.stats.earned += total;
      data.earnings = { prize, coins, clean, record, total, pos };
      if (race.mode === 'career') {
        const ci = race.cup.index;
        const run = d.cups[ci].run;
        if (run) {
          res.forEach((r) => {
            const pts = TG.ECON.points[r.pos - 1] || 0;
            const id = r.isPlayer ? 'player' : r.did;
            if (id) run.points[id] = (run.points[id] || 0) + pts;
          });
          run.results.push(pos);
          run.race++;
          data.cupRun = run;
          if (run.race >= 4) {
            const table = TG.UI.standings(run);
            const rank = table.findIndex((r) => r.me) + 1;
            const bonus = rank <= 3 ? round50(race.cup.prize * TG.ECON.cupBonus[rank - 1]) : 0;
            d.money += bonus;
            d.stats.earned += bonus;
            const cs = d.cups[ci];
            if (rank <= 3 && (!cs.trophy || rank < cs.trophy)) cs.trophy = rank;
            let unlocked = null;
            if (rank <= 3 && ci + 1 < TG.CUPS.length && d.unlocked < ci + 2) { d.unlocked = ci + 2; unlocked = TG.CUPS[ci + 1].name; }
            const done = rank <= 3 && ci === TG.CUPS.length - 1;
            cs.run = null;
            data.cupEnd = { cup: race.cup, table, rank, bonus, unlocked, done };
            data.cupRun = null;
          }
        }
      }
    } else if (race.mode === 'time') {
      const p = race.players[0];
      const rec = d.records[race.def.id] || {};
      if (p.bestLap && (!rec.lap || p.bestLap < rec.lap)) { rec.lap = p.bestLap; rec.lapCar = p.model.id; data.newRecord = true; }
      if (p.finished && (!rec.race || p.finishTime < rec.race)) { rec.race = p.finishTime; data.newRecord = true; }
      d.records[race.def.id] = rec;
      const gb = race.ghostBest;
      const old = d.ghosts[race.def.id];
      if (gb && (!old || gb.time < old.time)) { d.ghosts[race.def.id] = gb; data.newGhost = true; }
    }
    TG.Save.save();
    TG.Audio.raceStop();
    TG.Music.play('menu');
    TG.UI.show('results', data);
  };

  /* ---------- Bucle principal ---------- */
  G.loop = function (now) {
    let dt = (now - (G.last || now)) / 1000;
    G.last = now;
    if (!(dt >= 0)) dt = 0;
    if (dt > 0.1) dt = 0.1;
    TG.Input.frame();
    const race = G.race;
    if (race) {
      try {
        if (!G.paused) race.update(dt);
        G.handleEvents(race);
        if (!G.skipRender) TG.Render.frame(race, G.paused ? 0 : dt);
        TG.Audio.raceUpdate(race, G.paused);
      } catch (err) {
        console.error(err);
        if (!G._errShown) { G._errShown = true; TG.UI.toast('Error: ' + err.message, 'warn'); }
      }
      if (race.demo) {
        G.demoT += dt;
        const cur = TG.UI.cur ? TG.UI.cur.name : '';
        if (G.demoT > 50 && (cur === 'title' || cur === 'main')) G.startDemo();
      }
    }
    // FPS
    G.fpsAcc += dt; G.fpsN++;
    if (G.fpsAcc > 0.5) {
      const el = document.getElementById('fps');
      if (el && S() && S().settings.fps) { el.style.display = 'block'; el.textContent = Math.round(G.fpsN / G.fpsAcc) + ' FPS'; }
      else if (el) el.style.display = 'none';
      G.fpsAcc = 0; G.fpsN = 0;
    }
    requestAnimationFrame(G.loop);
  };

  // Ganchos de prueba por URL (solo desarrollo): ?screen=garage | ?race=vegas&car=chiron&skip=8
  G.testHook = function () {
    const q = new URLSearchParams(location.search);
    if (!q.toString()) return;
    if (q.get('money')) S().money = +q.get('money');
    if (q.get('own')) q.get('own').split(',').forEach((id) => { if (TG.CAR[id] && !S().cars[id]) S().cars[id] = { color: TG.CAR[id].color, up: {} }; });
    if (q.get('unlock')) S().unlocked = +q.get('unlock');
    if (q.get('quality')) { S().settings.quality = q.get('quality'); TG.Render.resize(); }
    if (q.get('race')) {
      const carId = q.get('car') || 'mustang';
      if (!S().cars[carId]) S().cars[carId] = { color: TG.CAR[carId].color, up: {} };
      const cfg = { mode: q.get('mode') || 'quick', trackId: q.get('race'), laps: +(q.get('laps') || 3), rivals: +(q.get('rivals') || 11), players: [TG.UI.carCfg(carId, 'solo', 'Tú')] };
      if (q.get('p2')) { cfg.mode = 'versus'; cfg.players[0].profile = 'p1'; const c2 = q.get('p2'); if (!S().cars[c2]) S().cars[c2] = { color: TG.CAR[c2].color, up: {} }; cfg.players.push(TG.UI.carCfg(c2, 'p2', 'Jugador 2')); cfg.players[1].color = '#7fcbe8'; }
      const race = new TG.Race(cfg);
      if (q.get('auto')) race.players.forEach((p) => { p.autopilot = true; });
      TG.Render.prepare(race);
      G.race = race;
      TG.UI.hide();
      const skip = +(q.get('skip') || 0);
      for (let t = 0; t < skip; t += 1 / 60) { race.update(1 / 60); race.events = []; }
      if (q.get('nitro')) race.players.forEach((p) => { p.nitroT = 2; });
      if (q.get('freeze')) { race.update(0); G.paused = true; }
      if (q.get('end')) { G.raceEnd(race); }
      return;
    }
    if (q.get('screen')) {
      const params = {};
      if (q.get('i')) params.i = +q.get('i');
      if (q.get('carp')) params.car = q.get('carp');
      TG.UI.show(q.get('screen'), params);
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    try { G.boot(); G.testHook(); } catch (err) {
      console.error(err);
      document.body.innerHTML = '<pre style="color:#fff;padding:24px;font:14px monospace">Error al iniciar: ' + String(err && err.stack || err) + '</pre>';
    }
  });
})(window.TG);
