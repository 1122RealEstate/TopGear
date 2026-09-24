# Mazda 787B (1991, ganador de Le Mans, librea Renown) — 4.78 × 1.99 × 1.04 m, batalla 2.66 m
# Grupo C: cuña larga y baja con la cola larga, alerón sobre dos soportes en la cola, faros bajo cubierta en
# las esquinas, toma central, librea naranja y verde con el 55.
import copy
P = inherit('p917')
K = 4.78 / 4.14
L = 4.78
GREEN, WHITE = 'sec', 'c_f4f4f2'


def _rear(ctx):
    mb = ctx['mb']
    recess(ctx, [(-0.74, 0.30), (0.74, 0.30), (0.76, 0.58), (-0.76, 0.58)], 'rear', depth=0.06, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.04)
    exhaust_tips(ctx, [(0.0, 0.40, 'round', 0.1, 0.1)], bezel=0.006, bezel_depth=0.02)
    for x in (0.66, 0.82):
        light_unit(ctx, circle_poly(x, 0.66, 0.04, 24), 'rear', depth=0.02, lens='lensred', inside='taildark', cell=0.01)
    # alerón alto en la cola sobre dos soportes
    wing(mb, 0.30, 1.04, 0.36, 1.84, th=0.09, mat='paint', angle=0.1, camber=0.06, plate_h=0.24, plate_mat='paint')
    prism(mb, [(0.26, 0.74), (0.06, 0.74), (0.06, 1.04), (0.22, 1.05)], 'x', 0.40, 0.418, 'wing_paint', mirror=True)


def _rear_in(ctx):
    for x in (0.66, 0.82):
        led(ctx, circle_poly(x, 0.66, 0.028, 20), mat='led', raise_=0.012, cell=0.008)


def _side(ctx):
    side_windows(ctx, [(3.18, 0.70), (2.85, 0.92), (2.4, 0.97), (2.0, 0.93), (1.85, 0.80), (2.2, 0.72)])
    door(ctx, [(1.92, 0.72), (1.95, 0.5), (1.99, 0.24), (3.18, 0.24), (3.2, 0.5), (3.24, 0.68)])
    recess(ctx, [(1.40, 0.62), (1.74, 0.64), (1.74, 0.72), (1.42, 0.71)], 'side', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.02)
    mirror_part(ctx['mb'], 0.80, 3.40, 0.76, w=0.10, h=0.08, d=0.06, stalk=0.06, mat='paint')
    # librea Renown: verde abajo con barrido diagonal, 55 en panel blanco
    panel(ctx, [(0.05, 0.14), (4.4, 0.14), (4.4, 0.34), (3.3, 0.36), (2.6, 0.62), (2.2, 0.62), (2.9, 0.34), (0.05, 0.34)], 'side', GREEN, cell=0.03,
          graze=0.2)
    D(ctx, [(2.35, 0.36), (2.75, 0.36), (2.75, 0.62), (2.35, 0.62)], 'side', WHITE, off=0.0028, cell=0.02, avoid=('glass',), graze=0.1)
    number(ctx, '55', 2.55, 0.49, 0.2, 'side', mat='black', stroke=0.17, raise_=0.004)


def _front(ctx):
    recess(ctx, ellipse(0.0, 0.25, 0.32, 0.06, 32), 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.02)
    light_unit(ctx, ellipse(0.66, 4.45, 0.13, 0.15, 36), None, depth=0.05, lens='lens', inside='black', custom=P['TOPF'], cell=0.012)


def _front_in(ctx):
    for (x, y) in ((0.62, 4.40), (0.72, 4.50)):
        projector(ctx, x, y, 0.05, None, custom=P['TOPF'], h=0.025, ring=0.01)


S0 = P['SPEC']
B = copy.deepcopy(S0['body'])
B['top'] = [(y * K, v) for (y, v) in B['top']]
B['bottom'] = [(y * K, v) for (y, v) in B['bottom']]
B['width'] = [(y * K, v * 0.98) for (y, v) in B['width']]
B['keys'] = [(y * K, uv) for (y, uv) in B['keys']]
C = copy.deepcopy(S0['cabin'])
for k in ('roof', 'edge', 'belt', 'wb', 'wt'):
    C[k] = [(y * K, v) for (y, v) in C[k]]
C['y0'], C['y1'] = C['y0'] * K, C['y1'] * K
C['zones'] = [(2.42 * K, 9, 'glass', None), (1.78 * K, 2.42 * K, 'paint', None), (1.45 * K, 1.78 * K, 'glass', None), (0, 1.45 * K, 'paint', None)]
C['ys'] = tuple(v * K for v in (2.42, 1.78, 1.45))

SPEC = dict(
    id='m787b', L=L, W=1.99, color='#f36f21', sec='#12a36f',
    wheels=dict(yf=3.24 * K, yr=0.94 * K, r=0.31, dr=0.012, drim=0.0, wf=0.28, wr=0.34, tf=1.62, tr=1.58, rim=0.2286, arch=0.36,
                style='dish', caliper='#b8b8b8', rim_color='#c9ccd1', lock=True),
    body=B, cabin=C,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
