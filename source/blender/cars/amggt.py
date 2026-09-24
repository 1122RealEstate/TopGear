# Mercedes-AMG GT R (C190) — 4.551 × 2.007 × 1.284 m, batalla 2.630 m
L = 4.551
HL = along_y((-0.3, -0.85, -0.43), L - 0.12)


def _rear(ctx):
    # pilotos finos que envuelven las esquinas (tres líneas LED)
    light_unit(ctx, [(0.36, 0.855), (0.80, 0.86), (0.93, 0.845), (0.945, 0.885), (0.80, 0.905), (0.40, 0.90)], 'rear', depth=0.02,
               lens='lensred', inside='taildark', cell=0.015)
    # matrícula
    recess(ctx, [(-0.26, 0.42), (0.26, 0.42), (0.26, 0.545), (-0.26, 0.545)], 'rear', depth=0.01, walls='paint', bottom='paint', mirror=False, smooth=1, cell=0.05)
    # difusor grande y rejillas laterales
    recess(ctx, [(-0.86, 0.21), (0.86, 0.21), (0.84, 0.36), (0.3, 0.37), (-0.3, 0.37), (-0.84, 0.36)], 'rear', depth=0.03, walls='black', bottom='carbon',
           mirror=False, cell=0.05)
    recess(ctx, [(0.52, 0.40), (0.86, 0.40), (0.88, 0.56), (0.62, 0.52)], 'rear', depth=0.035, walls='black', bottom='mesh', smooth=1, cell=0.04)
    # escape central doble
    exhaust_tips(ctx, [(0.075, 0.30, 'round', 0.115, 0.115)], bezel=0.012, bezel_depth=0.03)
    diffuser(ctx, 0.52, 6, y_len=0.5, z_low=0.17)
    # alerón fijo de carbono sobre dos pies
    wing(ctx['mb'], 0.30, 1.085, 0.23, 1.62, th=0.12, mat='carbon', angle=0.08, camber=0.06, plate_h=0.09, sweep=0.02)
    for sd in (1, -1):
        prism(ctx['mb'], [(0.25, 0.93), (0.14, 0.93), (0.15, 1.08), (0.23, 1.08)], 'x', sd * 0.36 - 0.008, sd * 0.36 + 0.008, 'wing_carbon')


def _rear_in(ctx):
    for dz in (0.0, 0.013, 0.026):
        lightbar(ctx, [(0.40, 0.866 + dz), (0.80, 0.871 + dz), (0.925, 0.858 + dz * 0.6)], 0.0055, 'rear', mat='led', raise_=0.016)
    led(ctx, circle_poly(0.0, 0.62, 0.045, 28), mat='badge', raise_=0.004, mirror=False)


def _side(ctx):
    side_windows(ctx, [(2.46, 0.89), (2.07, 1.20), (1.75, 1.25), (1.37, 1.19), (1.05, 1.03), (1.41, 0.935)])
    door(ctx, [(1.58, 0.93), (1.61, 0.6), (1.64, 0.30), (2.52, 0.30), (2.54, 0.6), (2.56, 0.88)], handle=(1.72, 0.86, 1.87, 0.885))
    # branquia de la aleta delantera con barra cromada
    recess(ctx, [(3.02, 0.50), (3.26, 0.52), (3.28, 0.70), (3.05, 0.68)], 'side', depth=0.035, walls='black', bottom='mesh', smooth=1, cell=0.03)
    D(ctx, strip([(3.03, 0.60), (3.28, 0.615)], 0.012), 'side', 'chrome', off=0.004, cell=0.012, avoid=(), graze=0.05)
    panel(ctx, [(1.35, 0.16), (3.1, 0.16), (3.06, 0.25), (1.39, 0.26)], 'side', 'carbon', cell=0.04)
    mirror_part(ctx['mb'], 0.78, 2.46, 0.93, w=0.16, h=0.08, d=0.1, stalk=0.03)


def _front(ctx):
    # parrilla Panamericana
    recess(ctx, [(-0.40, 0.30), (0.40, 0.30), (0.35, 0.60), (-0.35, 0.60)], 'front', depth=0.05, walls='chrome', bottom='black', mirror=False, smooth=1, cell=0.05)
    # tomas laterales con aletas
    recess(ctx, [(0.46, 0.20), (0.88, 0.22), (0.90, 0.44), (0.56, 0.42)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.04)
    D(ctx, [(-0.9, 0.16), (0.9, 0.16), (0.9, 0.185), (-0.9, 0.185)], 'front', 'carbon', off=0.002, cell=0.03, mirror=False, avoid=(), graze=0.15)
    # faros alargados sobre la esquina del capó
    light_unit(ctx, [(0.47, 0.585), (0.62, 0.60), (0.86, 0.645), (0.935, 0.665), (0.93, 0.688), (0.85, 0.683), (0.62, 0.643), (0.49, 0.616)], None,
               depth=0.05, lens='lens', inside='darkchrome', custom=HL, cell=0.012)


def _front_in(ctx):
    # lamas verticales cromadas de la Panamericana y la estrella
    for i in range(-7, 8):
        x = i * 0.047
        lightbar(ctx, [(x * 1.0, 0.31), (x * 0.88, 0.59)], 0.009, 'front', mat='chrome', raise_=0.045, mirror=False)
    led(ctx, circle_poly(0.0, 0.46, 0.075, 32), 'front', mat='badge', raise_=0.055, mirror=False, cell=0.02)
    for (x, z) in ((0.63, 0.619), (0.70, 0.629), (0.77, 0.642)):
        projector(ctx, x, z, 0.019, None, custom=HL, h=0.014)
    lightbar(ctx, [(0.50, 0.611), (0.62, 0.633), (0.85, 0.672), (0.922, 0.68)], 0.008, None, mat='drl', raise_=0.045, custom=HL)
    lightbar(ctx, [(0.55, 0.596), (0.86, 0.652)], 0.005, None, mat='amber', raise_=0.04, custom=HL)
    for i in range(4):
        x = 0.58 + i * 0.075
        lightbar(ctx, [(x, 0.225), (x + 0.02, 0.425)], 0.012, 'front', mat='black', raise_=0.04)


SPEC = dict(
    id='amggt', L=L, W=2.007, color='#6d8f1f',
    wheels=dict(yf=3.60, yr=0.97, r=0.340, dr=0.012, wf=0.275, wr=0.325, tf=1.680, tr=1.650, rim=0.25, arch=0.38,
                style='Y', caliper='#d8b400', rim_color='#2a2c30', lugs=5),
    body=dict(
        top=[(0.0, 0.93), (0.15, 0.955), (0.4, 0.96), (0.75, 0.99), (0.97, 0.975), (1.6, 0.925), (2.2, 0.885), (2.59, 0.875),
             (3.2, 0.835), (3.6, 0.795), (4.1, 0.725), (4.4, 0.66), (4.551, 0.57)],
        bottom=[(0.0, 0.21), (0.35, 0.17), (0.8, 0.13), (3.9, 0.12), (4.35, 0.14), (4.551, 0.21)],
        width=[(0.0, 0.9), (0.3, 0.975), (0.97, 1.0), (1.7, 0.975), (2.4, 0.955), (3.1, 0.96), (3.6, 0.978), (4.1, 0.95), (4.4, 0.9), (4.551, 0.8)],
        keys=[
            (0.0, [(0, 0), (0.8, 0), (0.92, 0.05), (0.965, 0.2), (0.99, 0.42), (0.99, 0.6), (0.97, 0.78), (0.93, 0.9), (0.82, 0.97), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (0.97, [(0, 0), (0.8, 0), (0.93, 0.07), (0.975, 0.2), (1.0, 0.42), (0.99, 0.6), (0.955, 0.78), (0.9, 0.9), (0.78, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (2.2, [(0, 0), (0.78, 0), (0.94, 0.08), (0.98, 0.2), (1.0, 0.38), (0.99, 0.56), (0.97, 0.74), (0.93, 0.9), (0.83, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (3.6, [(0, 0), (0.8, 0), (0.93, 0.08), (0.98, 0.22), (1.0, 0.44), (0.99, 0.62), (0.97, 0.8), (0.93, 0.93), (0.84, 1.0), (0.6, 0.98), (0.3, 0.99), (0, 1.0)]),
            (4.4, [(0, 0), (0.8, 0), (0.92, 0.1), (0.965, 0.28), (0.985, 0.48), (0.98, 0.64), (0.96, 0.8), (0.91, 0.93), (0.8, 0.99), (0.55, 1.0), (0.3, 1.0), (0, 1.0)]),
        ],
        corners=(2, 7),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.07,
        nose=[(0.20, 0.06), (0.30, 0.02), (0.42, 0.0), (0.52, 0.02), (0.6, 0.07)], nose_zone=0.5,
        nose_x=[(0.0, 0.0), (0.4, 0.03), (0.7, 0.1), (0.9, 0.2)],
        tail=[(0.21, 0.04), (0.32, 0.0), (0.90, 0.0), (0.96, -0.03)], tail_zone=0.35,
    ),
    cabin=dict(
        y0=0.60, y1=2.76, pillar=0.075,
        roof=[(0.6, 0.97), (0.73, 1.01), (1.0, 1.12), (1.37, 1.23), (1.77, 1.284), (2.0, 1.27), (2.2, 1.2), (2.4, 1.06), (2.59, 0.9), (2.76, 0.77)],
        edge=[(0.6, 0.95), (0.73, 0.985), (1.0, 1.09), (1.37, 1.20), (1.77, 1.254), (2.0, 1.24), (2.2, 1.17), (2.4, 1.035), (2.59, 0.88), (2.76, 0.75)],
        belt=[(0.6, 0.99), (1.0, 0.96), (1.5, 0.92), (2.1, 0.89), (2.59, 0.88), (2.76, 0.86)],
        wb=[(0.6, 0.62), (1.0, 0.72), (1.5, 0.77), (2.1, 0.78), (2.5, 0.77), (2.76, 0.76)],
        wt=[(0.6, 0.48), (1.0, 0.54), (1.5, 0.57), (1.9, 0.58), (2.12, 0.585), (2.35, 0.64), (2.59, 0.71), (2.76, 0.74)],
        zones=[(2.12, 9, 'glass', None), (1.45, 2.12, 'carbon', None), (0.73, 1.45, 'glass', None)],
        ys=(2.12, 1.45, 0.73),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
