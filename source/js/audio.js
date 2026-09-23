'use strict';
/* ============================================================
   Audio sintetizado (Web Audio): efectos, motores y ambiente
   ============================================================ */
(function (TG) {
  const U = TG.U;
  const A = (TG.Audio = { ctx: null, ready: false });

  A.init = function () {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { A.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { A.ctx = new AC(); } catch (e2) { return; } }
    const ctx = A.ctx;
    A.comp = ctx.createDynamicsCompressor();
    A.comp.threshold.value = -16; A.comp.knee.value = 14; A.comp.ratio.value = 4; A.comp.attack.value = 0.004; A.comp.release.value = 0.2;
    A.comp.connect(ctx.destination);
    A.master = ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.comp);
    A.sfx = ctx.createGain(); A.sfx.connect(A.master);
    A.music = ctx.createGain(); A.music.connect(A.master);
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = buf;
    const bb = ctx.createBuffer(1, len, ctx.sampleRate);
    const bd = bb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
    A.brown = bb;
    A.ready = true;
    A.apply();
    if (ctx.state === 'suspended') ctx.resume();
    if (TG.Music) TG.Music.onReady();
  };

  A.apply = function () {
    if (!A.ready) return;
    const s = TG.Save.data.settings;
    const t = A.ctx.currentTime;
    A.sfx.gain.setTargetAtTime(s.sfx, t, 0.02);
    A.music.gain.setTargetAtTime(s.music * 0.62 * (A.musicMuted ? 0 : 1), t, 0.05);
  };

  A.tone = function (o) {
    if (!A.ready) return;
    const ctx = A.ctx;
    const t = o.when || ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(10, o.f2), t + (o.glide || o.dur || 0.2));
    const g = ctx.createGain();
    const a = o.attack || 0.004, dur = o.dur || 0.2, vol = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    let out = g;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.value = o.filter.f;
      f.Q.value = o.filter.q || 0.8;
      g.connect(f);
      out = f;
    }
    out.connect(o.dest || A.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };

  A.noiseHit = function (o) {
    if (!A.ready) return;
    const ctx = A.ctx;
    const t = o.when || ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = o.brown ? A.brown : A.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.dur || 0.3));
    const g = ctx.createGain();
    const a = o.attack || 0.004, dur = o.dur || 0.3, vol = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || A.sfx);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  };

  A.play = function (name, opt) {
    if (!A.ready) return;
    const t = A.ctx.currentTime;
    const T = (o) => A.tone(o), N = (o) => A.noiseHit(o);
    switch (name) {
      case 'nav': T({ f: 1500, type: 'square', dur: 0.04, vol: 0.05, filter: { f: 3500 } }); break;
      case 'select':
        T({ f: 660, f2: 1320, type: 'triangle', dur: 0.14, vol: 0.15, glide: 0.07 });
        T({ f: 1320, type: 'sine', dur: 0.22, vol: 0.05, when: t + 0.06 });
        break;
      case 'back': T({ f: 620, f2: 310, type: 'triangle', dur: 0.14, vol: 0.1 }); break;
      case 'error':
        T({ f: 150, type: 'sawtooth', dur: 0.14, vol: 0.1, filter: { f: 900 } });
        T({ f: 130, type: 'sawtooth', dur: 0.18, vol: 0.1, when: t + 0.12, filter: { f: 900 } });
        break;
      case 'buy':
        N({ dur: 0.05, vol: 0.18, type: 'highpass', f: 3500 });
        [1568, 2093, 2637, 3136].forEach((f, i) => T({ f, type: 'sine', dur: 0.8, vol: 0.08, when: t + 0.05 + i * 0.05 }));
        break;
      case 'upgrade':
        N({ dur: 0.35, vol: 0.12, type: 'bandpass', f: 500, f2: 3000, q: 1.2 });
        [523, 659, 784, 1046].forEach((f, i) => T({ f, type: 'square', dur: 0.18, vol: 0.05, when: t + 0.08 + i * 0.06, filter: { f: 3000 } }));
        break;
      case 'count': T({ f: 520, type: 'square', dur: 0.22, vol: 0.16, filter: { f: 2400 } }); break;
      case 'go':
        T({ f: 1040, type: 'square', dur: 0.6, vol: 0.18, filter: { f: 3000 } });
        T({ f: 520, type: 'square', dur: 0.6, vol: 0.07, filter: { f: 2000 } });
        break;
      case 'coin':
        T({ f: 1318, type: 'square', dur: 0.07, vol: 0.15, filter: { f: 5000 } });
        T({ f: 1976, type: 'square', dur: 0.22, vol: 0.15, when: t + 0.065, filter: { f: 6000 } });
        break;
      case 'fuel':
        T({ f: 260, f2: 900, type: 'sine', dur: 0.3, vol: 0.26 });
        T({ f: 420, f2: 1300, type: 'triangle', dur: 0.26, vol: 0.07, when: t + 0.08 });
        break;
      case 'nitroPick': [880, 1175, 1397, 1760].forEach((f, i) => T({ f, type: 'square', dur: 0.1, vol: 0.1, when: t + i * 0.045, filter: { f: 4500 } })); break;
      case 'nitro':
        N({ dur: 1.1, vol: 0.55, type: 'bandpass', f: 380, f2: 3600, q: 0.7, attack: 0.02 });
        T({ f: 72, f2: 38, type: 'sine', dur: 0.7, vol: 0.45 });
        break;
      case 'bump':
        N({ dur: 0.15, vol: 0.35 * (opt || 1), type: 'lowpass', f: 1100, f2: 180 });
        T({ f: 120, f2: 60, type: 'sine', dur: 0.14, vol: 0.28 * (opt || 1) });
        break;
      case 'crash':
        N({ dur: 0.7, vol: 0.55, type: 'lowpass', f: 3000, f2: 120 });
        N({ dur: 0.25, vol: 0.25, type: 'highpass', f: 2500 });
        T({ f: 70, f2: 28, type: 'sine', dur: 0.55, vol: 0.5 });
        [523, 1245, 2093, 2960].forEach((f) => T({ f: f * U.rand(0.95, 1.05), type: 'triangle', dur: 0.35, vol: 0.04 }));
        break;
      case 'soft': N({ dur: 0.3, vol: 0.3, type: 'lowpass', f: 900, f2: 150 }); break;
      case 'lap': [784, 988, 1175].forEach((f, i) => T({ f, type: 'square', dur: 0.16, vol: 0.11, when: t + i * 0.09, filter: { f: 3500 } })); break;
      case 'record': [784, 988, 1175, 1568].forEach((f, i) => T({ f, type: 'square', dur: 0.2, vol: 0.06, when: t + i * 0.08, filter: { f: 4000 } })); break;
      case 'finalLap': [988, 1319, 988, 1319].forEach((f, i) => T({ f, type: 'square', dur: 0.12, vol: 0.11, when: t + i * 0.13, filter: { f: 3500 } })); break;
      case 'finish':
        [523, 659, 784, 1046, 1318].forEach((f, i) => T({ f, type: 'square', dur: 0.3, vol: 0.06, when: t + i * 0.1, filter: { f: 4000 } }));
        [523, 659, 784].forEach((f) => T({ f, type: 'triangle', dur: 1.4, vol: 0.06, when: t + 0.55, attack: 0.02 }));
        break;
      case 'shift': N({ dur: 0.05, vol: 0.08, type: 'highpass', f: 2500 }); break;
      case 'pop': N({ dur: 0.07, vol: 0.22, type: 'lowpass', f: 1500 }); T({ f: 95, type: 'square', dur: 0.05, vol: 0.1, filter: { f: 600 } }); break;
      case 'whoosh': N({ dur: 0.55, vol: opt || 0.15, type: 'bandpass', f: 2200, f2: 500, q: 1.1, attack: 0.08 }); break;
      case 'land': T({ f: 95, f2: 40, type: 'sine', dur: 0.22, vol: 0.35 }); N({ dur: 0.12, vol: 0.2, type: 'lowpass', f: 700 }); break;
      case 'thunder':
        N({ dur: 3.2, vol: 0.45, type: 'lowpass', f: 420, f2: 50, attack: 0.04, brown: true });
        N({ dur: 1.4, vol: 0.2, type: 'lowpass', f: 1200, f2: 90, attack: 0.01, when: t + 0.05 });
        break;
      case 'lowfuel': T({ f: 880, type: 'square', dur: 0.1, vol: 0.1 }); T({ f: 880, type: 'square', dur: 0.1, vol: 0.1, when: t + 0.18 }); break;
      case 'perfect': [659, 988, 1319].forEach((f, i) => T({ f, type: 'triangle', dur: 0.2, vol: 0.09, when: t + i * 0.06 })); break;
      case 'posUp': T({ f: 988, f2: 1480, type: 'triangle', dur: 0.12, vol: 0.08 }); break;
      case 'posDown': T({ f: 660, f2: 440, type: 'triangle', dur: 0.14, vol: 0.04 }); break;
      case 'pause': T({ f: 440, type: 'sine', dur: 0.12, vol: 0.08 }); T({ f: 330, type: 'sine', dur: 0.16, vol: 0.08, when: t + 0.08 }); break;
      case 'trophy':
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => T({ f, type: 'square', dur: 0.24, vol: 0.06, when: t + i * 0.12, filter: { f: 4000 } }));
        [523, 659, 784, 1046].forEach((f) => T({ f, type: 'triangle', dur: 2, vol: 0.05, when: t + 0.9, attack: 0.03 }));
        break;
      default: break;
    }
  };

  /* ---------- Motor ---------- */
  const waveCache = {};
  function engineWave(cyl) {
    const key = cyl >= 12 ? 'hi' : cyl >= 10 ? 'mid' : 'lo';
    if (waveCache[key]) return waveCache[key];
    const n = 24;
    const re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      let a = 1 / Math.pow(i, key === 'lo' ? 0.9 : key === 'mid' ? 0.75 : 0.65);
      if (key === 'lo' && i % 2 === 0) a *= 0.6;
      if (key === 'hi' && i % 3 === 0) a *= 1.3;
      im[i] = a * (0.8 + 0.4 * Math.sin(i * 1.7));
    }
    waveCache[key] = A.ctx.createPeriodicWave(re, im);
    return waveCache[key];
  }
  function distCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
    return c;
  }

  A.engine = function (prof) {
    if (!A.ready) return null;
    const ctx = A.ctx;
    const out = ctx.createGain(); out.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.6; lp.frequency.value = 900;
    const shaper = ctx.createWaveShaper(); shaper.curve = distCurve(prof.cyl >= 12 ? 1.5 : 3); shaper.oversample = '2x';
    const mix = ctx.createGain(); mix.gain.value = 0.42;
    const o1 = ctx.createOscillator(); o1.setPeriodicWave(engineWave(prof.cyl));
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth';
    const o3 = ctx.createOscillator(); o3.type = 'square';
    const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain();
    g1.gain.value = 0.55; g2.gain.value = prof.sub || 0.35; g3.gain.value = 0.08;
    const lfo = ctx.createOscillator(); lfo.type = 'sine';
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.12;
    lfo.connect(lfoG); lfoG.connect(mix.gain);
    const nz = ctx.createBufferSource(); nz.buffer = A.noise; nz.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.Q.value = 0.9;
    const ng = ctx.createGain(); ng.gain.value = 0.07;
    o1.connect(g1); o2.connect(g2); o3.connect(g3);
    g1.connect(mix); g2.connect(mix); g3.connect(mix);
    nz.connect(nf); nf.connect(ng); ng.connect(mix);
    mix.connect(shaper); shaper.connect(lp); lp.connect(out);
    let tw = null, twg = null;
    if (prof.turbo) {
      tw = ctx.createOscillator(); tw.type = 'sine';
      twg = ctx.createGain(); twg.gain.value = 0;
      tw.connect(twg); twg.connect(out);
    }
    if (pan) { out.connect(pan); pan.connect(A.sfx); } else out.connect(A.sfx);
    const nodes = [o1, o2, o3, lfo, nz];
    if (tw) nodes.push(tw);
    nodes.forEach((nd) => { try { nd.start(); } catch (e) { /* ya iniciado */ } });
    let lastThr = 0;
    return {
      set(rpm, throttle, volume, panV) {
        const t = ctx.currentTime;
        const f = Math.max(25, (rpm / 60) * (prof.cyl / 2));
        o1.frequency.setTargetAtTime(f, t, 0.02);
        o2.frequency.setTargetAtTime(f * 0.5, t, 0.02);
        o3.frequency.setTargetAtTime(f * 1.004 + 1.3, t, 0.02);
        lfo.frequency.setTargetAtTime(Math.min(60, f * 0.125), t, 0.05);
        nf.frequency.setTargetAtTime(Math.min(8000, f * 3), t, 0.05);
        lp.frequency.setTargetAtTime(Math.min(12000, 320 + f * (1.6 + throttle * 3.4)), t, 0.04);
        out.gain.setTargetAtTime(Math.max(0, volume) * (0.42 + 0.58 * throttle), t, 0.06);
        if (tw) {
          tw.frequency.setTargetAtTime(1700 + rpm * 0.32, t, 0.12);
          twg.gain.setTargetAtTime(throttle * 0.016 * (rpm / prof.red) * volume, t, 0.18);
          if (lastThr > 0.8 && throttle < 0.2 && rpm > prof.red * 0.6) A.noiseHit({ dur: 0.35, vol: 0.06 * volume, type: 'highpass', f: 3000 });
        }
        if (lastThr > 0.8 && throttle < 0.2 && rpm > prof.red * 0.7 && Math.random() < 0.5) setTimeout(() => A.play('pop'), 60 + Math.random() * 120);
        lastThr = throttle;
        if (pan && panV != null) pan.pan.setTargetAtTime(U.clamp(panV, -1, 1), t, 0.05);
      },
      stop() {
        const t = ctx.currentTime;
        out.gain.setTargetAtTime(0, t, 0.05);
        nodes.forEach((nd) => { try { nd.stop(t + 0.3); } catch (e) { /* detenido */ } });
        setTimeout(() => { try { out.disconnect(); } catch (e) { /* ok */ } }, 600);
      },
    };
  };

  A.loop = function (type, f, q, brown) {
    if (!A.ready) return null;
    const ctx = A.ctx;
    const src = ctx.createBufferSource();
    src.buffer = brown ? A.brown : A.noise;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = type; filt.frequency.value = f; filt.Q.value = q || 0.8;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(filt); filt.connect(g); g.connect(A.sfx);
    src.start(0, Math.random());
    return {
      set(vol, freq) { const t = ctx.currentTime; g.gain.setTargetAtTime(Math.max(0, vol), t, 0.08); if (freq) filt.frequency.setTargetAtTime(freq, t, 0.08); },
      stop() { const t = ctx.currentTime; g.gain.setTargetAtTime(0, t, 0.05); try { src.stop(t + 0.4); } catch (e) { /* ok */ } },
    };
  };

  /* ---------- Gestor de sonido en carrera ---------- */
  A.raceStart = function (race) {
    A.raceStop();
    if (!A.ready) return;
    const st = { race, engines: [], lastNear: null, nearSide: 0 };
    const vol = race.players.length > 1 ? 0.34 : 0.42;
    race.players.forEach((p) => st.engines.push({ car: p, v: A.engine(p.model.eng), vol }));
    st.traffic = A.engine({ cyl: 8, sub: 0.3, turbo: 0, red: 8000 });
    st.wind = A.loop('highpass', 900, 0.5);
    st.screech = A.loop('bandpass', 1600, 6);
    st.off = A.loop('lowpass', 260, 0.7, true);
    st.rain = race.theme.weather === 'rain' ? A.loop('lowpass', 3500, 0.4) : null;
    A.rs = st;
  };
  A.raceUpdate = function (race, paused) {
    const st = A.rs;
    if (!st || st.race !== race || !A.ready) return;
    const mute = paused ? 0 : 1;
    const demo = race.demo;
    st.engines.forEach((e) => {
      const p = e.car;
      if (!e.v) return;
      const k = demo ? 0.35 : 1;
      e.v.set(p.rpm, p.throttle, e.vol * mute * k, race.players.length > 1 ? (p.pIndex ? 0.3 : -0.3) : 0);
    });
    const p = race.players[0];
    const sp = U.clamp(p.speed / p.st.vmax, 0, 1.5);
    const L = race.track.length;
    let near = null, nd = 1e9;
    for (const c of race.cars) {
      if (c.isPlayer) continue;
      let dz = c.z - p.z;
      if (dz > L / 2) dz -= L; else if (dz < -L / 2) dz += L;
      const d = Math.abs(dz) + Math.abs(c.x - p.x) * 400;
      if (d < nd) { nd = d; near = c; near._dz = dz; }
    }
    if (st.traffic) {
      if (near && nd < 3000) {
        const k = 1 - nd / 3000;
        st.traffic.set(near.rpm, 0.8, 0.28 * k * k * mute * (demo ? 0.4 : 1), U.clamp((near.x - p.x) * 1.5, -1, 1));
        const side = Math.sign(near._dz);
        if (st.lastNear === near && st.nearSide !== side && Math.abs(near._dz) < 300) A.play('whoosh', 0.12 + 0.12 * sp);
        st.lastNear = near; st.nearSide = side;
      } else st.traffic.set(1000, 0, 0, 0);
    }
    st.wind && st.wind.set(0.09 * sp * sp * mute, 700 + sp * 1200);
    st.screech && st.screech.set(demo ? 0 : 0.1 * p.slip * Math.min(1, sp * 2) * mute, 1400 + Math.sin(performance.now() / 90) * 200);
    st.off && st.off.set(p.offroad ? 0.35 * Math.min(1, sp * 2) * mute : 0);
    st.rain && st.rain.set(0.08 * mute);
  };
  A.raceStop = function () {
    const st = A.rs;
    if (!st) return;
    st.engines.forEach((e) => e.v && e.v.stop());
    ['traffic', 'wind', 'screech', 'off', 'rain'].forEach((k) => st[k] && st[k].stop());
    A.rs = null;
  };
})(window.TG);
