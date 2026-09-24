# Ferrari F40 (1987) — 4.358 × 1.970 × 1.124 m, batalla 2.450 m
# Cuña con el morro bajo y la toma de lado a lado, faros tras cubiertas en las esquinas, dos NACA en el
# capó, tomas en las puertas y aletas traseras, tapa del motor de lamas, alerón integrado de lado a lado,
# cuatro pilotos redondos y tres escapes en el centro.
L = 4.358

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.28), (0.80, 0.28), (0.92, 0.32), (0.955, 0.42), (0.965, 0.56), (0.96, 0.70), (0.945, 0.80), (0.91, 0.87), (0.82, 0.90),
           (0.62, 0.905), (0.30, 0.905), (0, 0.905)]),
    (1.0, [(0, 0.14), (0.86, 0.14), (0.975, 0.20), (0.995, 0.32), (0.998, 0.46), (0.99, 0.60), (0.97, 0.74), (0.93, 0.86), (0.85, 0.94),
           (0.66, 0.965), (0.33, 0.965), (0, 0.965)]),
    (1.8, [(0, 0.12), (0.84, 0.12), (0.955, 0.17), (0.975, 0.28), (0.975, 0.42), (0.965, 0.56), (0.945, 0.68), (0.91, 0.78), (0.84, 0.85),
           (0.66, 0.875), (0.33, 0.875), (0, 0.875)]),
    (2.5, [(0, 0.12), (0.82, 0.12), (0.93, 0.16), (0.955, 0.26), (0.955, 0.40), (0.945, 0.54), (0.925, 0.65), (0.89, 0.74), (0.82, 0.80),
           (0.64, 0.82), (0.32, 0.82), (0, 0.82)]),
    (3.45, [(0, 0.13), (0.86, 0.13), (0.965, 0.19), (0.985, 0.30), (0.99, 0.42), (0.98, 0.54), (0.955, 0.64), (0.91, 0.72), (0.83, 0.77),
            (0.66, 0.765), (0.33, 0.74), (0, 0.735)]),
    (4.0, [(0, 0.15), (0.82, 0.15), (0.92, 0.19), (0.95, 0.27), (0.955, 0.36), (0.945, 0.45), (0.92, 0.53), (0.87, 0.59), (0.78, 0.62),
           (0.60, 0.61), (0.30, 0.585), (0, 0.58)]),
    (4.358, [(0, 0.17), (0.66, 0.17), (0.76, 0.20), (0.80, 0.26), (0.805, 0.32), (0.79, 0.38), (0.75, 0.43), (0.68, 0.46), (0.56, 0.475),
             (0.40, 0.475), (0.20, 0.47), (0, 0.47)]),
])


def _rear(ctx):
    mb = ctx['mb']
    # rejilla negra entre los cuatro pilotos redondos, tres escapes centrales y difusor
    recess(ctx, [(-0.66, 0.48), (0.66, 0.48), (0.66, 0.80), (-0.66, 0.80)], 'rear', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.04)
    for x in (0.735, 0.87):
        light_unit(ctx, circle_poly(x, 0.70, 0.058, 32), 'rear', depth=0.03, lens='lensred', inside='taildark', cell=0.015)
    exhaust_tips(ctx, [(0.0, 0.39, 'round', 0.085, 0.085), (0.105, 0.39, 'round', 0.085, 0.085)], bezel=0.008, bezel_depth=0.02)
    recess(ctx, [(-0.86, 0.29), (0.86, 0.29), (0.86, 0.34), (-0.86, 0.34)], 'rear', depth=0.03, walls='black', bottom='black', mirror=False, cell=0.04)
    diffuser(ctx, 0.5, 5, y_len=0.5, z_low=0.18)
    # alerón integrado: sus placas son la prolongación de las aletas
    wing(mb, 0.40, 1.07, 0.32, 1.88, th=0.07, mat='paint', angle=0.04, camber=0.04, plate_h=0.16, sweep=0.0)


def _rear_in(ctx):
    for x in (0.735, 0.87):
        led(ctx, circle_poly(x, 0.70, 0.047, 28), mat='led', raise_=0.022, cell=0.012)


def _side(ctx):
    side_windows(ctx, [(2.88, 0.82), (2.52, 1.06), (2.15, 1.09), (1.90, 1.03), (1.95, 0.88), (2.5, 0.84)])
    door(ctx, [(1.90, 0.84), (1.92, 0.6), (1.95, 0.30), (2.92, 0.30), (2.94, 0.6), (2.97, 0.80)], handle=(2.0, 0.78, 2.12, 0.80))
    # NACA de la puerta y gran toma de la aleta trasera
    recess(ctx, [(2.55, 0.52), (2.28, 0.545), (2.28, 0.60), (2.55, 0.58)], 'side', depth=0.035, walls='black', bottom='black', smooth=1, cell=0.012)
    recess(ctx, [(1.30, 0.76), (1.74, 0.80), (1.74, 0.90), (1.36, 0.88)], 'side', depth=0.06, walls='black', bottom='mesh', smooth=1, cell=0.02)
    panel(ctx, [(1.3, 0.15), (3.1, 0.15), (3.06, 0.23), (1.34, 0.24)], 'side', 'black', cell=0.04)
    mirror_part(ctx['mb'], 0.74, 2.86, 0.88, w=0.13, h=0.065, d=0.09, stalk=0.04)


def _front(ctx):
    recess(ctx, [(-0.56, 0.20), (0.56, 0.20), (0.52, 0.31), (-0.52, 0.31)], 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.03)
    recess(ctx, [(0.62, 0.20), (0.76, 0.21), (0.76, 0.27), (0.62, 0.27)], 'front', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.015)
    # faros tras cubiertas transparentes en las esquinas del morro
    light_unit(ctx, [(0.48, 0.345), (0.76, 0.315), (0.785, 0.365), (0.52, 0.415)], 'front', depth=0.04, lens='lens', inside='black', smooth=1, cell=0.01)
    # dos NACA en el capó
    recess(ctx, [(0.10, 3.60), (0.30, 3.60), (0.24, 3.92), (0.17, 3.92)], 'top', depth=0.035, walls='black', bottom='black', smooth=1, cell=0.012)


def _front_in(ctx):
    projector(ctx, 0.58, 0.37, 0.032, 'front', h=0.02)
    projector(ctx, 0.70, 0.35, 0.028, 'front', h=0.02)
    led(ctx, [(0.0, 0.41), (0.022, 0.43), (0.022, 0.46), (0.0, 0.47), (-0.022, 0.46), (-0.022, 0.43)], 'front', mat='c_f2c400', raise_=0.003,
        mirror=False, cell=0.006)


SPEC = dict(
    id='f40', L=L, W=1.970, color='#c8101a',
    wheels=dict(yf=3.45, yr=1.00, r=0.314, dr=0.019, drim=0.0, wf=0.245, wr=0.335, tf=1.594, tr=1.606, rim=0.216, arch=0.36,
                style='star', caliper='#c41a1a', rim_color='#aeb2b8', lock=True),
    body=dict(
        top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS,
        corners=(2, 7),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.06,
        nose=[(0.17, 0.02), (0.26, 0.0), (0.36, 0.03), (0.47, 0.10)], nose_zone=0.45,
        nose_x=[(0.0, 0.0), (0.4, 0.03), (0.7, 0.12), (0.8, 0.2)],
        tail=[(0.28, 0.03), (0.40, 0.0), (0.90, 0.0)], tail_zone=0.3,
    ),
    cabin=dict(
        y0=0.9, y1=3.1,
        roof=[(0.9, 0.95), (1.2, 0.99), (1.6, 1.05), (1.95, 1.10), (2.25, 1.124), (2.45, 1.115), (2.65, 1.06), (2.85, 0.95), (3.0, 0.83), (3.1, 0.74)],
        edge=[(0.9, 0.93), (1.2, 0.97), (1.6, 1.03), (1.95, 1.075), (2.25, 1.10), (2.45, 1.09), (2.65, 1.035), (2.85, 0.93), (3.0, 0.815), (3.1, 0.73)],
        belt=[(0.9, 0.92), (1.5, 0.90), (2.2, 0.84), (2.8, 0.82), (3.0, 0.78), (3.1, 0.72)],
        wb=[(0.9, 0.46), (1.4, 0.58), (1.9, 0.66), (2.4, 0.70), (2.8, 0.68), (3.1, 0.60)],
        wt=[(0.9, 0.32), (1.4, 0.44), (1.9, 0.52), (2.3, 0.55), (2.6, 0.55), (2.85, 0.52), (3.1, 0.46)],
        zones=[(2.55, 9, 'glass', None), (1.95, 2.55, 'paint', None), (1.72, 1.95, 'glass', None), (0, 1.72, 'louver', None)],
        ys=(2.55, 1.95, 1.72),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
