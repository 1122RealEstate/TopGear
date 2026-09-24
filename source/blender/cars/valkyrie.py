# Aston Martin Valkyrie — 4.72 × 1.92 × 1.07 m, batalla 2.73 m (un prototipo de Le Mans con matrícula)
# Pontones delanteros sobre las ruedas, morro estrecho con los túneles Venturi debajo,
# pontones laterales vaciados, habitáculo en lágrima, aleta central y alerón entre las aletas traseras.
L = 4.72


# 14 puntos por sección: suelo, costado (con el vaciado del pontón lateral), hombro y cubierta
_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.20), (0.74, 0.20), (0.855, 0.24), (0.885, 0.32), (0.895, 0.42), (0.895, 0.52), (0.89, 0.62), (0.87, 0.72), (0.825, 0.80),
           (0.74, 0.83), (0.62, 0.80), (0.42, 0.77), (0.2, 0.765), (0, 0.765)]),
    (0.5, [(0, 0.16), (0.80, 0.16), (0.92, 0.20), (0.945, 0.30), (0.95, 0.42), (0.95, 0.52), (0.945, 0.62), (0.925, 0.73), (0.87, 0.82),
           (0.76, 0.855), (0.63, 0.82), (0.44, 0.785), (0.22, 0.78), (0, 0.78)]),
    (1.03, [(0, 0.12), (0.83, 0.12), (0.95, 0.17), (0.97, 0.28), (0.975, 0.40), (0.975, 0.52), (0.97, 0.63), (0.95, 0.75), (0.89, 0.845),
            (0.78, 0.875), (0.64, 0.84), (0.46, 0.80), (0.23, 0.795), (0, 0.795)]),
    (1.75, [(0, 0.11), (0.86, 0.11), (0.96, 0.135), (0.86, 0.22), (0.78, 0.34), (0.84, 0.47), (0.94, 0.58), (0.935, 0.70), (0.88, 0.79),
            (0.76, 0.815), (0.63, 0.80), (0.46, 0.785), (0.23, 0.78), (0, 0.78)]),
    (2.45, [(0, 0.10), (0.88, 0.10), (0.96, 0.12), (0.72, 0.20), (0.63, 0.34), (0.70, 0.50), (0.88, 0.62), (0.885, 0.70), (0.80, 0.765),
            (0.68, 0.78), (0.58, 0.775), (0.44, 0.77), (0.22, 0.765), (0, 0.765)]),
    (3.1, [(0, 0.12), (0.86, 0.12), (0.95, 0.15), (0.80, 0.23), (0.72, 0.35), (0.78, 0.49), (0.90, 0.60), (0.89, 0.68), (0.80, 0.735),
           (0.68, 0.745), (0.58, 0.74), (0.44, 0.73), (0.22, 0.725), (0, 0.725)]),
    (3.76, [(0, 0.20), (0.58, 0.20), (0.66, 0.22), (0.69, 0.28), (0.69, 0.35), (0.66, 0.42), (0.60, 0.49), (0.52, 0.545), (0.43, 0.58),
            (0.34, 0.60), (0.25, 0.61), (0.16, 0.615), (0.08, 0.618), (0, 0.62)]),
    (4.3, [(0, 0.20), (0.55, 0.20), (0.63, 0.22), (0.66, 0.27), (0.66, 0.33), (0.63, 0.39), (0.58, 0.44), (0.51, 0.48), (0.43, 0.505),
           (0.34, 0.52), (0.25, 0.525), (0.16, 0.528), (0.08, 0.53), (0, 0.53)]),
    (4.72, [(0, 0.18), (0.48, 0.18), (0.55, 0.20), (0.58, 0.24), (0.58, 0.29), (0.56, 0.34), (0.51, 0.38), (0.45, 0.41), (0.38, 0.43),
            (0.30, 0.44), (0.22, 0.445), (0.14, 0.448), (0.07, 0.45), (0, 0.45)]),
])


def _pods(S, mb):
    '''Pontones delanteros (forman parte de la chapa: los pasos de rueda y el faro se tallan en ellos).'''
    top = Curve([(3.08, 0.60), (3.35, 0.735), (3.76, 0.815), (4.10, 0.79), (4.40, 0.71), (4.64, 0.60)])
    bot = Curve([(3.08, 0.36), (3.40, 0.28), (4.64, 0.26)])
    hw = Curve([(3.08, 0.11), (3.40, 0.165), (4.30, 0.17), (4.64, 0.16)])
    xcf = Curve([(3.08, 0.85), (3.50, 0.80), (4.64, 0.79)])
    y0, y1, Rf, Rr = 3.08, 4.64, 0.17, 0.10
    n, pw = 28, 2.6
    st = []                                   # (y, escala)
    K = 6
    for k in range(K, 0, -1):                 # cola: se estrecha hasta el pontón lateral
        th = (k / K) * math.pi / 2
        st.append((y0 + Rr - Rr * math.sin(th), max(0.3, math.cos(th))))
    m = int(round((y1 - Rf - (y0 + Rr)) / 0.05))
    for i in range(m + 1):
        st.append((y0 + Rr + (y1 - Rf - y0 - Rr) * i / m, 1.0))
    for k in range(1, K + 1):                 # punta redondeada (cúpula del faro)
        th = (k / K) * math.pi / 2
        st.append((y1 - Rf + Rf * math.sin(th), max(0.07, math.cos(th))))
    for sd in (1, -1):
        rings, cens = [], []
        for (y, s) in st:
            xc, zc = xcf(y), (top(y) + bot(y)) / 2
            a, b = hw(y) * s, (top(y) - bot(y)) / 2 * s
            ring = []
            for j in range(n):
                ph = 2 * math.pi * j / n
                c, sn = math.cos(ph), math.sin(ph)
                x = xc + a * math.copysign(abs(c) ** (2 / pw), c)
                z = zc + b * math.copysign(abs(sn) ** (2 / pw), sn)
                ring.append(mb.v((sd * x, y, z)))
            rings.append(ring)
            cens.append(Vector((sd * xc, y, zc)))
        core = lambda y: min(max(y, y0 + 0.3), y1 - 0.3)
        for i in range(len(rings) - 1):
            A, B = rings[i], rings[i + 1]
            for j in range(n):
                j1 = (j + 1) % n
                ph = 2 * math.pi * (j + 0.5) / n
                mat = 'under' if math.sin(ph) < -0.55 else 'paint'
                q = (A[j], A[j1], B[j1], B[j])
                mid = sum((v.co for v in q), Vector()) / 4
                c0 = cens[i].lerp(cens[i + 1], 0.5)
                mb.f_out(q, mat, mid - Vector((c0.x, core(mid.y), c0.z)))
        for (R, c, dy) in ((rings[0], cens[0], -1), (rings[-1], cens[-1], 1)):
            cv = mb.v(c + Vector((0, dy * 0.004, 0)))
            for j in range(n):
                mb.f_out((cv, R[j], R[(j + 1) % n]), 'paint', Vector((0, dy, 0)), smooth=False)


TUNNEL = [(0.12, 0.20), (0.70, 0.20), (0.70, 0.32), (0.64, 0.44), (0.50, 0.52), (0.30, 0.52), (0.16, 0.45), (0.12, 0.36)]
HL = (0.80, 0.49)


def _rear(ctx):
    mb = ctx['mb']
    # túneles Venturi enormes a los lados de la quilla central, perfilados en lima
    recess(ctx, TUNNEL, 'rear', depth=0.42, walls='carbon', bottom='black', smooth=2, cell=0.035)
    arch = chaikin_open([(0.725, 0.20), (0.725, 0.33), (0.665, 0.465), (0.51, 0.545), (0.30, 0.545), (0.14, 0.465), (0.095, 0.36), (0.095, 0.20)])
    D(ctx, strip(arch, 0.013), 'rear', 'sec', off=0.002, cell=0.012, avoid=(), graze=0.08)
    panel(ctx, [(-0.09, 0.20), (0.09, 0.20), (0.075, 0.50), (-0.075, 0.50)], 'rear', 'carbon', mirror=False, cell=0.02)
    for x in (0.30, 0.52):                   # aletas verticales dentro de cada túnel
        prism(mb, [(0.03, 0.15), (0.40, 0.19), (0.40, 0.50), (0.03, 0.45)], 'x', x - 0.004, x + 0.004, 'carbon', mirror=True)
    # zona negra alta con los dos escapes juntos en el centro
    recess(ctx, [(-0.50, 0.565), (0.50, 0.565), (0.56, 0.645), (0.50, 0.725), (-0.50, 0.725), (-0.56, 0.645)], 'rear', depth=0.05, walls='black',
           bottom='mesh', mirror=False, smooth=1, cell=0.03)
    exhaust_tips(ctx, [(0.105, 0.645, 'round', 0.10, 0.10)], bezel=0.008, bezel_depth=0.03)
    # pilotos: pequeños grupos de barras LED en la cara trasera de cada aleta
    light_unit(ctx, smooth_poly([(0.64, 0.69), (0.83, 0.69), (0.845, 0.735), (0.83, 0.775), (0.65, 0.775), (0.63, 0.735)], 1), 'rear',
               depth=0.02, lens='lensred', inside='taildark', cell=0.01)
    # alerón entre las dos aletas y aleta de tiburón sobre la columna del motor
    wing(mb, 0.46, 0.93, 0.34, 1.70, th=0.10, mat='carbon', angle=0.06, camber=0.05, plate_h=0.16)
    prism(mb, [(0.30, 0.74), (0.6, 0.74), (1.0, 0.78), (1.45, 0.90), (1.35, 0.96), (1.0, 0.99), (0.6, 1.0), (0.30, 0.99)], 'x', -0.007, 0.007, 'paint')


def _rear_in(ctx):
    for z in (0.715, 0.748):
        for x0 in (0.665, 0.725, 0.785):
            lightbar(ctx, [(x0, z), (x0 + 0.045, z)], 0.013, 'rear', mat='led', raise_=0.012)


def _side(ctx):
    side_windows(ctx, [(3.30, 0.72), (3.0, 0.90), (2.6, 1.0), (2.2, 1.0), (1.98, 0.92), (2.1, 0.80), (2.6, 0.77), (3.1, 0.74)])
    # retrovisores de cámara, diminutos, en la base del pilar
    mirror_part(ctx['mb'], 0.47, 3.12, 0.80, w=0.075, h=0.035, d=0.06, stalk=0.05)
    # salidas de aire de los pasos de rueda sobre los pontones, perfiladas en lima
    vent = [(0.69, 3.30), (0.92, 3.33), (0.91, 3.52), (0.71, 3.50)]
    recess(ctx, vent, 'top', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    ring = smooth_poly(offset_poly(vent, -0.016), 1)
    D(ctx, strip(ring + ring[:1], 0.011), 'top', 'sec', off=0.002, cell=0.01, avoid=(), graze=0.1)


def _front(ctx):
    mb = ctx['mb']
    # entrada de los túneles bajo el morro
    recess(ctx, [(-0.46, 0.185), (0.46, 0.185), (0.42, 0.30), (-0.42, 0.30)], 'front', depth=0.4, walls='black', bottom='black', mirror=False, smooth=1, cell=0.03)
    # faros redondos en la punta de cada pontón
    light_unit(ctx, ellipse(HL[0], HL[1], 0.072, 0.056, 32), 'front', depth=0.04, lens='lens', inside='darkchrome', cell=0.01)
    # alerón delantero / splitter de carbono con el filo lima y derivas que lo unen a los pontones
    box(mb, -0.92, 0.92, 4.26, 4.735, 0.075, 0.095, 'carbon')
    box(mb, -0.92, 0.92, 4.735, 4.745, 0.075, 0.095, 'sec')
    prism(mb, [(4.30, 0.09), (4.72, 0.09), (4.66, 0.24), (4.40, 0.27)], 'x', 0.875, 0.885, 'carbon', mirror=True)


def _front_in(ctx):
    x, z = HL
    for (dx, dz, r) in ((-0.024, 0.012, 0.016), (0.024, 0.012, 0.016), (0.0, -0.022, 0.015)):
        projector(ctx, x + dx, z + dz, r, 'front', h=0.01)
    arc = [(x + math.cos(a) * 0.062, z + math.sin(a) * 0.046) for a in [math.radians(15 + 150 * i / 10) for i in range(11)]]
    lightbar(ctx, arc, 0.008, 'front', mat='drl', raise_=0.03)
    # alas de Aston Martin en la punta del morro
    led(ctx, [(-0.075, 0.432), (-0.02, 0.418), (0.0, 0.41), (0.02, 0.418), (0.075, 0.432), (0.0, 0.424)], 'front', mat='chrome', raise_=0.003,
        mirror=False, cell=0.006)


def _two_tone(seg, y, side):
    # el vaciado de los pontones laterales va en carbono
    return 'carbon' if (2 <= seg <= 5 and 1.45 < y < 3.45) else None


SPEC = dict(
    id='valkyrie', L=L, W=1.92, color='#0e5a42', sec='#b6e000',
    wheels=dict(yf=3.76, yr=1.03, r=0.347, dr=0.005, wf=0.265, wr=0.325, tf=1.62, tr=1.60, rim=0.254, arch=0.39,
                style='10', caliper='#b6e000', rim_color='#2a2d32', lock=True),
    body=dict(
        top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS,
        subs=[6, 3, 2, 3, 3, 3, 3, 3, 3, 3, 4, 5, 5],
        corners=(2,),
        mats={0: 'under', 1: 'under'},
        mat_fn=_two_tone,
        r_rear=0.05, r_front=0.06,
        nose=[(0.18, 0.0), (0.30, 0.0), (0.45, 0.07)], nose_zone=0.5,
        nose_x=[(0.0, 0.0), (0.3, 0.03), (0.58, 0.14)],
        extra=[_pods],
    ),
    cabin=dict(
        y0=0.80, y1=3.55,
        roof=[(0.80, 0.77), (1.1, 0.86), (1.5, 0.95), (1.9, 1.025), (2.2, 1.06), (2.45, 1.07), (2.7, 1.055), (2.95, 1.0), (3.15, 0.92),
              (3.35, 0.80), (3.55, 0.62)],
        edge=[(0.80, 0.765), (1.1, 0.85), (1.5, 0.935), (1.9, 1.0), (2.2, 1.03), (2.45, 1.04), (2.7, 1.025), (2.95, 0.975), (3.15, 0.895),
              (3.35, 0.78), (3.55, 0.605)],
        belt=[(0.80, 0.74), (1.5, 0.76), (2.45, 0.76), (3.1, 0.72), (3.35, 0.66), (3.55, 0.58)],
        wb=[(0.80, 0.22), (1.2, 0.36), (1.7, 0.46), (2.2, 0.52), (2.6, 0.53), (3.0, 0.50), (3.3, 0.44), (3.55, 0.36)],
        wt=[(0.80, 0.10), (1.2, 0.18), (1.7, 0.28), (2.2, 0.37), (2.6, 0.39), (3.0, 0.38), (3.3, 0.33), (3.55, 0.26)],
        zones=[(2.52, 9, 'glass', None), (1.95, 2.52, 'paint', None), (0, 1.95, 'paint', None)],
        ys=(2.52, 1.95),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
