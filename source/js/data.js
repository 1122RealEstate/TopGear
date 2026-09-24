'use strict';
/* ============================================================
   Datos: constantes, coches, mejoras, economía, copas y temas
   ============================================================ */
(function (TG) {
  const U = TG.U;

  TG.C = {
    SEG: 200,          // longitud de segmento (unidades de mundo)
    ROAD_W: 2000,      // semiancho de la carretera
    RUMBLE: 4,         // segmentos por banda de color
    LANES: 3,
    CAR_W: 0.36,       // ancho del coche en semianchos de carretera
    CAR_LEN: 300,      // largo para colisiones (unidades z)
    KMH: 36,           // unidades por segundo por km/h
    CAM_H: 900,
    CAM_H_FAR: 1320,
    FOV: 100,
    CAM_DIST: 1.3,
    HORIZON: 0.47,
    STEER: 2.25,
    CENTRI: 0.46,
    STEP: 1 / 120,
    DRAW: { low: 170, medium: 230, high: 300, ultra: 360 },
  };

  /* ---------------- Coches ----------------
     rear: parámetros de la vista trasera (en carrera)
     side: silueta lateral (garaje / concesionario). x: 0 = morro, 1 = cola; y = altura
  */
  TG.CARS = [
    {
      id: 'mustang', brand: 'Ford', name: 'Mustang GT', price: 0, top: 250, acc: 4.3, hand: 0.5, gears: 6,
      color: '#1766d6', eng: { cyl: 8, idle: 800, red: 7400, sub: 0.55, turbo: 0 },
      desc: 'El muscle car americano. V8 de 5.0 litros, tracción trasera y mucho carácter.',
      rear: { w: 0.95, h: 0.66, deck: 0.47, cabinB: 0.72, cabinT: 0.55, hip: 10, arch: 4, lights: 'tri', spoiler: 'duck', exhaust: 'quad', fins: 2, stripes: '#f2f2f2', badge: 'pony', mesh: 0, engine: 0 },
      side: {
        body: [[0.012, 0.062], [0, 0.098], [0.006, 0.14], [0.045, 0.158], [0.2, 0.176], [0.355, 0.192, 1], [0.47, 0.266], [0.55, 0.284], [0.645, 0.276], [0.8, 0.224], [0.93, 0.212], [0.972, 0.218, 1], [0.99, 0.196], [1, 0.13], [0.99, 0.076]],
        glass: [[0.385, 0.198], [0.472, 0.26], [0.552, 0.276], [0.642, 0.268], [0.735, 0.228], [0.64, 0.205]],
        wheels: [0.185, 0.748, 0.079], cl: 0.05, rim: '5', caliper: '#c41a1a',
        hl: [[0.004, 0.128], [0.058, 0.152], [0.066, 0.14], [0.012, 0.116]],
        tl: [[0.978, 0.19], [0.997, 0.186], [0.999, 0.155], [0.982, 0.16]],
        line: [[0.07, 0.15], [0.3, 0.16], [0.62, 0.168], [0.9, 0.186]], mirror: [0.405, 0.205], stripe: '#f2f2f2',
      },
    },
    {
      id: 'gtr', brand: 'Nissan', name: 'GT-R Nismo', price: 55000, top: 315, acc: 2.7, hand: 0.62, gears: 6,
      color: '#e8eaed', eng: { cyl: 6, idle: 950, red: 7100, sub: 0.35, turbo: 1 },
      desc: '«Godzilla». Tracción total y un V6 biturbo que empuja como un avión.',
      rear: { w: 0.95, h: 0.66, deck: 0.48, cabinB: 0.74, cabinT: 0.58, hip: 6, arch: 6, lights: 'rings', spoiler: 'wing', exhaust: 'quad', fins: 3, badge: 'ring', mesh: 0, engine: 0 },
      side: {
        body: [[0.012, 0.062], [0, 0.1], [0.008, 0.145], [0.055, 0.163], [0.22, 0.18], [0.35, 0.198, 1], [0.46, 0.272], [0.56, 0.29], [0.67, 0.281], [0.82, 0.23], [0.95, 0.22], [0.99, 0.2], [1, 0.13], [0.99, 0.076]],
        glass: [[0.378, 0.203], [0.465, 0.266], [0.565, 0.282], [0.672, 0.272], [0.752, 0.234], [0.68, 0.212]],
        wheels: [0.19, 0.78, 0.08], cl: 0.05, rim: '6', caliper: '#d01e1e',
        wing: { x: 0.84, y: 0.268, len: 0.15, th: 0.012, post: 0.9 },
        intake: [[0.285, 0.152], [0.33, 0.156], [0.325, 0.124], [0.288, 0.124]],
        hl: [[0.006, 0.13], [0.07, 0.158], [0.08, 0.146], [0.014, 0.118]],
        tl: [[0.982, 0.198], [0.998, 0.19], [0.999, 0.165], [0.985, 0.168]],
        line: [[0.06, 0.152], [0.4, 0.17], [0.7, 0.19], [0.93, 0.205]], mirror: [0.395, 0.212],
      },
    },
    {
      id: 'vantage', brand: 'Aston Martin', name: 'Vantage', price: 78000, top: 314, acc: 3.6, hand: 0.68, gears: 8,
      color: '#1f7a5a', eng: { cyl: 8, idle: 850, red: 7000, sub: 0.45, turbo: 1 },
      desc: 'Elegancia británica con un V8 biturbo. Ágil, compacto y muy estable.',
      rear: { w: 0.96, h: 0.62, deck: 0.45, cabinB: 0.68, cabinT: 0.5, hip: 16, arch: 8, lights: 'slim', spoiler: 'duck', exhaust: 'quad', fins: 4, badge: 'wings', mesh: 0, engine: 0 },
      side: {
        body: [[0.012, 0.058], [0, 0.094], [0.014, 0.133], [0.07, 0.153], [0.22, 0.17], [0.38, 0.189, 1], [0.5, 0.26], [0.572, 0.278], [0.66, 0.268], [0.8, 0.224], [0.92, 0.211], [0.962, 0.219, 1], [0.985, 0.2], [1, 0.14], [0.99, 0.074]],
        glass: [[0.405, 0.194], [0.502, 0.254], [0.575, 0.268], [0.662, 0.257], [0.72, 0.23], [0.65, 0.204]],
        wheels: [0.18, 0.78, 0.081], cl: 0.048, rim: '10', caliper: '#2a2a2a',
        intake: [[0.285, 0.142], [0.345, 0.146], [0.338, 0.118], [0.29, 0.117]],
        hl: [[0.01, 0.124], [0.075, 0.148], [0.082, 0.138], [0.016, 0.112]],
        tl: [[0.975, 0.205], [0.998, 0.198], [0.999, 0.178], [0.978, 0.185]],
        line: [[0.08, 0.14], [0.35, 0.155], [0.62, 0.165], [0.9, 0.19]], mirror: [0.42, 0.203],
      },
    },
    {
      id: 'amggt', brand: 'Mercedes-AMG', name: 'GT R', price: 115000, top: 318, acc: 3.6, hand: 0.72, gears: 7,
      color: '#6d8f1f', eng: { cyl: 8, idle: 800, red: 7200, sub: 0.5, turbo: 1 },
      desc: '«La bestia del infierno verde». Capó interminable y aerodinámica de competición.',
      rear: { w: 0.97, h: 0.62, deck: 0.45, cabinB: 0.66, cabinT: 0.5, hip: 18, arch: 6, lights: 'amg', spoiler: 'wing', exhaust: 'center2', fins: 4, badge: 'star', mesh: 0, engine: 0 },
      side: {
        body: [[0.012, 0.06], [0, 0.098], [0.012, 0.14], [0.06, 0.158], [0.25, 0.176], [0.43, 0.19, 1], [0.54, 0.262], [0.61, 0.28], [0.7, 0.27], [0.84, 0.22], [0.94, 0.21], [0.985, 0.2], [1, 0.14], [0.99, 0.075]],
        glass: [[0.455, 0.195], [0.545, 0.256], [0.615, 0.27], [0.7, 0.258], [0.77, 0.225], [0.69, 0.205]],
        wheels: [0.19, 0.79, 0.081], cl: 0.048, rim: 'Y', caliper: '#d8b400',
        wing: { x: 0.855, y: 0.25, len: 0.13, th: 0.011, post: 0.9 },
        intake: [[0.31, 0.148], [0.36, 0.151], [0.355, 0.126], [0.315, 0.125]],
        hl: [[0.008, 0.13], [0.08, 0.155], [0.088, 0.142], [0.015, 0.118]],
        tl: [[0.978, 0.198], [0.998, 0.192], [0.999, 0.17], [0.98, 0.176]],
        line: [[0.07, 0.152], [0.4, 0.165], [0.7, 0.18], [0.93, 0.198]], mirror: [0.46, 0.205],
      },
    },
    {
      id: 'p911', brand: 'Porsche', name: '911 Turbo S', price: 150000, top: 330, acc: 2.7, hand: 0.78, gears: 8,
      color: '#1ba3d6', eng: { cyl: 6, idle: 900, red: 7200, sub: 0.35, turbo: 1 },
      desc: 'Motor bóxer trasero, tracción total y una salida brutal. Un clásico que no envejece.',
      rear: { w: 0.95, h: 0.63, deck: 0.44, cabinB: 0.7, cabinT: 0.52, hip: 22, arch: 14, lights: 'bar', spoiler: 'active', exhaust: 'twin', fins: 3, badge: 'crest', mesh: 0, engine: 2 },
      side: {
        body: [[0.012, 0.06], [0, 0.1], [0.01, 0.14], [0.05, 0.16], [0.16, 0.174], [0.3, 0.18], [0.37, 0.19, 1], [0.47, 0.268], [0.54, 0.286], [0.64, 0.279], [0.78, 0.245], [0.9, 0.215], [0.96, 0.2], [0.99, 0.18], [1, 0.13], [0.99, 0.075]],
        glass: [[0.395, 0.196], [0.475, 0.262], [0.55, 0.278], [0.64, 0.27], [0.72, 0.245], [0.62, 0.206]],
        wheels: [0.205, 0.755, 0.08], cl: 0.048, rim: '10', caliper: '#e6c000',
        wing: { x: 0.86, y: 0.232, len: 0.11, th: 0.01, post: 0.92, low: true },
        intake: [[0.66, 0.19], [0.73, 0.188], [0.735, 0.162], [0.672, 0.165]],
        hl: [[0.03, 0.152], [0.085, 0.172], [0.095, 0.16], [0.04, 0.142]],
        tl: [[0.968, 0.198], [0.995, 0.184], [0.998, 0.168], [0.972, 0.178]],
        line: [[0.06, 0.155], [0.3, 0.165], [0.62, 0.17], [0.88, 0.19]], mirror: [0.41, 0.205],
      },
    },
    {
      id: 'r8', brand: 'Audi', name: 'R8 V10', price: 185000, top: 331, acc: 3.1, hand: 0.76, gears: 7,
      color: '#aab0b8', sec: '#16181c', eng: { cyl: 10, idle: 1000, red: 8700, sub: 0.3, turbo: 0 },
      desc: 'V10 atmosférico de 5.2 litros que aúlla hasta 8.700 rpm. Motor central y quattro.',
      rear: { w: 0.97, h: 0.6, deck: 0.44, cabinB: 0.62, cabinT: 0.46, hip: 14, arch: 6, lights: 'r8', spoiler: 'lip', exhaust: 'twinOval', fins: 4, badge: 'rings', mesh: 1, engine: 1 },
      side: {
        body: [[0.012, 0.058], [0, 0.094], [0.012, 0.133], [0.07, 0.151], [0.2, 0.165], [0.33, 0.18, 1], [0.45, 0.258], [0.53, 0.278], [0.63, 0.268], [0.8, 0.22], [0.93, 0.205], [0.975, 0.198], [1, 0.14], [0.99, 0.074]],
        glass: [[0.355, 0.186], [0.455, 0.252], [0.54, 0.268], [0.62, 0.26], [0.655, 0.228], [0.6, 0.196]],
        wheels: [0.2, 0.8, 0.081], cl: 0.048, rim: 'Y', caliper: '#c8102e',
        accent: [[0.6, 0.198], [0.66, 0.232], [0.668, 0.1], [0.628, 0.092]],
        intake: [[0.615, 0.17], [0.652, 0.19], [0.655, 0.115], [0.628, 0.11]],
        hl: [[0.008, 0.122], [0.08, 0.146], [0.088, 0.134], [0.015, 0.11]],
        tl: [[0.978, 0.196], [0.998, 0.19], [0.999, 0.17], [0.98, 0.175]],
        line: [[0.07, 0.145], [0.35, 0.158], [0.6, 0.165]], mirror: [0.37, 0.197],
      },
    },
    {
      id: 'huracan', brand: 'Lamborghini', name: 'Huracán EVO', price: 240000, top: 325, acc: 2.9, hand: 0.82, gears: 7,
      color: '#5dbb1c', eng: { cyl: 10, idle: 1000, red: 8500, sub: 0.32, turbo: 0 },
      desc: 'Un V10 salvaje con dirección a las cuatro ruedas. Puro teatro italiano.',
      rear: { w: 0.98, h: 0.56, deck: 0.42, cabinB: 0.6, cabinT: 0.42, hip: 12, arch: 4, lights: 'y', spoiler: 'lip', exhaust: 'high2', fins: 5, badge: 'bull', mesh: 1, engine: 1 },
      side: {
        body: [[0.01, 0.05], [0, 0.088], [0.03, 0.118], [0.15, 0.143], [0.28, 0.168], [0.32, 0.178, 1], [0.45, 0.248], [0.52, 0.256], [0.62, 0.244], [0.8, 0.205], [0.95, 0.193], [0.985, 0.184], [1, 0.13], [0.99, 0.07]],
        glass: [[0.355, 0.185], [0.455, 0.243], [0.56, 0.243], [0.645, 0.214], [0.6, 0.19]],
        wheels: [0.2, 0.78, 0.083], cl: 0.044, rim: 'Y', caliper: '#e8c200',
        intake: [[0.6, 0.172], [0.7, 0.184], [0.715, 0.125], [0.63, 0.108]],
        hl: [[0.018, 0.112], [0.1, 0.138], [0.11, 0.13], [0.03, 0.104]],
        tl: [[0.975, 0.182], [0.998, 0.172], [0.999, 0.155], [0.978, 0.165]],
        line: [[0.05, 0.125], [0.3, 0.145], [0.58, 0.16], [0.9, 0.175]], mirror: [0.37, 0.195],
      },
    },
    {
      id: 'mc720', brand: 'McLaren', name: '720S', price: 290000, top: 341, acc: 2.9, hand: 0.84, gears: 7,
      color: '#ff7a00', eng: { cyl: 8, idle: 900, red: 8200, sub: 0.35, turbo: 1 },
      desc: 'Chasis de fibra de carbono y 720 CV. Precisión quirúrgica a cualquier velocidad.',
      rear: { w: 0.98, h: 0.57, deck: 0.43, cabinB: 0.56, cabinT: 0.4, hip: 10, arch: 6, lights: 'slimC', spoiler: 'active', exhaust: 'high2', fins: 5, badge: 'swoosh', mesh: 1, engine: 1 },
      side: {
        body: [[0.012, 0.052], [0, 0.09], [0.02, 0.12], [0.14, 0.145], [0.27, 0.168], [0.3, 0.175, 1], [0.43, 0.25], [0.5, 0.264], [0.6, 0.255], [0.76, 0.215], [0.92, 0.2], [0.975, 0.198], [1, 0.14], [0.99, 0.07]],
        glass: [[0.33, 0.182], [0.435, 0.245], [0.51, 0.256], [0.6, 0.247], [0.66, 0.225], [0.52, 0.19]],
        wheels: [0.2, 0.79, 0.083], cl: 0.044, rim: '10', caliper: '#9aa0a8',
        wing: { x: 0.87, y: 0.205, len: 0.12, th: 0.008, flush: true },
        intake: [[0.52, 0.162], [0.62, 0.168], [0.6, 0.112], [0.535, 0.12]],
        hl: [[0.012, 0.11], [0.07, 0.132], [0.085, 0.12], [0.02, 0.1]],
        tl: [[0.975, 0.196], [0.998, 0.19], [0.999, 0.176], [0.978, 0.182]],
        line: [[0.05, 0.13], [0.28, 0.15], [0.55, 0.16], [0.9, 0.185]], mirror: [0.345, 0.19],
      },
    },
    {
      id: 'f8', brand: 'Ferrari', name: 'F8 Tributo', price: 330000, top: 340, acc: 2.9, hand: 0.86, gears: 7,
      color: '#d10a0a', eng: { cyl: 8, idle: 1000, red: 8000, sub: 0.3, turbo: 1 },
      desc: 'Homenaje al V8 más laureado de Maranello. Equilibrio perfecto entre potencia y control.',
      rear: { w: 0.98, h: 0.57, deck: 0.43, cabinB: 0.6, cabinT: 0.43, hip: 14, arch: 6, lights: 'round4', spoiler: 'lip', exhaust: 'quad', fins: 5, badge: 'horse', mesh: 1, engine: 1 },
      side: {
        body: [[0.012, 0.055], [0, 0.09], [0.02, 0.122], [0.13, 0.145], [0.27, 0.168], [0.31, 0.176, 1], [0.44, 0.25], [0.51, 0.262], [0.61, 0.252], [0.78, 0.21], [0.93, 0.198], [0.98, 0.196], [1, 0.14], [0.99, 0.072]],
        glass: [[0.345, 0.184], [0.45, 0.245], [0.53, 0.252], [0.615, 0.24], [0.65, 0.22], [0.58, 0.19]],
        wheels: [0.2, 0.775, 0.083], cl: 0.045, rim: '5', caliper: '#ffd200',
        intake: [[0.6, 0.165], [0.68, 0.175], [0.675, 0.13], [0.61, 0.12]],
        hl: [[0.014, 0.115], [0.085, 0.138], [0.095, 0.128], [0.022, 0.106]],
        tl: [[0.978, 0.192], [0.998, 0.186], [0.999, 0.165], [0.98, 0.17]],
        line: [[0.05, 0.13], [0.3, 0.15], [0.58, 0.158], [0.9, 0.18]], mirror: [0.36, 0.192],
      },
    },
    {
      id: 'svj', brand: 'Lamborghini', name: 'Aventador SVJ', price: 440000, top: 350, acc: 2.8, hand: 0.85, gears: 7,
      color: '#6b2bd1', eng: { cyl: 12, idle: 1000, red: 8700, sub: 0.3, turbo: 0 },
      desc: 'V12 atmosférico de 770 CV y aerodinámica activa ALA. El toro más radical.',
      rear: { w: 1, h: 0.52, deck: 0.4, cabinB: 0.56, cabinT: 0.4, hip: 12, arch: 4, lights: 'y', spoiler: 'bigwing', exhaust: 'high2', fins: 6, badge: 'bull', mesh: 1, engine: 1 },
      side: {
        body: [[0.01, 0.048], [0, 0.078], [0.03, 0.105], [0.16, 0.13], [0.29, 0.152], [0.33, 0.16, 1], [0.45, 0.222], [0.52, 0.23], [0.62, 0.22], [0.8, 0.19], [0.95, 0.182], [0.985, 0.175], [1, 0.125], [0.99, 0.065]],
        glass: [[0.36, 0.166], [0.455, 0.217], [0.56, 0.218], [0.64, 0.195], [0.6, 0.172]],
        wheels: [0.21, 0.757, 0.083], cl: 0.042, rim: 'Y', caliper: '#e0b000',
        wing: { x: 0.855, y: 0.25, len: 0.14, th: 0.012, post: 0.9, big: true },
        intake: [[0.62, 0.158], [0.73, 0.168], [0.745, 0.11], [0.65, 0.1]],
        hl: [[0.016, 0.1], [0.1, 0.125], [0.11, 0.118], [0.03, 0.094]],
        tl: [[0.978, 0.172], [0.998, 0.165], [0.999, 0.148], [0.98, 0.155]],
        line: [[0.05, 0.115], [0.3, 0.135], [0.6, 0.15], [0.9, 0.165]], mirror: [0.375, 0.175],
      },
    },
    {
      id: 'laferrari', brand: 'Ferrari', name: 'LaFerrari', price: 580000, top: 350, acc: 2.4, hand: 0.9, gears: 7,
      color: '#ffcc00', eng: { cyl: 12, idle: 1000, red: 9250, sub: 0.28, turbo: 0 },
      desc: 'Híbrido V12 de 963 CV. La Ferrari definitiva, nacida de la Fórmula 1.',
      rear: { w: 0.98, h: 0.52, deck: 0.4, cabinB: 0.58, cabinT: 0.42, hip: 18, arch: 4, lights: 'round2', spoiler: 'active', exhaust: 'high2', fins: 6, badge: 'horse', mesh: 1, engine: 1 },
      side: {
        body: [[0.012, 0.05], [0, 0.085], [0.025, 0.112], [0.15, 0.132], [0.3, 0.155], [0.35, 0.162, 1], [0.46, 0.228], [0.53, 0.238], [0.63, 0.228], [0.8, 0.19], [0.94, 0.18], [0.985, 0.178], [1, 0.13], [0.99, 0.068]],
        glass: [[0.38, 0.168], [0.465, 0.223], [0.545, 0.228], [0.625, 0.215], [0.66, 0.196], [0.6, 0.172]],
        wheels: [0.21, 0.774, 0.084], cl: 0.042, rim: '5', caliper: '#1a1a1a',
        intake: [[0.62, 0.155], [0.72, 0.165], [0.71, 0.115], [0.63, 0.105]],
        hl: [[0.016, 0.106], [0.09, 0.128], [0.1, 0.12], [0.026, 0.098]],
        tl: [[0.978, 0.176], [0.998, 0.17], [0.999, 0.152], [0.98, 0.158]],
        line: [[0.05, 0.12], [0.3, 0.14], [0.6, 0.152], [0.9, 0.168]], mirror: [0.39, 0.175],
      },
    },
    {
      id: 'veyron', brand: 'Bugatti', name: 'Veyron 16.4', price: 720000, top: 407, acc: 2.5, hand: 0.8, gears: 7,
      color: '#1d4ea8', sec: '#101114', eng: { cyl: 16, idle: 900, red: 6400, sub: 0.4, turbo: 1 },
      desc: 'El primer hiperdeportivo de 1.001 CV. Un W16 con cuatro turbos que rompió todos los récords.',
      rear: { w: 0.97, h: 0.6, deck: 0.46, cabinB: 0.62, cabinT: 0.44, hip: 20, arch: 10, lights: 'veyron', spoiler: 'active', exhaust: 'centerSq', fins: 4, badge: 'macaron', mesh: 1, engine: 0, two: 1 },
      side: {
        body: [[0.015, 0.055], [0, 0.098], [0.02, 0.135], [0.1, 0.155], [0.25, 0.172], [0.34, 0.185, 1], [0.46, 0.262], [0.53, 0.271], [0.62, 0.262], [0.76, 0.228], [0.9, 0.212], [0.97, 0.2], [1, 0.15], [0.99, 0.075]],
        glass: [[0.365, 0.19], [0.465, 0.256], [0.54, 0.262], [0.61, 0.252], [0.64, 0.22], [0.57, 0.198]],
        wheels: [0.19, 0.8, 0.083], cl: 0.046, rim: 'turbine', caliper: '#d0d0d0',
        scoop: [[0.6, 0.262], [0.64, 0.288], [0.7, 0.286], [0.72, 0.25]],
        two: [[0.34, 0.4], [0.34, 0.186], [0.5, 0.2], [0.66, 0.192], [0.8, 0.172], [1.1, 0.162], [1.1, 0.4]],
        intake: [[0.62, 0.17], [0.7, 0.18], [0.7, 0.12], [0.63, 0.115]],
        hl: [[0.01, 0.13], [0.075, 0.152], [0.085, 0.142], [0.018, 0.12]],
        tl: [[0.975, 0.198], [0.998, 0.185], [0.999, 0.165], [0.978, 0.175]],
        line: [[0.06, 0.145], [0.35, 0.16], [0.62, 0.165]], mirror: [0.38, 0.2],
      },
    },
    {
      id: 'valkyrie', brand: 'Aston Martin', name: 'Valkyrie', price: 900000, top: 355, acc: 2.5, hand: 0.98, gears: 7,
      color: '#0e5a42', sec: '#b6e000', eng: { cyl: 12, idle: 1200, red: 11100, sub: 0.22, turbo: 0 },
      desc: 'Un coche de Le Mans con matrícula. V12 que grita a 11.100 rpm y el mejor agarre del juego.',
      rear: { w: 1, h: 0.5, deck: 0.36, cabinB: 0.42, cabinT: 0.3, hip: 6, arch: 0, lights: 'valk', spoiler: 'integrated', exhaust: 'high2', fins: 8, badge: 'wings', mesh: 1, engine: 0, fin: 1 },
      side: {
        body: [[0.01, 0.045], [0, 0.07], [0.04, 0.095], [0.18, 0.12], [0.28, 0.14], [0.33, 0.155, 1], [0.42, 0.21], [0.5, 0.227], [0.6, 0.218], [0.72, 0.185], [0.88, 0.17], [0.97, 0.175], [1, 0.12], [0.99, 0.06]],
        glass: [[0.35, 0.162], [0.43, 0.205], [0.51, 0.215], [0.58, 0.2], [0.52, 0.168]],
        wheels: [0.2, 0.776, 0.084], cl: 0.04, rim: 'aero', caliper: '#b6e000',
        fin: [[0.6, 0.215], [0.86, 0.224], [0.88, 0.175], [0.7, 0.186]],
        wing: { x: 0.87, y: 0.2, len: 0.12, th: 0.01, integrated: true },
        intake: [[0.56, 0.14], [0.7, 0.15], [0.68, 0.1], [0.58, 0.09]],
        hl: [[0.02, 0.086], [0.08, 0.104], [0.09, 0.097], [0.03, 0.08]],
        tl: [[0.98, 0.17], [0.998, 0.162], [0.999, 0.15], [0.982, 0.156]],
        line: [[0.05, 0.1], [0.3, 0.13], [0.6, 0.14], [0.9, 0.16]], mirror: [0.37, 0.172], stripe: '#b6e000',
      },
    },
    {
      id: 'jesko', brand: 'Koenigsegg', name: 'Jesko', price: 1300000, top: 450, acc: 2.5, hand: 0.92, gears: 9,
      color: '#eef0f3', eng: { cyl: 8, idle: 1000, red: 8500, sub: 0.35, turbo: 1 },
      desc: '1.600 CV, caja de nueve marchas y un alerón gigante. Nacido para la velocidad máxima.',
      rear: { w: 0.98, h: 0.56, deck: 0.42, cabinB: 0.58, cabinT: 0.42, hip: 14, arch: 6, lights: 'rings', spoiler: 'swan', exhaust: 'center1', fins: 6, badge: 'shield', mesh: 1, engine: 1 },
      side: {
        body: [[0.012, 0.05], [0, 0.088], [0.025, 0.118], [0.14, 0.14], [0.28, 0.162], [0.32, 0.17, 1], [0.45, 0.252], [0.52, 0.262], [0.62, 0.25], [0.78, 0.205], [0.93, 0.195], [0.985, 0.19], [1, 0.135], [0.99, 0.068]],
        glass: [[0.35, 0.178], [0.455, 0.246], [0.535, 0.252], [0.61, 0.24], [0.64, 0.21], [0.57, 0.182]],
        wheels: [0.2, 0.786, 0.085], cl: 0.044, rim: 'aero', caliper: '#e04a00',
        wing: { x: 0.85, y: 0.29, len: 0.15, th: 0.013, swan: true, big: true },
        intake: [[0.58, 0.16], [0.7, 0.172], [0.69, 0.115], [0.6, 0.105]],
        hl: [[0.014, 0.112], [0.085, 0.136], [0.095, 0.126], [0.022, 0.102]],
        tl: [[0.978, 0.188], [0.998, 0.18], [0.999, 0.162], [0.98, 0.168]],
        line: [[0.05, 0.13], [0.3, 0.15], [0.6, 0.16], [0.9, 0.18]], mirror: [0.37, 0.185],
      },
    },
    {
      id: 'chiron', brand: 'Bugatti', name: 'Chiron Super Sport', price: 2000000, top: 490, acc: 2.4, hand: 0.9, gears: 7,
      color: '#1b3fa6', sec: '#0d0f14', eng: { cyl: 16, idle: 900, red: 6900, sub: 0.42, turbo: 1 },
      desc: 'El rey. W16 de 1.600 CV y 490 km/h: el coche de serie más rápido jamás creado.',
      rear: { w: 0.99, h: 0.56, deck: 0.43, cabinB: 0.6, cabinT: 0.43, hip: 16, arch: 10, lights: 'bar', spoiler: 'active', exhaust: 'center4', fins: 5, badge: 'macaron', mesh: 1, engine: 0, two: 1 },
      side: {
        body: [[0.015, 0.052], [0, 0.095], [0.02, 0.13], [0.1, 0.148], [0.26, 0.165], [0.34, 0.178, 1], [0.45, 0.245], [0.52, 0.254], [0.62, 0.245], [0.76, 0.212], [0.92, 0.196], [0.99, 0.19], [1, 0.14], [0.99, 0.072]],
        glass: [[0.365, 0.184], [0.455, 0.24], [0.53, 0.246], [0.6, 0.238], [0.63, 0.215], [0.56, 0.19]],
        wheels: [0.18, 0.75, 0.084], cl: 0.046, rim: '10', caliper: '#e8e8e8',
        cline: [[0.46, 0.244], [0.6, 0.24], [0.655, 0.2], [0.65, 0.12], [0.6, 0.082], [0.47, 0.074]],
        two: [[0.6, 0.4], [0.6, 0.24], [0.655, 0.2], [0.65, 0.12], [0.6, 0.082], [0.6, -0.1], [1.2, -0.1], [1.2, 0.4]],
        intake: [[0.6, 0.2], [0.645, 0.195], [0.64, 0.12], [0.6, 0.1]],
        hl: [[0.01, 0.125], [0.075, 0.146], [0.085, 0.136], [0.018, 0.114]],
        tl: [[0.976, 0.188], [0.998, 0.18], [0.999, 0.165], [0.978, 0.172]],
        line: [[0.06, 0.14], [0.3, 0.155]], mirror: [0.38, 0.192],
      },
    },
  ];
  TG.CAR = {};
  TG.CARS.forEach((c, i) => { c.index = i; TG.CAR[c.id] = c; });

  /* ---------------- Mejoras ---------------- */
  TG.UPGRADES = [
    { id: 'motor', name: 'Motor', desc: '+3% de velocidad punta y algo más de empuje por nivel.', max: 5, base: 2500 },
    { id: 'turbo', name: 'Turbo', desc: '+7% de aceleración por nivel.', max: 4, base: 2200 },
    { id: 'trans', name: 'Transmisión', desc: 'Cambios más rápidos y +4% de aceleración. El nivel 3 añade una marcha.', max: 3, base: 1800 },
    { id: 'tires', name: 'Neumáticos', desc: 'Más agarre en curva, lluvia y nieve. Pierdes menos fuera de pista.', max: 4, base: 1500 },
    { id: 'nitro', name: 'Nitro', desc: '+1 carga por carrera, más potencia y más duración.', max: 4, base: 2000 },
    { id: 'tank', name: 'Depósito', desc: '−12% de consumo de combustible por nivel.', max: 3, base: 1000 },
    { id: 'chassis', name: 'Chasis', desc: 'Pierdes menos velocidad en los choques y el coche pesa menos.', max: 3, base: 1600 },
  ];
  TG.upgradeCost = function (car, up, level) {
    const f = Math.pow(1 + car.price / 100000, 0.7);
    return Math.round(up.base * Math.pow(1 + level * 1.15, 1.25) * f / 50) * 50;
  };

  // Estadísticas efectivas de un coche con sus mejoras
  TG.carStats = function (model, up) {
    const u = up || {};
    const lv = (k) => u[k] || 0;
    const top = model.top * (1 + 0.03 * lv('motor'));
    const accMul = (1 + 0.02 * lv('motor')) * (1 + 0.07 * lv('turbo')) * (1 + 0.04 * lv('trans')) * (1 + 0.015 * lv('chassis'));
    const t0100 = model.acc / accMul;
    const grip = (0.8 + 0.45 * model.hand) * (1 + 0.06 * lv('tires'));
    return {
      top, t0100, grip,
      vmax: top * TG.C.KMH,
      accel: (100 * TG.C.KMH) / t0100 * 1.3,
      nitroN: 3 + lv('nitro'),
      nitroPow: 1.22 + 0.025 * lv('nitro'),
      nitroDur: 2.4 + 0.15 * lv('nitro'),
      fuelUse: 1 - 0.12 * lv('tank'),
      crash: 1 - 0.15 * lv('chassis'),
      shift: 0.26 * (1 - 0.22 * lv('trans')),
      tires: lv('tires'),
      gears: model.gears + (lv('trans') >= 3 ? 1 : 0),
    };
  };
  // Barras para la interfaz (0..1)
  TG.statBars = function (st) {
    return {
      speed: U.clamp((st.top - 200) / 360, 0.04, 1),
      accel: U.clamp((5.2 - st.t0100) / 3.4, 0.04, 1),
      grip: U.clamp((st.grip - 0.9) / 0.65, 0.04, 1),
      nitro: U.clamp(st.nitroN / 7, 0.04, 1),
    };
  };

  /* ---------------- Pinturas ---------------- */
  TG.PAINTS = [
    { name: 'Rosso Corsa', c: '#d10a0a' }, { name: 'Giallo', c: '#ffc700' }, { name: 'Arancio', c: '#ff6a13' },
    { name: 'Verde Mantis', c: '#5dbb1c' }, { name: 'British Racing', c: '#0f5a3c' }, { name: 'Azul Francia', c: '#1b3fa6' },
    { name: 'Azul Gulf', c: '#7fcbe8' }, { name: 'Negro', c: '#1a1c21' }, { name: 'Blanco', c: '#eef0f3' },
    { name: 'Plata', c: '#b9bfc8' }, { name: 'Gris Nardo', c: '#7c8187' }, { name: 'Viola', c: '#6b2bd1' },
    { name: 'Rosa', c: '#ff3c8e' }, { name: 'Oro', c: '#c9a13b' },
  ];

  TG.DRIVERS = ['L. Moreau', 'K. Tanaka', 'S. Müller', 'J. Carter', 'R. Silva', 'E. Lindqvist', 'M. Bianchi', 'T. O’Neil',
    'D. Petrov', 'H. Sato', 'C. Dubois', 'F. Weber', 'N. Kowalski', 'P. Álvarez', 'G. Romano', 'B. Hughes', 'Y. Nakamura',
    'I. Novak', 'O. Hansen', 'V. Costa', 'A. Kaur', 'Z. Mendes', 'L. Ferreira', 'M. Jansen', 'R. Okafor', 'S. Ivanova',
    'E. Castillo', 'J. Laurent', 'A. Berg', 'K. Park'];

  TG.ECON = {
    start: 10000,
    prizePct: [1, 0.72, 0.52, 0.38, 0.28, 0.2, 0.14, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015, 0.01],
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    cupBonus: [2.5, 1.5, 1.0],
    clean: 0.12,
    record: 0.1,
  };

  /* ---------------- Temas visuales ---------------- */
  const DEF = {
    time: 'day', weather: 'clear', ambient: 1, shade: '#1b2a4a', light: '#ffffff',
    sky: ['#2f7fe0', '#8cc4f2', '#e2f2ff'],
    sun: { x: 0.72, y: 0.22, r: 0.032, c: '#fffbea', glow: '#fff0c0', a: 0.55 },
    moon: null, stars: 0, aurora: false,
    clouds: { n: 7, c: '#ffffff', shade: '#c7d6ea', a: 0.9, y: 0.3 },
    fog: '#d6e8f7', fogD: 2.6,
    grass: ['#4a9a3c', '#45923a'], road: ['#4b4f58', '#484c55'], rumble: ['#f2f2f2', '#e02f2f'], lane: '#f2f2f2', edge: '#f2f2f2',
    shoulder: null,
    layers: [],
    scenery: [],
    flora: { leaf: ['#2f8f3a', '#4bb04c', '#1d6a2b'], trunk: '#6b4a2e', snow: false },
    city: { style: 'modern', walls: ['#c9c2b6', '#9aa6b4', '#d8d2c4', '#7f8b99'], glass: '#7fb2dc', win: '#2d4058', lit: '#ffd27a', h: [0.9, 2.2] },
    house: { walls: ['#e8dcc8', '#f2efe6', '#d9c7a6'], roof: ['#9c3b2e', '#5b4a44'] },
    lampStyle: 'modern', lamps: false, headlights: false, wet: false,
    grade: null, music: 'race1',
  };
  const T = (o) => Object.assign({}, DEF, o);
  const NIGHT = { time: 'night', ambient: 0.42, shade: '#0a1030', sun: null, lamps: true, headlights: true, road: ['#2a2d35', '#282b32'], rumble: ['#b9bccb', '#9c1d2b'], lane: '#c9ccda', edge: '#c9ccda' };
  const SUNSET = { time: 'sunset', ambient: 0.86, shade: '#5a2a3a' };
  const CITY_ROAD = { road: ['#44474f', '#41444c'] };

  TG.THEMES = {
    vegas: T(Object.assign({}, NIGHT, {
      sky: ['#07031a', '#2b0b45', '#8a2a6a'], stars: 0.7, moon: { x: 0.22, y: 0.16, r: 0.022, c: '#fff6dc' },
      fog: '#4a1d55', fogD: 3.0, clouds: null,
      grass: ['#2c1d27', '#281a23'], shoulder: { w: 0.28, c: ['#3a3848', '#363444'] },
      layers: [
        { type: 'mountains', c: '#2a1240', haze: '#5c2862', h: 0.2, rough: 0.6, seed: 11, par: 1 },
        { type: 'city', c: '#170a2a', lit: '#ffcf6a', neon: ['#ff3cac', '#38e1ff', '#ffe14d'], h: 0.3, seed: 12, par: 1.3, landmark: 'vegastower', dense: 0.8 },
      ],
      scenery: [
        { s: ['palm'], p: 0.06, off: [1.3, 1.9] },
        { s: ['neon0', 'neon1', 'neon2'], every: 34, off: [1.5, 1.9] },
        { s: ['lamp'], every: 16, off: 1.14, lr: 1, both: 1 },
        { s: ['bld0', 'bld1', 'bld2', 'tower0', 'tower1'], every: 8, off: [2.3, 3.1], both: 1 },
        { s: ['cactus', 'rock'], p: 0.015, off: [1.6, 2.2] },
        { s: ['board0', 'board1'], every: 90, off: [1.35, 1.5], phase: 40 },
      ],
      flora: { leaf: ['#1d3b3a', '#2a5250', '#12282a'], trunk: '#3a2a26' },
      city: { style: 'neon', walls: ['#2a2240', '#1f2a44', '#35264a', '#232336'], glass: '#3b4f7a', win: '#1a1f33', lit: '#ffd27a', h: [1.2, 3.2] },
      grade: { c: '#ff3cac', a: 0.12, op: 'soft-light' }, music: 'race2',
    })),
    la: T(Object.assign({}, SUNSET, {
      sky: ['#1e2a6e', '#ff7e5f', '#ffd08a'], sun: { x: 0.62, y: 0.78, r: 0.06, c: '#fff3c0', glow: '#ff9a4a', a: 0.8 },
      clouds: { n: 5, c: '#ffc49a', shade: '#b0587a', a: 0.8, y: 0.45 },
      fog: '#ffb88a', fogD: 2.4, grass: ['#e6c290', '#dfba88'], shoulder: { w: 0.22, c: ['#c9c1b4', '#c2baad'] },
      layers: [
        { type: 'mountains', c: '#6a3f78', haze: '#e59078', h: 0.22, rough: 0.5, seed: 21, par: 1 },
        { type: 'hills', c: '#4a2e5c', haze: '#c47070', h: 0.12, seed: 22, par: 1.25, trees: 'palm' },
      ],
      scenery: [
        { s: ['palm'], p: 0.16, off: [1.3, 2.4] },
        { s: ['lamp'], every: 20, off: 1.14, lr: 1, both: 1 },
        { s: ['house0', 'house1', 'house2'], p: 0.03, off: [2.4, 3.2] },
        { s: ['board0', 'board1', 'board2'], every: 70, off: [1.4, 1.6], phase: 20 },
        { s: ['bush'], p: 0.05, off: [1.3, 2.2] },
      ],
      flora: { leaf: ['#3c6b3a', '#5a8a45', '#2a4d2c'], trunk: '#7a5a3e' },
      house: { walls: ['#f2e6d0', '#f5d6c6', '#e8e0f0'], roof: ['#c2583c', '#a04a3a'] },
      grade: { c: '#ff8a4a', a: 0.12, op: 'soft-light' }, music: 'race1',
    })),
    ny: T(Object.assign({}, CITY_ROAD, {
      sky: ['#3d8fe0', '#8cc6f2', '#dff1ff'], sun: { x: 0.3, y: 0.18, r: 0.03, c: '#fffbe8', glow: '#fff6d8', a: 0.5 },
      fog: '#cfe3f3', fogD: 2.8, grass: ['#6f737a', '#6b6f76'], shoulder: { w: 0.35, c: ['#a4a8b0', '#9da1a9'] },
      layers: [
        { type: 'city', c: '#7d93ad', lit: '#fff2c4', h: 0.42, seed: 31, par: 1, landmark: 'empire', dense: 1, far: 1 },
        { type: 'city', c: '#58687e', lit: '#fff2c4', h: 0.28, seed: 32, par: 1.35, dense: 1 },
      ],
      scenery: [
        { s: ['tower0', 'tower1', 'tower2', 'bld0', 'bld1'], every: 7, off: [2.1, 2.8], both: 1 },
        { s: ['lamp'], every: 14, off: 1.4, lr: 1, both: 1 },
        { s: ['tree'], every: 11, off: [1.55, 1.7], both: 1, phase: 5 },
        { s: ['board0', 'board1', 'board2'], every: 60, off: [1.5, 1.6], phase: 30 },
      ],
      flora: { leaf: ['#3c8a3a', '#56a74c', '#2a6a2c'], trunk: '#5a4332' },
      city: { style: 'glass', walls: ['#8e9cad', '#b4b9c0', '#6e7c8f', '#c8b9a2', '#a39688'], glass: '#8fc0e8', win: '#3a5470', lit: '#ffe6a0', h: [1.6, 4.0] },
      music: 'race3',
    })),
    sf: T({
      time: 'overcast', ambient: 0.92, shade: '#3a4656',
      sky: ['#8fa3b8', '#c2cfdb', '#e3e8ec'], sun: null, clouds: { n: 9, c: '#e8edf2', shade: '#a9b6c4', a: 0.7, y: 0.35 },
      fog: '#d5dde4', fogD: 6.5, grass: ['#5c8a4a', '#56834a'], shoulder: { w: 0.25, c: ['#b8b6ae', '#b0aea6'] },
      layers: [
        { type: 'hills', c: '#7f93a4', haze: '#c9d3dc', h: 0.2, seed: 41, par: 1, landmark: 'goldengate' },
        { type: 'hills', c: '#667d6a', haze: '#b8c6c4', h: 0.12, seed: 42, par: 1.3 },
      ],
      scenery: [
        { s: ['house0', 'house1', 'house2'], every: 10, off: [1.9, 2.5], both: 1 },
        { s: ['cypress', 'tree'], p: 0.05, off: [1.35, 1.8] },
        { s: ['lamp'], every: 18, off: 1.14, lr: 1, both: 1 },
      ],
      house: { walls: ['#d9a7b4', '#a9c7d9', '#f0dca8', '#c9e0c0'], roof: ['#5a5a66', '#6e5a50'], victorian: 1 },
      flora: { leaf: ['#3f6e46', '#58875a', '#2c5134'], trunk: '#5a4a3e' },
      music: 'race2',
    }),
    rio: T({
      sky: ['#1b86e6', '#6cc3f5', '#d6f2ff'], sun: { x: 0.78, y: 0.14, r: 0.03, c: '#fffbe8', glow: '#fff4c8', a: 0.55 },
      fog: '#bfe6f7', fogD: 2.2, grass: ['#3fae4a', '#37a043'], shoulder: { w: 0.3, c: ['#f1d9a6', '#ebd29c'] },
      layers: [
        { type: 'sugarloaf', c: '#3d7f6a', haze: '#9fd3e6', h: 0.34, seed: 51, par: 1 },
        { type: 'sea', c: '#1f8fd0', c2: '#6fd0f0', h: 0.035, par: 1 },
      ],
      scenery: [
        { s: ['palm'], p: 0.14, off: [1.35, 2.3] },
        { s: ['jungle'], p: 0.04, off: [2.0, 3.0] },
        { s: ['kiosk'], every: 55, off: [1.6, 1.8], phase: 10 },
        { s: ['board0', 'board1'], every: 80, off: [1.4, 1.5], phase: 50 },
        { s: ['bush'], p: 0.06, off: [1.3, 2.0] },
      ],
      flora: { leaf: ['#1f8a3a', '#3fb24c', '#156a2b'], trunk: '#7a5a3a' },
      music: 'race3',
    }),
    ba: T(Object.assign({}, CITY_ROAD, {
      time: 'dusk', ambient: 0.7, shade: '#3a2450', lamps: true,
      sky: ['#2a1f4f', '#c0587a', '#f7b267'], sun: { x: 0.4, y: 0.86, r: 0.05, c: '#ffe3a0', glow: '#ff8a5a', a: 0.7 },
      clouds: { n: 6, c: '#f3a07a', shade: '#8a4a6a', a: 0.75, y: 0.5 },
      fog: '#d88c7a', fogD: 2.8, grass: ['#4b4f55', '#474b51'], shoulder: { w: 0.32, c: ['#8f8a86', '#89847f'] },
      layers: [
        { type: 'city', c: '#4a2e52', lit: '#ffd37a', h: 0.26, seed: 61, par: 1, landmark: 'obelisk', dense: 0.8, classic: 1 },
      ],
      scenery: [
        { s: ['bld0', 'bld1', 'bld2', 'bld3'], every: 8, off: [2.0, 2.6], both: 1 },
        { s: ['jacaranda'], every: 13, off: [1.5, 1.7], both: 1, phase: 6 },
        { s: ['lamp'], every: 16, off: 1.25, lr: 1, both: 1 },
        { s: ['board0', 'board1'], every: 70, off: [1.4, 1.5], phase: 35 },
      ],
      city: { style: 'classic', walls: ['#d8c4a8', '#c9b28f', '#e2d4bd', '#b89c80'], glass: '#6a7f96', win: '#3a3a4a', lit: '#ffd37a', h: [0.9, 1.6] },
      flora: { leaf: ['#3a6a34', '#52864a', '#284c26'], trunk: '#4a3a34' },
      grade: { c: '#ff7a8a', a: 0.1, op: 'soft-light' }, music: 'race2',
    })),
    machu: T({
      sky: ['#2e6fc9', '#7fb4e8', '#e6f1fb'], sun: { x: 0.25, y: 0.2, r: 0.03, c: '#fffbe8', glow: '#fff0c8', a: 0.5 },
      clouds: { n: 8, c: '#ffffff', shade: '#c2d3e6', a: 0.9, y: 0.4 },
      fog: '#c9dcef', fogD: 3.2, grass: ['#6a9a3c', '#62913a'],
      layers: [
        { type: 'lowpoly', c: '#8fa6c4', c2: '#b8c8dc', haze: '#d6e3f0', h: 0.36, seed: 71, par: 1, snow: 0.72 },
        { type: 'lowpoly', c: '#3f6e3a', c2: '#5a8a48', haze: '#a9c6b0', h: 0.3, seed: 72, par: 1.3, peaks: 5 },
      ],
      scenery: [
        { s: ['rock'], p: 0.06, off: [1.3, 2.5] },
        { s: ['bush'], p: 0.07, off: [1.3, 2.4] },
        { s: ['llama'], p: 0.012, off: [1.5, 2.2] },
        { s: ['wall'], every: 60, off: [1.35, 1.4], both: 1 },
        { s: ['tree'], p: 0.03, off: [1.8, 3.0] },
      ],
      flora: { leaf: ['#4d7a2f', '#6a9a40', '#355a22'], trunk: '#5a4630' },
      music: 'race1',
    }),
    amazon: T({
      time: 'overcast', weather: 'rain', ambient: 0.72, shade: '#1f3a33', wet: true,
      sky: ['#3b4a45', '#6b7c72', '#9fb0a4'], sun: null, clouds: { n: 10, c: '#7d8c86', shade: '#56645f', a: 0.9, y: 0.3 },
      fog: '#8a9c90', fogD: 5, grass: ['#2f6b2a', '#2b6427'], road: ['#3b3f45', '#393d43'],
      layers: [
        { type: 'forest', c: '#3d5a48', haze: '#869a8e', h: 0.12, seed: 81, par: 1, kind: 'jungle' },
        { type: 'forest', c: '#2a4a36', haze: '#6f8676', h: 0.08, seed: 82, par: 1.3, kind: 'jungle' },
      ],
      scenery: [
        { s: ['jungle'], p: 0.16, off: [1.4, 2.8] },
        { s: ['palm'], p: 0.08, off: [1.3, 2.0] },
        { s: ['bush'], p: 0.12, off: [1.25, 1.8] },
        { s: ['hut'], every: 90, off: [1.8, 2.2], phase: 45 },
      ],
      flora: { leaf: ['#1f6a2a', '#2f8a38', '#144d1e'], trunk: '#4a3a2a' },
      music: 'race2',
    }),
    tokyo: T(Object.assign({}, NIGHT, {
      sky: ['#05060f', '#141a3a', '#3a2a6a'], stars: 0.2, fog: '#2a1f4a', fogD: 3, clouds: null,
      grass: ['#1b1d24', '#191b22'], shoulder: { w: 0.3, c: ['#2a2c35', '#282a32'] },
      layers: [
        { type: 'city', c: '#1a1636', lit: '#9fd8ff', neon: ['#ff3cac', '#38e1ff', '#b4ff4d', '#ffe14d'], h: 0.4, seed: 91, par: 1, landmark: 'tokyotower', dense: 1, far: 1 },
        { type: 'city', c: '#100d22', lit: '#ffd27a', neon: ['#ff3cac', '#38e1ff'], h: 0.26, seed: 92, par: 1.35, dense: 1 },
      ],
      scenery: [
        { s: ['tower0', 'tower1', 'tower2', 'bld0', 'bld1'], every: 7, off: [2.1, 2.8], both: 1 },
        { s: ['neon0', 'neon1', 'neon2'], every: 22, off: [1.45, 1.7] },
        { s: ['lamp'], every: 14, off: 1.25, lr: 1, both: 1 },
        { s: ['sakura'], every: 26, off: [1.5, 1.6], phase: 12 },
      ],
      city: { style: 'neon', walls: ['#23233a', '#2c2a44', '#1d2438', '#302a3c'], glass: '#344a70', win: '#161a2c', lit: '#bfe6ff', h: [1.5, 4] },
      flora: { leaf: ['#1f4a3a', '#2a6048', '#153428'], trunk: '#3a2a2e' },
      grade: { c: '#6a4cff', a: 0.12, op: 'soft-light' }, music: 'race2',
    })),
    kyoto: T(Object.assign({}, SUNSET, {
      sky: ['#3a2d6b', '#ff8c69', '#ffd29b'], sun: { x: 0.3, y: 0.8, r: 0.065, c: '#fff0c0', glow: '#ff7a4a', a: 0.8 },
      clouds: { n: 5, c: '#ffb08a', shade: '#a45a7a', a: 0.7, y: 0.5 },
      fog: '#f7b08a', fogD: 2.6, grass: ['#6e9b3a', '#679336'],
      layers: [
        { type: 'fuji', c: '#6a4a86', haze: '#f0a08a', h: 0.42, seed: 101, par: 1 },
        { type: 'hills', c: '#4e3a66', haze: '#d88a80', h: 0.1, seed: 102, par: 1.3, trees: 'pagoda' },
      ],
      scenery: [
        { s: ['sakura'], p: 0.1, off: [1.35, 2.3] },
        { s: ['lantern'], every: 18, off: 1.3, both: 1 },
        { s: ['pagoda'], every: 110, off: [2.2, 2.8], phase: 60 },
        { s: ['pine'], p: 0.03, off: [1.8, 2.8] },
      ],
      flora: { leaf: ['#3f6e2e', '#5a8a3a', '#2c5222'], trunk: '#4a3030' },
      grade: { c: '#ff8a5a', a: 0.1, op: 'soft-light' }, music: 'race3',
    })),
    fuji: T({
      sky: ['#2d7fe0', '#86bff0', '#e3f2ff'], sun: { x: 0.75, y: 0.16, r: 0.03, c: '#fffbe8', glow: '#fff4d0', a: 0.5 },
      fog: '#cfe4f6', fogD: 2.4, grass: ['#4f9a3c', '#489237'],
      layers: [
        { type: 'fuji', c: '#5f7ea6', haze: '#bcd6ee', h: 0.5, seed: 111, par: 1 },
        { type: 'sea', c: '#4f8fc8', c2: '#9fd0f0', h: 0.03, par: 1 },
        { type: 'forest', c: '#2f6a44', haze: '#8fb8b0', h: 0.07, seed: 112, par: 1.3, kind: 'pine' },
      ],
      scenery: [
        { s: ['pine'], p: 0.12, off: [1.35, 2.6] },
        { s: ['rock'], p: 0.03, off: [1.4, 2.2] },
        { s: ['bush'], p: 0.05, off: [1.3, 1.8] },
      ],
      flora: { leaf: ['#2a6a3a', '#3f8a48', '#1d4f2b'], trunk: '#5a4232' },
      music: 'race1',
    }),
    yokohama: T(Object.assign({}, NIGHT, {
      weather: 'rain', wet: true,
      sky: ['#0a0f1c', '#1b2438', '#34425e'], stars: 0, clouds: { n: 8, c: '#2a3346', shade: '#1a2030', a: 0.9, y: 0.2 },
      fog: '#2f3b52', fogD: 3.8, grass: ['#1f242c', '#1c2129'], shoulder: { w: 0.28, c: ['#2e333c', '#2b3039'] },
      layers: [
        { type: 'city', c: '#1b2336', lit: '#ffd27a', neon: ['#38e1ff', '#ff3cac'], h: 0.28, seed: 121, par: 1, landmark: 'wheel', dense: 0.7 },
        { type: 'sea', c: '#141c2c', c2: '#2f3f5a', h: 0.03, par: 1, lights: 1 },
      ],
      scenery: [
        { s: ['bld0', 'bld1', 'bld2', 'tower0'], every: 9, off: [2.1, 2.8], both: 1 },
        { s: ['lamp'], every: 14, off: 1.14, lr: 1, both: 1 },
        { s: ['neon0', 'neon1'], every: 40, off: [1.45, 1.6] },
        { s: ['board0', 'board1'], every: 75, off: [1.4, 1.5], phase: 30 },
      ],
      city: { style: 'neon', walls: ['#2a3040', '#23293a', '#343648'], glass: '#3a4a66', win: '#161c2a', lit: '#ffd9a0', h: [1.2, 3] },
      grade: { c: '#3a7aff', a: 0.1, op: 'soft-light' }, music: 'race2',
    })),
    berlin: T(Object.assign({}, CITY_ROAD, {
      time: 'overcast', ambient: 0.9, shade: '#3a4452',
      sky: ['#6f7c8c', '#a4afbb', '#d1d7dd'], sun: null, clouds: { n: 10, c: '#dfe4ea', shade: '#98a4b2', a: 0.8, y: 0.3 },
      fog: '#c0c8cf', fogD: 3, grass: ['#5a5f66', '#565b62'], shoulder: { w: 0.32, c: ['#9a9ea4', '#94989e'] },
      layers: [
        { type: 'city', c: '#8a96a4', lit: '#fff2c4', h: 0.26, seed: 131, par: 1, landmark: 'tvtower', dense: 0.8 },
      ],
      scenery: [
        { s: ['bld0', 'bld1', 'bld2', 'bld3'], every: 8, off: [2.0, 2.6], both: 1 },
        { s: ['tree'], every: 12, off: [1.5, 1.65], both: 1, phase: 4 },
        { s: ['lamp'], every: 16, off: 1.25, lr: 1, both: 1 },
        { s: ['board0', 'board1', 'board2'], every: 65, off: [1.4, 1.5], phase: 25 },
      ],
      city: { style: 'brick', walls: ['#a5a29c', '#8f7f72', '#b8b2a6', '#7d8590'], glass: '#7d96ad', win: '#3a4554', lit: '#ffe6a0', h: [1, 1.8] },
      music: 'race1',
    })),
    blackforest: T({
      time: 'overcast', weather: 'fog', ambient: 0.8, shade: '#25332c',
      sky: ['#5d6f68', '#8e9f97', '#c4cfc9'], sun: null, clouds: null,
      fog: '#aebbb4', fogD: 8, grass: ['#2f5a2e', '#2b542b'],
      layers: [
        { type: 'forest', c: '#46605a', haze: '#a4b3ad', h: 0.14, seed: 141, par: 1, kind: 'pine' },
        { type: 'forest', c: '#344a40', haze: '#8a9c94', h: 0.09, seed: 142, par: 1.3, kind: 'pine' },
      ],
      scenery: [
        { s: ['pine'], p: 0.24, off: [1.3, 3.0] },
        { s: ['rock'], p: 0.02, off: [1.35, 1.8] },
        { s: ['house0', 'house1'], every: 140, off: [2.0, 2.4], phase: 70 },
      ],
      flora: { leaf: ['#1d4a2e', '#2a603a', '#133a22'], trunk: '#4a3a2e' },
      house: { walls: ['#efe6d6', '#e2d6c0'], roof: ['#5a3a2e', '#3f3a38'] },
      music: 'race2',
    }),
    munich: T({
      time: 'overcast', weather: 'rain', ambient: 0.8, shade: '#2a3444', wet: true,
      sky: ['#4d5a6a', '#7b8898', '#aab4c0'], sun: null, clouds: { n: 10, c: '#9aa5b2', shade: '#6a7684', a: 0.9, y: 0.3 },
      fog: '#98a3ae', fogD: 4, grass: ['#3d6e36', '#386733'], road: ['#3f434a', '#3c4047'],
      layers: [
        { type: 'lowpoly', c: '#8a97a8', c2: '#aab6c4', haze: '#a8b3be', h: 0.34, seed: 151, par: 1, snow: 0.6 },
        { type: 'hills', c: '#4f6e56', haze: '#95a8a0', h: 0.1, seed: 152, par: 1.3 },
      ],
      scenery: [
        { s: ['house0', 'house1', 'house2'], p: 0.035, off: [1.9, 2.6] },
        { s: ['pine', 'tree'], p: 0.1, off: [1.35, 2.6] },
        { s: ['lamp'], every: 22, off: 1.14, lr: 1, both: 1 },
        { s: ['board0'], every: 100, off: [1.4, 1.5], phase: 50 },
      ],
      house: { walls: ['#f2ead8', '#efe0c8', '#e6ede8'], roof: ['#8a3a2a', '#6a3a30'] },
      music: 'race1',
    }),
    nurburg: T({
      sky: ['#3a86d8', '#8fc2ee', '#e6f3fd'], sun: { x: 0.2, y: 0.2, r: 0.03, c: '#fffbe8', glow: '#fff4d0', a: 0.5 },
      fog: '#cde3f5', fogD: 2.6, grass: ['#3f8a35', '#3a8231'], rumble: ['#f2f2f2', '#e02f2f'],
      layers: [
        { type: 'hills', c: '#5d8a7a', haze: '#b4d2dc', h: 0.18, seed: 161, par: 1, trees: 'pine' },
        { type: 'forest', c: '#2f5a3a', haze: '#8ab0a0', h: 0.08, seed: 162, par: 1.3, kind: 'pine' },
      ],
      scenery: [
        { s: ['pine'], p: 0.14, off: [1.7, 3.0] },
        { s: ['fence'], every: 12, off: 1.28, both: 1 },
        { s: ['tires'], every: 40, off: [1.4, 1.45], phase: 20 },
        { s: ['board0', 'board1', 'board2'], every: 55, off: [1.5, 1.6], phase: 10 },
        { s: ['flag'], every: 70, off: [1.55, 1.6], phase: 35 },
      ],
      circuit: 1, music: 'race3',
    }),
    stockholm: T({
      weather: 'snow', ambient: 0.95, shade: '#3a4a66',
      sky: ['#7fa7d0', '#b9d2ea', '#eef5fb'], sun: { x: 0.8, y: 0.3, r: 0.028, c: '#fffbea', glow: '#fff4e0', a: 0.4 },
      clouds: { n: 8, c: '#f4f8fc', shade: '#b8c8da', a: 0.8, y: 0.3 },
      fog: '#e1ebf4', fogD: 3.4, grass: ['#eef3f8', '#e3eaf2'], road: ['#474c55', '#444952'], rumble: ['#f2f2f2', '#2f6fdb'],
      layers: [
        { type: 'city', c: '#9aabc0', lit: '#fff2c4', h: 0.2, seed: 171, par: 1, dense: 0.6, classic: 1 },
        { type: 'hills', c: '#c8d6e6', haze: '#e6eef6', h: 0.1, seed: 172, par: 1.3, trees: 'pine', snow: 1 },
      ],
      scenery: [
        { s: ['pineSnow'], p: 0.12, off: [1.35, 2.8] },
        { s: ['house0', 'house1'], p: 0.025, off: [2.0, 2.6] },
        { s: ['snowman'], p: 0.01, off: [1.4, 1.8] },
        { s: ['lamp'], every: 22, off: 1.14, lr: 1, both: 1 },
      ],
      flora: { leaf: ['#2a5a44', '#3a7054', '#1d4232'], trunk: '#4a3a30', snow: true },
      house: { walls: ['#c8453a', '#e8c848', '#f0ece0'], roof: ['#3a3a40', '#5a3a30'], snow: 1 },
      music: 'race3',
    }),
    helsinki: T(Object.assign({}, NIGHT, {
      weather: 'snow', ambient: 0.5,
      sky: ['#02040c', '#0b1a2e', '#16324a'], stars: 1, aurora: true, moon: { x: 0.8, y: 0.14, r: 0.02, c: '#eaf4ff' }, clouds: null,
      fog: '#1a2f44', fogD: 3, grass: ['#8fa6bd', '#879eb5'], road: ['#2c3038', '#2a2e36'], rumble: ['#c9d4e6', '#2f5fbd'],
      layers: [
        { type: 'forest', c: '#0e1c2a', haze: '#1f3850', h: 0.12, seed: 181, par: 1, kind: 'pine' },
        { type: 'forest', c: '#08131e', haze: '#16293a', h: 0.08, seed: 182, par: 1.3, kind: 'pine' },
      ],
      scenery: [
        { s: ['pineSnow'], p: 0.16, off: [1.35, 3.0] },
        { s: ['lamp'], every: 18, off: 1.14, lr: 1, both: 1 },
        { s: ['house0', 'house1'], every: 90, off: [2.0, 2.4], phase: 30 },
        { s: ['snowman'], p: 0.008, off: [1.4, 1.8] },
      ],
      flora: { leaf: ['#1a3a3a', '#24504a', '#10282a'], trunk: '#2a2a2a', snow: true },
      house: { walls: ['#8a3a34', '#3a4a6a'], roof: ['#1a1a20', '#2a2020'], snow: 1 },
      grade: { c: '#3affc0', a: 0.08, op: 'soft-light' }, music: 'race2',
    })),
    oslo: T({
      sky: ['#3c7fd0', '#8dbde9', '#e8f3fc'], sun: { x: 0.35, y: 0.22, r: 0.03, c: '#fffbe8', glow: '#fff4d0', a: 0.5 },
      fog: '#d3e5f5', fogD: 2.8, grass: ['#3e7d3c', '#397538'],
      layers: [
        { type: 'lowpoly', c: '#5d7896', c2: '#7f9ab6', haze: '#bcd2e6', h: 0.4, seed: 191, par: 1, snow: 0.68, peaks: 7 },
        { type: 'sea', c: '#2f6a9a', c2: '#7fb6de', h: 0.035, par: 1 },
      ],
      scenery: [
        { s: ['pine'], p: 0.13, off: [1.35, 2.8] },
        { s: ['house0', 'house1'], p: 0.02, off: [2.0, 2.6] },
        { s: ['rock'], p: 0.04, off: [1.35, 2.2] },
      ],
      house: { walls: ['#a8322a', '#b8402e', '#e8d8a8'], roof: ['#2a2a2e', '#3a3a3e'] },
      flora: { leaf: ['#1f5a3a', '#2f704a', '#16422a'], trunk: '#4a3a2e' },
      music: 'race1',
    }),
    lapland: T(Object.assign({}, SUNSET, {
      weather: 'snow', ambient: 0.82,
      sky: ['#2b2f6b', '#e07a8a', '#ffcf9a'], sun: { x: 0.55, y: 0.84, r: 0.05, c: '#fff0d0', glow: '#ff9a7a', a: 0.7 },
      clouds: { n: 5, c: '#f8b8a8', shade: '#9a5a7a', a: 0.6, y: 0.45 },
      fog: '#e6b7a8', fogD: 3, grass: ['#f3dcd6', '#eccfc8'], road: ['#4a4650', '#47434d'],
      layers: [
        { type: 'hills', c: '#b08aa8', haze: '#eab4a8', h: 0.16, seed: 201, par: 1, snow: 1 },
        { type: 'forest', c: '#5a4a6a', haze: '#c890a0', h: 0.08, seed: 202, par: 1.3, kind: 'pine' },
      ],
      scenery: [
        { s: ['pineSnow'], p: 0.14, off: [1.35, 2.8] },
        { s: ['reindeer'], p: 0.01, off: [1.5, 2.3] },
        { s: ['house0'], every: 120, off: [2.0, 2.3], phase: 60 },
        { s: ['snowman'], p: 0.01, off: [1.4, 1.8] },
      ],
      flora: { leaf: ['#2a4a44', '#3a6054', '#1d3432'], trunk: '#3a2e2a', snow: true },
      house: { walls: ['#8a3a30', '#a8583a'], roof: ['#2a2020', '#3a2a2a'], snow: 1 },
      grade: { c: '#ff8aa0', a: 0.1, op: 'soft-light' }, music: 'race3',
    })),
    paris: T(Object.assign({}, NIGHT, {
      sky: ['#060a1a', '#15204a', '#3b3a6e'], stars: 0.5, moon: { x: 0.7, y: 0.15, r: 0.02, c: '#fff6e0' }, clouds: null,
      fog: '#2b2d55', fogD: 3, grass: ['#23252e', '#21232b'], shoulder: { w: 0.32, c: ['#34343e', '#31313a'] },
      layers: [
        { type: 'city', c: '#1d1f3a', lit: '#ffd27a', h: 0.2, seed: 211, par: 1, landmark: 'eiffel', dense: 0.8, classic: 1 },
      ],
      scenery: [
        { s: ['bld0', 'bld1', 'bld2', 'bld3'], every: 8, off: [2.0, 2.5], both: 1 },
        { s: ['lamp'], every: 13, off: 1.25, lr: 1, both: 1 },
        { s: ['tree'], every: 12, off: [1.55, 1.7], both: 1, phase: 6 },
        { s: ['kiosk'], every: 90, off: [1.6, 1.7], phase: 45 },
      ],
      lampStyle: 'ornate',
      city: { style: 'classic', walls: ['#3a3440', '#403a44', '#34303c'], glass: '#2a3048', win: '#1a1a26', lit: '#ffcf7a', h: [0.9, 1.4] },
      flora: { leaf: ['#1d3a2a', '#28503a', '#12281d'], trunk: '#2a2420' },
      grade: { c: '#ffb86a', a: 0.08, op: 'soft-light' }, music: 'race2',
    })),
    nice: T({
      sky: ['#2a8be6', '#79c2f3', '#e5f6ff'], sun: { x: 0.2, y: 0.18, r: 0.03, c: '#fffbe8', glow: '#fff4d0', a: 0.5 },
      fog: '#c6e6fa', fogD: 2.2, grass: ['#6a9f3f', '#63973b'], shoulder: { w: 0.25, c: ['#e8dcc0', '#e1d5b8'] },
      layers: [
        { type: 'sea', c: '#1e7fcf', c2: '#7fd2f5', h: 0.06, par: 1, glitter: 1 },
        { type: 'hills', c: '#5f8f78', haze: '#b0d6e6', h: 0.12, seed: 221, par: 1.25, side: 1 },
      ],
      scenery: [
        { s: ['palm'], p: 0.1, off: [1.35, 2.2] },
        { s: ['house0', 'house1', 'house2'], p: 0.04, off: [2.0, 2.8] },
        { s: ['cypress'], p: 0.04, off: [1.4, 2.4] },
        { s: ['lamp'], every: 24, off: 1.14, lr: 1, both: 1 },
        { s: ['lighthouse'], every: 300, off: [2.2, 2.4], phase: 150 },
      ],
      house: { walls: ['#f4e8d0', '#f8d8c0', '#f0f0e8', '#ffe0a8'], roof: ['#c8603a', '#b85a3a'] },
      music: 'race3',
    }),
    lemans: T(Object.assign({}, SUNSET, {
      sky: ['#262a60', '#f08a5d', '#ffd38c'], sun: { x: 0.7, y: 0.82, r: 0.055, c: '#fff0c0', glow: '#ff8a4a', a: 0.8 },
      clouds: { n: 6, c: '#ffb890', shade: '#a05a6a', a: 0.7, y: 0.5 },
      fog: '#f3b384', fogD: 2.6, grass: ['#5b8f37', '#558834'],
      layers: [
        { type: 'forest', c: '#5a4a5a', haze: '#e0a080', h: 0.1, seed: 231, par: 1, kind: 'tree' },
        { type: 'forest', c: '#3e3a4a', haze: '#c08070', h: 0.06, seed: 232, par: 1.3, kind: 'tree' },
      ],
      scenery: [
        { s: ['stand'], every: 36, off: [1.7, 1.8], both: 1, near: 300 },
        { s: ['board0', 'board1', 'board2'], every: 40, off: [1.45, 1.55], phase: 10 },
        { s: ['tires'], every: 30, off: [1.35, 1.4], phase: 15 },
        { s: ['fence'], every: 10, off: 1.3, both: 1 },
        { s: ['tree'], p: 0.08, off: [2.0, 3.0] },
        { s: ['flag'], every: 60, off: [1.55, 1.6], phase: 30 },
      ],
      circuit: 1, grade: { c: '#ff8a4a', a: 0.1, op: 'soft-light' }, music: 'race1',
    })),
    alps: T({
      weather: 'snow', ambient: 1,
      sky: ['#2b6fd6', '#7db3ee', '#e8f2fd'], sun: { x: 0.7, y: 0.18, r: 0.03, c: '#fffbe8', glow: '#fff4d8', a: 0.55 },
      fog: '#dce9f6', fogD: 2.6, grass: ['#f0f4f8', '#e6edf4'], road: ['#4a4f58', '#474c55'],
      layers: [
        { type: 'lowpoly', c: '#7f96b6', c2: '#a8bcd6', haze: '#d6e4f2', h: 0.46, seed: 241, par: 1, snow: 0.5, peaks: 6 },
        { type: 'lowpoly', c: '#5a7090', c2: '#8aa0bc', haze: '#c4d6e8', h: 0.26, seed: 242, par: 1.3, snow: 0.55 },
      ],
      scenery: [
        { s: ['pineSnow'], p: 0.12, off: [1.35, 2.8] },
        { s: ['rock'], p: 0.03, off: [1.35, 2.0] },
        { s: ['house0', 'house1'], every: 100, off: [2.0, 2.5], phase: 50 },
      ],
      house: { walls: ['#f2e8d8', '#e8dcc8'], roof: ['#5a3a2a', '#4a3a32'], snow: 1, chalet: 1 },
      flora: { leaf: ['#1f4f3a', '#2f6a4a', '#15382a'], trunk: '#4a3a2e', snow: true },
      music: 'race3',
    }),
    rome: T(Object.assign({}, SUNSET, {
      sky: ['#35286a', '#f2956b', '#ffd79a'], sun: { x: 0.38, y: 0.8, r: 0.055, c: '#fff0c8', glow: '#ff9a5a', a: 0.8 },
      clouds: { n: 5, c: '#ffc098', shade: '#a8607a', a: 0.7, y: 0.5 },
      fog: '#f4b88c', fogD: 2.6, grass: ['#8a9a46', '#839343'], shoulder: { w: 0.28, c: ['#d0bfa0', '#c8b798'] },
      layers: [
        { type: 'city', c: '#7a4a5a', lit: '#ffd37a', h: 0.18, seed: 251, par: 1, landmark: 'colosseum', dense: 0.6, domes: 1 },
      ],
      scenery: [
        { s: ['stonepine'], p: 0.06, off: [1.5, 2.6] },
        { s: ['cypress'], p: 0.06, off: [1.35, 2.2] },
        { s: ['column'], every: 45, off: [1.5, 1.8], phase: 20 },
        { s: ['bld0', 'bld1', 'bld2'], p: 0.05, off: [2.1, 2.8] },
        { s: ['lamp'], every: 20, off: 1.2, lr: 1, both: 1 },
      ],
      lampStyle: 'ornate',
      city: { style: 'ochre', walls: ['#e0a870', '#d8905a', '#e8c090', '#c8785a'], glass: '#6a7a8a', win: '#4a3a3a', lit: '#ffd37a', h: [0.8, 1.3] },
      flora: { leaf: ['#3a5a2a', '#4f7a38', '#2a4420'], trunk: '#5a4232' },
      grade: { c: '#ff9a5a', a: 0.1, op: 'soft-light' }, music: 'race1',
    })),
    tuscany: T({
      sky: ['#3688dd', '#8dc3ef', '#eaf5fe'], sun: { x: 0.6, y: 0.18, r: 0.03, c: '#fffbe8', glow: '#fff4d0', a: 0.5 },
      fog: '#d6e8f6', fogD: 2.4, grass: ['#9aa845', '#92a042'],
      layers: [
        { type: 'hills', c: '#8aa0a0', haze: '#c8dcea', h: 0.14, seed: 261, par: 1, landmark: 'pisa', trees: 'cypress' },
        { type: 'hills', c: '#7a9444', haze: '#b8cc9a', h: 0.08, seed: 262, par: 1.3, trees: 'cypress' },
      ],
      scenery: [
        { s: ['cypress'], p: 0.1, off: [1.35, 2.6] },
        { s: ['house0', 'house1'], p: 0.02, off: [2.2, 3.0] },
        { s: ['stonepine'], p: 0.02, off: [1.8, 2.8] },
        { s: ['bush'], p: 0.04, off: [1.3, 1.8] },
      ],
      house: { walls: ['#e8c898', '#f0d8b0', '#e0b888'], roof: ['#b8583a', '#a8503a'] },
      flora: { leaf: ['#2f5a2a', '#4a7a38', '#20401e'], trunk: '#5a4232' },
      music: 'race3',
    }),
    monza: T({
      sky: ['#3a8ee0', '#94c9f1', '#e9f5fe'], sun: { x: 0.25, y: 0.18, r: 0.03, c: '#fffbe8', glow: '#fff4d0', a: 0.5 },
      fog: '#d4e8f7', fogD: 2.4, grass: ['#3f8f3a', '#3a8736'],
      layers: [
        { type: 'forest', c: '#5f8a86', haze: '#b8d6e0', h: 0.1, seed: 271, par: 1, kind: 'tree' },
        { type: 'forest', c: '#3a6a4a', haze: '#8ab4a4', h: 0.06, seed: 272, par: 1.3, kind: 'tree' },
      ],
      scenery: [
        { s: ['stand'], every: 34, off: [1.7, 1.8], both: 1, near: 360 },
        { s: ['tires'], every: 28, off: [1.35, 1.4], phase: 14 },
        { s: ['board0', 'board1', 'board2'], every: 38, off: [1.45, 1.55], phase: 6 },
        { s: ['tree'], p: 0.1, off: [1.9, 3.0] },
        { s: ['fence'], every: 10, off: 1.3, both: 1 },
        { s: ['flag'], every: 55, off: [1.55, 1.6], phase: 25 },
      ],
      circuit: 1, music: 'race1',
    }),
    venice: T({
      time: 'dusk', ambient: 0.72, shade: '#3a2a50', lamps: true,
      sky: ['#2a2458', '#d4707a', '#f7c08a'], sun: { x: 0.66, y: 0.88, r: 0.05, c: '#ffe8b0', glow: '#ff8a6a', a: 0.7 },
      clouds: { n: 5, c: '#f0a088', shade: '#8a4a70', a: 0.7, y: 0.5 },
      fog: '#e0a08a', fogD: 2.8, grass: ['#2f6f8a', '#2b6a84'], shoulder: { w: 0.3, c: ['#bda98a', '#b5a182'] },
      water: true,
      layers: [
        { type: 'city', c: '#6a3a5a', lit: '#ffd37a', h: 0.16, seed: 281, par: 1, landmark: 'campanile', dense: 0.7, classic: 1 },
        { type: 'sea', c: '#3a5f7a', c2: '#e0a088', h: 0.03, par: 1, glitter: 1 },
      ],
      scenery: [
        { s: ['pole'], every: 9, off: [1.6, 1.75], both: 1 },
        { s: ['lamp'], every: 18, off: 1.2, lr: 1, both: 1 },
        { s: ['bld0', 'bld1', 'bld2', 'bld3'], p: 0.05, off: [2.6, 3.2] },
      ],
      lampStyle: 'ornate',
      city: { style: 'pastel', walls: ['#e8a888', '#f0c8a0', '#d88878', '#e8d0a8', '#c8a0a0'], glass: '#6a7a8a', win: '#4a3a44', lit: '#ffd37a', h: [0.8, 1.3] },
      grade: { c: '#ff8a8a', a: 0.1, op: 'soft-light' }, music: 'race3',
    }),
    london: T(Object.assign({}, NIGHT, {
      weather: 'rain', wet: true,
      sky: ['#070b16', '#18233a', '#2c3a55'], stars: 0, clouds: { n: 8, c: '#232d42', shade: '#161c2a', a: 0.9, y: 0.2 },
      fog: '#2a3650', fogD: 3.6, grass: ['#1f232b', '#1d2129'], shoulder: { w: 0.3, c: ['#2e3139', '#2b2e36'] },
      layers: [
        { type: 'city', c: '#18203a', lit: '#ffd27a', h: 0.24, seed: 291, par: 1, landmark: 'bigben', dense: 0.8, classic: 1 },
      ],
      scenery: [
        { s: ['bld0', 'bld1', 'bld2', 'bld3'], every: 8, off: [2.0, 2.6], both: 1 },
        { s: ['lamp'], every: 13, off: 1.22, lr: 1, both: 1 },
        { s: ['phonebox'], every: 60, off: [1.45, 1.5], phase: 22 },
        { s: ['tree'], every: 15, off: [1.55, 1.7], both: 1, phase: 7 },
      ],
      lampStyle: 'ornate',
      city: { style: 'brick', walls: ['#4a3a38', '#3e3a3a', '#52463e', '#3a3a44'], glass: '#2a3048', win: '#1a1a24', lit: '#ffcf7a', h: [1, 1.6] },
      flora: { leaf: ['#1a3024', '#243e2e', '#10201a'], trunk: '#2a2420' },
      grade: { c: '#4a7aff', a: 0.08, op: 'soft-light' }, music: 'race2',
    })),
    lochness: T({
      time: 'overcast', weather: 'fog', ambient: 0.82, shade: '#2e3a44',
      sky: ['#6b7784', '#9aa5b0', '#c8cfd6'], sun: null, clouds: null,
      fog: '#b5bec7', fogD: 7, grass: ['#5b7a45', '#557341'],
      layers: [
        { type: 'hills', c: '#6f7f86', haze: '#b0bac2', h: 0.2, seed: 301, par: 1 },
        { type: 'lake', c: '#5a6a76', c2: '#8a98a4', h: 0.035, par: 1, landmark: 'nessie' },
      ],
      scenery: [
        { s: ['rock'], p: 0.06, off: [1.35, 2.6] },
        { s: ['heather'], p: 0.1, off: [1.3, 2.4] },
        { s: ['pine'], p: 0.04, off: [1.8, 3.0] },
        { s: ['wall'], every: 50, off: [1.4, 1.45], both: 1 },
      ],
      flora: { leaf: ['#2a4a34', '#3a5e42', '#1d3626'], trunk: '#4a3a30' },
      music: 'race2',
    }),
    silverstone: T({
      time: 'overcast', ambient: 0.9, shade: '#3a4452',
      sky: ['#65748a', '#9ba8b8', '#cfd6de'], sun: null, clouds: { n: 10, c: '#dde2e8', shade: '#96a2b0', a: 0.85, y: 0.3 },
      fog: '#bcc6d0', fogD: 3, grass: ['#4b8a3f', '#46823b'],
      layers: [
        { type: 'forest', c: '#7a8a8e', haze: '#c0cad2', h: 0.08, seed: 311, par: 1, kind: 'tree' },
      ],
      scenery: [
        { s: ['stand'], every: 40, off: [1.7, 1.8], both: 1, near: 300 },
        { s: ['tires'], every: 30, off: [1.35, 1.4], phase: 15 },
        { s: ['board0', 'board1', 'board2'], every: 42, off: [1.45, 1.55], phase: 8 },
        { s: ['fence'], every: 10, off: 1.3, both: 1 },
        { s: ['tree'], p: 0.05, off: [2.0, 3.0] },
        { s: ['flag'], every: 60, off: [1.55, 1.6], phase: 30 },
      ],
      circuit: 1, music: 'race1',
    }),
    stonehenge: T(Object.assign({}, SUNSET, {
      sky: ['#2e2a5e', '#e98a6c', '#fcd49a'], sun: { x: 0.45, y: 0.84, r: 0.055, c: '#fff0c8', glow: '#ff8a5a', a: 0.8 },
      clouds: { n: 6, c: '#f8b090', shade: '#9a5a78', a: 0.7, y: 0.5 },
      fog: '#eeb08e', fogD: 2.8, grass: ['#6f9a45', '#699342'],
      layers: [
        { type: 'hills', c: '#7a6a8a', haze: '#e8a890', h: 0.12, seed: 321, par: 1, landmark: 'stonehenge' },
        { type: 'hills', c: '#5a7a4a', haze: '#c8a888', h: 0.07, seed: 322, par: 1.3 },
      ],
      scenery: [
        { s: ['sheep'], p: 0.025, off: [1.5, 2.6] },
        { s: ['megalith'], p: 0.01, off: [1.8, 2.6] },
        { s: ['bush'], p: 0.06, off: [1.3, 2.2] },
        { s: ['wall'], every: 55, off: [1.4, 1.45], both: 1 },
        { s: ['tree'], p: 0.03, off: [2.0, 3.0] },
      ],
      grade: { c: '#ff9a6a', a: 0.1, op: 'soft-light' }, music: 'race3',
    })),
  };
  Object.keys(TG.THEMES).forEach((k) => { TG.THEMES[k].id = k; });

  /* ---------------- Copas y circuitos ---------------- */
  const tr = (id, name, theme, seed, o) => Object.assign({ id, name, theme, seed, len: 1, curvy: 0.5, hilly: 0.35 }, o || {});
  TG.CUPS = [
    { id: 'usa', name: 'Estados Unidos', flag: 'us', prize: 7500, coin: 100, ai: 228, curve: 4.2, hill: 30, pool: [0, 0, 1, 2],
      tracks: [tr('vegas', 'Las Vegas', 'vegas', 1101, { curvy: 0.35, hilly: 0.15 }), tr('la', 'Los Ángeles', 'la', 1102, { curvy: 0.45, hilly: 0.25 }),
        tr('ny', 'Nueva York', 'ny', 1103, { curvy: 0.5, hilly: 0.2 }), tr('sf', 'San Francisco', 'sf', 1104, { curvy: 0.45, hilly: 0.8 })] },
    { id: 'sam', name: 'Sudamérica', flag: 'br', prize: 12000, coin: 150, ai: 258, curve: 4.6, hill: 38, pool: [0, 1, 2, 3],
      tracks: [tr('rio', 'Río de Janeiro', 'rio', 1201, { curvy: 0.45, hilly: 0.3 }), tr('ba', 'Buenos Aires', 'ba', 1202, { curvy: 0.5, hilly: 0.2 }),
        tr('machu', 'Machu Picchu', 'machu', 1203, { curvy: 0.65, hilly: 0.75 }), tr('amazon', 'Amazonas', 'amazon', 1204, { curvy: 0.55, hilly: 0.35 })] },
    { id: 'jpn', name: 'Japón', flag: 'jp', prize: 18000, coin: 200, ai: 286, curve: 5.0, hill: 40, pool: [1, 2, 3, 4, 5],
      tracks: [tr('tokyo', 'Tokio', 'tokyo', 1301, { curvy: 0.55, hilly: 0.2 }), tr('kyoto', 'Kioto', 'kyoto', 1302, { curvy: 0.55, hilly: 0.4 }),
        tr('fuji', 'Monte Fuji', 'fuji', 1303, { curvy: 0.6, hilly: 0.6 }), tr('yokohama', 'Yokohama', 'yokohama', 1304, { curvy: 0.5, hilly: 0.3 })] },
    { id: 'ger', name: 'Alemania', flag: 'de', prize: 26000, coin: 280, ai: 312, curve: 5.4, hill: 46, pool: [2, 3, 4, 5, 6],
      tracks: [tr('berlin', 'Berlín', 'berlin', 1401, { curvy: 0.5, hilly: 0.2 }), tr('blackforest', 'Selva Negra', 'blackforest', 1402, { curvy: 0.7, hilly: 0.5 }),
        tr('munich', 'Múnich', 'munich', 1403, { curvy: 0.55, hilly: 0.45 }), tr('nurburg', 'Nürburgring', 'nurburg', 1404, { curvy: 0.75, hilly: 0.7, len: 1.15 })] },
    { id: 'sca', name: 'Escandinavia', flag: 'se', prize: 36000, coin: 360, ai: 334, curve: 5.4, hill: 44, pool: [4, 5, 6, 7, 8],
      tracks: [tr('stockholm', 'Estocolmo', 'stockholm', 1501, { curvy: 0.5, hilly: 0.3 }), tr('helsinki', 'Helsinki', 'helsinki', 1502, { curvy: 0.55, hilly: 0.3 }),
        tr('oslo', 'Oslo', 'oslo', 1503, { curvy: 0.6, hilly: 0.6 }), tr('lapland', 'Laponia', 'lapland', 1504, { curvy: 0.5, hilly: 0.45 })] },
    { id: 'fra', name: 'Francia', flag: 'fr', prize: 48000, coin: 450, ai: 356, curve: 5.8, hill: 50, pool: [5, 6, 7, 8, 9],
      tracks: [tr('paris', 'París', 'paris', 1601, { curvy: 0.55, hilly: 0.2 }), tr('nice', 'Niza', 'nice', 1602, { curvy: 0.6, hilly: 0.45 }),
        tr('lemans', 'Le Mans', 'lemans', 1603, { curvy: 0.35, hilly: 0.2, len: 1.2 }), tr('alps', 'Alpes', 'alps', 1604, { curvy: 0.8, hilly: 0.85 })] },
    { id: 'ita', name: 'Italia', flag: 'it', prize: 64000, coin: 560, ai: 382, curve: 6.0, hill: 55, pool: [7, 8, 9, 10, 11],
      tracks: [tr('rome', 'Roma', 'rome', 1701, { curvy: 0.55, hilly: 0.3 }), tr('tuscany', 'Toscana', 'tuscany', 1702, { curvy: 0.6, hilly: 0.75 }),
        tr('monza', 'Monza', 'monza', 1703, { curvy: 0.35, hilly: 0.15, len: 1.1 }), tr('venice', 'Venecia', 'venice', 1704, { curvy: 0.55, hilly: 0.2 })] },
    { id: 'gbr', name: 'Reino Unido', flag: 'gb', prize: 85000, coin: 700, ai: 418, curve: 6.2, hill: 55, pool: [9, 10, 11, 12, 13, 14],
      tracks: [tr('london', 'Londres', 'london', 1801, { curvy: 0.55, hilly: 0.25 }), tr('lochness', 'Loch Ness', 'lochness', 1802, { curvy: 0.65, hilly: 0.65 }),
        tr('silverstone', 'Silverstone', 'silverstone', 1803, { curvy: 0.5, hilly: 0.2, len: 1.1 }), tr('stonehenge', 'Stonehenge', 'stonehenge', 1804, { curvy: 0.6, hilly: 0.55 })] },
  ];
  TG.TRACKS = {};
  // exigencia extra de los rivales por copa (no cambia la longitud de los circuitos)
  const AI_K = { usa: 1.02, sam: 1.045, jpn: 1.03 };
  TG.cupSpeed = (cup) => Math.round(cup.ai * (cup.aiK || 1));
  TG.CUPS.forEach((cup, ci) => {
    cup.index = ci;
    cup.aiK = AI_K[cup.id] || 1;
    cup.tracks.forEach((t, ti) => {
      t.cup = ci; t.index = ti;
      t.maxCurve = cup.curve; t.maxHill = cup.hill;
      t.segments = Math.round((cup.ai * TG.C.KMH * 0.92 * 50) / TG.C.SEG * t.len);
      TG.TRACKS[t.id] = t;
    });
  });

  // Dificultad: el nivel de los rivales sube carrera a carrera (0 = primera del campeonato, 1 = última)
  TG.DIFFICULTY = {
    easy: { name: 'Fácil', off: -0.2, spd: 0.975 },
    normal: { name: 'Normal', off: 0, spd: 1 },
    hard: { name: 'Difícil', off: 0.22, spd: 1.02 },
  };
  TG.raceLevel = (def) => U.clamp((def.cup * 4 + def.index) / 31, 0, 1);
  // Piezas de los rivales: mejoran carrera a carrera a lo largo del campeonato
  TG.aiUpgrades = (lvl) => ({
    motor: Math.min(5, Math.floor(lvl * 5.4)),
    turbo: Math.min(4, Math.floor(lvl * 4.4)),
    tires: Math.min(4, Math.floor(lvl * 4.2)),
  });

  TG.WEATHER_LABEL = { clear: 'Despejado', rain: 'Lluvia', snow: 'Nieve', fog: 'Niebla' };
  TG.TIME_LABEL = { day: 'Día', sunset: 'Atardecer', dusk: 'Anochecer', night: 'Noche', overcast: 'Nublado' };

  TG.TIPS = [
    'Guarda el nitro para las rectas largas: en curva cerrada te sacará de la pista.',
    'Recoge los bidones rojos: sin gasolina el coche apenas avanza.',
    'Suelta el acelerador un instante antes de una curva cerrada y recupera después.',
    'Pegado detrás de un rival ganas rebufo: aprovecha para adelantarlo.',
    'En la salida, mantén las revoluciones en la zona verde para una salida perfecta.',
    'Los neumáticos mejorados marcan la diferencia con lluvia y nieve.',
    'Terminar sin chocar contra el decorado da un bonus de carrera limpia.',
    'Con cambio manual ganas un poco de aceleración si cambias cerca del corte.',
    'Las monedas del circuito se suman al premio de la carrera.',
    'Si te quedas atrás en una copa, compra un coche más rápido en el concesionario.',
  ];
})(window.TG);
