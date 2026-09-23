'use strict';
/* ============================================================
   Música original sintetizada (secuenciador por pasos)
   ============================================================ */
(function (TG) {
  const A = TG.Audio;
  const M = (TG.Music = { cur: null, name: null, timer: null, pending: null });

  const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m9: [0, 3, 7, 10, 14], sus4: [0, 5, 7], sus2: [0, 2, 7], add9: [0, 4, 7, 14], '6': [0, 4, 7, 9], maj9: [0, 4, 7, 11, 14] };
  const f = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function parseChord(sym) {
    const mm = sym.match(/^([A-G][#b]?)(.*)$/);
    const root = SEMI[mm[1]];
    const iv = QUAL[mm[2]] || QUAL[''];
    return { root, iv };
  }
  function parseBar(str) {
    const tok = str.trim().split(/\s+/);
    const out = [];
    for (let i = 0; i < tok.length; i++) {
      const t = tok[i];
      if (t === '.' || t === '-') { out.push(null); continue; }
      const mm = t.match(/^([A-G][#b]?)(\d)$/);
      let len = 1;
      while (i + len < tok.length && tok[i + len] === '-') len++;
      out.push(mm ? { m: 12 * (+mm[2] + 1) + SEMI[mm[1]], len } : null);
    }
    return out;
  }

  const SONGS = {
    menu: {
      bpm: 100, leadShift: 0, loopFrom: 0,
      order: ['A', 'B', 'A', 'B'],
      sec: {
        A: { chords: ['Am9', 'Am9', 'Fmaj7', 'Fmaj7', 'Cmaj7', 'Cmaj7', 'G', 'E'], bass: 'pulse8', arp: 'updown', pad: true, drums: 'half' },
        B: {
          chords: ['Am9', 'Am9', 'Fmaj7', 'Fmaj7', 'Cmaj7', 'Cmaj7', 'G', 'E'], bass: 'pulse8', arp: 'updown', pad: true, drums: 'half', fill: true,
          lead: ['E5 - - - - - D5 - C5 - - - B4 - C5 -', 'A4 - - - - - - - - - - - . . . .', 'A5 - - - - - G5 - F5 - - - E5 - F5 -', 'C5 - - - - - - - - - - - . . . .',
            'E5 - - - G5 - - - C6 - - - B5 - G5 -', 'A5 - - - G5 - - - E5 - - - . . . .', 'D5 - - - G5 - - - B5 - - - A5 - G5 -', 'G#5 - - - - - - - B5 - - - - - . .'],
        },
      },
    },
    race1: {
      bpm: 150, leadShift: -12, loopFrom: 1,
      order: ['I', 'A', 'B', 'A', 'B', 'Br'],
      sec: {
        I: { chords: ['Em', 'C', 'G', 'D'], bass: 'oct', pad: true, drums: 'four', fill: true },
        A: {
          chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'], bass: 'oct', arp: 'up', drums: 'four',
          lead: ['E5 - - B4 - - E5 - F#5 - G5 - F#5 - E5 -', 'G5 - - E5 - - C5 - D5 - E5 - - - . .', 'D5 - - B4 - - G4 - A4 - B4 - D5 - B4 -', 'A4 - - - F#4 - A4 - D5 - - - . . . .',
            'E5 - - B4 - - E5 - F#5 - G5 - A5 - B5 -', 'C6 - - B5 - - G5 - E5 - - - G5 - - -', 'A5 - - G5 - - E5 - C5 - - - E5 - D5 -', 'D#5 - - - F#5 - - - B5 - - - . . . .'],
        },
        B: {
          chords: ['C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B'], bass: 'oct', pad: true, drums: 'four', fill: true,
          lead: ['E5 - G5 - C6 - B5 - - - G5 - E5 - G5 -', 'F#5 - A5 - D6 - C6 - - - A5 - F#5 - A5 -', 'B5 - - - - - G5 - E5 - G5 - B5 - - -', 'A5 - G5 - F#5 - E5 - - - - - . . . .',
            'E5 - G5 - C6 - B5 - - - G5 - E5 - G5 -', 'F#5 - A5 - D6 - E6 - - - D6 - C6 - A5 -', 'B5 - - - D#6 - - - F#6 - - - D#6 - - -', 'B5 - - - - - - - . . . . . . . .'],
        },
        Br: { chords: ['Am', 'C', 'D', 'D'], bass: 'half', arp: 'up', pad: true, drums: 'half', fill: true },
      },
    },
    race2: {
      bpm: 136, leadShift: -12, loopFrom: 1,
      order: ['I', 'A', 'B', 'A', 'B', 'Br'],
      sec: {
        I: { chords: ['Dm', 'Bb', 'C', 'Am'], bass: 'pulse16', arp: 'up', drums: 'half', fill: true },
        A: {
          chords: ['Dm', 'Bb', 'C', 'Am', 'Dm', 'Bb', 'Gm', 'A'], bass: 'pulse16', arp: 'updown', drums: 'four',
          lead: ['D5 - - - F5 - - - A5 - G5 - F5 - E5 -', 'D5 - - - - - . . F5 - E5 - D5 - C5 -', 'E5 - - - G5 - - - C6 - Bb5 - A5 - G5 -', 'A5 - - - - - - - E5 - - - . . . .',
            'D5 - - - F5 - - - A5 - Bb5 - A5 - F5 -', 'G5 - F5 - D5 - - - Bb4 - C5 - D5 - - -', 'Bb5 - A5 - G5 - - - D5 - - - G5 - - -', 'A5 - - - C#6 - - - E6 - - - . . . .'],
        },
        B: {
          chords: ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'], bass: 'oct', pad: true, drums: 'four', fill: true,
          lead: ['F5 - - D5 - - F5 - Bb5 - - - A5 - F5 -', 'G5 - - E5 - - G5 - C6 - - - Bb5 - G5 -', 'A5 - - - - - F5 - D5 - F5 - A5 - - -', 'D6 - C6 - A5 - F5 - - - - - . . . .',
            'F5 - - D5 - - F5 - Bb5 - - - C6 - D6 -', 'E6 - - C6 - - G5 - E6 - - - D6 - C6 -', 'C#6 - - - E6 - - - A5 - - - C#6 - - -', 'A5 - - - - - - - . . . . . . . .'],
        },
        Br: { chords: ['Gm', 'Bb', 'C', 'A'], bass: 'half', arp: 'up', pad: true, drums: 'break', fill: true },
      },
    },
    race3: {
      bpm: 146, leadShift: -12, loopFrom: 1,
      order: ['I', 'A', 'B', 'A', 'B', 'Br'],
      sec: {
        I: { chords: ['A', 'E', 'F#m', 'D'], bass: 'oct', arp: 'up', drums: 'four', fill: true },
        A: {
          chords: ['A', 'E', 'F#m', 'D', 'A', 'E', 'D', 'E'], bass: 'oct', arp: 'up', drums: 'four',
          lead: ['C#5 - E5 - A5 - - - G#5 - A5 - B5 - C#6 -', 'B5 - - - G#5 - - - E5 - - - . . . .', 'A5 - - - C#6 - - - F#5 - G#5 - A5 - B5 -', 'A5 - - - F#5 - - - D5 - - - . . . .',
            'C#5 - E5 - A5 - - - B5 - C#6 - E6 - - -', 'D6 - C#6 - B5 - - - G#5 - - - E5 - - -', 'F#5 - - - A5 - - - D6 - C#6 - B5 - A5 -', 'G#5 - - - B5 - - - E6 - - - . . . .'],
        },
        B: {
          chords: ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'A'], bass: 'oct', pad: true, drums: 'four', fill: true,
          lead: ['F#5 - A5 - D6 - - - C#6 - - - A5 - - -', 'G#5 - B5 - E6 - - - D6 - - - B5 - - -', 'E5 - G#5 - C#6 - - - B5 - - - G#5 - - -', 'A5 - - - C#6 - - - F#6 - - - E6 - - -',
            'F#5 - A5 - D6 - - - C#6 - - - A5 - F#5 -', 'G#5 - B5 - E6 - - - F#6 - - - G#6 - - -', 'A6 - - - - - - - E6 - - - C#6 - - -', 'A5 - - - - - - - . . . . . . . .'],
        },
        Br: { chords: ['F#m', 'D', 'A', 'E'], bass: 'half', arp: 'updown', pad: true, drums: 'half', fill: true },
      },
    },
  };
  // preparar compases
  Object.values(SONGS).forEach((s) => Object.values(s.sec).forEach((sec) => {
    sec.ch = sec.chords.map(parseChord);
    if (sec.lead) sec.ld = sec.lead.map(parseBar);
  }));
  M.SONGS = SONGS;

  /* ---------- Instrumentos ---------- */
  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }
  function bass(m, t, d, acc) {
    const c = A.ctx;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f(m);
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = f(m); o2.detune.value = -8;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 5;
    fl.frequency.setValueAtTime(200 + acc * 300, t);
    fl.frequency.exponentialRampToValueAtTime(1500 + acc * 700, t + 0.012);
    fl.frequency.exponentialRampToValueAtTime(320, t + Math.max(0.05, d * 0.85));
    const g = c.createGain();
    env(g, t, 0.004, 0.2 + acc * 0.05, Math.max(0.01, d * 0.6), 0.06);
    const g2 = c.createGain(); g2.gain.value = 0.5;
    o1.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(M.bus);
    o1.start(t); o2.start(t); o1.stop(t + d + 0.1); o2.stop(t + d + 0.1);
  }
  function lead(m, t, d) {
    const c = A.ctx;
    const o1 = c.createOscillator(); o1.type = 'square'; o1.frequency.value = f(m);
    const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f(m); o2.detune.value = 9;
    const lfo = c.createOscillator(); lfo.frequency.value = 5.6;
    const lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(7, t + Math.min(0.35, d * 0.8));
    lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 3000; fl.Q.value = 1.2;
    const g = c.createGain();
    env(g, t, 0.01, 0.075, Math.max(0.02, d - 0.06), 0.1);
    const mx = c.createGain(); mx.gain.value = 0.55;
    o1.connect(fl); o2.connect(mx); mx.connect(fl); fl.connect(g); g.connect(M.bus); g.connect(M.send);
    [o1, o2, lfo].forEach((o) => { o.start(t); o.stop(t + d + 0.25); });
  }
  function pad(ms, t, d) {
    const c = A.ctx;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1300; fl.Q.value = 0.7;
    const g = c.createGain();
    env(g, t, 0.35, 0.05, Math.max(0.05, d - 0.4), 0.6);
    fl.connect(g); g.connect(M.bus); g.connect(M.send);
    ms.forEach((m) => {
      [-7, 7].forEach((dt) => {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f(m); o.detune.value = dt;
        o.connect(fl); o.start(t); o.stop(t + d + 0.7);
      });
    });
  }
  function arp(m, t, d) {
    const c = A.ctx;
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f(m);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2600;
    const g = c.createGain();
    env(g, t, 0.003, 0.035, 0.01, Math.min(0.15, d));
    o.connect(fl); fl.connect(g); g.connect(M.bus); g.connect(M.send);
    o.start(t); o.stop(t + d + 0.2);
  }
  function kick(t, v) {
    const c = A.ctx;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    const g = c.createGain(); env(g, t, 0.002, 0.75 * v, 0.02, 0.3);
    o.connect(g); g.connect(M.bus);
    o.start(t); o.stop(t + 0.4);
  }
  function noiseDrum(t, type, fr, vol, dec, q) {
    const c = A.ctx;
    const s = c.createBufferSource(); s.buffer = A.noise;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = fr; fl.Q.value = q || 0.7;
    const g = c.createGain(); env(g, t, 0.002, vol, 0.005, dec);
    s.connect(fl); fl.connect(g); g.connect(M.bus);
    s.start(t, Math.random()); s.stop(t + dec + 0.05);
  }
  function snare(t, v) {
    noiseDrum(t, 'highpass', 1400, 0.22 * v, 0.16);
    const c = A.ctx;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    const g = c.createGain(); env(g, t, 0.002, 0.12 * v, 0.005, 0.09);
    o.connect(g); g.connect(M.bus); o.start(t); o.stop(t + 0.15);
  }
  const hat = (t, open, v) => noiseDrum(t, 'highpass', 7200, (open ? 0.06 : 0.035) * v, open ? 0.16 : 0.035);
  const crash = (t) => noiseDrum(t, 'highpass', 4500, 0.07, 1.3);

  /* ---------- Secuenciador ---------- */
  M.schedule = function (step, t) {
    const song = M.cur;
    const bar = Math.floor(step / 16);
    const s = step % 16;
    // localizar sección
    let b = bar, oi = M.orderIdx, sec = song.sec[song.order[oi]];
    const secLen = sec.chords.length;
    if (b - M.secStartBar >= secLen) {
      oi = M.orderIdx + 1;
      if (oi >= song.order.length) oi = song.loopFrom;
      M.orderIdx = oi; M.secStartBar = b;
      sec = song.sec[song.order[oi]];
    }
    const bi = b - M.secStartBar;
    const ch = sec.ch[bi % sec.ch.length];
    const sd = 60 / song.bpm / 4;
    const lastBar = bi === sec.chords.length - 1;
    if (s === 0 && bi === 0 && step > 0) crash(t);
    // batería
    const dr = sec.drums;
    if (dr === 'four') {
      if (s % 4 === 0) kick(t, 1);
      if (s === 4 || s === 12) snare(t, 1);
      if (s % 4 === 2) hat(t, true, 1);
      else if (s % 2 === 1) hat(t, false, 0.6);
    } else if (dr === 'half') {
      if (s === 0 || s === 10) kick(t, 0.9);
      if (s === 8) snare(t, 0.9);
      if (s % 2 === 0) hat(t, false, 0.7);
    } else if (dr === 'break') {
      if (s === 0) kick(t, 0.8);
      if (s % 4 === 2) hat(t, false, 0.5);
    }
    if (sec.fill && lastBar && s >= 12) snare(t, 0.5 + (s - 12) * 0.15);
    // bajo
    const root = 36 + ((ch.root - 36 % 12 + 120) % 12);
    const bs = sec.bass;
    if (bs === 'oct') { if (s % 2 === 0) bass(root + (s % 4 === 2 ? 12 : 0), t, sd * 1.6, s % 4 === 0 ? 1 : 0.3); }
    else if (bs === 'pulse16') bass(root + (s % 8 === 6 ? 12 : 0), t, sd * 0.8, s % 4 === 0 ? 1 : 0.1);
    else if (bs === 'pulse8') { if (s % 2 === 0) bass(root, t, sd * 1.5, s % 8 === 0 ? 0.8 : 0.2); }
    else if (bs === 'half') { if (s === 0 || s === 6 || s === 8) bass(root, t, sd * (s === 6 ? 2 : 5), 0.6); }
    // pad
    if (sec.pad && s === 0) pad(ch.iv.map((i) => 48 + ch.root + i).map((m) => (m > 76 ? m - 12 : m)), t, sd * 16);
    // arpegio
    if (sec.arp) {
      const tones = ch.iv.slice(0, 4).map((i) => 60 + ch.root + i);
      if (tones.length < 4) tones.push(tones[0] + 12);
      const seq = sec.arp === 'updown' ? [0, 1, 2, 3, 2, 1] : [0, 1, 2, 3];
      arp(tones[seq[s % seq.length]], t, sd);
    }
    // melodía
    if (sec.ld) {
      const n = sec.ld[bi % sec.ld.length][s];
      if (n) lead(n.m + song.leadShift, t, sd * n.len);
    }
  };

  M.tick = function () {
    if (!M.cur || !A.ready) return;
    const ctx = A.ctx;
    const sd = 60 / M.cur.bpm / 4;
    while (M.next < ctx.currentTime + 0.14) {
      try { M.schedule(M.step, M.next); } catch (e) { /* nota perdida */ }
      M.next += sd;
      M.step++;
    }
  };

  M.play = function (name) {
    M.pending = name;
    if (!A.ready) return;
    if (M.name === name && M.cur) return;
    M.stop();
    const ctx = A.ctx;
    M.cur = SONGS[name];
    M.name = name;
    M.bus = ctx.createGain();
    M.bus.gain.value = 0.0001;
    M.bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.6);
    M.bus.connect(A.music);
    M.send = ctx.createGain(); M.send.gain.value = 0.22;
    const dl = ctx.createDelay(1); dl.delayTime.value = (60 / M.cur.bpm / 4) * 3;
    const fb = ctx.createGain(); fb.gain.value = 0.3;
    const dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 2400;
    M.send.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(M.bus);
    M.step = 0; M.orderIdx = 0; M.secStartBar = 0;
    M.next = ctx.currentTime + 0.12;
    M.timer = setInterval(M.tick, 25);
    M.tick();
  };

  M.stop = function () {
    if (M.timer) clearInterval(M.timer);
    M.timer = null;
    if (M.bus && A.ready) {
      const bus = M.bus, t = A.ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), t);
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      setTimeout(() => { try { bus.disconnect(); } catch (e) { /* ok */ } }, 700);
    }
    M.cur = null; M.name = null; M.bus = null;
  };

  M.onReady = function () { if (M.pending) { const n = M.pending; M.name = null; M.play(n); } };
})(window.TG);
