'use strict';
/* ============================================================
   Simulación de carrera
   ============================================================ */
(function (TG) {
  const U = TG.U, C = TG.C;
  const INTRO = 2.6, COUNT = 3.0;
  const LANES = [-0.62, 0, 0.62];

  function makeCar(model, color, up, o) {
    const st = TG.carStats(model, up);
    return {
      id: Math.random().toString(36).slice(2, 8),
      model, color, up: up || {}, st, name: o.name || '', isPlayer: !!o.player, pIndex: o.pIndex == null ? -1 : o.pIndex,
      profile: o.profile || 'solo', autopilot: !!o.autopilot, manual: !!o.manual,
      z: 0, x: 0, speed: 0, lapsDone: -1, finished: false, finishTime: 0, finishPos: 0, progress: 0, pos: 0,
      steer: 0, steerVis: 0, throttle: 0, braking: false, vx: 0, latV: 0, lastX: 0, lastSpeed: 0, lastThr: 0,
      vis: { yaw: 0, roll: 0, rollV: 0, pitch: 0, pitchV: 0, heave: 0, heaveV: 0, steer: 0, blur: 0 },
      backfire: 0, shiftPuff: 0, burn: 0, bumpSmoke: 0,
      gear: 1, rpm: model.eng.idle, shiftT: 0,
      nitroN: st.nitroN, nitroT: 0, fuel: 100,
      offroad: false, crashT: 0, bumpT: 0, slip: 0, air: 0, airV: 0, draft: 0, spinT: 0, perfect: false,
      lapStart: 0, lastLap: null, bestLap: null, laps: [],
      coins: 0, coinMoney: 0, crashes: 0, apLane: 0, apLaneT: 0,
      ai: null, spr: null, inp: null, lowFuelWarned: false,
    };
  }

  class Race {
    constructor(cfg) {
      this.cfg = cfg;
      this.mode = cfg.mode;
      this.demo = cfg.mode === 'demo';
      const def = TG.TRACKS[cfg.trackId];
      this.def = def;
      this.cup = TG.CUPS[def.cup];
      const noMoney = cfg.mode === 'time' || cfg.mode === 'versus' || this.demo;
      this.track = TG.Track.build(def, { coins: !noMoney, fuel: !this.demo });
      this.theme = this.track.theme;
      this.laps = this.demo ? 9999 : cfg.laps || 3;
      this.time = 0;
      this.phase = this.demo ? 'race' : 'intro';
      this.phaseT = 0;
      this.cars = [];
      this.players = [];
      this.events = [];
      this.finishedCount = 0;
      this.acc = 0;
      this.coinValue = this.cup.coin;
      const lapTime = this.track.length / (this.cup.ai * C.KMH * 0.88);
      this.fuelRate = 100 / (2.6 * lapTime);
      const weather = this.theme.weather;
      this.gripW = weather === 'rain' ? 0.86 : weather === 'snow' ? 0.8 : 1;

      cfg.players.forEach((pc, i) => {
        const model = TG.CAR[pc.carId];
        const car = makeCar(model, pc.color, pc.up, {
          player: true, pIndex: i, profile: pc.profile, autopilot: pc.autopilot || this.demo, manual: pc.manual, name: pc.name,
        });
        this.cars.push(car);
        this.players.push(car);
      });
      const nAI = cfg.rivals || 0;
      const drivers = cfg.drivers || Race.makeDrivers(this.cup, nAI, def.seed);
      const ref = (cfg.aiRef || this.cup.ai) * C.KMH;
      // dificultad: sube poco a poco con cada carrera del campeonato (0 = primera, 1 = última)
      const D = TG.DIFFICULTY[TG.Save.data.settings.difficulty] || TG.DIFFICULTY.normal;
      const lvl = this.demo ? 0.5 : U.clamp(TG.raceLevel(def) + D.off, 0, 1);
      this.level = lvl;
      drivers.slice(0, nAI).forEach((d, rank) => {
        const model = TG.CAR[d.carId];
        const car = makeCar(model, d.color, {}, { name: d.name });
        const skill = d.skill != null ? d.skill : 1 - rank / Math.max(1, nAI);
        const vmax = ref * (0.87 + 0.13 * skill) * (0.972 + 0.052 * lvl) * D.spd * U.rand(0.992, 1.008) * (this.demo ? U.rand(0.8, 0.95) : 1);
        car.ai = {
          vmax, tol: 3.0 + skill * 1.6 + lvl * 0.5, brakeK: 0.075 - lvl * 0.012, lane: 0, laneT: 0, jitter: U.rand(-0.05, 0.05), rubber: 1,
          nitroN: (skill > 0.4 ? 2 : 1) + (lvl > 0.55 && skill > 0.3 ? 1 : 0), skill, did: d.id,
          lvl, mistake: (1 - lvl) * 0.07 * (1.25 - skill), errT: 0, lat: 0.9 + 0.45 * lvl, defT: 0,
        };
        car.st = Object.assign({}, car.st, { vmax, accel: (100 * C.KMH) / model.acc * 1.05 });
        this.cars.push(car);
      });
      this.grid();
      const camH = TG.Save.data.settings.camera === 'far' ? C.CAM_H_FAR : C.CAM_H;
      this.views = this.players.map((p) => ({
        player: p,
        cam: { x: p.x, h: this.demo ? camH : camH * 5, fov: C.FOV, extra: this.demo ? 0 : 7000, shake: 0, base: camH },
        parts: [], msgs: [], flash: 0, hitFlash: 0,
      }));
      if (this.demo) this.views = [this.views[0]];
      this.updatePositions();
      // Contrarreloj: grabación de la vuelta y coche fantasma del récord
      if (this.mode === 'time') {
        this.ghostRec = [];
        this.ghostAcc = 0;
        this.ghostBest = null;
        const g = TG.Save.data.ghosts && TG.Save.data.ghosts[def.id];
        if (g && Array.isArray(g.s) && g.s.length > 8 && TG.CAR[g.car]) {
          this.ghostData = g;
          this.ghostCar = makeCar(TG.CAR[g.car], g.color || TG.CAR[g.car].color, {}, { name: 'Fantasma' });
          this.ghostCar.ghost = true;
          this.ghostCar.visible = false;
        }
      }
    }

    stepGhost(dt) {
      const p = this.players[0];
      if (p.lapsDone >= 0 && !p.finished) {
        this.ghostAcc += dt;
        if (this.ghostAcc >= 0.05) {
          this.ghostAcc -= 0.05;
          this.ghostRec.push(Math.round(p.z / 10), Math.round(p.x * 100));
        }
      }
      const g = this.ghostData, gc = this.ghostCar;
      if (!g || !gc) return;
      if (p.lapsDone < 0 || p.finished) { gc.visible = false; return; }
      const f = (this.time - p.lapStart) / g.dt;
      const i = Math.floor(f);
      const n = g.s.length / 2;
      if (i < 0 || i >= n - 1) { gc.visible = false; return; }
      const k = f - i;
      const L = this.track.length;
      const z0 = g.s[i * 2] * 10;
      let z1 = g.s[i * 2 + 2] * 10;
      if (z1 < z0 - L / 2) z1 += L;
      gc.z = U.increase(0, z0 + (z1 - z0) * k, L);
      gc.x = (g.s[i * 2 + 1] + (g.s[i * 2 + 3] - g.s[i * 2 + 1]) * k) / 100;
      gc.speed = Math.max(0, (z1 - z0) / g.dt);
      gc.visible = true;
    }

    static makeDrivers(cup, n, seed) {
      const r = U.rng((seed || 1) * 31 + 7);
      const names = TG.DRIVERS.slice();
      for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = names[i]; names[i] = names[j]; names[j] = t; }
      const out = [];
      for (let i = 0; i < n; i++) {
        const model = TG.CARS[cup.pool[Math.floor(r() * cup.pool.length)]];
        const color = r() < 0.45 ? model.color : TG.PAINTS[Math.floor(r() * TG.PAINTS.length)].c;
        out.push({ id: 'd' + i, name: names[i % names.length], carId: model.id, color, skill: 1 - i / Math.max(1, n) });
      }
      return out;
    }

    grid() {
      const L = this.track.length, SEG = C.SEG;
      if (this.demo) {
        this.cars.forEach((car, i) => {
          car.z = (L * i) / this.cars.length + U.rand(0, 20) * SEG;
          car.x = U.pick(LANES);
          car.speed = car.st.vmax * 0.8;
          car.lapsDone = 0;
          if (car.ai) car.ai.lane = car.x;
        });
        const p = this.players[0];
        p.x = 0; p.z = SEG * 60; p.speed = p.st.vmax * 0.6;
        return;
      }
      const ais = this.cars.filter((c) => !c.isPlayer).sort((a, b) => b.ai.skill - a.ai.skill);
      ais.forEach((car, i) => {
        const row = Math.floor(i / 2), col = i % 2;
        car.z = L - (row + 1) * 3.4 * SEG - col * 1.6 * SEG;
        car.x = col ? 0.42 : -0.42;
        car.ai.lane = car.x;
      });
      const prow = Math.ceil(ais.length / 2);
      this.players.forEach((p, i) => {
        const col = this.players.length === 1 ? (ais.length % 2) : i;
        const row = this.players.length === 1 ? Math.floor(ais.length / 2) : prow;
        p.z = L - (row + 1) * 3.4 * SEG - col * 1.6 * SEG;
        p.x = col ? 0.42 : -0.42;
        p.apLane = p.x;
      });
    }

    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }

    readInput(car) {
      const I = TG.Input, p = car.profile;
      return {
        accel: I.action(p, 'accel'), brake: I.action(p, 'brake'), left: I.action(p, 'left'), right: I.action(p, 'right'),
        nitro: I.hit(p, 'nitro'), up: I.hit(p, 'gearUp'), down: I.hit(p, 'gearDown'),
      };
    }

    update(dt) {
      for (const p of this.players) p.inp = p.autopilot ? null : this.readInput(p);
      this.acc += dt;
      let steps = 0;
      while (this.acc >= C.STEP && steps < 14) {
        this.step(C.STEP);
        this.acc -= C.STEP;
        steps++;
        for (const p of this.players) if (p.inp) { p.inp.nitro = false; p.inp.up = false; p.inp.down = false; }
      }
      if (steps >= 14) this.acc = 0;
      this.updateVisuals(dt);
      this.updateCams(dt);
    }

    // Movimiento de la carrocería: guiñada, dirección de las ruedas, balanceo, cabeceo y suspensión
    updateVisuals(dt) {
      if (!(dt > 0)) return;
      const T = this.track;
      const list = this.ghostCar ? this.cars.concat([this.ghostCar]) : this.cars;
      const kx = 1 - Math.exp(-dt * 12), ky = 1 - Math.exp(-dt * 7), ks = 1 - Math.exp(-dt * 14);
      for (let i = 0; i < list.length; i++) {
        const c = list[i], v = c.vis;
        const seg = T.findSegment(c.z);
        const sp = c.speed / c.st.vmax;
        let lv = (c.x - c.lastX) / dt;
        if (Math.abs(lv) > 12) lv = 0;
        c.latV += (lv - c.latV) * kx;
        const acc = U.clamp((c.speed - c.lastSpeed) / dt, -9000, 6000);
        c.lastX = c.x; c.lastSpeed = c.speed;
        // guiñada: el morro sigue la trayectoria; al derrapar entra más en la curva
        const slide = c.isPlayer ? c.slip * 0.15 * (Math.sign(seg.curve) || Math.sign(c.steer) || 0) : 0;
        const spin = c.spinT > 0 ? Math.sin(this.time * 17) * 0.06 : 0;
        // al girar, la carrocería apunta sutilmente hacia el lado del giro y deja ver el costado y la rueda
        const steerYaw = c.isPlayer ? c.steer * 0.13 * Math.min(1, 0.35 + sp * 1.3) : c.steerVis * 0.06 * Math.min(1, sp * 1.6);
        const yawT = U.clamp(((c.latV * C.ROAD_W) / Math.max(c.speed, 1400)) * 0.45 + steerYaw, -0.26, 0.26) + slide + spin;
        v.yaw += (yawT - v.yaw) * ky;
        // ruedas delanteras: giran con la dirección (la IA también las gira en las curvas)
        const st = c.isPlayer ? c.steer : U.clamp(c.steerVis + seg.curve * sp * 0.09, -1, 1);
        v.steer += (st * U.lerp(0.46, 0.3, Math.min(1, sp)) - v.steer) * ks;
        // inclinación sutil hacia el lado al que se gira (derecha → derecha, izquierda → izquierda)
        const turn = c.isPlayer ? c.steer : U.clamp(c.steerVis + seg.curve * sp * 0.09, -1, 1);
        const rollT = U.clamp(turn * 0.042 * Math.min(1, 0.3 + sp * 1.2) + U.clamp(c.latV, -3, 3) * 0.004, -0.06, 0.06);
        v.rollV += ((rollT - v.roll) * 110 - v.rollV * 12) * dt;
        v.roll += v.rollV * dt;
        // cabeceo: se agacha al acelerar y hunde el morro al frenar
        const pitchT = U.clamp(acc > 0 ? acc * 0.000014 : acc * 0.0000075, -0.036, 0.024);
        v.pitchV += ((pitchT - v.pitch) * 95 - v.pitchV * 11) * dt;
        v.pitch += v.pitchV * dt;
        // suspensión: baches fuera de pista y vibración a alta velocidad
        if (c.offroad && c.speed > 200) { v.heaveV += U.rand(-1, 1) * 0.05 * Math.min(1, sp * 1.4); v.rollV += U.rand(-1, 1) * 0.06; }
        else if (sp > 0.5) v.heaveV += U.rand(-1, 1) * 0.004 * sp;
        v.heaveV += (-v.heave * 160 - v.heaveV * 13) * dt;
        v.heave += v.heaveV * dt;
        v.heave = U.clamp(v.heave, -0.02, 0.02);
        v.roll = U.clamp(v.roll, -0.1, 0.1);
        v.pitch = U.clamp(v.pitch, -0.06, 0.05);
        v.blur = sp > 0.28 ? 1 : 0;
      }
    }

    step(dt) {
      this.phaseT += dt;
      if (this.phase === 'intro') {
        this.idle(dt);
        if (this.phaseT >= INTRO) { this.phase = 'count'; this.phaseT = 0; this.countN = 3; this.emit('count', { n: 3 }); }
        return;
      }
      if (this.phase === 'count') {
        this.idle(dt);
        const n = 3 - Math.floor(this.phaseT);
        if (n > 0 && n !== this.countN) { this.countN = n; this.emit('count', { n }); }
        if (this.phaseT >= COUNT) { this.phase = 'race'; this.phaseT = 0; this.emit('go'); this.launch(); }
        return;
      }
      this.time += dt;
      for (let i = 0; i < this.cars.length; i++) {
        const car = this.cars[i];
        if (car.isPlayer) this.stepPlayer(car, dt, car.autopilot ? this.autoInput(car, dt) : car.inp || {});
        else this.stepAI(car, dt);
      }
      if (this.mode === 'time') this.stepGhost(dt);
      this.collisions(dt);
      this.updatePositions();
      this.updateRubber();
      if (!this.demo && this.phase === 'race' && this.players.every((p) => p.finished)) {
        this.phase = 'done'; this.phaseT = 0; this.emit('allFinished');
      }
      if (this.phase === 'done' && this.phaseT > 3.6 && !this.ended) { this.ended = true; this.emit('end'); }
    }

    idle(dt) {
      for (const car of this.players) {
        const acc = !car.autopilot && car.inp && car.inp.accel;
        const eng = car.model.eng;
        const target = eng.idle + (eng.red - eng.idle) * (acc ? 0.95 : 0);
        car.rpm = U.approach(car.rpm, target, (acc ? 5000 : 3800) * dt);
        car.throttle = acc ? 1 : 0;
        car.burn = U.approach(car.burn, acc && this.phase === 'count' && car.rpm > eng.red * 0.88 ? 1 : 0, dt * 3);
      }
      for (const car of this.cars) if (!car.isPlayer) car.rpm = car.model.eng.idle * 1.2;
    }

    launch() {
      for (const car of this.players) {
        car.lapStart = 0;
        if (car.autopilot) continue;
        const r = car.rpm / car.model.eng.red;
        if (car.inp && car.inp.accel) {
          if (r >= 0.55 && r <= 0.84) { car.speed = car.st.vmax * 0.24; car.perfect = true; this.emit('perfect', { car }); }
          else if (r > 0.9) { car.spinT = 1.1; this.emit('spin', { car }); }
        }
      }
      for (const car of this.cars) if (car.ai) car.speed = car.ai.vmax * 0.02;
    }

    gearTop(car, g) { return car.st.vmax * Math.pow(g / car.st.gears, 0.72); }

    stepPlayer(car, dt, inp) {
      const T = this.track, st = car.st;
      const seg = T.findSegment(car.z);
      if (car.finished && !car.autopilot) car.autopilot = true;

      // nitro y marchas manuales
      if (inp.nitro && car.nitroT <= 0 && car.nitroN > 0 && !car.finished) {
        car.nitroN--; car.nitroT = st.nitroDur; this.emit('nitro', { car });
      }
      const eng0 = car.model.eng;
      if (car.manual && !car.autopilot) {
        if (inp.up && car.gear < st.gears) {
          car.gear++; car.shiftT = st.shift * 0.7; car.shiftPuff = 0.07; this.emit('shift', { car });
          if (car.rpm > eng0.red * 0.8 && Math.random() < 0.45) { car.backfire = 0.08; this.emit('backfire', { car, soft: true }); }
        }
        if (inp.down && car.gear > 1) { car.gear--; car.shiftT = st.shift * 0.4; this.emit('shift', { car }); }
      }

      const grip = st.grip * (this.gripW + (1 - this.gripW) * st.tires * 0.18);
      let vmax = st.vmax;
      if (car.nitroT > 0) vmax *= st.nitroPow;
      if (car.draft > 0.5) vmax *= 1.05;

      // dirección: rampa progresiva, más suave cuanto más rápido (estabilidad)
      let target = inp.steerTarget != null ? inp.steerTarget : (inp.left ? -1 : 0) + (inp.right ? 1 : 0);
      const sp = car.speed / st.vmax;
      const hs = U.clamp((sp - 0.3) / 0.7, 0, 1);
      const reversing = target !== 0 && car.steer !== 0 && Math.sign(target) !== Math.sign(car.steer);
      const rate = target === 0 ? U.lerp(7.5, 5.6, hs) : reversing ? U.lerp(10, 7.2, hs) : U.lerp(5.2, 3.5, hs);
      car.steer = U.approach(car.steer, target, rate * dt);
      const auth = U.clamp(car.speed / (st.vmax * 0.22), 0, 1);
      const crashK = car.crashT > 0 ? 0.35 : 1;
      const drift = (seg.curve * sp * sp * C.CENTRI) / grip;
      // inercia lateral: el coche no se desplaza de golpe, sigue a la dirección con un pequeño retardo
      const want = car.steer * C.STEER * auth * crashK * (0.92 + 0.08 * grip) - drift;
      const resp = (car.offroad ? 6.5 : 10.5) * (0.88 + 0.12 * Math.min(1.5, grip));
      car.vx += (want - car.vx) * (1 - Math.exp(-resp * dt));
      car.x += car.vx * dt;
      // derrape: cuando la curva pide casi todo el agarre, o al frenar fuerte girando
      const turning = Math.abs(car.steer);
      const demand = Math.abs(drift) / (C.STEER * 0.95);
      let slipT = U.clamp((demand - 0.62) * 2.3, 0, 1) * U.clamp(sp * 1.5, 0, 1);
      if (turning > 0.6 && sp > 0.62) slipT = Math.max(slipT, (sp - 0.62) * 2.1 * turning * (Math.sign(car.steer) === Math.sign(seg.curve) ? 1 : 0.55));
      if (inp.brake && sp > 0.45) slipT = Math.max(slipT, (sp - 0.45) * (0.45 + turning) * 1.3);
      if (this.gripW < 1) slipT *= 1.15;
      car.slip = U.approach(car.slip, U.clamp(slipT, 0, 1), dt * (slipT > car.slip ? 5 : 2.5));
      if (car.slip > 0.3) car.speed -= car.slip * st.vmax * 0.035 * dt;
      car.offroad = Math.abs(car.x) > 1.0 + C.CAR_W * 0.25;

      // motor
      const eng = car.model.eng;
      const acc = !!inp.accel && !(car.finished && !car.autopilot);
      car.throttle = U.approach(car.throttle, acc ? 1 : 0, dt * 8);
      if (car.lastThr > 0.85 && car.throttle < 0.3 && car.rpm > eng.red * 0.66 && car.backfire <= 0) {
        if (Math.random() < 0.6) { car.backfire = 0.1; car.shiftPuff = 0.06; this.emit('backfire', { car }); }
      }
      car.lastThr = car.throttle > car.lastThr || car.throttle < 0.3 ? car.throttle : car.lastThr;
      if (car.backfire > 0) car.backfire -= dt;
      let a = st.accel * Math.max(0, 1 - Math.pow(car.speed / vmax, 2.2));
      if (car.manual) {
        const gt = this.gearTop(car, car.gear);
        const rn = car.speed / gt;
        if (rn >= 1) a = 0;
        else if (rn < 0.4 && car.gear > 1) a *= 0.3 + rn;
        a *= 1.05;
      }
      if (car.shiftT > 0) { car.shiftT -= dt; a *= 0.25; }
      if (car.fuel <= 0) a *= 0.28;
      if (car.nitroT > 0) a *= 2.1;
      if (car.draft > 0.5) a *= 1.12;
      if (car.spinT > 0) { car.spinT -= dt; a *= 0.45; }
      if (car.offroad) vmax = Math.min(vmax, st.vmax * (0.34 + st.tires * 0.035));
      if (inp.brake) {
        car.speed -= st.vmax * 0.62 * dt;
        car.braking = car.speed > 1;
      } else {
        car.braking = false;
        if (car.throttle > 0.05) car.speed += a * car.throttle * dt;
        else car.speed -= st.vmax * 0.1 * dt;
      }
      if (car.speed > vmax) car.speed = Math.max(vmax, car.speed - st.vmax * (car.offroad ? 1.1 : 0.3) * dt);
      const slope = (seg.p2.world.y - seg.p1.world.y) / C.SEG;
      car.speed -= slope * 900 * dt;
      car.speed = U.clamp(car.speed, 0, st.vmax * 1.6);

      // saltos en cambios de rasante
      const next = T.segments[(seg.index + 1) % T.N];
      const dSlope = (next.p2.world.y - next.p1.world.y) / C.SEG - slope;
      if (dSlope < -0.03 && sp > 0.55 && car.air <= 0 && car.airV <= 0) car.airV = -dSlope * car.speed * 1.4;
      if (car.air > 0 || car.airV > 0) {
        car.airV -= 2800 * dt;
        car.air += car.airV * dt;
        if (car.air <= 0) { car.air = 0; if (car.airV < -350) { this.emit('land', { car }); car.vis.heaveV -= 0.1; car.vis.pitchV -= 0.2; } car.airV = 0; }
      }

      // combustible
      if (!this.demo) {
        car.fuel -= this.fuelRate * st.fuelUse * (0.25 + car.throttle * 0.75) * (0.4 + 0.6 * Math.min(1, sp)) * dt;
        if (car.fuel < 0) car.fuel = 0;
        if (car.fuel < 20 && !car.lowFuelWarned) { car.lowFuelWarned = true; this.emit('lowfuel', { car }); }
        if (car.fuel > 30) car.lowFuelWarned = false;
      }
      if (car.nitroT > 0) car.nitroT -= dt;
      if (car.crashT > 0) car.crashT -= dt;

      // marchas automáticas y rpm
      if (!car.manual || car.autopilot) {
        if (car.shiftT <= 0) {
          const rn = car.speed / this.gearTop(car, car.gear);
          if (rn > 0.95 && car.gear < st.gears) {
            car.gear++; car.shiftT = st.shift; car.shiftPuff = 0.07; this.emit('shift', { car });
            if (car.throttle > 0.8 && Math.random() < 0.3) { car.backfire = 0.08; this.emit('backfire', { car, soft: true }); }
          }
          else if (car.gear > 1 && car.speed < this.gearTop(car, car.gear - 1) * 0.72) { car.gear--; car.shiftT = st.shift * 0.4; }
        }
      }
      const rn = U.clamp(car.speed / this.gearTop(car, car.gear), 0, 1.03);
      const rpmT = eng.idle + (eng.red - eng.idle) * rn;
      car.rpm = U.lerp(car.rpm, rpmT, 1 - Math.exp(-dt * (car.shiftT > 0 ? 30 : 16)));
      if (car.manual && rn >= 1 && acc) car.rpm = eng.red * (0.97 + Math.random() * 0.03);

      // rebufo
      const ahead = this.nearestAhead(car, 13 * C.SEG, 0.26);
      if (ahead && ahead.dz > C.SEG * 1.2 && car.speed > st.vmax * 0.5) car.draft = Math.min(1, car.draft + dt * 1.4);
      else car.draft = Math.max(0, car.draft - dt * 2);

      // avance
      const oldZ = car.z;
      car.z = U.increase(car.z, car.speed * dt, T.length);
      if (car.z < oldZ && car.speed > 0) this.lapCross(car);
      this.sceneryCollide(car, oldZ);
      this.pickupCheck(car, oldZ);
      if (Math.abs(car.x) > 3.2) { car.x = U.clamp(car.x, -3.2, 3.2); car.vx = 0; }
      car.steerVis = car.steer;
    }

    autoInput(car, dt) {
      const T = this.track, st = car.st;
      const seg = T.findSegment(car.z);
      let maxC = 0;
      const look = 10 + Math.floor(car.speed / C.SEG);
      for (let i = 2; i < look; i += 2) maxC = Math.max(maxC, Math.abs(T.segments[(seg.index + i) % T.N].curve));
      const grip = st.grip * this.gripW;
      const spMax = maxC > 0.1 ? Math.sqrt((0.7 * C.STEER * grip) / (maxC * C.CENTRI)) : 2;
      const vT = Math.min(this.demo ? 0.93 : 0.97, spMax) * st.vmax;
      car.apLaneT -= dt;
      const ahead = this.nearestAhead(car, 9 * C.SEG, 0.4);
      if (ahead && car.apLaneT <= 0 && car.speed > ahead.car.speed * 0.9) {
        const lane = this.freeLane(car);
        if (lane != null) { car.apLane = lane; car.apLaneT = 1.5; }
      }
      const sp = car.speed / st.vmax;
      const drift = (seg.curve * sp * sp * C.CENTRI) / grip;
      const auth = Math.max(0.15, U.clamp(car.speed / (st.vmax * 0.22), 0, 1));
      const need = (drift + (car.apLane - car.x) * 2.6) / (C.STEER * auth);
      return { accel: car.speed < vT * 0.99, brake: car.speed > vT * 1.1, steerTarget: U.clamp(need, -1, 1) };
    }

    nearestAhead(car, range, lat) {
      const L = this.track.length;
      let best = null, bd = range;
      for (let i = 0; i < this.cars.length; i++) {
        const o = this.cars[i];
        if (o === car) continue;
        let dz = o.z - car.z;
        if (dz < -L / 2) dz += L; else if (dz > L / 2) dz -= L;
        if (dz <= 0 || dz > bd) continue;
        if (Math.abs(o.x - car.x) > lat) continue;
        bd = dz; best = o;
      }
      return best ? { car: best, dz: bd } : null;
    }

    freeLane(car) {
      const L = this.track.length;
      const opts = LANES.slice().sort((a, b) => Math.abs(a - car.x) - Math.abs(b - car.x));
      for (const lane of opts) {
        if (Math.abs(lane - car.x) < 0.2) continue;
        let ok = true;
        for (let i = 0; i < this.cars.length && ok; i++) {
          const o = this.cars[i];
          if (o === car) continue;
          let dz = o.z - car.z;
          if (dz < -L / 2) dz += L; else if (dz > L / 2) dz -= L;
          if (dz > -3 * C.SEG && dz < 10 * C.SEG && Math.abs(o.x - lane) < C.CAR_W * 1.05) ok = false;
        }
        if (ok) return lane;
      }
      return null;
    }

    stepAI(car, dt) {
      const T = this.track, ai = car.ai, st = car.st;
      const seg = T.findSegment(car.z);
      const look = 12 + Math.floor((car.speed / C.SEG) * 0.9);
      let maxC = 0;
      for (let i = 2; i < look; i += 2) { const c = Math.abs(T.segments[(seg.index + i) % T.N].curve); if (c > maxC) maxC = c; }
      let target = ai.vmax;
      const snow = this.theme.weather === 'snow';
      const tol = ai.tol + (this.gripW < 1 ? (snow ? -0.9 : -0.6) : 0);
      if (maxC > tol) target *= Math.max(0.55, 1 - (maxC - tol) * ai.brakeK);
      if (this.gripW < 1) target *= snow ? 0.965 : 0.982;
      // errores ocasionales (más frecuentes en las primeras copas)
      if (ai.errT > 0) { ai.errT -= dt; target *= 0.88; }
      else if (this.phase === 'race' && maxC > 2 && Math.random() < ai.mistake * dt) ai.errT = U.rand(0.5, 1.2);
      target *= ai.rubber;
      if (car.nitroT > 0) target *= 1.14;
      if (car.finished) target *= 0.85;
      ai.laneT -= dt;
      // en niveles altos los mejores rivales defienden la posición cerrando el hueco
      if (ai.defT > 0) ai.defT -= dt;
      else if (ai.lvl > 0.35 && ai.skill > 0.45 && this.phase === 'race' && !car.finished) {
        const L = this.track.length;
        for (let i = 0; i < this.players.length; i++) {
          const p = this.players[i];
          let dz = car.z - p.z;
          if (dz < -L / 2) dz += L; else if (dz > L / 2) dz -= L;
          if (dz > C.SEG * 1.5 && dz < C.SEG * 6 && p.speed > car.speed * 1.01 && Math.random() < ai.lvl * 0.9 * dt) {
            ai.lane = U.clamp(p.x, -0.62, 0.62); ai.laneT = 1.1; ai.defT = U.rand(4, 7);
            break;
          }
        }
      }
      const ahead = this.nearestAhead(car, 8 * C.SEG, C.CAR_W * 1.1);
      if (ahead) {
        if (ai.laneT <= 0 && ahead.car.speed < car.speed * 1.02) {
          const lane = this.freeLane(car);
          if (lane != null) { ai.lane = lane; ai.laneT = 1.3 + Math.random(); }
          else ai.laneT = 0.4;
        }
        if (ahead.dz < 3.5 * C.SEG && Math.abs(ahead.car.x - car.x) < C.CAR_W * 0.98) target = Math.min(target, ahead.car.speed * 0.98);
      }
      const a = st.accel * Math.max(0.06, 1 - Math.pow(car.speed / (ai.vmax * 1.25), 2));
      if (car.speed < target) car.speed = Math.min(target, car.speed + a * dt);
      else car.speed = Math.max(target, car.speed - st.vmax * 0.55 * dt);
      car.braking = car.speed > target + 40 || target < ai.vmax * ai.rubber * 0.9;
      car.throttle = car.speed < target - 20 ? 1 : 0.35;
      const tx = U.clamp(ai.lane + ai.jitter, -0.8, 0.8);
      const dx = tx - car.x;
      const mv = Math.sign(dx) * Math.min(Math.abs(dx), ai.lat * dt);
      car.x += mv;
      car.steerVis = U.approach(car.steerVis, U.clamp(dx * 4, -1, 1), dt * 5);
      if (ai.nitroN > 0 && this.phase === 'race' && car.lapsDone >= 1 && maxC < 1 && car.speed > ai.vmax * 0.8 && Math.random() < dt * 0.08) {
        ai.nitroN--; car.nitroT = 2.2;
      }
      if (car.nitroT > 0) car.nitroT -= dt;
      if (car.backfire > 0) car.backfire -= dt;
      if (car.bumpSmoke > 0) car.bumpSmoke = Math.max(0, car.bumpSmoke - dt * 1.5);
      const gt = this.gearTop(car, car.gear);
      if (car.speed > gt * 0.95 && car.gear < st.gears) { car.gear++; car.shiftPuff = 0.05; if (Math.random() < 0.12) car.backfire = 0.07; }
      else if (car.gear > 1 && car.speed < this.gearTop(car, car.gear - 1) * 0.72) car.gear--;
      car.rpm = car.model.eng.idle + (car.model.eng.red - car.model.eng.idle) * U.clamp(car.speed / this.gearTop(car, car.gear), 0, 1);
      const oldZ = car.z;
      car.z = U.increase(car.z, car.speed * dt, T.length);
      if (car.z < oldZ) this.lapCross(car);
    }

    lapCross(car) {
      car.lapsDone++;
      if (car.lapsDone >= 1 && !car.finished) {
        const lt = this.time - car.lapStart;
        car.laps.push(lt);
        car.lastLap = lt;
        const best = car.bestLap == null || lt < car.bestLap;
        if (best) car.bestLap = lt;
        if (car.isPlayer) this.emit('lap', { car, time: lt, best });
        if (car.isPlayer && this.ghostRec && best && this.ghostRec.length > 8) {
          this.ghostBest = { dt: 0.05, s: this.ghostRec.slice(), car: car.model.id, color: car.color, time: lt };
        }
      }
      car.lapStart = this.time;
      if (car.isPlayer && this.ghostRec) {
        this.ghostRec = [Math.round(car.z / 10), Math.round(car.x * 100)];
        this.ghostAcc = 0;
      }
      if (!car.finished && car.lapsDone >= this.laps) {
        car.finished = true;
        car.finishTime = this.time;
        car.finishPos = ++this.finishedCount;
        if (car.isPlayer) this.emit('finish', { car, pos: car.pos });
      } else if (car.isPlayer && car.lapsDone === this.laps - 1 && this.laps > 1) {
        this.emit('finalLap', { car });
      }
    }

    spriteHit(def, sp, x) {
      const RW = C.ROAD_W;
      const half = C.CAR_W * 0.5 * RW * 0.85;
      const cl = x * RW - half, cr = x * RW + half;
      const a = def.ax != null ? def.ax : sp.offset < 0 ? 1 : 0;
      const left = sp.offset * RW - a * def.w;
      for (let i = 0; i < def.col.length; i++) {
        const l = left + def.col[i][0] * def.w, r = left + def.col[i][1] * def.w;
        if (cr > l && cl < r) return true;
      }
      return false;
    }

    sceneryCollide(car, oldZ) {
      if (Math.abs(car.x) < 1.05 || car.crashT > 0 || !this.sprites) return;
      const T = this.track;
      const i0 = Math.floor(oldZ / C.SEG), i1 = Math.floor(car.z / C.SEG);
      const n = (((i1 - i0) % T.N) + T.N) % T.N;
      for (let k = 0; k <= n; k++) {
        const seg = T.segments[(i0 + k) % T.N];
        for (let j = 0; j < seg.sprites.length; j++) {
          const sp = seg.sprites[j];
          const def = this.sprites[sp.name];
          if (!def || !def.col) continue;
          if (this.spriteHit(def, sp, car.x)) { this.crash(car, sp, def); return; }
        }
      }
    }

    crash(car, sp, def) {
      const st = car.st;
      const soft = !!def.soft;
      const before = car.speed;
      if (soft) car.speed *= 0.55;
      else car.speed = Math.min(car.speed, st.vmax * (0.1 + (1 - st.crash) * 0.5));
      car.crashT = 0.6;
      const dir = car.x > 0 ? -1 : 1;
      car.x += dir * (soft ? 0.08 : 0.16);
      car.vx = dir * (soft ? 0.9 : 1.8);
      car.vis.heaveV += soft ? 0.03 : 0.07;
      car.vis.rollV += dir * (soft ? 0.25 : 0.8);
      car.nitroT = 0;
      if (!soft && before > st.vmax * 0.25) car.crashes++;
      this.emit('crash', { car, soft, strength: before / st.vmax });
    }

    pickupCheck(car, oldZ) {
      const T = this.track;
      const i0 = Math.floor(oldZ / C.SEG), i1 = Math.floor(car.z / C.SEG);
      const n = (((i1 - i0) % T.N) + T.N) % T.N;
      for (let k = 0; k <= n; k++) {
        const seg = T.segments[(i0 + k) % T.N];
        for (let j = 0; j < seg.pickups.length; j++) {
          const p = seg.pickups[j];
          if (p.taken[car.pIndex] === car.lapsDone) continue;
          if (Math.abs(car.x - p.x) > 0.36 || car.air > 120) continue;
          p.taken[car.pIndex] = car.lapsDone;
          if (p.type === 'coin') { car.coins++; car.coinMoney += this.coinValue; }
          else if (p.type === 'fuel') car.fuel = Math.min(100, car.fuel + 38);
          else if (p.type === 'nitro') car.nitroN = Math.min(car.nitroN + 1, car.st.nitroN + 2);
          this.emit('pickup', { car, kind: p.type, value: p.type === 'coin' ? this.coinValue : 0 });
        }
      }
    }

    collisions(dt) {
      const L = this.track.length, CW = C.CAR_W * 0.92, CL = C.CAR_LEN;
      for (const p of this.players) {
        if (p.bumpT > 0) p.bumpT -= dt;
        for (let i = 0; i < this.cars.length; i++) {
          const o = this.cars[i];
          if (o === p) continue;
          let dz = o.z - p.z;
          if (dz > L / 2) dz -= L; else if (dz < -L / 2) dz += L;
          if (Math.abs(dz) > CL) continue;
          const dx = o.x - p.x;
          if (Math.abs(dx) > CW) continue;
          if (dz > 0 && p.speed > o.speed) {
            const dv = p.speed - o.speed;
            p.speed = Math.max(0, o.speed * 0.95 - dv * 0.05);
            o.speed += dv * 0.35;
            if (p.bumpT <= 0) { this.emit('bump', { car: p, other: o, strength: dv / p.st.vmax }); p.bumpT = 0.35; }
          } else if (dz <= 0 && o.speed > p.speed) {
            const dv = o.speed - p.speed;
            o.speed = p.speed * 0.96;
            p.speed += dv * 0.3;
            if (p.bumpT <= 0) { this.emit('bump', { car: p, other: o, strength: (dv / p.st.vmax) * 0.6 }); p.bumpT = 0.35; }
          }
          const push = (CW - Math.abs(dx)) * 0.5 + 0.005;
          const s = dx >= 0 ? -1 : 1;
          p.x += s * push;
          o.x -= s * push;
          p.vx += s * 0.5;
          if (p.bumpT > 0.3) { p.vis.rollV += s * 0.35; o.vis.rollV -= s * 0.35; o.bumpSmoke = Math.max(o.bumpSmoke, 0.7); }
          if (o.ai) { o.ai.lane = U.clamp(o.x - s * 0.1, -0.7, 0.7); o.ai.laneT = 0.8; }
        }
      }
    }

    updatePositions() {
      const L = this.track.length;
      for (let i = 0; i < this.cars.length; i++) { const c = this.cars[i]; c.progress = c.lapsDone * L + c.z; }
      const sorted = this.cars.slice().sort((a, b) => {
        if (a.finished && b.finished) return a.finishTime - b.finishTime;
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.progress - a.progress;
      });
      for (let i = 0; i < sorted.length; i++) {
        const c = sorted[i];
        if (c.isPlayer && c.pos && i + 1 !== c.pos && this.phase === 'race' && !c.finished && !this.demo) {
          this.emit(i + 1 < c.pos ? 'posUp' : 'posDown', { car: c, pos: i + 1 });
        }
        c.pos = i + 1;
      }
      this.order = sorted;
    }

    updateRubber() {
      if (this.demo || !this.players.length) return;
      const L = this.track.length;
      let ref = -Infinity;
      for (const p of this.players) ref = Math.max(ref, p.progress);
      for (const c of this.cars) {
        if (!c.ai) continue;
        const d = (c.progress - ref) / L;
        let r = 1;
        const lv = c.ai.lvl;
        if (d > 0.06) r = U.lerp(1, U.lerp(0.9, 0.955, lv), U.clamp((d - 0.06) / 0.3, 0, 1));
        else if (d < -0.12) r = U.lerp(1, U.lerp(1.03, 1.07, lv), U.clamp((-d - 0.12) / 0.3, 0, 1));
        c.ai.rubber = r;
      }
    }

    updateCams(dt) {
      const introE = this.phase === 'intro' ? U.easeInOutCubic(U.clamp(this.phaseT / INTRO, 0, 1)) : 1;
      for (const v of this.views) {
        const p = v.player, cam = v.cam;
        cam.h = U.lerp(cam.base * 5.5, cam.base, introE);
        cam.extra = U.lerp(7000, 0, introE);
        cam.x = U.lerp(cam.x, p.x, 1 - Math.exp(-dt * 8));
        const sp = p.speed / p.st.vmax;
        const fovT = C.FOV + (p.nitroT > 0 ? 16 : 0) + Math.max(0, sp - 0.55) * 12;
        cam.fov = U.lerp(cam.fov, fovT, 1 - Math.exp(-dt * 3.2));
        cam.shake = Math.max(0, cam.shake - dt * 2.2);
        if (p.offroad && p.speed > 300) cam.shake = Math.max(cam.shake, 0.25);
        v.hitFlash = Math.max(0, v.hitFlash - dt * 2);
      }
    }

    results() {
      const L = this.track.length;
      const list = this.cars.map((c) => {
        let t = c.finished ? c.finishTime : null;
        if (t == null) {
          const remain = Math.max(0, this.laps * L - c.progress);
          const v = c.ai ? c.ai.vmax * 0.9 : Math.max(c.speed, c.st.vmax * 0.5);
          t = this.time + remain / Math.max(1, v);
        }
        return { car: c, time: t };
      });
      list.sort((a, b) => a.time - b.time);
      return list.map((r, i) => ({
        pos: i + 1, name: r.car.name, model: r.car.model, color: r.car.color, time: r.time, finished: r.car.finished,
        bestLap: r.car.bestLap, isPlayer: r.car.isPlayer, pIndex: r.car.pIndex, did: r.car.ai ? r.car.ai.did : null, car: r.car,
      }));
    }
  }

  TG.Race = Race;
})(window.TG);
