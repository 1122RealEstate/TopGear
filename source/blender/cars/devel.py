# Devel Sixteen (2017) — 4.88 × 2.10 × 1.20 m, batalla 2.80 m aprox.
# Hiperdeportivo de inspiración aeronáutica: morro afilado con grandes tomas negras, habitáculo negro de
# cazabombardero, enormes tomas laterales negras, cola con dos derivas y gran alerón, blanco y negro.
import copy
P = inherit('jesko')
K = 4.88 / 4.61
L = 4.88


def _rear(ctx):
    mb = ctx['mb']
    recess(ctx, smooth_poly([(-0.86, 0.26), (0.86, 0.26), (0.90, 0.42), (0.88, 0.62), (0.78, 0.74), (-0.78, 0.74), (-0.88, 0.62), (-0.90, 0.42)], 1),
           'rear', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.10, 0.55, 'round', 0.11, 0.11), (0.30, 0.55, 'round', 0.11, 0.11)], bezel=0.01, bezel_depth=0.03)
    light_unit(ctx, [(0.52, 0.78), (0.84, 0.80), (0.90, 0.84), (0.86, 0.86), (0.52, 0.83)], 'rear', depth=0.02, lens='lensred', inside='taildark',
               smooth=1, cell=0.008)
    diffuser(ctx, 0.7, 8, y_len=0.6, z_low=0.14)
    # dos derivas en la cola y alerón entre ellas
    for x in (0.62,):
        prism(mb, [(0.05, 0.88), (0.95, 0.90), (0.55, 1.22), (0.10, 1.26)], 'x', x - 0.012, x + 0.012, 'paint', mirror=True, smooth=True)
    wing(mb, 0.40, 1.16, 0.34, 1.26, th=0.08, mat='sec', angle=0.08, camber=0.05, plates=False)


def _rear_in(ctx):
    lightbar(ctx, [(0.54, 0.80), (0.84, 0.82), (0.88, 0.845)], 0.012, 'rear', mat='led', raise_=0.012)


def _side(ctx):
    side_windows(ctx, [(3.28, 0.85), (2.96, 1.06), (2.54, 1.16), (2.12, 1.15), (1.85, 1.04), (2.06, 0.90), (2.75, 0.86)])
    door(ctx, [(1.84, 0.87), (1.87, 0.6), (1.92, 0.30), (3.19, 0.30), (3.23, 0.6), (3.28, 0.83)])
    # enormes tomas laterales negras en diagonal
    recess(ctx, [(1.84, 0.84), (1.20, 0.86), (1.05, 0.62), (1.30, 0.30), (1.84, 0.30), (2.4, 0.30), (1.95, 0.52)], 'side', depth=0.08, walls='black',
           bottom='mesh', smooth=1, cell=0.03)
    panel(ctx, [(2.4, 0.14), (4.3, 0.14), (4.1, 0.34), (2.6, 0.34)], 'side', 'sec', cell=0.03, graze=0.12)
    mirror_part(ctx['mb'], 0.80, 3.15, 0.95, w=0.15, h=0.07, d=0.09, stalk=0.10, mat='sec')


def _front(ctx):
    # tomas negras del morro, afiladas, y faros finos en las esquinas
    recess(ctx, [(0.14, 0.18), (0.56, 0.18), (0.76, 0.34), (0.60, 0.48), (0.30, 0.40)], 'front', depth=0.06, walls='black', bottom='mesh', smooth=1, cell=0.02)
    recess(ctx, [(-0.12, 0.18), (0.12, 0.18), (0.08, 0.40), (-0.08, 0.40)], 'front', depth=0.05, walls='black', bottom='black', mirror=False, smooth=1, cell=0.02)
    light_unit(ctx, [(0.62, 0.52), (0.84, 0.46), (0.88, 0.50), (0.66, 0.57)], 'front', depth=0.03, lens='lens', inside='black', smooth=1, cell=0.008)


def _front_in(ctx):
    lightbar(ctx, [(0.64, 0.535), (0.86, 0.48)], 0.01, 'front', mat='drl', raise_=0.02)


S0 = P['SPEC']
B = copy.deepcopy(S0['body'])
B['top'] = [(y * K, v) for (y, v) in B['top']]
B['bottom'] = [(y * K, v) for (y, v) in B['bottom']]
B['width'] = [(y * K, v * 1.03) for (y, v) in B['width']]
B['keys'] = [(y * K, uv) for (y, uv) in B['keys']]
B['nose_x'] = [(0.0, 0.0), (0.3, 0.06), (0.6, 0.22), (0.86, 0.46)]
C = copy.deepcopy(S0['cabin'])
for k in ('roof', 'edge', 'belt', 'wb', 'wt'):
    C[k] = [(y * K, v) for (y, v) in C[k]]
C['y0'], C['y1'] = C['y0'] * K, C['y1'] * K
C['zones'] = [(2.62 * K, 9, 'glass', None), (0, 2.62 * K, 'sec', None)]
C['ys'] = (2.62 * K,)
C['side_mat'] = 'sec'
C['pillar_mat'] = 'sec'

SPEC = dict(
    id='devel', L=L, W=2.10, color='#eceef1', sec='#141518',
    wheels=dict(yf=3.56 * K, yr=0.86 * K, r=0.355, dr=0.015, drim=0.0127, wf=0.275, wr=0.345, tf=1.78, tr=1.74, rim=0.254, arch=0.40,
                style='5', caliper='#c41a1a', rim_color='#6c7078', lock=True),
    body=B, cabin=C,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
