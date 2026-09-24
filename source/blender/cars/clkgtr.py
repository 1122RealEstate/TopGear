# Mercedes-Benz CLK GTR Roadster (2002) — 4.855 × 1.951 × 1.16 m, batalla 2.67 m
# Barchetta de GT1: frontal con la estrella en la parrilla y los cuatro faros redondos, grandes tomas,
# habitáculo abierto con parabrisas y dos arcos carenados, gran alerón sobre soportes; plata.
L = 4.855

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.26), (0.78, 0.26), (0.90, 0.30), (0.935, 0.40), (0.945, 0.52), (0.94, 0.62), (0.925, 0.71), (0.89, 0.78), (0.80, 0.82),
           (0.60, 0.83), (0.30, 0.83), (0, 0.83)]),
    (0.98, [(0, 0.13), (0.86, 0.13), (0.97, 0.19), (0.995, 0.31), (0.999, 0.44), (0.995, 0.56), (0.98, 0.67), (0.95, 0.76), (0.88, 0.83),
            (0.68, 0.85), (0.34, 0.85), (0, 0.85)]),
    (2.0, [(0, 0.12), (0.84, 0.12), (0.95, 0.17), (0.975, 0.28), (0.975, 0.41), (0.965, 0.53), (0.945, 0.63), (0.91, 0.71), (0.84, 0.76),
           (0.64, 0.78), (0.32, 0.78), (0, 0.78)]),
    (2.9, [(0, 0.12), (0.84, 0.12), (0.95, 0.17), (0.97, 0.28), (0.97, 0.41), (0.96, 0.53), (0.94, 0.63), (0.90, 0.71), (0.83, 0.76),
           (0.64, 0.765), (0.32, 0.76), (0, 0.76)]),
    (3.65, [(0, 0.13), (0.86, 0.13), (0.97, 0.19), (0.995, 0.31), (1.0, 0.44), (0.99, 0.56), (0.97, 0.66), (0.93, 0.74), (0.85, 0.79),
            (0.66, 0.77), (0.33, 0.73), (0, 0.72)]),
    (4.3, [(0, 0.14), (0.84, 0.14), (0.95, 0.19), (0.975, 0.30), (0.98, 0.41), (0.97, 0.52), (0.945, 0.61), (0.90, 0.68), (0.82, 0.72),
           (0.64, 0.69), (0.32, 0.64), (0, 0.63)]),
    (4.855, [(0, 0.16), (0.70, 0.16), (0.80, 0.19), (0.845, 0.26), (0.86, 0.34), (0.85, 0.42), (0.82, 0.49), (0.76, 0.54), (0.66, 0.565),
             (0.50, 0.56), (0.25, 0.54), (0, 0.535)]),
])


def _rear(ctx):
    mb = ctx['mb']
    light_unit(ctx, [(0.52, 0.68), (0.88, 0.68), (0.89, 0.75), (0.54, 0.76)], 'rear', depth=0.02, lens='lensred', inside='taildark', smooth=1, cell=0.01)
    recess(ctx, [(-0.86, 0.26), (0.86, 0.26), (0.86, 0.44), (-0.86, 0.44)], 'rear', depth=0.04, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.12, 0.35, 'round', 0.1, 0.1)], bezel=0.008, bezel_depth=0.02)
    diffuser(ctx, 0.6, 7, y_len=0.55, z_low=0.16)
    wing(mb, 0.40, 1.08, 0.34, 1.80, th=0.08, mat='carbon', angle=0.1, camber=0.06, plate_h=0.20)
    prism(mb, [(0.34, 0.84), (0.14, 0.84), (0.12, 1.08), (0.28, 1.09)], 'x', 0.36, 0.378, 'wing_carbon', mirror=True)


def _rear_in(ctx):
    lightbar(ctx, [(0.56, 0.715), (0.86, 0.713)], 0.02, 'rear', mat='led', raise_=0.012)


def _side(ctx):
    mb = ctx['mb']
    open_cockpit(ctx, 1.62, 2.74, 0.62, depth=0.36, seats=(0.31,), wheel_y=2.50)
    # arcos antivuelco carenados tras cada asiento
    for sd in (1, -1):
        prism(mb, [(0.95, 0.80), (1.64, 0.80), (1.60, 1.04), (1.44, 1.07), (1.15, 0.92)], 'x', sd * 0.31 - 0.17, sd * 0.31 + 0.17, 'paint', smooth=True)
    door(ctx, [(2.0, 0.76), (2.02, 0.5), (2.06, 0.26), (3.05, 0.26), (3.07, 0.5), (3.10, 0.74)])
    recess(ctx, [(1.98, 0.70), (1.52, 0.74), (1.42, 0.50), (1.70, 0.36), (1.98, 0.42)], 'side', depth=0.07, walls='black', bottom='mesh', smooth=2, cell=0.02)
    panel(ctx, [(1.3, 0.14), (3.2, 0.14), (3.15, 0.24), (1.34, 0.25)], 'side', 'carbon', cell=0.04)
    mirror_part(mb, 0.84, 3.02, 0.84, w=0.13, h=0.06, d=0.08, stalk=0.05, mat='paint')


def _front(ctx):
    recess(ctx, [(-0.22, 0.30), (0.22, 0.30), (0.25, 0.37), (0.22, 0.45), (-0.22, 0.45), (-0.25, 0.37)], 'front', depth=0.05, walls='chrome',
           bottom='mesh', mirror=False, smooth=1, cell=0.015)
    recess(ctx, [(0.30, 0.17), (0.80, 0.19), (0.84, 0.31), (0.34, 0.29)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    light_unit(ctx, [(0.36, 0.39), (0.66, 0.36), (0.72, 0.42), (0.62, 0.48), (0.40, 0.48)], 'front', depth=0.035, lens='lens', inside='darkchrome',
               smooth=1, cell=0.01)
    recess(ctx, [(0.20, 3.95), (0.42, 3.95), (0.40, 4.20), (0.22, 4.20)], 'top', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.015)


def _front_in(ctx):
    projector(ctx, 0.46, 0.44, 0.042, 'front', h=0.02, ring=0.01)
    projector(ctx, 0.60, 0.42, 0.038, 'front', h=0.02, ring=0.01)
    # la estrella en el centro de la parrilla
    c = (0.0, 0.375)
    D(ctx, strip(circle_poly(c[0], c[1], 0.055, 24) + [(c[0] + 0.055, c[1])], 0.008), 'front', 'chrome', off=0.003, cell=0.004, mirror=False,
      avoid=(), graze=0.05, raise_=0.05)
    for a in (90, 210, 330):
        r = math.radians(a)
        D(ctx, strip([c, (c[0] + math.cos(r) * 0.05, c[1] + math.sin(r) * 0.05)], 0.008), 'front', 'chrome', off=0.003, cell=0.004,
          mirror=False, avoid=(), graze=0.05, raise_=0.05)


SPEC = dict(
    id='clkgtr', L=L, W=1.951, color='#c0c4ca', sec='#16181c',
    wheels=dict(yf=3.65, yr=0.98, r=0.335, dr=0.012, wf=0.265, wr=0.325, tf=1.64, tr=1.62, rim=0.2286, arch=0.37,
                style='mesh', caliper='#c41a1a', rim_color='#c9ccd1', lock=True),
    body=dict(top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS, corners=(2, 7), mats={0: 'under', 1: 'under'}, r_rear=0.05, r_front=0.06,
              nose=[(0.16, 0.0), (0.30, 0.02), (0.45, 0.09), (0.56, 0.2)], nose_zone=0.6,
              nose_x=[(0.0, 0.0), (0.4, 0.04), (0.7, 0.14), (0.86, 0.28)],
              tail=[(0.26, 0.04), (0.36, 0.0), (0.83, 0.0)], tail_zone=0.3),
    cabin=dict(
        y0=2.60, y1=3.02, side_mat='hidden', pillar_mat='glass',
        roof=[(2.60, 1.10), (2.72, 1.09), (2.86, 0.96), (3.02, 0.74)],
        edge=[(2.60, 1.095), (2.72, 1.082), (2.86, 0.952), (3.02, 0.735)],
        belt=[(2.60, 0.78), (3.02, 0.76)],
        wb=[(2.60, 0.62), (3.02, 0.62)],
        wt=[(2.60, 0.58), (3.02, 0.58)],
        zones=[(0, 9, 'glass', None)],
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
