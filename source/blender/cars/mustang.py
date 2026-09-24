# Ford Mustang GT (S550, 2018-2023) — 4.789 × 1.916 × 1.381 m, batalla 2.720 m
L = 4.789
TOPF = along((0, -0.5, -0.87), zr=0.78)


def _stripes(ctx):
    # franjas dobles de competición sobre capó, techo y maletero (sin pisar los cristales)
    for x0, x1 in ((0.035, 0.26),):
        poly = [(x0, 0.0), (x1, 0.0), (x1, L), (x0, L)]
        D(ctx, poly, 'top', 'stripe', off=0.0016, cell=0.05, mirror=True, avoid=('glass', 'mesh', 'black', 'lens', 'louver'), graze=0.25)
        D(ctx, [(x0, 0.86), (x1, 0.86), (x1, 1.05), (x0, 1.05)], 'rear', 'stripe', off=0.0016, cell=0.04, mirror=True, avoid=('glass', 'black', 'mesh'), graze=0.3)
        D(ctx, [(x0, 0.645), (x1, 0.645), (x1, 0.86), (x0, 0.86)], 'front', 'stripe', off=0.0016, cell=0.04, mirror=True, avoid=('mesh', 'black'), graze=0.3)


def _rear(ctx):
    # panel negro de los pilotos a lo ancho
    recess(ctx, [(-0.86, 0.64), (0.86, 0.64), (0.875, 0.70), (0.86, 0.845), (-0.86, 0.845), (-0.875, 0.70)], 'rear', depth=0.014,
           walls='black', bottom='black', mirror=False, cell=0.05)
    # parte baja: difusor negro y hueco de los escapes (dos pares)
    recess(ctx, [(-0.70, 0.215), (0.70, 0.215), (0.76, 0.30), (-0.76, 0.30)], 'rear', depth=0.03, walls='black', bottom='matte', mirror=False, smooth=1, cell=0.05)
    exhaust_tips(ctx, [(0.53, 0.245, 'round', 0.095, 0.095), (0.645, 0.245, 'round', 0.095, 0.095)], bezel=0.012, bezel_depth=0.04)
    # hueco de la matrícula
    recess(ctx, [(-0.19, 0.40), (0.19, 0.40), (0.19, 0.56), (-0.19, 0.56)], 'rear', depth=0.012, walls='paint', bottom='paint', mirror=False, smooth=1, cell=0.05)
    # labio del spoiler «ducktail» en negro
    D(ctx, [(-0.84, -0.02), (0.84, -0.02), (0.84, 0.09), (-0.84, 0.09)], 'top', 'black', off=0.002, cell=0.03, mirror=False, avoid=('glass',), graze=0.1)


def _rear_in(ctx):
    for xc in (0.565, 0.668, 0.771):
        led(ctx, [(xc - 0.026, 0.655), (xc + 0.026, 0.655), (xc + 0.026, 0.83), (xc - 0.026, 0.83)], mat='lensred', raise_=0.011, cell=0.02, smooth=1)
        led(ctx, [(xc - 0.012, 0.67), (xc + 0.012, 0.67), (xc + 0.012, 0.815), (xc - 0.012, 0.815)], mat='led', raise_=0.013, cell=0.02, smooth=1)
    # emblema central
    led(ctx, ellipse(0.0, 0.742, 0.075, 0.045, 28), mat='badge', raise_=0.016, mirror=False, cell=0.02)
    led(ctx, ellipse(0.0, 0.742, 0.06, 0.033, 28), mat='black', raise_=0.018, mirror=False, cell=0.02)


def _side(ctx):
    side_windows(ctx, [(3.22, 0.99), (2.82, 1.30), (2.2, 1.34), (1.6, 1.265), (1.28, 1.12), (1.30, 1.01), (2.0, 0.975)])
    door(ctx, [(2.10, 0.975), (2.12, 0.62), (2.14, 0.30), (3.13, 0.30), (3.15, 0.62), (3.20, 0.985)], handle=(2.30, 0.875, 2.46, 0.905))
    panel(ctx, [(1.45, 0.19), (3.40, 0.19), (3.36, 0.27), (1.49, 0.285)], 'side', 'matte', cell=0.04)
    mirror_part(ctx['mb'], 0.80, 3.10, 1.03, w=0.17, h=0.09, d=0.1, stalk=0.02)


HL = along_y((-0.25, -0.93, -0.27), L - 0.05)     # proyector del faro (envuelve la esquina)


def _front(ctx):
    # parrilla de panal trapezoidal con las esquinas recortadas
    recess(ctx, [(-0.44, 0.36), (0.44, 0.36), (0.49, 0.42), (0.50, 0.60), (0.47, 0.645), (-0.47, 0.645), (-0.50, 0.60), (-0.49, 0.42)],
           'front', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.05)
    recess(ctx, [(-0.6, 0.23), (0.6, 0.23), (0.64, 0.31), (-0.64, 0.31)], 'front', depth=0.04, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.05)
    # faro afilado que envuelve la esquina del guardabarros
    light_unit(ctx, [(0.465, 0.70), (0.55, 0.748), (0.835, 0.805), (0.895, 0.778), (0.886, 0.705), (0.745, 0.667), (0.56, 0.664)], None,
               depth=0.045, lens='lens', inside='darkchrome', custom=HL, cell=0.012)
    # luz baja en la esquina del paragolpes
    light_unit(ctx, [(0.55, 0.305), (0.80, 0.325), (0.805, 0.352), (0.55, 0.335)], 'front', depth=0.03, lens='lens', inside='black', cell=0.012)
    # respiraderos del capó (GT)
    recess(ctx, [(0.30, 3.95), (0.46, 3.95), (0.46, 4.26), (0.30, 4.23)], 'top', depth=0.03, walls='black', bottom='mesh', smooth=1, cell=0.04)


def _front_in(ctx):
    # lupa del proyector, las tres barras LED en diagonal y el intermitente ámbar
    projector(ctx, 0.787, 0.738, 0.041, None, custom=HL, h=0.016)
    for xc in (0.57, 0.618, 0.666):
        lightbar(ctx, [(xc - 0.016, 0.688), (xc + 0.015, 0.724)], 0.011, None, mat='drl', raise_=0.034, custom=HL)
    lightbar(ctx, [(0.70, 0.681), (0.878, 0.713)], 0.009, None, mat='amber', raise_=0.03, custom=HL)
    lightbar(ctx, [(0.57, 0.322), (0.79, 0.338)], 0.01, 'front', mat='drl', raise_=0.022)
    led(ctx, ellipse(0.0, 0.50, 0.09, 0.05, 28), 'front', mat='badge', raise_=0.035, mirror=False, cell=0.02)


SPEC = dict(
    id='mustang', L=L, W=1.916, color='#1766d6', stripe='#f2f2f2',
    wheels=dict(yf=3.78, yr=1.06, r=0.343, dr=0.008, wf=0.255, wr=0.275, tf=1.582, tr=1.655, rim=0.248, arch=0.39,
                style='5', caliper='#c41a1a', rim_color='#26282c', lugs=5),
    body=dict(
        top=[(0.0, 0.975), (0.1, 1.0), (0.3, 1.02), (0.6, 1.05), (1.1, 1.0), (1.6, 0.975), (2.4, 0.965), (3.0, 1.02), (3.3, 1.05),
             (3.78, 0.96), (4.3, 0.895), (4.6, 0.86), (4.789, 0.82)],
        bottom=[(0.0, 0.20), (0.35, 0.17), (0.9, 0.145), (1.4, 0.13), (3.3, 0.13), (4.3, 0.16), (4.789, 0.21)],
        width=[(0.0, 0.86), (0.3, 0.93), (1.06, 0.958), (1.8, 0.935), (2.6, 0.915), (3.4, 0.92), (3.78, 0.935), (4.4, 0.90), (4.789, 0.80)],
        keys=[
            (0.0, [(0, 0), (0.78, 0), (0.9, 0.05), (0.96, 0.2), (0.99, 0.42), (0.99, 0.6), (0.975, 0.78), (0.94, 0.9), (0.85, 0.97), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (0.6, [(0, 0), (0.8, 0), (0.92, 0.06), (0.97, 0.2), (0.995, 0.4), (0.99, 0.58), (0.965, 0.76), (0.92, 0.9), (0.8, 0.97), (0.55, 1.0), (0.25, 1.0), (0, 1.0)]),
            (1.06, [(0, 0), (0.8, 0), (0.93, 0.07), (0.975, 0.2), (1.0, 0.4), (0.99, 0.58), (0.965, 0.76), (0.92, 0.9), (0.8, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (2.4, [(0, 0), (0.78, 0), (0.94, 0.08), (0.98, 0.2), (1.0, 0.38), (0.99, 0.56), (0.97, 0.74), (0.93, 0.9), (0.82, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
            (3.25, [(0, 0), (0.8, 0), (0.93, 0.08), (0.975, 0.2), (1.0, 0.4), (0.99, 0.56), (0.97, 0.72), (0.93, 0.84), (0.85, 0.9), (0.6, 0.955), (0.3, 0.99), (0, 1.0)]),
            (3.78, [(0, 0), (0.8, 0), (0.93, 0.08), (0.98, 0.22), (1.0, 0.42), (0.99, 0.6), (0.975, 0.78), (0.94, 0.9), (0.86, 0.94), (0.6, 0.97), (0.3, 0.99), (0, 1.0)]),
            (4.6, [(0, 0), (0.8, 0), (0.92, 0.1), (0.965, 0.28), (0.985, 0.48), (0.98, 0.64), (0.96, 0.8), (0.9, 0.9), (0.8, 0.96), (0.55, 0.99), (0.3, 1.0), (0, 1.0)]),
        ],
        corners=(2, 5, 7),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.05,
        nose=[(0.21, 0.07), (0.32, 0.02), (0.45, 0.0), (0.72, 0.0), (0.8, 0.03), (0.86, 0.08)], nose_zone=0.45,
        nose_x=[(0.0, 0.0), (0.4, 0.02), (0.7, 0.07), (0.9, 0.16)],
        tail=[(0.30, 0.04), (0.45, 0.0), (0.92, 0.0), (1.0, -0.03)], tail_zone=0.35,
    ),
    cabin=dict(
        y0=0.45, y1=3.44, pillar=0.09,
        roof=[(0.45, 1.0), (0.62, 1.07), (1.0, 1.17), (1.5, 1.28), (2.0, 1.365), (2.3, 1.381), (2.6, 1.37), (2.8, 1.33), (3.0, 1.23),
              (3.2, 1.11), (3.3, 1.05), (3.44, 0.95)],
        edge=[(0.45, 0.96), (0.62, 1.03), (1.0, 1.13), (1.5, 1.24), (2.0, 1.32), (2.3, 1.34), (2.6, 1.33), (2.8, 1.29), (3.0, 1.19),
              (3.2, 1.075), (3.3, 1.02), (3.44, 0.93)],
        belt=[(0.45, 0.98), (1.0, 0.99), (1.6, 0.965), (2.4, 0.96), (3.0, 0.975), (3.44, 0.99)],
        wb=[(0.45, 0.62), (0.8, 0.70), (1.4, 0.76), (2.2, 0.79), (2.9, 0.79), (3.44, 0.78)],
        wt=[(0.45, 0.52), (0.8, 0.56), (1.4, 0.58), (2.2, 0.60), (2.8, 0.61), (3.0, 0.67), (3.2, 0.73), (3.44, 0.76)],
        zones=[(2.8, 9, 'glass', None), (1.78, 2.8, 'paint', None), (0.62, 1.78, 'glass', None)],
        ys=(2.8, 1.78, 0.62),
    ),
    details=[_rear, _side, _front, _stripes],
    inner=[_rear_in, _front_in],
)
