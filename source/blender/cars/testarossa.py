# Ferrari 250 Testa Rossa (1957, «pontoon fender») — 4.17 × 1.58 × 1.05 m, batalla 2.35 m
# Barchetta: guardabarros delanteros en pontón, separados del morro, con los faros bajo cubierta;
# la gran parrilla oval de rejilla, habitáculo abierto con parabrisas envolvente y reposacabezas
# carenado, ruedas de radios con palomilla.
L = 4.17

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.30), (0.60, 0.30), (0.70, 0.34), (0.74, 0.42), (0.75, 0.52), (0.74, 0.62), (0.71, 0.70), (0.64, 0.755), (0.52, 0.785),
           (0.36, 0.795), (0.18, 0.80), (0, 0.80)]),
    (0.95, [(0, 0.18), (0.70, 0.18), (0.77, 0.22), (0.79, 0.32), (0.795, 0.44), (0.79, 0.56), (0.775, 0.66), (0.745, 0.745), (0.66, 0.80),
            (0.48, 0.795), (0.24, 0.785), (0, 0.785)]),
    (1.7, [(0, 0.17), (0.66, 0.17), (0.72, 0.21), (0.74, 0.30), (0.745, 0.42), (0.74, 0.54), (0.72, 0.64), (0.68, 0.71), (0.60, 0.745),
           (0.44, 0.75), (0.22, 0.75), (0, 0.75)]),
    (2.35, [(0, 0.17), (0.62, 0.17), (0.68, 0.21), (0.70, 0.30), (0.70, 0.42), (0.69, 0.52), (0.67, 0.60), (0.63, 0.66), (0.56, 0.69),
            (0.42, 0.70), (0.20, 0.70), (0, 0.70)]),
    (3.3, [(0, 0.22), (0.44, 0.22), (0.50, 0.25), (0.52, 0.32), (0.52, 0.42), (0.50, 0.52), (0.46, 0.60), (0.40, 0.66), (0.32, 0.69),
           (0.22, 0.70), (0.10, 0.70), (0, 0.70)]),
    (3.9, [(0, 0.24), (0.42, 0.24), (0.48, 0.27), (0.50, 0.34), (0.50, 0.43), (0.48, 0.51), (0.44, 0.57), (0.38, 0.61), (0.30, 0.63),
           (0.20, 0.64), (0.10, 0.64), (0, 0.64)]),
    (4.17, [(0, 0.26), (0.34, 0.26), (0.40, 0.29), (0.42, 0.35), (0.42, 0.42), (0.40, 0.48), (0.36, 0.53), (0.30, 0.56), (0.22, 0.575),
            (0.14, 0.58), (0.07, 0.58), (0, 0.58)]),
])
POD = dict(top=[(2.72, 0.50), (3.0, 0.66), (3.3, 0.725), (3.7, 0.70), (4.0, 0.64), (4.15, 0.57)],
           bot=[(2.72, 0.42), (3.0, 0.30), (4.15, 0.30)],
           hw=[(2.72, 0.07), (3.0, 0.16), (3.8, 0.17), (4.15, 0.15)],
           xc=[(2.72, 0.66), (3.2, 0.64), (4.15, 0.62)], y0=2.72, y1=4.15, Rf=0.2, Rr=0.14, rear_min=0.25)


def _pods(S, mb):
    pods(mb, **POD)


def _rear(ctx):
    for z in (0.60,):
        for x in (0.52, 0.64):
            light_unit(ctx, circle_poly(x, z, 0.028, 20), 'rear', depth=0.015, lens='lensred', inside='taildark', cell=0.008)
    exhaust_tips(ctx, [(0.30, 0.33, 'round', 0.07, 0.07)], bezel=0.006, bezel_depth=0.02)


def _rear_in(ctx):
    for x in (0.52, 0.64):
        led(ctx, circle_poly(x, 0.60, 0.02, 16), mat='led', raise_=0.01, cell=0.006)


def _side(ctx):
    mb = ctx['mb']
    # habitáculo abierto con asientos y volante; reposacabezas carenado tras el conductor
    open_cockpit(ctx, 1.78, 2.74, 0.50, depth=0.34, seats=(0.27,), wheel_y=2.52)
    prism(mb, [(1.05, 0.745), (1.80, 0.745), (1.78, 0.93), (1.66, 0.955), (1.35, 0.86)], 'x', 0.16, 0.40, 'paint', smooth=True)
    door(ctx, [(2.05, 0.66), (2.08, 0.40), (2.12, 0.22), (2.70, 0.22), (2.72, 0.46), (2.74, 0.66)])


def _front(ctx):
    mb = ctx['mb']
    # parrilla oval de huevera con marco cromado
    recess(ctx, ellipse(0.0, 0.43, 0.28, 0.12, 40), 'front', depth=0.06, walls='chrome', bottom='mesh', mirror=False, cell=0.02)
    # faros redondos bajo cubierta en la punta de cada pontón
    light_unit(ctx, ellipse(0.62, 0.47, 0.085, 0.08, 32), 'front', depth=0.04, lens='lens', inside='darkchrome', cell=0.01)
    # toma del capó
    prism(mb, [(3.35, 0.70), (3.95, 0.64), (3.98, 0.665), (3.55, 0.755)], 'x', -0.11, 0.11, 'paint', smooth=True)


def _front_in(ctx):
    D(ctx, offset_poly(ellipse(0.0, 0.43, 0.28, 0.12, 40), -0.02), 'front', 'chrome', off=0.003, cell=0.012, mirror=False, avoid=('mesh', 'chrome'),
      graze=0.1)
    projector(ctx, 0.62, 0.47, 0.062, 'front', h=0.02, ring=0.012)
    led(ctx, [(0.0, 0.575), (0.02, 0.59), (0.02, 0.62), (0.0, 0.63), (-0.02, 0.62), (-0.02, 0.59)], 'front', mat='c_f2c400', raise_=0.003,
        mirror=False, cell=0.005)


SPEC = dict(
    id='testarossa', L=L, W=1.58, color='#8d1417', sec='#18191c',
    wheels=dict(yf=3.30, yr=0.95, r=0.345, dr=0.005, wf=0.17, wr=0.19, tf=1.31, tr=1.30, rim=0.203, arch=0.38,
                style='wire', caliper='#3a3a3c', rim_color='#c9ccd1', lock=True),
    body=dict(
        top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS,
        corners=(),
        mats={0: 'under', 1: 'under'},
        r_rear=0.08, r_front=0.08,
        nose=[(0.26, 0.02), (0.36, 0.0), (0.48, 0.03), (0.58, 0.09)], nose_zone=0.45,
        nose_x=[(0.0, 0.0), (0.2, 0.02), (0.42, 0.10)],
        tail=[(0.30, 0.04), (0.42, 0.0), (0.80, 0.02)], tail_zone=0.35,
        extra=[_pods],
    ),
    cabin=dict(
        # solo el parabrisas envolvente (el resto del habitáculo queda abierto)
        y0=2.66, y1=2.92, side_mat='hidden', pillar_mat='glass',
        roof=[(2.66, 0.93), (2.75, 0.92), (2.84, 0.83), (2.92, 0.69)],
        edge=[(2.66, 0.925), (2.75, 0.912), (2.84, 0.822), (2.92, 0.685)],
        belt=[(2.66, 0.70), (2.92, 0.70)],
        wb=[(2.66, 0.50), (2.92, 0.50)],
        wt=[(2.66, 0.46), (2.92, 0.47)],
        zones=[(0, 9, 'glass', None)],
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
