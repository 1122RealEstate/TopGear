'use strict';
/* ============================================================
   Coches 3D con WebGL (modelos hechos en Blender: source/blender)
   ------------------------------------------------------------
   · Decodifica TG.CarModels (binario empaquetado en PNG).
   · Pinta cada coche en un lienzo WebGL fuera de pantalla y lo copia al
     lienzo 2D del juego en su sitio, con la misma cámara que Car3D (misma
     posición y tamaño en pantalla), así el resto del juego no cambia.
   · Sombreado: difuso + laca con reflejos del cielo del escenario,
     oclusión ambiental horneada, pilotos que se encienden al frenar y faros
     de noche. Las ruedas delanteras giran con la dirección.
   Espacio del coche (como Car3D): x derecha, y arriba, z hacia delante,
   1 = largo del coche, z = 0 en la cola.
   ============================================================ */
(function (TG) {
  const U = TG.U;
  // mode: 'auto' (según el coste medido), 'live' (todos en directo) o 'sprite' (solo el jugador en directo)
  const CG = (TG.CarGL = { ok: false, ready: false, cars: {}, cost: 0, fast: true, mode: 'auto' });
  let gl = null, cv = null, P = null, PS = null, gl2 = false;

  // Materiales: [rugosidad, metal, laca, emisión] · [sustituto de color, alfa, patrón, freno, faro]
  const MAT = {
    paint: [0.34, 0.0, 1.0, 0, 1, 1, 0, 0, 0],
    sec: [0.34, 0.0, 1.0, 0, 2, 1, 0, 0, 0],
    plastic: [0.6, 0.0, 0.0, 0, 0, 1, 0, 0, 0],
    gloss: [0.16, 0.0, 0.8, 0, 0, 1, 0, 0, 0],
    chrome: [0.06, 1.0, 0.0, 0, 0, 1, 0, 0, 0],
    metal: [0.3, 1.0, 0.0, 0, 0, 1, 0, 0, 0],
    glass: [0.02, 0.0, 1.0, 0, 0, 1, 0, 0, 0],
    lens: [0.02, 0.0, 1.0, 0, 0, 0.22, 0, 0, 0],
    rubber: [0.85, 0.0, 0.0, 0, 0, 1, 0, 0, 0],
    tail: [0.2, 0.0, 0.6, 0.55, 0, 1, 0, 2.6, 0],
    head: [0.1, 0.0, 0.8, 0.35, 0, 1, 0, 0, 3.0],
    amber: [0.2, 0.0, 0.6, 0.3, 0, 1, 0, 0, 0.6],
    emit: [0.3, 0.0, 0.3, 1.5, 0, 1, 0, 0, 1.0],
    caliper: [0.35, 0.0, 0.6, 0, 4, 1, 0, 0, 0],
    carbon: [0.28, 0.1, 1.0, 0, 0, 1, 2, 0, 0],
    mesh: [0.45, 0.4, 0.0, 0, 0, 1, 1, 0, 0],
    dark: [1.0, 0.0, 0.0, 0, 0, 1, 0, 0, 0],
    stripe: [0.34, 0.0, 1.0, 0, 3, 1, 0, 0, 0],
    rim: [0.25, 0.85, 0.3, 0, 5, 1, 0, 0, 0],
    lensred: [0.02, 0.0, 1.0, 0.25, 0, 0.55, 0, 1.2, 0],
    // piezas del alerón: se ocultan cuando se desprende en un choque (pose.noWing)
    wingc: [0.28, 0.1, 1.0, 0, 0, 1, 2, 0, 0],
    wingp: [0.34, 0.0, 1.0, 0, 1, 1, 0, 0, 0],
    wingk: [0.16, 0.0, 0.8, 0, 0, 1, 0, 0, 0],
    wings: [0.34, 0.0, 1.0, 0, 2, 1, 0, 0, 0],
    // pintura de decoración de color fijo (franjas, libreas, dorsales)
    livery: [0.34, 0.0, 1.0, 0, 0, 1, 0, 0, 0],
    wingl: [0.34, 0.0, 1.0, 0, 0, 1, 0, 0, 0],
  };
  const WING = { wingc: 1, wingp: 1, wingk: 1, wings: 1, wingl: 1 };
  const NMAT = 32;                       // tamaño de las tablas de materiales del shader

  const VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec4 aCol; attribute float aMat;
uniform mat4 uModel; uniform mat3 uNrmM; uniform mat4 uVP;
uniform vec4 uMA[32]; uniform vec4 uMB[32]; uniform vec4 uMC[32];
uniform vec3 uPaint; uniform vec3 uSec; uniform vec3 uStripe; uniform vec3 uCaliper; uniform vec3 uRim;
uniform vec4 uDmg; uniform vec4 uDmg2; uniform vec4 uDmgG; uniform vec2 uDmgS;
varying vec3 vPos; varying vec3 vNrm; varying vec3 vAlb; varying float vAO; varying vec4 vA; varying vec4 vC; varying vec3 vLoc;
float hsh(vec3 q) { return fract(sin(dot(q, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
// ruido suave (celdas de ~20 cm): las abolladuras son ondas de chapa, no pinchos, y las piezas
// pegadas a la carrocería (pilotos, rejillas) se mueven con ella
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float a = hsh(i), b = hsh(i + vec3(1.0, 0.0, 0.0)), c = hsh(i + vec3(0.0, 1.0, 0.0)), d = hsh(i + vec3(1.0, 1.0, 0.0));
  float e = hsh(i + vec3(0.0, 0.0, 1.0)), g = hsh(i + vec3(1.0, 0.0, 1.0)), h = hsh(i + vec3(0.0, 1.0, 1.0)), k = hsh(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z) * 2.0 - 1.0;
}
void main() {
  int m = int(aMat + 0.5);
  vec3 p = aPos, nr = aNrm;
  if (uDmg2.z > 0.5 && uMB[m].y > 0.5) {
    // alerón desprendido: fuera del volumen de recorte
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    vPos = vec3(0.0); vNrm = vec3(0.0, 1.0, 0.0); vAlb = vec3(0.0); vAO = 0.0; vA = vec4(0.0); vC = vec4(0.0); vLoc = vec3(0.0);
    return;
  }
  if (uDmg2.w > 0.5) {
    // daños (uDmg = delante, detrás, izquierda, derecha; uDmg2.x = techo): mismas abolladuras que Car3D
    vec3 q = aPos * 24.0 + vec3(uDmg2.y, uDmg2.y * 0.37, uDmg2.y * 0.71);
    float n1 = vnoise(q), n2 = vnoise(q + 19.19), n3 = vnoise(q + 47.47);
    float dv = 0.0;
    if (uDmg.y > 0.01) { float u = 1.0 - (p.z - uDmgG.x) / 0.17; if (u > 0.0) { float a = uDmg.y * u * u; p.z += a * 0.055 * (0.7 + 0.3 * n1); p.y += a * 0.018 * n2; p.x *= 1.0 - a * 0.05 * (0.6 + 0.4 * n3); dv = max(dv, a); } }
    if (uDmg.x > 0.01) { float u = 1.0 - (uDmgG.y - p.z) / 0.2; if (u > 0.0) { float a = uDmg.x * u * u; p.z -= a * 0.07 * (0.7 + 0.3 * n1); p.y += a * 0.025 * (0.5 + 0.5 * n2); p.x *= 1.0 - a * 0.05 * (0.6 + 0.4 * n3); dv = max(dv, a); } }
    float sd = p.x > 0.0 ? uDmg.w : uDmg.z;
    if (sd > 0.01 && abs(p.x) > uDmgG.z * 0.5) {
      float e1 = (p.z - uDmgS.x) / 0.16, e2 = (p.z - uDmgS.y) / 0.13;
      float a = sd * min(1.0, exp(-e1 * e1) + exp(-e2 * e2) + 0.25) * (0.6 + 0.4 * n1);
      p.x -= sign(p.x) * a * 0.03; p.y += a * 0.006 * n2;
      dv = max(dv, a);
    }
    if (uDmg2.x > 0.01 && p.y > uDmgG.w) { float a = uDmg2.x * clamp((p.y - uDmgG.w) / 0.06, 0.0, 1.0); p.y -= a * 0.042 * (0.7 + 0.3 * n1); p.x *= 1.0 - a * 0.05; dv = max(dv, a); }
    // la chapa abollada refleja la luz de forma irregular
    if (dv > 0.02) nr = normalize(nr + vec3(n1 * 0.45, n2 * 0.35, n3 * 0.3) * dv);
  }
  vec4 wp = uModel * vec4(p, 1.0);
  vPos = wp.xyz; vLoc = aPos;
  vNrm = uNrmM * nr;
  vec3 alb = pow(aCol.rgb, vec3(2.2));
  float ov = uMB[m].x;
  if (ov > 0.5) {
    alb = ov < 1.5 ? uPaint : ov < 2.5 ? uSec : ov < 3.5 ? uStripe : ov < 4.5 ? uCaliper : uRim;
  }
  vAlb = alb; vAO = aCol.a; vA = uMA[m]; vC = uMC[m];
  gl_Position = uVP * wp;
}`;

  const FS = `
precision highp float;
varying vec3 vPos; varying vec3 vNrm; varying vec3 vAlb; varying float vAO; varying vec4 vA; varying vec4 vC; varying vec3 vLoc;
uniform vec3 uCam; uniform vec3 uSun; uniform vec3 uSunC; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uGnd; uniform vec3 uGndH;
uniform vec3 uAmbC; uniform float uAmb; uniform float uFill; uniform float uStudio; uniform float uBrake; uniform float uHead;
uniform float uExpo; uniform float uAlpha; uniform float uPass;
vec3 envRace(vec3 r, float rough) {
  float w = 0.015 + rough * 0.5;
  float t = smoothstep(-w, w, r.y);
  vec3 sky = mix(uHor, uZen, sqrt(max(r.y, 0.0)));
  vec3 gnd = mix(uGndH, uGnd, min(1.0, -r.y * 4.0));
  vec3 c = mix(gnd, sky, t);
  float s = max(dot(r, uSun), 0.0);
  c += uSunC * pow(s, mix(700.0, 30.0, rough)) * mix(5.0, 0.4, rough);
  return c;
}
vec3 envStudio(vec3 r, float rough) {
  float w = 0.02 + rough * 0.45;
  vec3 c = vec3(0.018, 0.02, 0.024) + vec3(0.035, 0.04, 0.05) * max(r.y, 0.0);
  float top = smoothstep(0.72 - w, 0.8, r.y) * (1.0 - smoothstep(0.5, 0.62 + w, abs(r.x)));
  c += vec3(1.35) * top;
  float band = (1.0 - smoothstep(0.05, 0.1 + w, abs(abs(r.x) - 0.82))) * smoothstep(-0.05, 0.15, r.y) * (1.0 - smoothstep(0.5, 0.7, r.y));
  c += vec3(0.75, 0.8, 0.9) * band;
  float rim = (1.0 - smoothstep(0.04, 0.09 + w, abs(r.z + 0.85))) * smoothstep(0.0, 0.3, r.y);
  c += vec3(0.55) * rim;
  c += vec3(0.16, 0.13, 0.1) * (1.0 - smoothstep(0.0, 0.06 + w, abs(r.y)));
  return c;
}
vec3 env(vec3 r, float rough) { return uStudio > 0.5 ? envStudio(r, rough) : envRace(r, rough); }
void main() {
  vec3 N = normalize(vNrm);
  vec3 V = normalize(uCam - vPos);
  if (dot(N, V) < 0.0) N = -N;
  float rough = vA.x, metal = vA.y, coat = vA.z, emis = vA.w;
  vec3 alb = vAlb;
  float ao = vAO;
  float pat = vC.y;
  if (pat > 0.5) {
    vec3 an = abs(N);
    vec2 uv = an.x > an.z ? (an.x > an.y ? vLoc.zy : vLoc.xz) : (an.z > an.y ? vLoc.xy : vLoc.xz);
    if (pat < 1.5) {
      vec2 g = uv * 4.52 / 0.024;
      vec2 c = fract(vec2(g.x, g.y + 0.5 * floor(mod(g.x, 2.0)))) - 0.5;
      float d = max(abs(c.x) * 1.15 + abs(c.y) * 0.5, abs(c.y));
      float hole = smoothstep(0.34, 0.42, d);
      alb = mix(alb * 0.25, alb * 2.5 + 0.03, hole);
      ao *= mix(0.55, 1.0, hole);
    } else {
      vec2 g = uv * 4.52 / 0.012;
      float tw = step(0.5, fract((floor(g.x) + floor(g.y)) * 0.5));
      alb *= mix(0.8, 1.25, tw);
    }
  }
  float NdV = clamp(dot(N, V), 0.001, 1.0);
  vec3 R = reflect(-V, N);
  float NdL = max(dot(N, uSun), 0.0);
  vec3 hemi = mix(uGnd * 0.7, uAmbC, N.y * 0.5 + 0.5) * uAmb;
  vec3 light = uSunC * NdL + hemi + vec3(uFill * NdV * 0.35);
  vec3 F0 = mix(vec3(0.04), alb, metal);
  vec3 F = F0 + (vec3(1.0) - F0) * pow(1.0 - NdV, 5.0) * (1.0 - rough * 0.8);
  float sao = ao * mix(0.35, 1.0, ao);
  vec3 col = alb * (1.0 - metal) * light * ao * (1.0 - F * 0.5);
  col += env(R, rough) * F * sao;
  vec3 H = normalize(uSun + V);
  float sh = pow(max(dot(N, H), 0.0), mix(400.0, 12.0, rough)) * (1.0 - rough * 0.7);
  col += uSunC * sh * F * 2.0 * sao;
  float Fc = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
  col = mix(col, env(R, 0.0) * sao, Fc * coat * 0.9);
  col += uSunC * pow(max(dot(N, H), 0.0), 900.0) * coat * 3.0 * sao;
  col += alb * emis * (1.0 + uBrake * vC.z + uHead * vC.w) * 1.8;
  col *= uExpo;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  float a = vC.x * uAlpha;
  if (uPass < 0.5 && vC.x < 0.99) discard;
  if (uPass > 0.5 && vC.x > 0.99) discard;
  gl_FragColor = vec4(col * a, a);
}`;

  // sombra de contacto: rectángulo difuminado bajo el coche
  const SVS = `attribute vec2 aP; uniform mat4 uVP; uniform vec4 uBox; varying vec2 vQ;
void main(){ vQ = aP; vec3 p = vec3(mix(uBox.x, uBox.y, aP.x * 0.5 + 0.5), 0.0, mix(uBox.z, uBox.w, aP.y * 0.5 + 0.5)); gl_Position = uVP * vec4(p, 1.0); }`;
  const SFS = `precision mediump float; varying vec2 vQ; uniform float uA;
void main(){ vec2 q = abs(vQ); float d = max(q.x * 1.0, q.y); float a = (1.0 - smoothstep(0.55, 1.0, q.x)) * (1.0 - smoothstep(0.7, 1.0, q.y)); a = a * a * uA; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }`;

  function compile(vs, fs) {
    const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, a = {};
    const nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nu; i++) { const inf = gl.getActiveUniform(p, i); const n = inf.name.replace(/\[0\]$/, ''); u[n] = gl.getUniformLocation(p, inf.name); }
    const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++) { const inf = gl.getActiveAttrib(p, i); a[inf.name] = gl.getAttribLocation(p, inf.name); }
    return { p, u, a };
  }

  CG.init = function () {
    if (!window.TG.CarModels) return false;
    try {
      cv = document.createElement('canvas');
      cv.width = 640; cv.height = 400;
      const o = { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, stencil: false, preserveDrawingBuffer: false };
      gl = cv.getContext('webgl2', o);
      gl2 = !!gl;
      if (!gl) {
        gl = cv.getContext('webgl', o) || cv.getContext('experimental-webgl', o);
        if (gl) gl.getExtension('OES_element_index_uint');
      }
      if (!gl) return false;
      P = compile(VS, FS);
      PS = compile(SVS, SFS);
      CG.quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, CG.quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
      const names = TG.CarModels.mats;
      const A = new Float32Array(NMAT * 4), B = new Float32Array(NMAT * 4), C = new Float32Array(NMAT * 4);
      names.forEach((n, i) => {
        const m = MAT[n] || MAT.plastic;
        A.set([m[0], m[1], m[2], m[3]], i * 4);
        B.set([m[4], WING[n] ? 1 : 0, 0, 0], i * 4);
        C.set([m[5], m[6], m[7], m[8]], i * 4);
      });
      CG.matA = A; CG.matB = B; CG.matC = C;
      CG.ok = true;
      CG.load();
      return true;
    } catch (e) {
      console.warn('WebGL no disponible para los coches:', e);
      CG.ok = false;
      return false;
    }
  };

  /* ---------------- Decodificación de los modelos ---------------- */
  /* Carga progresiva: con 39 coches descodificar todo de golpe congela la portada (≈1,7 s), así que
     se descodifican de dos en dos con una pausa entre uno y otro, empezando por los que se piden
     (CG.has de un coche aún sin cargar lo adelanta en la cola). CG.onModel(id) avisa de cada coche
     listo y CG.onReady cuando están todos. */
  CG.queue = [];
  let loading = 0, left = 0;
  function decode(id) {
    const rec = TG.CarModels.cars[id];
    loading++;
    const done = () => {
      loading--;
      if (--left === 0) { CG.ready = true; if (CG.onReady) CG.onReady(); }
      setTimeout(pump, 16);
    };
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0);
        const px = x.getImageData(0, 0, img.width, img.height).data;
        const n = rec.meta.bytes;
        const bytes = new Uint8Array(n);
        for (let i = 0, j = 0; i < n; j += 4) { bytes[i++] = px[j]; if (i < n) bytes[i++] = px[j + 1]; if (i < n) bytes[i++] = px[j + 2]; }
        CG.cars[id] = build(rec.meta, bytes);
        if (CG.onModel) CG.onModel(id);
      } catch (e) { console.warn('Modelo ' + id + ' no válido', e); }
      done();
    };
    img.onerror = done;
    img.src = rec.png;
  }
  function pump() {
    while (loading < 2 && CG.queue.length) decode(CG.queue.shift());
  }
  CG.load = function () {
    CG.queue = Object.keys(TG.CarModels.cars);
    left = CG.queue.length;
    pump();
  };
  // adelanta un coche en la cola de carga
  CG.need = function (id) {
    const i = CG.queue.indexOf(id);
    if (i > 0) { CG.queue.splice(i, 1); CG.queue.unshift(id); }
  };
  CG.has = (id) => {
    if (!CG.ok) return false;
    if (CG.cars[id]) return true;
    CG.need(id);
    return false;
  };

  function build(meta, bytes) {
    const L = meta.L;
    const pal = meta.palette;
    const names = TG.CarModels.mats;
    let off = 0;
    const meshes = meta.meshes.map((m) => {
      const nv = m.nv, ni = m.ni;
      const q = new Uint16Array(nv * 3);
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let i = 0; i < nv; i++) { acc = (acc + (bytes[off + i] | (bytes[off + nv + i] << 8))) & 0xffff; q[i * 3 + c] = acc; }
        off += nv * 2;
      }
      const ox = bytes.subarray(off, off + nv), oy = bytes.subarray(off + nv, off + nv * 2);
      off += nv * 2;
      const pi = bytes.subarray(off, off + nv); off += nv;
      const ao = bytes.subarray(off, off + nv); off += nv;
      const idx = new Uint32Array(ni);
      let hw = 0;
      for (let k = 0; k < ni; k++) {
        const code = bytes[off + k] | (bytes[off + ni + k] << 8);
        const i = hw - code;
        idx[k] = i;
        if (i === hw) hw++;
      }
      off += ni * 2;
      off = (off + 3) & ~3;
      // a espacio del coche (x, z arriba -> y, y delante -> z), unidades = largo
      const mir = !!m.mirror;
      const tot = mir ? nv * 2 : nv;
      const buf = new ArrayBuffer(tot * 24);
      const F = new Float32Array(buf), I8 = new Int8Array(buf), U8 = new Uint8Array(buf);
      const s = [(m.qmax[0] - m.qmin[0]) / 65535, (m.qmax[1] - m.qmin[1]) / 65535, (m.qmax[2] - m.qmin[2]) / 65535];
      const mats = new Uint8Array(tot);
      for (let i = 0; i < nv; i++) {
        const X = m.qmin[0] + q[i * 3] * s[0], Y = m.qmin[1] + q[i * 3 + 1] * s[1], Z = m.qmin[2] + q[i * 3 + 2] * s[2];
        let nx = ((ox[i] << 24) >> 24) / 127, ny = ((oy[i] << 24) >> 24) / 127;
        let nz = 1 - Math.abs(nx) - Math.abs(ny);
        if (nz < 0) { const tx = nx; nx = (1 - Math.abs(ny)) * (tx >= 0 ? 1 : -1); ny = (1 - Math.abs(tx)) * (ny >= 0 ? 1 : -1); }
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        const p = pal[pi[i]];
        const mi = typeof p[0] === 'number' ? p[0] : names.indexOf(p[0]);
        const rgb = U.hex2rgb(p[1]);
        for (let k = 0; k < (mir ? 2 : 1); k++) {
          const j = i + k * nv, sg = k ? -1 : 1;
          F[j * 6] = (X * sg) / L; F[j * 6 + 1] = Z / L; F[j * 6 + 2] = Y / L;
          I8[j * 24 + 12] = Math.round(nx * sg * 127); I8[j * 24 + 13] = Math.round(nz * 127); I8[j * 24 + 14] = Math.round(ny * 127);
          U8[j * 24 + 16] = rgb[0]; U8[j * 24 + 17] = rgb[1]; U8[j * 24 + 18] = rgb[2]; U8[j * 24 + 19] = ao[i];
          U8[j * 24 + 20] = mi;
          mats[j] = mi;
        }
      }
      // índices: opacos primero, transparentes después
      const trans = (mi) => (MAT[names[mi]] || MAT.plastic)[5] < 0.99;
      const oi = [], ti = [];
      for (let k = 0; k < ni; k += 3) {
        const a = idx[k], b = idx[k + 1], c = idx[k + 2];
        const dst = trans(mats[a]) ? ti : oi;
        dst.push(a, b, c);
        if (mir) dst.push(a + nv, c + nv, b + nv);
      }
      let nSpin = oi.length;
      if (m.name === 'wheel') {
        // lo que gira (goma, llanta, disco) primero; la pinza de freno al final
        const cal = names.indexOf('caliper');
        const spin = [], fixed = [];
        for (let k = 0; k < oi.length; k += 3) (mats[oi[k]] === cal ? fixed : spin).push(oi[k], oi[k + 1], oi[k + 2]);
        oi.length = 0;
        oi.push(...spin, ...fixed);
        nSpin = spin.length;
      }
      const all = new Uint32Array(oi.length + ti.length);
      all.set(oi); all.set(ti, oi.length);
      return { name: m.name, data: buf, idx: all, nOpaque: oi.length, nSpin, nAll: all.length, vbo: null, ibo: null };
    });
    const W = meta.wheels;
    let zA = 1e9, zB = -1e9;
    const bodyF = new Float32Array(meshes.find((m) => m.name === 'body').data);
    for (let j = 2; j < bodyF.length; j += 6) { const z = bodyF[j]; if (z < zA) zA = z; if (z > zB) zB = z; }
    const car = {
      meta, L, meshes, zA, zB, belt: (meta.belt || meta.H * 0.62) / L,
      body: meshes.find((m) => m.name === 'body'),
      wheel: meshes.find((m) => m.name === 'wheel'),
      W: {
        zf: W.yf / L, zr: W.yr / L, xf: W.tf / 2 / L, xr: W.tr / 2 / L, rf: W.rf / L, rr: W.rr / L,
        sx: W.wr / W.wf, sr: W.rr / W.rf,
      },
      hw: meta.W / 2 / L, h: meta.H / L,
      lights: (meta.lights || []).map((l) => [l[0][0] / L, l[0][2] / L, l[0][1] / L, l[1] / L]),
      exh: (meta.exhausts || []).map((l) => [l[0][0] / L, l[0][2] / L, l[0][1] / L, l[1] / L]),
      heads: (meta.heads || []).map((l) => [l[0][0] / L, l[0][2] / L, l[0][1] / L, l[1] / L]),
    };
    return car;
  }

  function upload(m) {
    if (m.vbo) return;
    m.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, m.data, gl.STATIC_DRAW);
    m.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
  }

  /* ---------------- Matemáticas (matrices 4x4 por columnas) ---------------- */
  const M4 = () => new Float32Array(16);
  function mul(a, b) {
    const o = M4();
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function fromRT(R, t) { // R 3x3 por filas, t vec3
    const o = M4();
    o[0] = R[0]; o[4] = R[1]; o[8] = R[2]; o[12] = t[0];
    o[1] = R[3]; o[5] = R[4]; o[9] = R[5]; o[13] = t[1];
    o[2] = R[6]; o[6] = R[7]; o[10] = R[8]; o[14] = t[2];
    o[15] = 1;
    return o;
  }
  function m3mul(a, b) {
    const r = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    return r;
  }
  function nrmOf(R) { // inversa traspuesta de una 3x3 (por filas) -> mat3 por columnas
    const [a, b, c, d, e, f, g, h, i] = R;
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * B + c * C || 1;
    const inv = [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
    // (inv)^T por columnas = inv por filas
    return new Float32Array([inv[0], inv[1], inv[2], inv[3], inv[4], inv[5], inv[6], inv[7], inv[8]]);
  }
  const rgbL = (h) => { const c = U.hex2rgb(h); return [Math.pow(c[0] / 255, 2.2), Math.pow(c[1] / 255, 2.2), Math.pow(c[2] / 255, 2.2)]; };

  /* ---------------- Cámara compatible con Car3D ----------------
     view: { x, y, ppl, pitch, dist, lift }  (x, y = cola a ras de suelo en pantalla)  */
  function camera(view) {
    const cph = Math.cos(view.pitch), sph = Math.sin(view.pitch), D = view.dist;
    const C = [0, 0.1 + D * sph, 0.45 - D * cph];
    const zcA = -(0 - C[1]) * sph + (0 - C[2]) * cph;
    const syA = -((0 - C[1]) * cph + (0 - C[2]) * sph) / zcA;
    const k = view.ppl * zcA;
    const R = [1, 0, 0, 0, cph, sph, 0, -sph, cph];
    const t = [-C[0], -(C[1] * cph + C[2] * sph), -(-C[1] * sph + C[2] * cph)];
    return { V: fromRT(R, t), C, k, ox: view.x, oy: view.y - (view.lift || 0), sxA: 0, syA };
  }
  // proyección al rectángulo de pantalla [bx, by, bw, bh]
  function projMat(cam, bx, by, bw, bh, near, far) {
    const o = M4();
    o[0] = (2 * cam.k) / bw;
    o[8] = (2 * (cam.ox - cam.k * cam.sxA - bx)) / bw - 1;
    o[5] = (2 * cam.k) / bh;
    o[9] = 1 - (2 * (cam.oy - cam.k * cam.syA - by)) / bh;
    o[10] = (far + near) / (far - near);
    o[14] = (-2 * far * near) / (far - near);
    o[11] = 1;
    return o;
  }
  // punto del espacio mundo -> pantalla (px)
  function toScreen(cam, p) {
    const V = cam.V;
    const xc = V[0] * p[0] + V[4] * p[1] + V[8] * p[2] + V[12];
    const yc = V[1] * p[0] + V[5] * p[1] + V[9] * p[2] + V[13];
    const zc = V[2] * p[0] + V[6] * p[1] + V[10] * p[2] + V[14];
    return [cam.ox + cam.k * (xc / zc - cam.sxA), cam.oy + cam.k * (-yc / zc - cam.syA), zc];
  }

  // pose de la carrocería (igual que Car3D.draw)
  function bodyPose(pose) {
    const cy = Math.cos(pose.yaw || 0), sy = Math.sin(pose.yaw || 0);
    const th = -(pose.roll || 0), cr = Math.cos(th), sr = Math.sin(th);
    const cp = Math.cos(pose.pitch || 0), sp = Math.sin(pose.pitch || 0);
    const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
    const Rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
    const Rz = [cr, -sr, 0, sr, cr, 0, 0, 0, 1];
    const M = m3mul(Ry, m3mul(Rx, Rz));
    const pv = [0, 0.1, 0.5], hv = pose.heave || 0;
    const tx0 = pv[0], ty0 = pv[1] + hv, tz0 = pv[2] - 0.5;
    const T = [Ry[0] * tx0 + Ry[1] * ty0 + Ry[2] * tz0, Ry[3] * tx0 + Ry[4] * ty0 + Ry[5] * tz0, Ry[6] * tx0 + Ry[7] * ty0 + Ry[8] * tz0 + 0.5];
    const t = [T[0] - (M[0] * pv[0] + M[1] * pv[1] + M[2] * pv[2]), T[1] - (M[3] * pv[0] + M[4] * pv[1] + M[5] * pv[2]), T[2] - (M[6] * pv[0] + M[7] * pv[1] + M[8] * pv[2])];
    return { M, t, Ry };
  }

  /* ---------------- Entorno ---------------- */
  function envUniforms(env, studio) {
    const u = P.u;
    if (studio) {
      gl.uniform3f(u.uSun, -0.35, 0.82, -0.45);
      gl.uniform3f(u.uSunC, 1.15, 1.12, 1.08);
      gl.uniform3f(u.uZen, 0.05, 0.055, 0.065);
      gl.uniform3f(u.uHor, 0.2, 0.2, 0.22);
      gl.uniform3f(u.uGnd, 0.06, 0.06, 0.065);
      gl.uniform3f(u.uGndH, 0.12, 0.12, 0.13);
      gl.uniform3f(u.uAmbC, 0.55, 0.58, 0.64);
      gl.uniform1f(u.uAmb, 0.55);
      gl.uniform1f(u.uFill, 0.25);
      gl.uniform1f(u.uStudio, 1);
      gl.uniform1f(u.uExpo, 1.05);
      return;
    }
    const L = env.L;
    const lin = (c) => c.map((v) => Math.pow(v, 2.2));
    gl.uniform3f(u.uSun, L[0], L[1], L[2]);
    const sc = lin(env.sunC).map((v) => v * env.sunI * 2.2);
    gl.uniform3fv(u.uSunC, sc);
    gl.uniform3fv(u.uZen, lin(env.zen));
    gl.uniform3fv(u.uHor, lin(env.hor));
    gl.uniform3fv(u.uGnd, lin(env.gnd));
    gl.uniform3fv(u.uGndH, lin(env.gndH));
    gl.uniform3fv(u.uAmbC, lin(env.ambC));
    gl.uniform1f(u.uAmb, env.amb * 1.9);
    gl.uniform1f(u.uFill, env.fill);
    gl.uniform1f(u.uStudio, 0);
    gl.uniform1f(u.uExpo, env.night ? 1.25 : 1.0);
  }

  function ensureSize(w, h) {
    if (cv.width < w || cv.height < h) {
      cv.width = Math.max(cv.width, Math.ceil(w / 64) * 64);
      cv.height = Math.max(cv.height, Math.ceil(h / 64) * 64);
    }
  }

  function bindMesh(m) {
    upload(m);
    const a = P.a;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
    gl.enableVertexAttribArray(a.aPos); gl.vertexAttribPointer(a.aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(a.aNrm); gl.vertexAttribPointer(a.aNrm, 3, gl.BYTE, true, 24, 12);
    gl.enableVertexAttribArray(a.aCol); gl.vertexAttribPointer(a.aCol, 4, gl.UNSIGNED_BYTE, true, 24, 16);
    gl.enableVertexAttribArray(a.aMat); gl.vertexAttribPointer(a.aMat, 1, gl.UNSIGNED_BYTE, false, 24, 20);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
  }
  function drawMesh(m, model, R3, mirrored, pass) {
    gl.uniformMatrix4fv(P.u.uModel, false, model);
    gl.uniformMatrix3fv(P.u.uNrmM, false, nrmOf(R3));
    gl.frontFace(mirrored ? gl.CW : gl.CCW);
    if (pass === 0) gl.drawElements(gl.TRIANGLES, m.nOpaque, gl.UNSIGNED_INT, 0);
    else if (m.nAll > m.nOpaque) gl.drawElements(gl.TRIANGLES, m.nAll - m.nOpaque, gl.UNSIGNED_INT, m.nOpaque * 4);
  }

  function drawWheel(m, w, pass) {
    gl.frontFace(w.mir ? gl.CW : gl.CCW);
    if (pass === 0) {
      gl.uniformMatrix4fv(P.u.uModel, false, w.M);
      gl.uniformMatrix3fv(P.u.uNrmM, false, nrmOf(w.R3));
      gl.drawElements(gl.TRIANGLES, m.nSpin, gl.UNSIGNED_INT, 0);
      if (m.nOpaque > m.nSpin) {
        gl.uniformMatrix4fv(P.u.uModel, false, w.Mfix);
        gl.uniformMatrix3fv(P.u.uNrmM, false, nrmOf(w.Rfix));
        gl.drawElements(gl.TRIANGLES, m.nOpaque - m.nSpin, gl.UNSIGNED_INT, m.nSpin * 4);
      }
    } else if (m.nAll > m.nOpaque) {
      gl.uniformMatrix4fv(P.u.uModel, false, w.M);
      gl.uniformMatrix3fv(P.u.uNrmM, false, nrmOf(w.R3));
      gl.drawElements(gl.TRIANGLES, m.nAll - m.nOpaque, gl.UNSIGNED_INT, m.nOpaque * 4);
    }
  }

  // transformación de cada rueda: sin balanceo (salvo vuelco), con dirección, guiñada y giro sobre su eje
  function wheelModels(car, pose, boost) {
    const W = car.W;
    const rigid = !!pose.rigid;
    const bp = rigid ? bodyPose(pose) : null;
    const Ry = bodyPose({ yaw: pose.yaw }).Ry;
    const a = pose.spin || 0, ca = Math.cos(a), sa = Math.sin(a);
    const Rspin = [1, 0, 0, 0, ca, -sa, 0, sa, ca];
    const out = [];
    [[W.zf, W.xf * (boost || 1), W.rf, 1, 1, 1], [W.zr, W.xr, W.rr, 0, W.sx, W.sr]].forEach((w) => {
      [1, -1].forEach((sd) => {
        const d = w[3] ? pose.steer || 0 : 0;
        const cd = Math.cos(d), sdn = Math.sin(d);
        const Rs = [cd, 0, sdn, 0, 1, 0, -sdn, 0, cd];
        const S = [sd * w[4], 0, 0, 0, w[5], 0, 0, 0, w[5]];
        const cx = sd * w[1], cy = w[2], cz = w[0];
        let Rb, t;
        if (rigid) {
          Rb = m3mul(bp.M, Rs);
          const M = bp.M;
          t = [M[0] * cx + M[1] * cy + M[2] * cz + bp.t[0], M[3] * cx + M[4] * cy + M[5] * cz + bp.t[1], M[6] * cx + M[7] * cy + M[8] * cz + bp.t[2]];
        } else {
          Rb = m3mul(Ry, Rs);
          const rz = cz - 0.5;
          t = [Ry[0] * cx + Ry[2] * rz, cy, Ry[6] * cx + Ry[8] * rz + 0.5];
        }
        const Rfix = m3mul(Rb, S);
        const Rrot = m3mul(Rb, m3mul(S, Rspin));
        out.push({ M: fromRT(Rrot, t), R3: Rrot, Mfix: fromRT(Rfix, t), Rfix, mir: sd < 0 });
      });
    });
    return out;
  }

  function setCarUniforms(colors) {
    const u = P.u;
    gl.uniform4fv(u.uMA, CG.matA);
    gl.uniform4fv(u.uMB, CG.matB);
    gl.uniform4fv(u.uMC, CG.matC);
    gl.uniform3fv(u.uPaint, rgbL(colors.paint));
    gl.uniform3fv(u.uSec, rgbL(colors.sec));
    gl.uniform3fv(u.uStripe, rgbL(colors.stripe));
    gl.uniform3fv(u.uCaliper, rgbL(colors.caliper));
    gl.uniform3fv(u.uRim, rgbL(colors.rim));
  }

  function render(car, VP, camPos, env, studio, colors, pose, opts) {
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uVP, false, VP);
    gl.uniform3fv(P.u.uCam, camPos);
    envUniforms(env, studio);
    setCarUniforms(colors);
    gl.uniform1f(P.u.uBrake, opts.brake ? 1 : 0);
    gl.uniform1f(P.u.uHead, opts.night ? 1 : 0);
    const bp = bodyPose(pose);
    const bodyM = fromRT(bp.M, bp.t);
    const wheels = wheelModels(car, pose, opts.boost);
    const D = pose.dmg, seed = pose.seed || 0;
    const dmgOn = !!D && D.f + D.r + D.l + D.rt + D.roof > 0.015;
    const u = P.u, noWing = pose.noWing ? 1 : 0, seedH = (seed % 97) * 1.618;
    gl.uniform4f(u.uDmg, D ? D.f : 0, D ? D.r : 0, D ? D.l : 0, D ? D.rt : 0);
    gl.uniform4f(u.uDmgG, car.zA, car.zB, car.hw, car.belt);
    gl.uniform2f(u.uDmgS, 0.28 + (seed % 5) * 0.05, 0.64 + (seed % 3) * 0.05);
    gl.enable(gl.DEPTH_TEST);
    if (CG.noCull) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    for (let pass = 0; pass < 2; pass++) {
      if (pass) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.uniform1f(P.u.uAlpha, 1); }
      else { gl.disable(gl.BLEND); gl.depthMask(true); gl.uniform1f(P.u.uAlpha, 1); }
      gl.uniform1f(P.u.uPass, pass);
      gl.uniform4f(u.uDmg2, 0, seedH, 0, 0);
      bindMesh(car.wheel);
      wheels.forEach((w) => drawWheel(car.wheel, w, pass));
      gl.uniform4f(u.uDmg2, D ? D.roof : 0, seedH, noWing, dmgOn ? 1 : 0);
      bindMesh(car.body);
      drawMesh(car.body, bodyM, bp.M, false, pass);
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    if (CG.debug) CG.err = gl.getError();
    return { bp, wheels };
  }

  function shadow(VP, car, alpha) {
    gl.useProgram(PS.p);
    gl.uniformMatrix4fv(PS.u.uVP, false, VP);
    const hw = car.hw * 1.12;
    gl.uniform4f(PS.u.uBox, -hw, hw, -0.06, 1.06);
    gl.uniform1f(PS.u.uA, alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, CG.quad);
    for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
    gl.enableVertexAttribArray(PS.a.aP);
    gl.vertexAttribPointer(PS.a.aP, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.disableVertexAttribArray(PS.a.aP);
  }

  /* ---------------- En carrera ----------------
     Igual que Car3D.draw: devuelve { lights, exh, x0, y0, x1, y1 } en pantalla. */
  CG.drawCar = function (ctx, id, colors, env, pose, view, opts) {
    const car = CG.cars[id];
    opts = opts || {};
    const cam = camera(view);
    // caja en pantalla: esquinas de la caja del coche con la pose aplicada
    const bp = bodyPose(pose);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const hw = car.hw * 1.14, h = car.h * 1.05;
    for (const px of [-hw, hw]) for (const py of [0, h]) for (const pz of [-0.08, 1.08]) {
      const w = [bp.M[0] * px + bp.M[1] * py + bp.M[2] * pz + bp.t[0], bp.M[3] * px + bp.M[4] * py + bp.M[5] * pz + bp.t[1], bp.M[6] * px + bp.M[7] * py + bp.M[8] * pz + bp.t[2]];
      const s = toScreen(cam, w);
      if (s[0] < x0) x0 = s[0]; if (s[0] > x1) x1 = s[0]; if (s[1] < y0) y0 = s[1]; if (s[1] > y1) y1 = s[1];
    }
    const pad = 3;
    const bx = Math.floor(x0 - pad), by = Math.floor(y0 - pad);
    const bw = Math.ceil(x1 + pad) - bx, bh = Math.ceil(y1 + pad) - by;
    const meta = anchors(car, cam, bp);
    meta.x0 = x0; meta.y0 = y0; meta.x1 = x1; meta.y1 = y1; meta.k = cam.k;
    if (!ctx || bw < 2 || bh < 2 || bw > 4096 || bh > 4096) return meta;
    const t0 = performance.now();
    ensureSize(bw, bh);
    const VP = mul(projMat(cam, bx, by, bw, bh, Math.max(0.05, view.dist - 1.6), view.dist + 2.2), cam.V);
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (opts.shadow) shadow(VP, car, opts.shadow);
    render(car, VP, cam.C, env, false, colors, pose, opts);
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    ctx.drawImage(cv, 0, cv.height - bh, bw, bh, bx, by, bw, bh);
    ctx.restore();
    // En Chrome la copia es asíncrona (≈0,1 ms); en WebKit (Safari, app de Mac) es síncrona y lee
    // el búfer entero (≈1,5 ms por coche). Con ese dato el juego decide cuántos coches pinta en
    // directo y cuáles con su imagen cacheada (CG.sprite). Histéresis para no alternar.
    CG.cost = CG.cost * 0.9 + (performance.now() - t0) * 0.1;
    if (CG.mode !== 'auto') CG.fast = CG.mode === 'live';
    else if (CG.fast && CG.cost > 0.6) CG.fast = false;
    else if (!CG.fast && CG.cost < 0.3) CG.fast = true;
    return meta;
  };

  /* ---------------- Imagen fija (coches pequeños o lejanos) ----------------
     Como Car3D.sprite: el modelo se pinta una vez por guiñada en un lienzo 2D que se
     reutiliza. Se lee con readPixels solo el rectángulo del coche (en WebKit, drawImage de un
     lienzo WebGL copia el búfer entero). opts.bounds: caja extra (p. ej. la sombra proyectada,
     en coordenadas con el coche en 0, 0); opts.under(ctx, ax, ay): lo que va debajo del coche. */
  let scratch = null;
  CG.sprite = function (id, colors, env, pose, ppl, pitch, dist, opts) {
    const car = CG.cars[id];
    opts = opts || {};
    const m0 = CG.drawCar(null, id, colors, env, pose, { x: 0, y: 0, ppl, pitch, dist }, opts);   // solo medidas
    let x0 = m0.x0, y0 = m0.y0, x1 = m0.x1, y1 = m0.y1;
    const bb = opts.bounds;
    if (bb) { x0 = Math.min(x0, bb.x0); y0 = Math.min(y0, bb.y0); x1 = Math.max(x1, bb.x1); y1 = Math.max(y1, bb.y1); }
    const pad = 3;
    const w = Math.min(2048, Math.ceil(x1 - x0) + pad * 2), h = Math.min(2048, Math.ceil(y1 - y0) + pad * 2);
    const ax = pad - x0, ay = pad - y0;
    const cam = camera({ x: ax, y: ay, ppl, pitch, dist });
    ensureSize(w, h);
    const VP = mul(projMat(cam, 0, 0, w, h, Math.max(0.05, dist - 1.6), dist + 2.2), cam.V);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (opts.shadow) shadow(VP, car, opts.shadow);
    const r = render(car, VP, cam.C, env, false, colors, pose, opts);
    // lectura del rectángulo (filas de abajo arriba, alfa premultiplicado) -> ImageData
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const img = new ImageData(w, h), d = img.data, row = w * 4;
    for (let y = 0; y < h; y++) {
      const s0 = (h - 1 - y) * row, d0 = y * row;
      for (let i = 0; i < row; i += 4) {
        const a = px[s0 + i + 3];
        if (!a) continue;
        const k = 255 / a;
        d[d0 + i] = Math.min(255, px[s0 + i] * k);
        d[d0 + i + 1] = Math.min(255, px[s0 + i + 1] * k);
        d[d0 + i + 2] = Math.min(255, px[s0 + i + 2] * k);
        d[d0 + i + 3] = a;
      }
    }
    if (!scratch || scratch.width < w || scratch.height < h) scratch = U.canvas(Math.max(w, scratch ? scratch.width : 0), Math.max(h, scratch ? scratch.height : 0));
    scratch.getContext('2d').putImageData(img, 0, 0);
    const out = U.canvas(w, h);
    const oc = out.getContext('2d');
    if (opts.under) opts.under(oc, ax, ay);
    oc.drawImage(scratch, 0, 0, w, h, 0, 0, w, h);
    const meta = anchors(car, cam, r.bp);
    const rel = (arr) => arr.map((q) => [q[0] - ax, q[1] - ay, q[2]]);
    return { img: out, ax, ay, ppl, lights: rel(meta.lights), exh: rel(meta.exh) };
  };

  function anchors(car, cam, bp) {
    const conv = (list) => {
      const out = [];
      list.forEach((l) => {
        [1, -1].forEach((sd) => {
          if (sd < 0 && Math.abs(l[0]) < 0.01) return;
          const p = [sd * l[0], l[1], l[2]];
          const w = [bp.M[0] * p[0] + bp.M[1] * p[1] + bp.M[2] * p[2] + bp.t[0], bp.M[3] * p[0] + bp.M[4] * p[1] + bp.M[5] * p[2] + bp.t[1], bp.M[6] * p[0] + bp.M[7] * p[1] + bp.M[8] * p[2] + bp.t[2]];
          const s = toScreen(cam, w);
          out.push([s[0], s[1], (l[3] * cam.k) / s[2]]);
        });
      });
      return out;
    };
    return { lights: conv(car.lights), exh: conv(car.exh) };
  }

  // datos para partículas y marcas (mismo formato que Car3D.geometry)
  CG.info = function (id) {
    const car = CG.cars[id];
    return {
      exh: car.exh, hw: car.hw,
      wheelX: car.W.xr, rearZ: car.W.zr, frontZ: car.W.zf,
    };
  };

  /* ---------------- Expositor (garaje / concesionario) ---------------- */
  CG.showroom = function (ctx, id, colors, w, h, floorY, angle) {
    const car = CG.cars[id];
    if (!car) return false;
    ensureSize(w, h);
    const tgt = [0, car.h * 0.45, 0.5];
    const el = 0.2, dist = 2.6;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const f = [sa * Math.cos(el), -Math.sin(el), ca * Math.cos(el)];
    const C = [tgt[0] - f[0] * dist, tgt[1] - f[1] * dist, tgt[2] - f[2] * dist];
    const r = [ca, 0, -sa];
    const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    const ul = Math.hypot(u[0], u[1], u[2]);
    const R = [r[0], r[1], r[2], u[0] / ul, u[1] / ul, u[2] / ul, f[0], f[1], f[2]];
    const t = [-(R[0] * C[0] + R[1] * C[1] + R[2] * C[2]), -(R[3] * C[0] + R[4] * C[1] + R[5] * C[2]), -(R[6] * C[0] + R[7] * C[1] + R[8] * C[2])];
    const V = fromRT(R, t);
    // escala fija (no «respira» al girar): el largo del coche ocupa ~78% del ancho
    const k = Math.min(w * 0.8, h * 2.0) * dist * 1.12;
    const cam = { V, C, k, ox: w / 2, oy: 0, sxA: 0, syA: 0 };
    const g = toScreen(cam, [0, 0, 0.5]);
    cam.oy = floorY - g[1] - h * 0.02;
    const VP = mul(projMat(cam, 0, 0, w, h, 0.3, 8), V);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shadow(VP, car, 0.8);
    render(car, VP, C, null, true, colors, { yaw: 0, steer: 0 }, {});
    ctx.drawImage(cv, 0, cv.height - h, w, h, 0, 0, w, h);
    return true;
  };
  CG.colors = function (model, color) {
    const W = model.side || {};
    const id = model.id;
    const c = CG.cars[id] && CG.cars[id].meta.colors;
    return {
      paint: color || model.color,
      sec: model.sec || (c && c.sec) || '#15171b',
      stripe: (model.rear && model.rear.stripes) || (c && c.stripe) || '#f2f2f2',
      caliper: W.caliper || (c && c.caliper) || '#c41a1a',
      rim: (c && c.rim) || '#b9bdc4',
    };
  };
})(window.TG);
