'use strict';
/* ============================================================
   Arte procedural de coches
   - rearDecal: detalles del panel trasero (los proyecta el coche 3D)
   - carSide: perfil lateral para garaje / concesionario
   - showroom: escena completa del expositor
   ============================================================ */
(function (TG) {
  const U = TG.U;
  const Art = (TG.Art = TG.Art || {});

  const RED_LIGHT = ['#ff6a72', '#ff1a2c', '#a8000f'];

  /* ---------------- Trasera (calcomanía del coche 3D) ----------------
     Dibuja solo los detalles del panel trasero (difusor, pilotos, matrícula,
     emblema, escapes y rejillas) en el espacio 1000×780 del diseño, recortado
     a la zona útil. Car3D la proyecta sobre el panel trasero de la malla. */
  Art.rearDecal = function (model, color, opt) {
    opt = opt || {};
    const R = model.rear;
    const L = opt.light == null ? 1 : opt.light;
    const night = L < 0.7;
    const shadeC = opt.shade || '#0a1030';
    const lit = (c) => (L >= 0.999 ? c : U.mix(c, shadeC, (1 - L) * 0.82));
    const carbon = lit('#1a1c21');
    const black = lit('#0a0b0e');
    const GY = 742;
    const bw2 = 440 * R.w;
    const cx = 500;
    const yDeck = GY - R.deck * 880;
    const yBot = GY - 92;
    const Lx = cx - bw2, Rx = cx + bw2;
    const x0 = Lx - 24, x1 = Rx + 24, y0 = yDeck - 36, y1 = GY - 14;
    const k = (opt.w || 512) / (x1 - x0);
    const cv = U.canvas((x1 - x0) * k, (y1 - y0) * k);
    const ctx = cv.getContext('2d');
    ctx.scale(k, k);
    ctx.translate(-x0, -y0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const lights = [], exh = [];

    const bodyPath = (begin) => {
      if (begin !== false) ctx.beginPath();
      ctx.moveTo(Lx + 34, yBot);
      ctx.bezierCurveTo(Lx - 2, yBot - 40, Lx - 6 - R.hip, yDeck + 100, Lx + 12, yDeck + 34);
      ctx.quadraticCurveTo(Lx + 32, yDeck - 2, Lx + 96, yDeck - 6);
      ctx.quadraticCurveTo(cx, yDeck - 12 - R.arch, Rx - 96, yDeck - 6);
      ctx.quadraticCurveTo(Rx - 32, yDeck - 2, Rx - 12, yDeck + 34);
      ctx.bezierCurveTo(Rx + 6 + R.hip, yDeck + 100, Rx + 2, yBot - 40, Rx - 34, yBot);
      ctx.lineTo(cx + bw2 * 0.56, yBot);
      ctx.quadraticCurveTo(cx + bw2 * 0.5, yBot - 34, cx + bw2 * 0.4, yBot - 38);
      ctx.lineTo(cx - bw2 * 0.4, yBot - 38);
      ctx.quadraticCurveTo(cx - bw2 * 0.5, yBot - 34, cx - bw2 * 0.56, yBot);
      ctx.closePath();
    };

    // --- Difusor
    // (más estrecho que la carrocería: deja ver los neumáticos traseros en las esquinas)
    ctx.fillStyle = U.lin(ctx, 0, yBot - 62, 0, GY - 30, [0, carbon, 1, black]);
    ctx.beginPath();
    ctx.moveTo(Lx + 120, yBot - 62); ctx.lineTo(Rx - 120, yBot - 62);
    ctx.lineTo(Rx - 168, GY - 34); ctx.lineTo(Lx + 168, GY - 34);
    ctx.closePath();
    ctx.fill();
    if (R.fins) {
      ctx.strokeStyle = lit('#30333b');
      ctx.lineWidth = 7;
      const span = bw2 * 0.62;
      for (let i = 0; i < R.fins; i++) {
        const xx = cx - span / 2 + (span * (i + 0.5)) / R.fins;
        ctx.beginPath(); ctx.moveTo(xx, yBot - 24); ctx.lineTo(xx + (xx - cx) * 0.06, GY - 38); ctx.stroke();
      }
    }


    // franjas (Mustang): solo sobre el panel trasero; en el techo las pinta la malla
    if (R.stripes) {
      ctx.save();
      bodyPath();
      ctx.clip();
      ctx.fillStyle = lit(R.stripes);
      ctx.fillRect(cx - 50, yDeck - 30, 36, GY);
      ctx.fillRect(cx + 14, yDeck - 30, 36, GY);
      ctx.restore();
    }

    // --- Rejilla (mesh) inferior
    const meshTop = yDeck + 122, meshBot = yBot - 22;
    if (R.mesh) {
      ctx.fillStyle = black;
      U.rr(ctx, Lx + 110, meshTop, bw2 * 2 - 220, meshBot - meshTop, 14);
      ctx.fill();
      ctx.save();
      U.rr(ctx, Lx + 110, meshTop, bw2 * 2 - 220, meshBot - meshTop, 14);
      ctx.clip();
      ctx.strokeStyle = lit('#2c3038');
      ctx.lineWidth = 3;
      for (let x = Lx + 40; x < Rx; x += 18) {
        ctx.beginPath(); ctx.moveTo(x, meshTop); ctx.lineTo(x + 36, meshBot); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 36, meshTop); ctx.lineTo(x, meshBot); ctx.stroke();
      }
      ctx.restore();
    }
    if (R.engine === 2) { // rejilla del motor trasero 911
      ctx.fillStyle = black;
      U.rr(ctx, cx - bw2 * 0.34, yDeck - 2, bw2 * 0.68, 26, 8);
      ctx.fill();
      ctx.strokeStyle = lit('#2a2e36'); ctx.lineWidth = 4;
      for (let x = cx - bw2 * 0.32; x < cx + bw2 * 0.32; x += 12) { ctx.beginPath(); ctx.moveTo(x, yDeck + 2); ctx.lineTo(x, yDeck + 20); ctx.stroke(); }
    }

    // --- Pilotos traseros
    const on = night;
    const redGrad = (y0, y1) => U.lin(ctx, 0, y0, 0, y1, [0, on ? '#ff9aa2' : RED_LIGHT[0], 0.5, on ? '#ff2a3a' : RED_LIGHT[1], 1, on ? '#d0001a' : RED_LIGHT[2]]);
    const lampFill = (y0, y1) => { ctx.fillStyle = redGrad(y0, y1); ctx.fill(); ctx.strokeStyle = 'rgba(40,0,0,0.6)'; ctx.lineWidth = 3; ctx.stroke(); };
    const sides = [-1, 1];
    switch (R.lights) {
      case 'tri': {
        ctx.fillStyle = black;
        U.rr(ctx, Lx + 58, yDeck + 20, bw2 * 2 - 116, 76, 14);
        ctx.fill();
        sides.forEach((sd) => {
          for (let i = 0; i < 3; i++) {
            const x = cx + sd * (bw2 - 96 - i * 34);
            U.rr(ctx, x - 11, yDeck + 28, 22, 60, 6);
            lampFill(yDeck + 28, yDeck + 88);
          }
          lights.push([cx + sd * (bw2 - 130), yDeck + 58, 95]);
        });
        break;
      }
      case 'rings': {
        sides.forEach((sd) => {
          [bw2 - 82, bw2 - 168].forEach((d) => {
            const x = cx + sd * d, y = yDeck + 58;
            ctx.beginPath(); ctx.arc(x, y, 31, 0, Math.PI * 2);
            ctx.arc(x, y, 17, 0, Math.PI * 2, true);
            lampFill(y - 31, y + 31);
            ctx.fillStyle = lit('#2a0a0e');
            ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
            lights.push([x, y, 58]);
          });
        });
        break;
      }
      case 'bar': {
        const y = yDeck + 24;
        ctx.beginPath();
        ctx.moveTo(Lx + 42, y + 4);
        ctx.quadraticCurveTo(cx, y - 10, Rx - 42, y + 4);
        ctx.lineTo(Rx - 46, y + 20);
        ctx.quadraticCurveTo(cx, y + 6, Lx + 46, y + 20);
        ctx.closePath();
        lampFill(y - 6, y + 20);
        for (let i = 0; i < 5; i++) lights.push([Lx + 70 + ((bw2 * 2 - 140) * i) / 4, y + 8, 60]);
        break;
      }
      case 'slim': {
        sides.forEach((sd) => {
          ctx.beginPath();
          ctx.moveTo(cx + sd * (bw2 - 26), yDeck + 14);
          ctx.quadraticCurveTo(cx + sd * (bw2 * 0.6), yDeck + 44, cx + sd * (bw2 * 0.24), yDeck + 30);
          ctx.lineTo(cx + sd * (bw2 * 0.24), yDeck + 42);
          ctx.quadraticCurveTo(cx + sd * (bw2 * 0.6), yDeck + 60, cx + sd * (bw2 - 34), yDeck + 34);
          ctx.closePath();
          lampFill(yDeck + 14, yDeck + 60);
          lights.push([cx + sd * (bw2 * 0.7), yDeck + 40, 80]);
        });
        ctx.fillStyle = on ? '#ff3a4a' : '#8a0012';
        ctx.fillRect(cx - bw2 * 0.24, yDeck + 34, bw2 * 0.48, 6);
        break;
      }
      case 'slimC': {
        sides.forEach((sd) => {
          ctx.beginPath();
          ctx.moveTo(cx + sd * (bw2 * 0.5), yDeck + 16);
          ctx.lineTo(cx + sd * (bw2 - 22), yDeck + 14);
          ctx.lineTo(cx + sd * (bw2 - 30), yDeck + 96);
          ctx.lineTo(cx + sd * (bw2 - 44), yDeck + 96);
          ctx.lineTo(cx + sd * (bw2 - 38), yDeck + 28);
          ctx.lineTo(cx + sd * (bw2 * 0.5), yDeck + 28);
          ctx.closePath();
          lampFill(yDeck + 14, yDeck + 96);
          lights.push([cx + sd * (bw2 - 50), yDeck + 30, 70]);
          lights.push([cx + sd * (bw2 - 36), yDeck + 80, 50]);
        });
        break;
      }
      case 'amg': {
        sides.forEach((sd) => {
          ctx.beginPath();
          ctx.moveTo(cx + sd * (bw2 * 0.4), yDeck + 34);
          ctx.lineTo(cx + sd * (bw2 - 28), yDeck + 22);
          ctx.lineTo(cx + sd * (bw2 - 34), yDeck + 50);
          ctx.lineTo(cx + sd * (bw2 * 0.4), yDeck + 46);
          ctx.closePath();
          lampFill(yDeck + 22, yDeck + 50);
          lights.push([cx + sd * (bw2 * 0.72), yDeck + 38, 80]);
        });
        ctx.strokeStyle = lit('#c9ced6');
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(cx - bw2 * 0.38, yDeck + 40); ctx.lineTo(cx + bw2 * 0.38, yDeck + 40); ctx.stroke();
        break;
      }
      case 'r8': {
        sides.forEach((sd) => {
          ctx.beginPath();
          ctx.moveTo(cx + sd * (bw2 * 0.3), yDeck + 28);
          ctx.lineTo(cx + sd * (bw2 - 24), yDeck + 22);
          ctx.lineTo(cx + sd * (bw2 - 40), yDeck + 64);
          ctx.lineTo(cx + sd * (bw2 * 0.36), yDeck + 60);
          ctx.closePath();
          lampFill(yDeck + 22, yDeck + 64);
          ctx.strokeStyle = on ? '#ffd0d4' : '#ff7a84';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(cx + sd * (bw2 * 0.36), yDeck + 44); ctx.lineTo(cx + sd * (bw2 - 36), yDeck + 40); ctx.stroke();
          lights.push([cx + sd * (bw2 * 0.66), yDeck + 44, 85]);
        });
        break;
      }
      case 'y': {
        sides.forEach((sd) => {
          const jx = cx + sd * (bw2 - 118), jy = yDeck + 52;
          ctx.lineWidth = 17;
          ctx.strokeStyle = redGrad(yDeck + 20, yDeck + 90);
          ctx.beginPath();
          ctx.moveTo(cx + sd * (bw2 - 28), yDeck + 20); ctx.lineTo(jx, jy);
          ctx.lineTo(cx + sd * (bw2 - 30), yDeck + 86);
          ctx.moveTo(jx, jy); ctx.lineTo(cx + sd * (bw2 - 210), jy);
          ctx.stroke();
          ctx.lineWidth = 5;
          ctx.strokeStyle = on ? '#ffe0e4' : '#ff8a92';
          ctx.stroke();
          lights.push([jx, jy, 90]);
        });
        break;
      }
      case 'round2': {
        sides.forEach((sd) => {
          const x = cx + sd * (bw2 - 92), y = yDeck + 44;
          ctx.beginPath(); ctx.arc(x, y, 29, 0, Math.PI * 2); lampFill(y - 29, y + 29);
          ctx.beginPath(); ctx.arc(cx + sd * (bw2 - 156), y + 4, 14, 0, Math.PI * 2); lampFill(y - 10, y + 18);
          lights.push([x, y, 64]);
        });
        break;
      }
      case 'veyron': {
        sides.forEach((sd) => {
          const x = cx + sd * (bw2 - 124), y = yDeck + 36;
          U.ellipse(ctx, x, y, 72, 15); lampFill(y - 15, y + 15);
          lights.push([x, y, 80]);
        });
        U.ellipse(ctx, cx, yDeck + 30, 40, 7); lampFill(yDeck + 23, yDeck + 37);
        break;
      }
      case 'valk': {
        U.rr(ctx, cx - 96, yDeck - 4, 192, 9, 4); lampFill(yDeck - 4, yDeck + 5);
        sides.forEach((sd) => {
          U.rr(ctx, cx + sd * (bw2 - 24) - 5, yDeck + 20, 10, 64, 4); lampFill(yDeck + 20, yDeck + 84);
          lights.push([cx + sd * (bw2 - 24), yDeck + 50, 55]);
        });
        lights.push([cx, yDeck, 60]);
        break;
      }
      default: { // round4
        sides.forEach((sd) => {
          [bw2 - 76, bw2 - 146].forEach((d) => {
            const x = cx + sd * d, y = yDeck + 50;
            ctx.beginPath(); ctx.arc(x, y, 27, 0, Math.PI * 2);
            lampFill(y - 27, y + 27);
            ctx.strokeStyle = on ? '#ffd6da' : '#ff7a84';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.stroke();
            lights.push([x, y, 56]);
          });
        });
      }
    }

    // --- Matrícula
    const plateY = R.mesh ? yDeck + 52 : yBot - 64;
    ctx.fillStyle = lit('#f4f4ef');
    U.rr(ctx, cx - 78, plateY, 156, 42, 6);
    ctx.fill();
    ctx.strokeStyle = lit('#2a2a2a'); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = lit('#1b1b28');
    ctx.font = 'bold 30px "DIN Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(opt.plate || ('TG ' + String(model.index + 1).padStart(2, '0') + (model.id.slice(0, 2).toUpperCase())), cx, plateY + 23);

    // --- Emblema
    const by = R.mesh ? yDeck + 30 : (R.lights === 'tri' ? yDeck + 58 : yDeck + 34);
    Art.badge(ctx, R.badge, cx, by, 1, lit);

    // --- Escapes
    const metal = (x, y, r) => {
      ctx.fillStyle = U.rad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [0, '#f0f2f5', 0.6, '#9aa0a8', 1, '#4a4e56']);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = U.rad(ctx, x, y, 0, r * 0.8, [0, '#000', 1, '#1a1a1e']);
      ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, Math.PI * 2); ctx.fill();
      exh.push([x, y, r]);
    };
    const eyLow = GY - 66;
    switch (R.exhaust) {
      case 'quad': sides.forEach((sd) => { metal(cx + sd * (bw2 - 150), eyLow, 20); metal(cx + sd * (bw2 - 198), eyLow, 20); }); break;
      case 'twin': sides.forEach((sd) => metal(cx + sd * (bw2 - 176), eyLow, 25)); break;
      case 'twinOval': sides.forEach((sd) => {
        const x = cx + sd * (bw2 - 176);
        ctx.fillStyle = U.lin(ctx, 0, eyLow - 18, 0, eyLow + 18, [0, '#e8eaee', 1, '#5a5e66']);
        U.ellipse(ctx, x, eyLow, 44, 19); ctx.fill();
        ctx.fillStyle = '#050506'; U.ellipse(ctx, x, eyLow, 34, 12); ctx.fill();
        exh.push([x, eyLow, 30]);
      }); break;
      case 'center2': metal(cx - 36, eyLow, 23); metal(cx + 36, eyLow, 23); break;
      case 'high2': metal(cx - 42, meshTop + 34, 25); metal(cx + 42, meshTop + 34, 25); break;
      case 'center1': metal(cx, meshTop + 36, 34); break;
      case 'centerSq': {
        ctx.fillStyle = U.lin(ctx, 0, eyLow - 26, 0, eyLow + 22, [0, '#e8eaee', 1, '#5a5e66']);
        U.rr(ctx, cx - 60, eyLow - 26, 120, 46, 12); ctx.fill();
        ctx.fillStyle = '#050506'; U.rr(ctx, cx - 50, eyLow - 18, 100, 30, 8); ctx.fill();
        exh.push([cx - 25, eyLow, 22]); exh.push([cx + 25, eyLow, 22]);
        break;
      }
      case 'center4': metal(cx - 24, eyLow - 22, 17); metal(cx + 24, eyLow - 22, 17); metal(cx - 24, eyLow + 14, 17); metal(cx + 24, eyLow + 14, 17); break;
      default: metal(cx, eyLow, 24);
    }

    if (R.spoiler === 'lip') {
      ctx.fillStyle = carbon;
      U.rr(ctx, cx - bw2 * 0.7, yDeck - 10, bw2 * 1.4, 10, 4);
      ctx.fill();
    }
    return { img: cv, k, x0, y0, cx, GY, bw2, yDeck, lights, exh };
  };

  /* ---------------- Frontal (calcomanía del morro) ----------------
     Faros, parrilla, tomas de aire y emblema. Car3D la proyecta sobre el morro. */
  Art.frontDecal = function (model, color, opt) {
    opt = opt || {};
    const W = Math.max(128, Math.round(opt.w || 400)), H = Math.round(W * 0.34);
    const cv = U.canvas(W, H);
    const c = cv.getContext('2d');
    const id = model.id;
    const style = /^(mustang|amggt|vantage)$/.test(id) ? 'grille' : id === 'p911' ? 'round' : /^(veyron|chiron)$/.test(id) ? 'bugatti' : id === 'gtr' ? 'gtr' : 'slim';
    const k = W / 1000;
    c.scale(k, k);
    const HH = H / k;
    c.lineJoin = 'round';
    const black = '#0b0c0f', carbon = '#1a1c21';
    const lights = [];
    // splitter y tomas de aire inferiores
    c.fillStyle = carbon;
    U.rr(c, 40, HH * 0.9, 920, HH * 0.1, 12); c.fill();
    const intake = (x, y, w, h, r) => {
      c.fillStyle = black; U.rr(c, x, y, w, h, r); c.fill();
      c.save(); U.rr(c, x, y, w, h, r); c.clip();
      c.strokeStyle = '#23262d'; c.lineWidth = 4;
      for (let xx = x - h; xx < x + w; xx += 16) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx + h, y + h); c.stroke(); c.beginPath(); c.moveTo(xx + h, y); c.lineTo(xx, y + h); c.stroke(); }
      c.restore();
    };
    if (style === 'grille') {
      // parrilla grande trapezoidal (muscle / GT)
      c.fillStyle = black;
      c.beginPath(); c.moveTo(280, HH * 0.36); c.lineTo(720, HH * 0.36); c.lineTo(760, HH * 0.86); c.lineTo(240, HH * 0.86); c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = '#2a2e36'; c.lineWidth = 5;
      for (let x = 240; x < 780; x += 22) { c.beginPath(); c.moveTo(x, HH * 0.3); c.lineTo(x, HH * 0.9); c.stroke(); }
      c.restore();
      intake(70, HH * 0.6, 150, HH * 0.26, 18); intake(780, HH * 0.6, 150, HH * 0.26, 18);
    } else if (style === 'bugatti') {
      // parrilla de herradura
      c.fillStyle = '#c9ced6';
      c.beginPath(); c.ellipse(500, HH * 0.6, 95, HH * 0.36, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = black; c.beginPath(); c.ellipse(500, HH * 0.62, 80, HH * 0.31, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.ellipse(500, HH * 0.62, 80, HH * 0.31, 0, 0, Math.PI * 2); c.clip();
      c.strokeStyle = '#3a3e46'; c.lineWidth = 4;
      for (let x = 400; x < 600; x += 14) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 30, HH); c.stroke(); }
      c.restore();
      intake(90, HH * 0.52, 240, HH * 0.34, 30); intake(670, HH * 0.52, 240, HH * 0.34, 30);
    } else {
      intake(110, HH * 0.56, 300, HH * 0.3, 26); intake(590, HH * 0.56, 300, HH * 0.3, 26);
      if (style === 'gtr') { c.fillStyle = black; c.beginPath(); c.moveTo(390, HH * 0.4); c.lineTo(610, HH * 0.4); c.lineTo(560, HH * 0.8); c.lineTo(440, HH * 0.8); c.closePath(); c.fill(); }
      else intake(430, HH * 0.62, 140, HH * 0.22, 16);
    }
    // faros
    const glass = (path) => {
      path();
      c.fillStyle = U.lin(c, 0, 0, 0, HH * 0.4, [0, '#dfe8f2', 0.5, '#8a9cb2', 1, '#3a4658']); c.fill();
      c.strokeStyle = '#15171c'; c.lineWidth = 4; c.stroke();
    };
    [-1, 1].forEach((sd) => {
      const X = (x) => 500 + sd * x;
      if (style === 'round') {
        glass(() => { c.beginPath(); c.ellipse(X(380), HH * 0.24, 70, HH * 0.18, sd * 0.2, 0, Math.PI * 2); });
        c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.ellipse(X(380), HH * 0.24, 50, HH * 0.12, sd * 0.2, 0, Math.PI * 2); c.stroke();
        lights.push([X(380) / 1000, 0.24, 0.07]);
      } else if (style === 'grille') {
        glass(() => { c.beginPath(); c.moveTo(X(110), HH * 0.16); c.lineTo(X(420), HH * 0.1); c.lineTo(X(430), HH * 0.34); c.lineTo(X(120), HH * 0.36); c.closePath(); });
        c.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) c.fillRect(X(160 + i * 70) - 6, HH * 0.16, 12, HH * 0.14);
        lights.push([X(270) / 1000, 0.23, 0.12]);
      } else {
        // faros finos de LED (superdeportivos)
        glass(() => { c.beginPath(); c.moveTo(X(150), HH * 0.2); c.quadraticCurveTo(X(300), HH * 0.06, X(440), HH * 0.12); c.lineTo(X(430), HH * 0.3); c.quadraticCurveTo(X(300), HH * 0.3, X(160), HH * 0.36); c.closePath(); });
        c.strokeStyle = '#ffffff'; c.lineWidth = 7;
        c.beginPath(); c.moveTo(X(170), HH * 0.28); c.quadraticCurveTo(X(300), HH * 0.2, X(420), HH * 0.2); c.stroke();
        lights.push([X(300) / 1000, 0.21, 0.1]);
      }
    });
    Art.badge(c, model.rear.badge, 500, HH * 0.22, 1.2);
    return { img: cv, lights };
  };

  // Emblemas genéricos (formas evocadoras, sin logotipos reales)
  Art.badge = function (ctx, kind, x, y, sc, lit) {
    lit = lit || ((c) => c);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    const chrome = U.lin(ctx, 0, -14, 0, 14, [0, lit('#ffffff'), 0.5, lit('#aab0b8'), 1, lit('#6a707a')]);
    switch (kind) {
      case 'horse': case 'bull': case 'crest':
        ctx.fillStyle = kind === 'horse' ? lit('#ffd21f') : kind === 'bull' ? lit('#c9a13b') : lit('#d9b54a');
        ctx.beginPath(); ctx.moveTo(-12, -16); ctx.lineTo(12, -16); ctx.lineTo(12, 2); ctx.quadraticCurveTo(12, 14, 0, 20); ctx.quadraticCurveTo(-12, 14, -12, 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lit('#1a1a1a'); ctx.fillRect(-4, -10, 8, 16);
        break;
      case 'macaron':
        ctx.fillStyle = chrome; U.ellipse(ctx, 0, 0, 24, 15); ctx.fill();
        ctx.fillStyle = lit('#d4101e'); U.ellipse(ctx, 0, 0, 19, 11); ctx.fill();
        break;
      case 'wings':
        ctx.fillStyle = chrome;
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-30, -12, -46, -4); ctx.quadraticCurveTo(-26, 2, 0, 8); ctx.quadraticCurveTo(26, 2, 46, -4); ctx.quadraticCurveTo(30, -12, 0, -4); ctx.fill();
        break;
      case 'ring': case 'star':
        ctx.strokeStyle = chrome; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = chrome; ctx.fillRect(-20, -3, 40, 6);
        break;
      case 'rings':
        ctx.strokeStyle = chrome; ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-20 + i * 20, 0, 12, 0, Math.PI * 2); ctx.stroke(); }
        break;
      case 'swoosh':
        ctx.fillStyle = chrome; ctx.beginPath(); ctx.moveTo(-26, 6); ctx.quadraticCurveTo(0, -18, 28, -8); ctx.quadraticCurveTo(0, -8, -26, 6); ctx.fill();
        break;
      case 'shield':
        ctx.fillStyle = chrome; ctx.beginPath(); ctx.moveTo(-13, -14); ctx.lineTo(13, -14); ctx.lineTo(10, 8); ctx.lineTo(0, 18); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lit('#c4a040'); ctx.fillRect(-6, -8, 12, 10);
        break;
      default: // pony
        ctx.fillStyle = chrome; ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(-6, -10); ctx.lineTo(8, -12); ctx.lineTo(18, -2); ctx.lineTo(4, 0); ctx.lineTo(-4, 10); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------- Perfil lateral ---------------- */
  function drawWheel(ctx, x, y, r, style, caliper, spin) {
    ctx.fillStyle = '#131417';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#26282d'; ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.stroke();
    const rr = r * 0.72;
    ctx.fillStyle = U.rad(ctx, x, y, 0, rr, [0, '#5c6068', 0.7, '#3e4148', 1, '#24262b']);
    ctx.beginPath(); ctx.arc(x, y, rr * 0.9, 0, Math.PI * 2); ctx.fill();
    // disco perforado
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr * 0.62, y + Math.sin(a) * rr * 0.62, rr * 0.035, 0, Math.PI * 2); ctx.fill(); }
    // pinza de freno (delante-arriba)
    ctx.fillStyle = caliper;
    ctx.beginPath(); ctx.arc(x, y, rr * 0.84, -Math.PI * 0.42, -Math.PI * 0.02); ctx.arc(x, y, rr * 0.52, -Math.PI * 0.02, -Math.PI * 0.42, true); ctx.closePath(); ctx.fill();
    // radios
    const spokeFill = U.lin(ctx, x - rr, y - rr, x + rr, y + rr, [0, '#f4f6f8', 0.5, '#b4bac2', 1, '#7a8088']);
    ctx.fillStyle = spokeFill;
    const a0 = spin || 0;
    const spoke = (a, w0, w1, r0, r1) => {
      const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
      ctx.beginPath();
      ctx.moveTo(x + ca * r0 + nx * w0, y + sa * r0 + ny * w0);
      ctx.lineTo(x + ca * r1 + nx * w1, y + sa * r1 + ny * w1);
      ctx.lineTo(x + ca * r1 - nx * w1, y + sa * r1 - ny * w1);
      ctx.lineTo(x + ca * r0 - nx * w0, y + sa * r0 - ny * w0);
      ctx.closePath(); ctx.fill();
    };
    if (style === 'aero') {
      ctx.fillStyle = U.rad(ctx, x - rr * 0.3, y - rr * 0.3, 0, rr, [0, '#dfe3e8', 1, '#5a6068']);
      ctx.beginPath(); ctx.arc(x, y, rr * 0.96, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1c20';
      for (let i = 0; i < 5; i++) { const a = a0 + (i / 5) * Math.PI * 2; U.ellipse(ctx, x + Math.cos(a) * rr * 0.62, y + Math.sin(a) * rr * 0.62, rr * 0.16, rr * 0.09, a); ctx.fill(); }
    } else if (style === 'turbine') {
      for (let i = 0; i < 14; i++) {
        const a = a0 + (i / 14) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rr * 0.2, y + Math.sin(a) * rr * 0.2);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.35) * rr * 0.6, y + Math.sin(a + 0.35) * rr * 0.6, x + Math.cos(a + 0.5) * rr * 0.96, y + Math.sin(a + 0.5) * rr * 0.96);
        ctx.lineTo(x + Math.cos(a + 0.68) * rr * 0.96, y + Math.sin(a + 0.68) * rr * 0.96);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.45) * rr * 0.55, y + Math.sin(a + 0.45) * rr * 0.55, x + Math.cos(a + 0.2) * rr * 0.2, y + Math.sin(a + 0.2) * rr * 0.2);
        ctx.fill();
      }
    } else {
      const n = style === '10' ? 10 : style === '6' ? 6 : 5;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * Math.PI * 2;
        if (style === 'Y') {
          spoke(a, rr * 0.07, rr * 0.05, rr * 0.18, rr * 0.55);
          spoke(a - 0.2, rr * 0.05, rr * 0.05, rr * 0.5, rr * 0.97);
          spoke(a + 0.2, rr * 0.05, rr * 0.05, rr * 0.5, rr * 0.97);
        } else if (style === '5') {
          spoke(a - 0.09, rr * 0.05, rr * 0.06, rr * 0.18, rr * 0.97);
          spoke(a + 0.09, rr * 0.05, rr * 0.06, rr * 0.18, rr * 0.97);
        } else {
          spoke(a, rr * 0.07, rr * (n === 10 ? 0.045 : 0.08), rr * 0.18, rr * 0.97);
        }
      }
    }
    ctx.strokeStyle = spokeFill; ctx.lineWidth = r * 0.075;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = U.rad(ctx, x - rr * 0.06, y - rr * 0.06, 0, rr * 0.2, [0, '#ffffff', 1, '#6a7078']);
    ctx.beginPath(); ctx.arc(x, y, rr * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1b1d22';
    ctx.beginPath(); ctx.arc(x, y, rr * 0.07, 0, Math.PI * 2); ctx.fill();
  }

  Art.drawWheel = drawWheel;

  Art.carSide = function (model, color, opt) {
    opt = opt || {};
    const W = Math.max(120, Math.round(opt.w || 900));
    const H = Math.round(W * 0.4);
    const cv = U.canvas(W, H);
    const ctx = cv.getContext('2d');
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const Sd = model.side;
    const S = W * 0.9, ox = W * 0.05, gy = H * 0.94;
    const X = (x) => ox + (1 - x) * S;
    const Y = (y) => gy - y * S;
    const P = (arr) => arr.map((p) => [X(p[0]), Y(p[1]), p[2]]);
    const paint = color;
    const sec = model.sec || '#15171b';
    const fx = Sd.wheels[0], rx = Sd.wheels[1], wr = Sd.wheels[2];
    const cl = Sd.cl;
    const ar = wr * 1.13;
    const alpha = Math.asin(U.clamp((wr - cl) / ar, -1, 1));
    let maxH = 0;
    Sd.body.forEach((p) => { if (p[1] > maxH) maxH = p[1]; });

    const bodyPath = () => {
      ctx.beginPath();
      U.smoothShape(ctx, P(Sd.body), false);
      const sillY = Y(cl), wy = Y(wr), a = ar * S;
      const rw = X(rx), fw = X(fx);
      ctx.lineTo(rw - a * Math.cos(alpha), sillY);
      ctx.arc(rw, wy, a, Math.PI - alpha, alpha, false);
      ctx.lineTo(fw - a * Math.cos(alpha), sillY);
      ctx.arc(fw, wy, a, Math.PI - alpha, alpha, false);
      ctx.closePath();
    };

    // sombra de contacto
    if (opt.shadow !== false) {
      ctx.fillStyle = U.rad(ctx, W / 2, gy, 0, S * 0.55, [0, 'rgba(0,0,0,0.55)', 0.6, 'rgba(0,0,0,0.25)', 1, 'rgba(0,0,0,0)']);
      ctx.save(); ctx.translate(W / 2, gy); ctx.scale(1, 0.07); ctx.translate(-W / 2, -gy);
      ctx.beginPath(); ctx.arc(W / 2, gy, S * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // aletas sobre las ruedas (cubren el paso de rueda aunque el capó sea bajo)
    const bodyGrad = U.lin(ctx, 0, Y(maxH), 0, Y(cl), [0, U.shade(paint, 0.28), 0.35, U.shade(paint, 0.06), 0.62, paint, 1, U.shade(paint, -0.45)]);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, Y(cl + 0.01)); ctx.clip();
    [[fx, 0.013], [rx, 0.02]].forEach((w) => {
      const xw = X(w[0]);
      ctx.fillStyle = bodyGrad;
      U.ellipse(ctx, xw, Y(wr), ar * S * 1.36, (ar + w[1]) * S);
      ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, Y(wr + ar * 0.55)); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = S * 0.0025;
      ctx.beginPath(); ctx.ellipse(xw, Y(wr), ar * S * 1.36, (ar + w[1]) * S, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    // hueco de los pasos de rueda
    ctx.fillStyle = '#0a0b0d';
    [X(rx), X(fx)].forEach((xw) => { ctx.beginPath(); ctx.arc(xw, Y(wr), ar * S * 0.99, 0, Math.PI * 2); ctx.fill(); });

    // alerón (detrás de la carrocería: soportes)
    const wing = Sd.wing;
    if (wing && !wing.flush && !wing.integrated) {
      ctx.fillStyle = '#16181c';
      const px = X(wing.post || wing.x + wing.len * 0.5);
      if (wing.swan) {
        ctx.strokeStyle = '#16181c'; ctx.lineWidth = S * 0.01;
        ctx.beginPath(); ctx.moveTo(px, Y(maxH * 0.72)); ctx.quadraticCurveTo(px - S * 0.02, Y(wing.y + 0.04), px - S * 0.04, Y(wing.y + 0.012)); ctx.stroke();
      } else {
        ctx.fillRect(px - S * 0.006, Y(wing.y), S * 0.012, (wing.y - maxH * 0.7) * S);
      }
    }

    // carrocería
    bodyPath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.save();
    bodyPath();
    ctx.clip();
    if (Sd.two) { ctx.fillStyle = U.lin(ctx, 0, Y(maxH), 0, Y(cl), [0, U.shade(sec, 0.25), 1, U.shade(sec, -0.3)]); ctx.beginPath(); U.smoothShape(ctx, P(Sd.two)); ctx.fill(); }
    if (Sd.accent) { ctx.fillStyle = U.lin(ctx, 0, Y(0.24), 0, Y(0.09), [0, U.shade(sec, 0.3), 1, sec]); ctx.beginPath(); U.smoothShape(ctx, P(Sd.accent)); ctx.fill(); }
    // brillo superior (reflejo del cielo)
    ctx.fillStyle = U.lin(ctx, 0, Y(maxH), 0, Y(maxH * 0.62), [0, 'rgba(255,255,255,0.42)', 1, 'rgba(255,255,255,0)']);
    ctx.fillRect(0, Y(maxH) - 4, W, maxH * 0.4 * S + 4);
    // banda de horizonte
    ctx.fillStyle = U.lin(ctx, 0, Y(0.155), 0, Y(0.115), [0, 'rgba(255,255,255,0)', 0.45, 'rgba(255,255,255,0.18)', 0.55, 'rgba(0,0,0,0.12)', 1, 'rgba(0,0,0,0)']);
    ctx.fillRect(0, Y(0.155), W, 0.04 * S);
    // oscurecido inferior
    ctx.fillStyle = U.lin(ctx, 0, Y(cl + 0.075), 0, Y(cl), [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.55)']);
    ctx.fillRect(0, Y(cl + 0.075), W, 0.08 * S);
    ctx.restore();

    // línea de hombro
    if (Sd.line) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.line), false);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = S * 0.004; ctx.stroke();
      ctx.save(); ctx.translate(0, -S * 0.004);
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.line), false);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = S * 0.003; ctx.stroke();
      ctx.restore();
      if (Sd.stripe && model.id === 'valkyrie') { ctx.beginPath(); U.smoothShape(ctx, P(Sd.line), false); ctx.strokeStyle = sec; ctx.lineWidth = S * 0.005; ctx.stroke(); }
    }

    // toma de aire lateral
    if (Sd.intake) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.intake));
      ctx.fillStyle = U.lin(ctx, 0, Y(0.2), 0, Y(0.1), [0, '#050607', 1, '#22252b']);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = S * 0.002; ctx.stroke();
    }
    if (Sd.scoop) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.scoop));
      ctx.fillStyle = U.lin(ctx, 0, Y(0.29), 0, Y(0.25), [0, U.shade(sec, 0.3), 1, sec]);
      ctx.fill();
    }
    if (Sd.fin) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.fin));
      ctx.fillStyle = U.lin(ctx, 0, Y(0.23), 0, Y(0.17), [0, U.shade(paint, 0.25), 1, U.shade(paint, -0.2)]);
      ctx.fill();
    }

    // cristales
    ctx.beginPath(); U.smoothShape(ctx, P(Sd.glass));
    ctx.fillStyle = U.lin(ctx, 0, Y(maxH), 0, Y(0.18), [0, '#43526c', 0.55, '#161e2c', 1, '#0b1018']);
    ctx.fill();
    ctx.strokeStyle = '#0a0b0e'; ctx.lineWidth = S * 0.004; ctx.stroke();
    ctx.save();
    ctx.beginPath(); U.smoothShape(ctx, P(Sd.glass)); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    const gx0 = X(Sd.glass[0][0]);
    ctx.beginPath(); ctx.moveTo(gx0 - S * 0.02, Y(0.3)); ctx.lineTo(gx0 - S * 0.07, Y(0.3)); ctx.lineTo(gx0 - S * 0.16, Y(0.15)); ctx.lineTo(gx0 - S * 0.11, Y(0.15)); ctx.closePath(); ctx.fill();
    ctx.restore();

    // línea de puerta
    const doorX = X((fx + rx) / 2 + 0.03);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = S * 0.0025;
    ctx.beginPath(); ctx.moveTo(doorX, Y(Sd.glass[Sd.glass.length - 1][1] - 0.01)); ctx.quadraticCurveTo(doorX + S * 0.01, Y(0.12), doorX - S * 0.004, Y(cl + 0.012)); ctx.stroke();

    // retrovisor
    if (Sd.mirror) {
      const mx = X(Sd.mirror[0]), my = Y(Sd.mirror[1]);
      ctx.fillStyle = '#0c0d10'; ctx.fillRect(mx - S * 0.004, my, S * 0.008, S * 0.012);
      ctx.fillStyle = U.lin(ctx, 0, my - S * 0.018, 0, my + S * 0.006, [0, U.shade(paint, 0.25), 1, U.shade(paint, -0.25)]);
      U.ellipse(ctx, mx + S * 0.004, my - S * 0.006, S * 0.024, S * 0.012, -0.12); ctx.fill();
    }

    // faros
    if (Sd.hl) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.hl));
      ctx.fillStyle = U.lin(ctx, X(0.08), 0, X(0), 0, [0, '#9fb8d0', 0.5, '#eef6ff', 1, '#ffffff']);
      ctx.fill(); ctx.strokeStyle = '#1a1c22'; ctx.lineWidth = S * 0.002; ctx.stroke();
    }
    if (Sd.tl) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.tl));
      ctx.fillStyle = U.lin(ctx, X(1), 0, X(0.96), 0, [0, '#ff4a5a', 1, '#8a0010']);
      ctx.fill();
    }

    // C-line Bugatti
    if (Sd.cline) {
      ctx.beginPath(); U.smoothShape(ctx, P(Sd.cline), false);
      ctx.strokeStyle = U.lin(ctx, 0, Y(0.25), 0, Y(0.07), [0, '#ffffff', 0.5, '#a8b0ba', 1, '#e8ecf0']);
      ctx.lineWidth = S * 0.011; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = S * 0.002; ctx.stroke();
    }

    // alerón
    if (wing) {
      const x0 = X(wing.x + wing.len), x1 = X(wing.x), wy = Y(wing.y);
      const th = wing.th * S;
      ctx.fillStyle = wing.integrated ? U.lin(ctx, 0, wy - th, 0, wy + th, [0, U.shade(paint, 0.3), 1, U.shade(paint, -0.3)]) : U.lin(ctx, 0, wy - th, 0, wy + th, [0, '#3a3e46', 1, '#0e0f12']);
      ctx.beginPath();
      ctx.moveTo(x0, wy);
      ctx.quadraticCurveTo((x0 + x1) / 2, wy - th * 1.3, x1, wy - th * 0.2);
      ctx.lineTo(x1, wy + th * 0.4);
      ctx.quadraticCurveTo((x0 + x1) / 2, wy + th * 0.5, x0, wy);
      ctx.closePath();
      ctx.fill();
      if (wing.big || wing.swan) {
        ctx.fillStyle = '#121418';
        U.rr(ctx, x0 - S * 0.004, wy - th * 1.6, (x1 - x0) * 0.9, th * 2.6, S * 0.004);
        ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      }
    }

    // ruedas
    drawWheel(ctx, X(rx), Y(wr), wr * S, Sd.rim, Sd.caliper, opt.spin || 0);
    drawWheel(ctx, X(fx), Y(wr), wr * S, Sd.rim, Sd.caliper, opt.spin || 0);

    // perfil de luz en el techo
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, Y(maxH * 0.62)); ctx.clip();
    bodyPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = S * 0.0025; ctx.stroke();
    ctx.restore();

    return cv;
  };

  /* ---------------- Expositor (garaje / concesionario) ---------------- */
  Art.showroom = function (canvas, model, color, opt) {
    opt = opt || {};
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const floorY = H * 0.8;
    // foco elíptico que se desvanece antes de los bordes
    const sr = Math.min(floorY * 0.97, W / 3.1);
    ctx.save();
    ctx.translate(W / 2, floorY);
    ctx.scale(1.5, 1);
    ctx.fillStyle = U.rad(ctx, 0, 0, 0, sr, [0, 'rgba(127,203,232,0.2)', 0.55, 'rgba(127,203,232,0.06)', 1, 'rgba(127,203,232,0)']);
    ctx.fillRect(-sr, -sr, sr * 2, sr * 2);
    ctx.restore();
    // suelo pulido
    ctx.save();
    ctx.translate(W / 2, floorY);
    ctx.scale(W * 0.48, (H - floorY) * 1.1);
    ctx.fillStyle = U.rad(ctx, 0, 0, 0, 1, [0, 'rgba(255,255,255,0.09)', 1, 'rgba(255,255,255,0)']);
    ctx.fillRect(-1, 0, 2, 1);
    ctx.restore();
    ctx.strokeStyle = U.lin(ctx, 0, 0, W, 0, [0, 'rgba(255,255,255,0)', 0.5, 'rgba(255,255,255,0.16)', 1, 'rgba(255,255,255,0)']);
    ctx.lineWidth = Math.max(1, W / 900);
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();
    // plataforma
    ctx.save();
    ctx.translate(W / 2, floorY);
    ctx.scale(1, 0.09);
    ctx.fillStyle = U.rad(ctx, 0, 0, 0, W * 0.44, [0, 'rgba(255,122,26,0.28)', 0.7, 'rgba(255,122,26,0.08)', 1, 'rgba(255,122,26,0)']);
    ctx.beginPath(); ctx.arc(0, 0, W * 0.44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,160,90,0.55)'; ctx.lineWidth = W * 0.02;
    ctx.beginPath(); ctx.arc(0, 0, W * 0.42, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    const CG = TG.CarGL;
    if (CG && CG.has(model.id) && opt.angle != null) {
      // coche 3D (Blender + WebGL) girando sobre la plataforma, con reflejo en el suelo
      const tmp = Art._show && Art._show.width === W && Art._show.height === H ? Art._show : (Art._show = U.canvas(W, H));
      const tc = tmp.getContext('2d');
      tc.clearRect(0, 0, W, H);
      CG.showroom(tc, model.id, CG.colors(model, color), W, H, floorY, opt.angle);
      const rf = Art._showR && Art._showR.width === W && Art._showR.height === H ? Art._showR : (Art._showR = U.canvas(W, H));
      const rc2 = rf.getContext('2d');
      rc2.setTransform(1, 0, 0, 1, 0, 0);
      rc2.clearRect(0, 0, W, H);
      rc2.translate(0, floorY * 2);
      rc2.scale(1, -1);
      rc2.drawImage(tmp, 0, 0);
      rc2.setTransform(1, 0, 0, 1, 0, 0);
      rc2.globalCompositeOperation = 'destination-in';
      rc2.fillStyle = U.lin(rc2, 0, floorY, 0, floorY + (H - floorY) * 0.9, [0, 'rgba(0,0,0,0.28)', 1, 'rgba(0,0,0,0)']);
      rc2.fillRect(0, floorY, W, H - floorY);
      rc2.fillRect(0, 0, 0, 0);
      rc2.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath(); ctx.rect(0, floorY, W, H - floorY); ctx.clip();
      ctx.drawImage(rf, 0, 0);
      ctx.restore();
      ctx.drawImage(tmp, 0, 0);
      return tmp;
    }
    const carW = Math.round(W * 0.86);
    const img = Art.carSide(model, color, { w: carW, spin: opt.spin });
    const x = (W - carW) / 2, y = floorY - img.height * 0.94;
    // reflejo con desvanecido
    const refl = U.canvas(img.width, img.height);
    const rc = refl.getContext('2d');
    rc.translate(0, img.height);
    rc.scale(1, -1);
    rc.drawImage(img, 0, 0);
    rc.setTransform(1, 0, 0, 1, 0, 0);
    rc.globalCompositeOperation = 'destination-in';
    rc.fillStyle = U.lin(rc, 0, 0, 0, img.height * 0.5, [0, 'rgba(0,0,0,0.3)', 1, 'rgba(0,0,0,0)']);
    rc.fillRect(0, 0, img.width, img.height);
    ctx.drawImage(refl, x, floorY - img.height * 0.06);
    ctx.drawImage(img, x, y);
    return img;
  };
})(window.TG);
