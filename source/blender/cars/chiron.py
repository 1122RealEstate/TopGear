# Bugatti Chiron Super Sport — 4.794 × 2.038 × 1.195 m, batalla 2.711 m (cola larga)
# Herradura con el macarón, faros de cuatro lupas, línea en «C» cromada, espina central en el techo,
# barra LED de lado a lado en la trasera negra y cuatro escapes apilados de dos en dos.
L = 4.794
HL = along_y((-0.1, -0.9, -0.42), L - 0.24)

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.20), (0.78, 0.20), (0.89, 0.24), (0.925, 0.34), (0.93, 0.46), (0.925, 0.58), (0.91, 0.70), (0.88, 0.79), (0.80, 0.845),
           (0.62, 0.86), (0.31, 0.86), (0, 0.86)]),
    (0.5, [(0, 0.15), (0.84, 0.15), (0.96, 0.20), (0.985, 0.31), (0.99, 0.44), (0.985, 0.58), (0.97, 0.71), (0.94, 0.82), (0.86, 0.895),
           (0.66, 0.91), (0.33, 0.905), (0, 0.90)]),
    (1.0, [(0, 0.12), (0.87, 0.12), (0.99, 0.18), (1.015, 0.30), (1.019, 0.44), (1.015, 0.58), (1.0, 0.72), (0.96, 0.84), (0.87, 0.925),
           (0.68, 0.95), (0.34, 0.945), (0, 0.94)]),
    (1.75, [(0, 0.12), (0.85, 0.12), (0.965, 0.17), (0.99, 0.28), (0.985, 0.42), (0.975, 0.56), (0.955, 0.68), (0.92, 0.79), (0.84, 0.87),
            (0.66, 0.90), (0.33, 0.895), (0, 0.89)]),
    (2.4, [(0, 0.12), (0.84, 0.12), (0.95, 0.16), (0.975, 0.27), (0.97, 0.41), (0.96, 0.55), (0.94, 0.67), (0.905, 0.77), (0.83, 0.845),
           (0.65, 0.87), (0.32, 0.865), (0, 0.86)]),
    (3.0, [(0, 0.12), (0.85, 0.12), (0.965, 0.17), (0.99, 0.28), (0.985, 0.42), (0.975, 0.56), (0.955, 0.68), (0.92, 0.78), (0.845, 0.85),
           (0.67, 0.87), (0.34, 0.86), (0, 0.855)]),
    (3.711, [(0, 0.13), (0.87, 0.13), (0.985, 0.19), (1.01, 0.31), (1.015, 0.45), (1.005, 0.59), (0.985, 0.71), (0.945, 0.81), (0.86, 0.885),
             (0.68, 0.90), (0.36, 0.85), (0, 0.84)]),
    (4.3, [(0, 0.15), (0.82, 0.15), (0.93, 0.20), (0.965, 0.31), (0.97, 0.43), (0.96, 0.55), (0.93, 0.65), (0.88, 0.73), (0.80, 0.785),
           (0.64, 0.80), (0.32, 0.74), (0, 0.73)]),
    (4.794, [(0, 0.16), (0.68, 0.16), (0.78, 0.19), (0.825, 0.26), (0.84, 0.34), (0.83, 0.42), (0.80, 0.49), (0.74, 0.555), (0.64, 0.60),
             (0.48, 0.62), (0.24, 0.60), (0, 0.595)]),
])

SHOE = [(-0.16, 0.20), (0.16, 0.20), (0.185, 0.30), (0.185, 0.42), (0.16, 0.52), (0.10, 0.585), (0.0, 0.605), (-0.10, 0.585), (-0.16, 0.52),
        (-0.185, 0.42), (-0.185, 0.30)]
ROOF = [(0.7, 0.88), (1.0, 0.95), (1.35, 1.04), (1.7, 1.13), (2.0, 1.18), (2.25, 1.195), (2.5, 1.18), (2.75, 1.12), (2.95, 1.04), (3.15, 0.95),
        (3.3, 0.88), (3.45, 0.80)]


def _rear(ctx):
    mb = ctx['mb']
    # trasera negra de lado a lado: barra LED arriba, escapes y difusor abajo
    recess(ctx, smooth_poly([(-0.86, 0.22), (0.86, 0.22), (0.91, 0.40), (0.90, 0.66), (0.85, 0.80), (-0.85, 0.80), (-0.90, 0.66), (-0.91, 0.40)], 1),
           'rear', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.47, 0.39, 'round', 0.085, 0.085), (0.47, 0.292, 'round', 0.085, 0.085)], bezel=0.01, bezel_depth=0.03)
    diffuser(ctx, 0.64, 5, y_len=0.62, z_low=0.14)
    # alerón activo recogido, enrasado con la cola
    panel(ctx, [(-0.80, 0.08), (0.80, 0.08), (0.78, 0.44), (-0.78, 0.44)], 'top', 'sec', mirror=False, cell=0.04)
    # «BB» sobre la barra de luz
    D(ctx, [(-0.032, 0.815), (0.032, 0.815), (0.032, 0.84), (-0.032, 0.84)], 'rear', 'chrome', off=0.002, cell=0.006, mirror=False, avoid=())


def _rear_in(ctx):
    bar = [(-0.88, 0.715), (-0.86, 0.752), (-0.78, 0.765), (0.0, 0.77), (0.78, 0.765), (0.86, 0.752), (0.88, 0.715)]
    lightbar(ctx, bar, 0.032, 'rear', mat='taildark', raise_=0.02, mirror=False)
    lightbar(ctx, bar, 0.013, 'rear', mat='led', raise_=0.024, mirror=False)


def _side(ctx):
    side_windows(ctx, [(3.25, 0.86), (2.95, 1.05), (2.55, 1.16), (2.15, 1.16), (1.95, 1.08), (1.98, 0.92), (2.6, 0.87)])
    door(ctx, [(2.02, 0.90), (2.04, 0.6), (2.08, 0.30), (3.12, 0.30), (3.16, 0.6), (3.20, 0.86)])
    # toma lateral dentro de la «C» y la línea en C cromada que la rodea
    recess(ctx, [(1.76, 0.78), (1.90, 0.84), (2.00, 0.78), (2.00, 0.46), (1.90, 0.38), (1.78, 0.44), (1.74, 0.60)], 'side', depth=0.07,
           walls='black', bottom='mesh', smooth=1, cell=0.03)
    cl = chaikin_open([(2.10, 1.08), (1.92, 1.04), (1.76, 0.93), (1.66, 0.75), (1.64, 0.56), (1.70, 0.39), (1.84, 0.28), (2.04, 0.22), (2.30, 0.20)])
    D(ctx, strip(cl, 0.03), 'side', 'chrome', off=0.0025, cell=0.012, avoid=('glass',), graze=0.05)
    panel(ctx, [(1.3, 0.14), (3.2, 0.14), (3.15, 0.23), (1.34, 0.24)], 'side', 'sec', cell=0.04)
    mirror_part(ctx['mb'], 0.78, 3.12, 0.95, w=0.15, h=0.07, d=0.09, stalk=0.09, mat='sec')
    # espina central que recorre el techo hasta la tapa del motor
    r = Curve(ROOF)
    ys = [1.0 + 1.75 * i / 24 for i in range(25)]
    fin = [(y, r(y) + 0.03) for y in ys] + [(y, r(y) - 0.06) for y in reversed(ys)]
    prism(ctx['mb'], fin, 'x', -0.012, 0.012, 'sec')


def _front(ctx):
    # herradura con marco cromado y rejilla
    recess(ctx, SHOE, 'front', depth=0.06, walls='chrome', bottom='mesh', mirror=False, smooth=2, cell=0.03)
    # grandes tomas a los lados de la herradura y labio de carbono
    recess(ctx, [(0.26, 0.20), (0.80, 0.22), (0.86, 0.34), (0.78, 0.46), (0.34, 0.46), (0.24, 0.34)], 'front', depth=0.06, walls='black',
           bottom='mesh', smooth=1, cell=0.04)
    D(ctx, [(-0.95, 0.12), (0.95, 0.12), (0.95, 0.145), (-0.95, 0.145)], 'front', 'carbon', off=0.002, cell=0.03, mirror=False, avoid=(), graze=0.15)
    # faros estrechos de cuatro lupas
    light_unit(ctx, [(0.48, 0.63), (0.68, 0.64), (0.84, 0.66), (0.90, 0.69), (0.88, 0.715), (0.68, 0.70), (0.50, 0.69), (0.46, 0.66)], None,
               depth=0.04, lens='lens', inside='darkchrome', custom=HL, smooth=1, cell=0.01)


def _front_in(ctx):
    # marco cromado: solo donde el rayo cae en la chapa (no dentro del hueco)
    D(ctx, offset_poly(smooth_poly(SHOE, 2), -0.024), 'front', 'chrome', off=0.003, cell=0.012, mirror=False, avoid=('mesh', 'chrome'), graze=0.1)
    for (x, z) in ((0.545, 0.664), (0.625, 0.668), (0.705, 0.674), (0.785, 0.682)):
        projector(ctx, x, z, 0.021, None, custom=HL, h=0.01)
    lightbar(ctx, [(0.50, 0.643), (0.68, 0.652), (0.84, 0.672), (0.875, 0.69)], 0.007, None, mat='drl', raise_=0.035, custom=HL)
    # macarón sobre la herradura
    led(ctx, ellipse(0.0, 0.548, 0.05, 0.027, 28), 'front', mat='badge', raise_=0.066, mirror=False, cell=0.01)
    led(ctx, ellipse(0.0, 0.548, 0.041, 0.02, 28), 'front', mat='tail', raise_=0.068, mirror=False, cell=0.01)


SPEC = dict(
    id='chiron', L=L, W=2.038, color='#1b3fa6', sec='#0d0f14',
    wheels=dict(yf=3.711, yr=1.00, r=0.34, dr=0.015, drim=0.0127, wf=0.285, wr=0.355, tf=1.74, tr=1.68, rim=0.254, arch=0.385,
                style='10', caliper='#e8e8e8', rim_color='#2c2f35', lock=True),
    body=dict(
        top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS,
        corners=(2, 7),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.07,
        nose=[(0.16, 0.0), (0.30, 0.01), (0.45, 0.07), (0.62, 0.20)], nose_zone=0.6,
        nose_x=[(0.0, 0.0), (0.3, 0.02), (0.6, 0.10), (0.84, 0.26)],
        tail=[(0.20, 0.05), (0.32, 0.0), (0.80, 0.0), (0.86, -0.03)], tail_zone=0.3,
    ),
    cabin=dict(
        y0=0.7, y1=3.45,
        roof=ROOF,
        edge=[(0.7, 0.875), (1.0, 0.94), (1.35, 1.025), (1.7, 1.11), (2.0, 1.155), (2.25, 1.17), (2.5, 1.155), (2.75, 1.10), (2.95, 1.02),
              (3.15, 0.93), (3.3, 0.865), (3.45, 0.785)],
        belt=[(0.7, 0.86), (1.3, 0.87), (1.9, 0.87), (2.5, 0.85), (3.0, 0.84), (3.3, 0.82), (3.45, 0.78)],
        wb=[(0.7, 0.34), (1.0, 0.46), (1.4, 0.58), (1.9, 0.68), (2.4, 0.71), (2.8, 0.71), (3.1, 0.68), (3.45, 0.60)],
        wt=[(0.7, 0.20), (1.0, 0.30), (1.4, 0.42), (1.9, 0.52), (2.3, 0.55), (2.6, 0.555), (2.9, 0.54), (3.15, 0.50), (3.45, 0.44)],
        zones=[(2.72, 9, 'glass', None), (1.62, 2.72, 'sec', None), (1.25, 1.62, 'glass', None), (0, 1.25, 'louver', None)],
        ys=(2.72, 1.62, 1.25),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
