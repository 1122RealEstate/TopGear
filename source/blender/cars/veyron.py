# Bugatti Veyron 16.4 — 4.462 × 1.998 × 1.204 m, batalla 2.710 m (bitono)
L = 4.462
TOPF = along((0, -0.62, -0.78), zr=0.68)


SHOE = [(-0.15, 0.25), (0.15, 0.25), (0.17, 0.35), (0.16, 0.44), (0.11, 0.50), (0.0, 0.525), (-0.11, 0.50), (-0.16, 0.44), (-0.17, 0.35)]


def _rear(ctx):
    # rejilla negra con los pilotos finos y el gran escape central único
    recess(ctx, [(-0.84, 0.42), (0.84, 0.42), (0.88, 0.52), (0.86, 0.74), (-0.86, 0.74), (-0.88, 0.52)], 'rear', depth=0.04, walls='black', bottom='mesh',
           mirror=False, smooth=1, cell=0.05)
    light_unit(ctx, ellipse(0.62, 0.785, 0.22, 0.022, 32), 'rear', depth=0.02, lens='lensred', inside='taildark', cell=0.012)
    light_unit(ctx, ellipse(0.0, 0.79, 0.12, 0.012, 24), 'rear', depth=0.015, lens='lensred', inside='taildark', mirror=False, cell=0.01)
    recess(ctx, [(-0.84, 0.21), (0.84, 0.21), (0.86, 0.40), (-0.86, 0.40)], 'rear', depth=0.04, walls='black', bottom='carbon', mirror=False, cell=0.05)
    exhaust_tips(ctx, [(0.0, 0.33, 'rect', 0.26, 0.13)], bezel=0.014, bezel_depth=0.03)
    diffuser(ctx, 0.56, 6, y_len=0.6, z_low=0.17)
    # alerón plegado sobre la tapa del motor
    wing(ctx['mb'], 0.42, 0.945, 0.36, 1.4, th=0.06, mat='carbon', angle=0.02, camber=0.02, plates=False)


def _rear_in(ctx):
    lightbar(ctx, [(0.42, 0.785), (0.82, 0.785)], 0.01, 'rear', mat='led', raise_=0.017)
    led(ctx, ellipse(0.0, 0.66, 0.06, 0.035, 28), mat='badge', raise_=0.04, mirror=False, cell=0.012)
    led(ctx, ellipse(0.0, 0.66, 0.05, 0.027, 28), mat='tail', raise_=0.042, mirror=False, cell=0.012)


def _side(ctx):
    side_windows(ctx, [(2.83, 0.87), (2.39, 1.14), (2.05, 1.17), (1.74, 1.125), (1.60, 0.99), (1.92, 0.885), (2.5, 0.87)])
    door(ctx, [(1.90, 0.88), (1.93, 0.6), (1.96, 0.30), (2.88, 0.30), (2.90, 0.6), (2.92, 0.87)], handle=(2.0, 0.84, 2.14, 0.865))
    recess(ctx, [(1.88, 0.76), (1.78, 0.83), (1.64, 0.80), (1.56, 0.66), (1.60, 0.52), (1.72, 0.46), (1.86, 0.52)], 'side', depth=0.06, walls='black',
           bottom='mesh', smooth=2, cell=0.02)
    panel(ctx, [(1.4, 0.16), (3.1, 0.16), (3.06, 0.24), (1.44, 0.25)], 'side', 'black', cell=0.04)
    mirror_part(ctx['mb'], 0.76, 2.82, 0.92, w=0.16, h=0.075, d=0.1, stalk=0.04, mat='sec')
    # las dos tomas de aire sobre el techo, detrás del habitáculo
    for sd in (1, -1):
        prism(ctx['mb'], [(1.30, 1.02), (1.72, 1.02), (1.66, 1.13), (1.40, 1.10)], 'x', sd * 0.14, sd * 0.36, 'sec', mats={'cap0': 'sec', 'cap1': 'sec'})


def _front(ctx):
    # parrilla de herradura con marco cromado
    recess(ctx, SHOE, 'front', depth=0.06, walls='chrome', bottom='mesh', mirror=False, smooth=2, cell=0.03)
    # tomas laterales redondeadas
    recess(ctx, [(0.30, 0.20), (0.62, 0.20), (0.70, 0.30), (0.62, 0.42), (0.34, 0.40)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=2, cell=0.04)
    # faros en lágrima con varias lupas
    light_unit(ctx, [(0.50, 4.30), (0.66, 4.33), (0.84, 4.27), (0.90, 4.18), (0.82, 4.12), (0.62, 4.18)], None, depth=0.05, lens='lens',
               inside='darkchrome', custom=TOPF, smooth=1, cell=0.012)


def _front_in(ctx):
    D(ctx, offset_poly(smooth_poly(SHOE, 2), -0.022), 'front', 'chrome', off=0.003, cell=0.012, mirror=False, avoid=('mesh', 'chrome'), graze=0.1)
    for (x, y) in ((0.60, 4.265), (0.68, 4.27), (0.76, 4.235), (0.83, 4.19)):
        projector(ctx, x, y, 0.024, None, custom=TOPF, h=0.012)
    lightbar(ctx, [(0.54, 4.30), (0.70, 4.315), (0.86, 4.245)], 0.006, None, mat='drl', raise_=0.04, custom=TOPF)
    led(ctx, ellipse(0.0, 0.46, 0.045, 0.024, 28), 'front', mat='badge', raise_=0.066, mirror=False, cell=0.01)
    led(ctx, ellipse(0.0, 0.46, 0.036, 0.018, 28), 'front', mat='tail', raise_=0.068, mirror=False, cell=0.01)


def _two_tone(seg, y, side):
    # la parte alta de detrás del parabrisas va en el segundo color
    return 'sec' if (y < 2.94 and seg >= 7) else None


SPEC = dict(
    id='veyron', L=L, W=1.998, color='#1d4ea8', sec='#101114',
    wheels=dict(yf=3.60, yr=0.89, r=0.333, dr=0.04, drim=0.0127, wf=0.265, wr=0.365, tf=1.715, tr=1.630, rim=0.254, arch=0.395,
                style='turbine', caliper='#d0d0d0', rim_color='#c3c7cd', lugs=5),
    body=dict(
        top=[(0.0, 0.86), (0.12, 0.89), (0.4, 0.92), (0.89, 0.935), (1.5, 0.915), (2.2, 0.88), (2.94, 0.86), (3.3, 0.815),
             (3.60, 0.77), (4.0, 0.70), (4.3, 0.62), (4.462, 0.52)],
        bottom=[(0.0, 0.21), (0.3, 0.17), (0.8, 0.13), (3.9, 0.12), (4.25, 0.14), (4.462, 0.2)],
        width=[(0.0, 0.9), (0.3, 0.97), (0.89, 0.999), (1.6, 0.98), (2.3, 0.955), (3.0, 0.96), (3.60, 0.985), (4.0, 0.95), (4.3, 0.87), (4.462, 0.72)],
        keys=[
            (0.0, [(0, 0), (0.8, 0), (0.92, 0.05), (0.965, 0.2), (0.99, 0.42), (0.99, 0.6), (0.97, 0.78), (0.93, 0.9), (0.82, 0.97), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (0.89, [(0, 0), (0.8, 0), (0.93, 0.07), (0.975, 0.2), (1.0, 0.42), (0.99, 0.6), (0.955, 0.78), (0.9, 0.9), (0.78, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (2.3, [(0, 0), (0.78, 0), (0.94, 0.08), (0.98, 0.2), (1.0, 0.38), (0.99, 0.56), (0.97, 0.74), (0.93, 0.9), (0.83, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (3.60, [(0, 0), (0.8, 0), (0.93, 0.08), (0.98, 0.22), (1.0, 0.44), (0.99, 0.62), (0.97, 0.8), (0.93, 0.93), (0.84, 1.0), (0.6, 0.97), (0.3, 0.95), (0, 0.95)]),
            (4.3, [(0, 0), (0.8, 0), (0.92, 0.1), (0.965, 0.28), (0.985, 0.48), (0.98, 0.64), (0.96, 0.8), (0.91, 0.93), (0.8, 0.99), (0.55, 1.0), (0.3, 1.0), (0, 1.0)]),
        ],
        corners=(2, 7),
        mats={0: 'under', 1: 'under'},
        mat_fn=_two_tone, rear_mat='sec',
        r_rear=0.06, r_front=0.08,
        nose=[(0.20, 0.06), (0.30, 0.02), (0.42, 0.0), (0.50, 0.03), (0.56, 0.09)], nose_zone=0.5,
        nose_x=[(0.0, 0.0), (0.3, 0.02), (0.6, 0.08), (0.9, 0.2)],
        tail=[(0.21, 0.03), (0.32, 0.0), (0.84, 0.0), (0.90, -0.02)], tail_zone=0.35,
    ),
    cabin=dict(
        y0=0.25, y1=3.08, side_mat='sec', pillar_mat='sec',
        roof=[(0.25, 0.90), (0.6, 0.94), (1.07, 1.02), (1.5, 1.12), (1.8, 1.18), (2.10, 1.204), (2.28, 1.195), (2.41, 1.16),
              (2.62, 1.04), (2.82, 0.92), (2.94, 0.85), (3.08, 0.76)],
        edge=[(0.25, 0.885), (0.6, 0.925), (1.07, 1.0), (1.5, 1.095), (1.8, 1.152), (2.10, 1.174), (2.28, 1.165), (2.41, 1.135),
              (2.62, 1.015), (2.82, 0.90), (2.94, 0.83), (3.08, 0.74)],
        belt=[(0.25, 0.86), (1.07, 0.89), (1.7, 0.885), (2.4, 0.875), (2.9, 0.865), (3.08, 0.84)],
        wb=[(0.25, 0.54), (0.9, 0.60), (1.5, 0.68), (2.1, 0.74), (2.6, 0.745), (2.94, 0.74), (3.08, 0.72)],
        wt=[(0.25, 0.44), (0.9, 0.47), (1.5, 0.51), (2.1, 0.55), (2.28, 0.555), (2.41, 0.56), (2.7, 0.64), (2.94, 0.70), (3.08, 0.71)],
        zones=[(2.41, 9, 'glass', None), (1.8, 2.41, 'sec', None), (1.6, 1.8, 'glass', None), (0, 1.6, 'sec', None)],
        ys=(2.41, 1.8, 1.6),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
