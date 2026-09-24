# Nissan GT-R Nismo (R35, 2020) — 4.690 × 1.895 × 1.370 m, batalla 2.780 m
L = 4.69
HL = along((0, -0.62, -0.78), zr=0.72)             # faro: sobre la esquina del capó y la aleta


def _rear(ctx):
    # cuatro pilotos redondos (dos por lado)
    for (x, r) in ((0.50, 0.085), (0.72, 0.10)):
        light_unit(ctx, circle_poly(x, 0.84, r, 36), 'rear', depth=0.03, lens='lensred', inside='taildark', cell=0.02)
    # hueco de la matrícula
    recess(ctx, [(-0.29, 0.56), (0.29, 0.56), (0.29, 0.675), (-0.29, 0.675)], 'rear', depth=0.008, walls='paint', bottom='paint', mirror=False, smooth=1, cell=0.05)
    # difusor negro bajo la línea roja Nismo en V
    recess(ctx, [(-0.84, 0.21), (0.84, 0.21), (0.80, 0.37), (0.3, 0.35), (0.0, 0.31), (-0.3, 0.35), (-0.80, 0.37)], 'rear', depth=0.02,
           walls='carbon', bottom='carbon', mirror=False, cell=0.05)
    D(ctx, strip([(-0.80, 0.372), (-0.3, 0.352), (0.0, 0.312), (0.3, 0.352), (0.80, 0.372)], 0.012), 'rear', 'stripe', off=0.002, cell=0.02, mirror=False, avoid=(), graze=0.1)
    exhaust_tips(ctx, [(0.585, 0.285, 'round', 0.15, 0.15), (0.765, 0.285, 'round', 0.15, 0.15)], bezel=0.012, bezel_depth=0.04)
    diffuser(ctx, 0.42, 5, y_len=0.55, z_low=0.18)
    # alerón de carbono con dos pies
    wing(ctx['mb'], 0.30, 1.13, 0.27, 1.58, th=0.12, mat='carbon', angle=0.1, camber=0.06, plate_h=0.1, sweep=0.03, dihedral=0.012)
    for sd in (1, -1):
        prism(ctx['mb'], [(0.24, 1.035), (0.10, 1.035), (0.13, 1.128), (0.22, 1.128)], 'x', sd * 0.30 - 0.008, sd * 0.30 + 0.008, 'wing_carbon')


def _rear_in(ctx):
    for (x, r) in ((0.50, 0.085), (0.72, 0.10)):
        # aro LED y centro oscuro
        ring = circle_poly(x, 0.84, r * 0.78, 36) + circle_poly(x, 0.84, r * 0.52, 36)[::-1]
        led(ctx, circle_poly(x, 0.84, r * 0.78, 36), mat='led', raise_=0.026, cell=0.02)
        led(ctx, circle_poly(x, 0.84, r * 0.5, 36), mat='taildark', raise_=0.029, cell=0.02)
    led(ctx, ellipse(0.0, 0.33, 0.035, 0.018, 20), mat='led', raise_=0.004, mirror=False)
    led(ctx, circle_poly(0.0, 0.95, 0.045, 28), mat='badge', raise_=0.006, mirror=False)
    led(ctx, circle_poly(0.0, 0.95, 0.032, 28), mat='black', raise_=0.008, mirror=False)


def _side(ctx):
    side_windows(ctx, [(3.00, 0.99), (2.55, 1.30), (2.05, 1.345), (1.55, 1.30), (1.18, 1.10), (1.30, 1.02), (1.50, 0.995), (2.3, 0.985)])
    door(ctx, [(1.96, 0.98), (1.99, 0.62), (2.02, 0.33), (2.98, 0.33), (3.0, 0.62), (3.02, 0.975)], handle=(2.10, 0.905, 2.28, 0.93))
    # respiradero de la aleta delantera
    recess(ctx, [(3.14, 0.54), (3.30, 0.56), (3.33, 0.80), (3.18, 0.80)], 'side', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.03)
    panel(ctx, [(1.45, 0.17), (3.35, 0.17), (3.32, 0.30), (1.48, 0.31)], 'side', 'carbon', cell=0.04)
    D(ctx, strip([(1.48, 0.20), (3.33, 0.20)], 0.01), 'side', 'stripe', off=0.0026, cell=0.02, avoid=(), graze=0.1)
    mirror_part(ctx['mb'], 0.80, 3.0, 1.03, w=0.17, h=0.09, d=0.1, stalk=0.02)


def _front(ctx):
    # parrilla «V-motion» (más ancha abajo) con la V de cromo oscuro encima
    g = [(-0.43, 0.29), (0.43, 0.29), (0.37, 0.58), (-0.37, 0.58)]
    recess(ctx, g, 'front', depth=0.05, walls='darkchrome', bottom='mesh', mirror=False, smooth=1, cell=0.05)
    D(ctx, strip([(-0.40, 0.60), (0.0, 0.575), (0.40, 0.60)], 0.02), 'front', 'darkchrome', off=0.003, cell=0.02, mirror=False, avoid=(), graze=0.1)
    # tomas de las esquinas y labio de carbono con la línea roja
    recess(ctx, [(0.55, 0.25), (0.82, 0.27), (0.85, 0.46), (0.62, 0.45)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.04)
    D(ctx, [(-0.84, 0.19), (0.84, 0.19), (0.84, 0.215), (-0.84, 0.215)], 'front', 'carbon', off=0.002, cell=0.03, mirror=False, avoid=(), graze=0.15)
    D(ctx, strip([(-0.82, 0.22), (0.82, 0.22)], 0.01), 'front', 'stripe', off=0.003, cell=0.02, mirror=False, avoid=(), graze=0.15)
    # faro afilado con tres lupas, sobre la esquina del frontal
    light_unit(ctx, [(0.44, 4.61), (0.62, 4.585), (0.83, 4.50), (0.905, 4.40), (0.885, 4.33), (0.72, 4.43), (0.50, 4.55)], None,
               depth=0.05, lens='lens', inside='darkchrome', custom=HL, cell=0.014)


def _front_in(ctx):
    for (x, y) in ((0.585, 4.545), (0.675, 4.515), (0.765, 4.475)):
        projector(ctx, x, y, 0.027, None, custom=HL, h=0.016)
    # tira LED en zigzag («rayo») junto al borde delantero del faro
    lightbar(ctx, [(0.47, 4.585), (0.60, 4.57), (0.66, 4.555), (0.72, 4.54), (0.87, 4.44)], 0.009, None, mat='drl', raise_=0.04, custom=HL)
    # DRL vertical en «bumerán» junto a la toma
    lightbar(ctx, [(0.84, 0.45), (0.86, 0.35), (0.84, 0.28)], 0.012, 'front', mat='drl', raise_=0.03)
    led(ctx, circle_poly(0.0, 0.50, 0.05, 28), 'front', mat='badge', raise_=0.052, mirror=False, cell=0.02)


SPEC = dict(
    id='gtr', L=L, W=1.895, color='#e8eaed', stripe='#d0121b',
    wheels=dict(yf=3.81, yr=1.03, r=0.355, wf=0.255, wr=0.285, tf=1.600, tr=1.600, rim=0.262, arch=0.395,
                style='6', caliper='#d01e1e', rim_color='#2c2e33', lugs=5),
    body=dict(
        top=[(0.0, 1.03), (0.25, 1.045), (0.6, 1.06), (1.03, 1.02), (1.6, 0.99), (2.4, 0.98), (3.0, 0.985), (3.2, 0.985),
             (3.81, 0.905), (4.3, 0.83), (4.55, 0.79), (4.69, 0.745)],
        bottom=[(0.0, 0.20), (0.35, 0.17), (0.8, 0.14), (1.4, 0.13), (3.4, 0.13), (4.3, 0.15), (4.69, 0.20)],
        width=[(0.0, 0.86), (0.3, 0.925), (1.03, 0.948), (1.8, 0.93), (2.6, 0.925), (3.4, 0.935), (3.81, 0.945), (4.35, 0.91), (4.69, 0.79)],
        keys=[
            (0.0, [(0, 0), (0.8, 0), (0.92, 0.05), (0.965, 0.2), (0.99, 0.42), (0.99, 0.6), (0.975, 0.78), (0.94, 0.9), (0.84, 0.97), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (0.6, [(0, 0), (0.8, 0), (0.92, 0.06), (0.97, 0.2), (0.995, 0.42), (0.99, 0.6), (0.97, 0.78), (0.93, 0.9), (0.82, 0.975), (0.55, 1.0), (0.25, 1.0), (0, 1.0)]),
            (1.03, [(0, 0), (0.8, 0), (0.93, 0.07), (0.975, 0.2), (1.0, 0.42), (0.995, 0.6), (0.97, 0.78), (0.93, 0.9), (0.82, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (2.4, [(0, 0), (0.78, 0), (0.94, 0.08), (0.98, 0.2), (1.0, 0.4), (0.995, 0.58), (0.975, 0.76), (0.94, 0.9), (0.84, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (3.2, [(0, 0), (0.8, 0), (0.93, 0.08), (0.975, 0.2), (1.0, 0.4), (0.99, 0.58), (0.975, 0.76), (0.94, 0.9), (0.85, 0.97), (0.6, 0.985), (0.3, 1.0), (0, 1.0)]),
            (3.81, [(0, 0), (0.8, 0), (0.93, 0.08), (0.98, 0.22), (1.0, 0.44), (0.99, 0.62), (0.975, 0.8), (0.94, 0.93), (0.85, 1.0), (0.62, 0.965), (0.3, 0.95), (0, 0.945)]),
            (4.55, [(0, 0), (0.8, 0), (0.92, 0.1), (0.965, 0.28), (0.985, 0.48), (0.98, 0.64), (0.96, 0.8), (0.91, 0.93), (0.8, 0.99), (0.55, 0.99), (0.3, 1.0), (0, 1.0)]),
        ],
        corners=(2, 5, 7),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.06,
        nose=[(0.20, 0.06), (0.30, 0.02), (0.45, 0.0), (0.62, 0.02), (0.72, 0.07), (0.8, 0.16)], nose_zone=0.5,
        nose_x=[(0.0, 0.0), (0.4, 0.03), (0.7, 0.09), (0.9, 0.18)],
        tail=[(0.30, 0.03), (0.45, 0.0), (0.98, 0.0), (1.04, -0.02)], tail_zone=0.35,
    ),
    cabin=dict(
        y0=0.50, y1=3.22, pillar=0.085,
        roof=[(0.5, 1.02), (0.62, 1.08), (1.1, 1.20), (1.55, 1.30), (2.06, 1.365), (2.3, 1.37), (2.53, 1.33), (2.75, 1.21),
              (2.95, 1.07), (3.05, 1.0), (3.22, 0.88)],
        edge=[(0.5, 0.99), (0.62, 1.045), (1.1, 1.165), (1.55, 1.265), (2.06, 1.33), (2.3, 1.335), (2.53, 1.295), (2.75, 1.18),
              (2.95, 1.045), (3.05, 0.98), (3.22, 0.86)],
        belt=[(0.5, 1.03), (1.2, 1.0), (1.6, 0.985), (2.4, 0.975), (2.9, 0.975), (3.22, 0.96)],
        wb=[(0.5, 0.64), (1.0, 0.72), (1.6, 0.78), (2.4, 0.795), (2.9, 0.79), (3.22, 0.78)],
        wt=[(0.5, 0.52), (1.0, 0.56), (1.6, 0.6), (2.3, 0.62), (2.53, 0.62), (2.8, 0.68), (3.05, 0.74), (3.22, 0.76)],
        zones=[(2.53, 9, 'glass', None), (1.6, 2.53, 'carbon', None), (0.62, 1.6, 'glass', None)],
        ys=(2.53, 1.6, 0.62),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
