# Porsche 911 GT3 RS (992) — 4.572 × 1.900 × 1.322 m, batalla 2.457 m
# Carrocería del 992 con el alerón de cuello de cisne, las dos tomas del capó, rejillas sobre las
# ruedas delanteras, salida de aire tras el paso de rueda, rótulo «GT3 RS» rojo y llantas rojas.
L = 4.535
TOPF = along((0, -0.55, -0.83), zr=0.74)
RED = 'c_d0202a'


def _rear(ctx):
    mb = ctx['mb']
    bar = [(-0.90, 0.772), (0.90, 0.772), (0.915, 0.80), (0.90, 0.823), (-0.90, 0.823), (-0.915, 0.80)]
    light_unit(ctx, bar, 'rear', depth=0.018, lens='lensred', inside='taildark', mirror=False, cell=0.02)
    # parte baja negra con la rejilla y el difusor; dos escapes redondos en el centro
    recess(ctx, [(-0.86, 0.22), (0.86, 0.22), (0.86, 0.42), (0.35, 0.44), (-0.35, 0.44), (-0.86, 0.42)], 'rear', depth=0.035,
           walls='black', bottom='mesh', mirror=False, cell=0.04)
    exhaust_tips(ctx, [(0.085, 0.33, 'round', 0.095, 0.095)], bezel=0.01, bezel_depth=0.03)
    diffuser(ctx, 0.62, 7, y_len=0.5, z_low=0.16)
    # alerón gigante sobre dos cuellos de cisne que salen de la tapa del motor
    wing(mb, 0.52, 1.30, 0.38, 1.70, th=0.10, mat='carbon', angle=0.1, camber=0.07, plate_h=0.22, sweep=0.02)
    neck = [(0.84, 0.95), (0.64, 0.95), (0.52, 1.12), (0.44, 1.30), (0.38, 1.345), (0.28, 1.335), (0.24, 1.35), (0.30, 1.43), (0.44, 1.45),
            (0.56, 1.38), (0.70, 1.18), (0.80, 1.02)]
    prism(mb, smooth_poly(neck, 1), 'x', 0.29, 0.31, 'wing_carbon', mirror=True)


def _rear_in(ctx):
    lightbar(ctx, [(-0.88, 0.797), (0.88, 0.797)], 0.008, 'rear', mat='led', raise_=0.014, mirror=False)
    for x in (0.80, 0.86):
        lightbar(ctx, [(x, 0.78), (x, 0.815)], 0.01, 'rear', mat='led', raise_=0.015)


def _side(ctx):
    side_windows(ctx, [(2.78, 0.89), (2.44, 1.22), (2.05, 1.28), (1.6, 1.23), (1.3, 1.08), (1.45, 0.94), (2.1, 0.905)])
    door(ctx, [(1.72, 0.9), (1.74, 0.6), (1.77, 0.32), (2.80, 0.32), (2.81, 0.6), (2.83, 0.88)], handle=(1.80, 0.845, 1.95, 0.87))
    recess(ctx, [(1.24, 0.64), (1.55, 0.70), (1.56, 0.80), (1.28, 0.78)], 'side', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.03)
    # salida de aire vertical detrás de la rueda delantera
    recess(ctx, [(3.12, 0.46), (3.25, 0.50), (3.27, 0.78), (3.14, 0.76)], 'side', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    panel(ctx, [(1.45, 0.17), (3.08, 0.17), (3.05, 0.26), (1.48, 0.27)], 'side', 'carbon', cell=0.04)
    side_stripe(ctx, [(1.45, 0.295), (3.05, 0.295)], 0.022, RED)
    number(ctx, 'GT3 RS', 2.25, 0.47, 0.105, 'side', mat=RED, slant=0.22)
    mirror_part(ctx['mb'], 0.73, 2.72, 0.93, w=0.15, h=0.075, d=0.09, stalk=0.05, mat='paint')
    # rejillas sobre los pasos de rueda delanteros
    recess(ctx, [(0.56, 3.30), (0.86, 3.32), (0.86, 3.72), (0.58, 3.70)], 'top', depth=0.03, walls='black', bottom='black', smooth=1, cell=0.02)


def _front(ctx):
    # gran toma central y tomas laterales; splitter de carbono
    recess(ctx, [(-0.36, 0.20), (0.36, 0.20), (0.40, 0.34), (-0.40, 0.34)], 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.04)
    recess(ctx, [(0.48, 0.20), (0.86, 0.22), (0.88, 0.44), (0.52, 0.42)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.04)
    D(ctx, [(-0.92, 0.13), (0.92, 0.13), (0.92, 0.16), (-0.92, 0.16)], 'front', 'carbon', off=0.002, cell=0.03, mirror=False, avoid=(), graze=0.15)
    light_unit(ctx, [(0.52, 0.465), (0.84, 0.47), (0.845, 0.49), (0.52, 0.487)], 'front', depth=0.015, lens='lens', inside='black', cell=0.012)
    light_unit(ctx, ellipse(0.62, 4.30, 0.125, 0.15, 36), None, depth=0.05, lens='lens', inside='darkchrome', custom=TOPF, cell=0.014)
    # las dos «narices» del capó (salida del radiador central)
    recess(ctx, [(0.10, 4.02), (0.40, 3.98), (0.44, 4.18), (0.14, 4.24)], 'top', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)


def _front_in(ctx):
    projector(ctx, 0.62, 4.30, 0.045, None, custom=TOPF, h=0.016)
    for (dx, dy) in ((-0.07, 0.07), (0.07, 0.07), (-0.07, -0.07), (0.07, -0.07)):
        lightbar(ctx, [(0.62 + dx * 0.9 - 0.012, 4.30 + dy), (0.62 + dx * 0.9 + 0.012, 4.30 + dy)], 0.012, None, mat='drl', raise_=0.042, custom=TOPF)
    lightbar(ctx, [(0.53, 0.476), (0.83, 0.48)], 0.007, 'front', mat='amber', raise_=0.012)
    led(ctx, [(0.0, 0.64), (0.03, 0.66), (0.03, 0.70), (0.0, 0.71), (-0.03, 0.70), (-0.03, 0.66)], 'front', mat='badge', raise_=0.004, mirror=False)
    for y in (3.36, 3.42, 3.48, 3.54, 3.60, 3.66):
        lightbar(ctx, [(0.58, y), (0.85, y + 0.01)], 0.02, 'top', mat='carbon', raise_=0.02)
    for x in (0.2, 0.34, 0.48, 0.62):              # aletas verticales del splitter
        prism(ctx['mb'], [(4.30, 0.13), (4.52, 0.13), (4.50, 0.22), (4.36, 0.24)], 'x', x - 0.004, x + 0.004, 'carbon', mirror=True)


B = dict(
    top=[(0.0, 0.83), (0.12, 0.875), (0.35, 0.90), (0.8, 0.935), (1.1, 0.945), (1.6, 0.915), (2.2, 0.875), (2.86, 0.865),
         (3.2, 0.835), (3.55, 0.835), (4.0, 0.785), (4.3, 0.72), (4.535, 0.62)],
    bottom=[(0.0, 0.22), (0.35, 0.18), (0.9, 0.13), (3.9, 0.12), (4.3, 0.14), (4.535, 0.22)],
    width=[(0.0, 0.86), (0.35, 0.93), (1.1, 0.95), (1.8, 0.92), (2.6, 0.9), (3.2, 0.91), (3.55, 0.935), (4.0, 0.90), (4.3, 0.85), (4.535, 0.75)],
    keys=[
        (0.0, [(0, 0), (0.8, 0), (0.92, 0.05), (0.965, 0.2), (0.99, 0.42), (0.99, 0.6), (0.97, 0.78), (0.92, 0.9), (0.8, 0.97), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
        (1.1, [(0, 0), (0.8, 0), (0.93, 0.07), (0.975, 0.2), (1.0, 0.42), (0.99, 0.6), (0.955, 0.78), (0.89, 0.9), (0.77, 0.97), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
        (2.3, [(0, 0), (0.78, 0), (0.94, 0.08), (0.98, 0.2), (1.0, 0.38), (0.99, 0.56), (0.97, 0.74), (0.93, 0.9), (0.83, 0.975), (0.6, 1.0), (0.3, 1.0), (0, 1.0)]),
        (2.9, [(0, 0), (0.8, 0), (0.93, 0.08), (0.975, 0.2), (1.0, 0.4), (0.99, 0.58), (0.97, 0.76), (0.93, 0.9), (0.84, 0.965), (0.6, 0.99), (0.3, 1.0), (0, 1.0)]),
        (3.55, [(0, 0), (0.8, 0), (0.93, 0.08), (0.98, 0.22), (1.0, 0.44), (0.99, 0.62), (0.96, 0.8), (0.9, 0.94), (0.78, 1.0), (0.58, 0.93), (0.3, 0.885), (0, 0.88)]),
        (4.35, [(0, 0), (0.8, 0), (0.92, 0.1), (0.965, 0.28), (0.985, 0.48), (0.98, 0.64), (0.95, 0.8), (0.88, 0.93), (0.76, 1.0), (0.55, 0.95), (0.3, 0.92), (0, 0.915)]),
    ],
    corners=(2, 7),
    mats={0: 'under', 1: 'under'},
    r_rear=0.05, r_front=0.07,
    nose=[(0.20, 0.08), (0.30, 0.03), (0.44, 0.0), (0.56, 0.03), (0.64, 0.09)], nose_zone=0.5,
    nose_x=[(0.0, 0.0), (0.4, 0.03), (0.7, 0.1), (0.9, 0.2)],
    tail=[(0.22, 0.04), (0.32, 0.0), (0.80, 0.0), (0.86, -0.02)], tail_zone=0.35,
)
CABIN = dict(
    y0=0.14, y1=3.0,
    roof=[(0.14, 0.87), (0.4, 0.955), (0.8, 1.05), (1.1, 1.12), (1.6, 1.25), (2.09, 1.303), (2.3, 1.29), (2.45, 1.24), (2.65, 1.09),
          (2.86, 0.92), (3.0, 0.8)],
    edge=[(0.14, 0.855), (0.4, 0.935), (0.8, 1.025), (1.1, 1.09), (1.6, 1.22), (2.09, 1.273), (2.3, 1.26), (2.45, 1.21), (2.65, 1.065),
          (2.86, 0.9), (3.0, 0.78)],
    belt=[(0.14, 0.86), (0.6, 0.90), (1.2, 0.905), (1.8, 0.88), (2.4, 0.87), (2.86, 0.865), (3.0, 0.845)],
    wb=[(0.14, 0.50), (0.6, 0.60), (1.2, 0.68), (1.8, 0.73), (2.4, 0.73), (2.86, 0.72), (3.0, 0.71)],
    wt=[(0.14, 0.42), (0.6, 0.47), (1.2, 0.52), (1.8, 0.55), (2.3, 0.56), (2.45, 0.58), (2.7, 0.66), (2.86, 0.70), (3.0, 0.71)],
    zones=[(2.45, 9, 'glass', None), (1.62, 2.45, 'paint', None), (0.95, 1.62, 'glass', None), (0.55, 0.95, 'paint', None),
           (0.22, 0.55, 'louver', None), (0, 0.22, 'paint', None)],
    ys=(2.45, 1.62, 0.95, 0.55, 0.22),
)

SPEC = dict(
    id='gt3rs', L=L, W=1.900, color='#eef0f3', sec='#16181c',
    wheels=dict(yf=3.55, yr=1.10, r=0.35, dr=0.017, drim=0.0127, wf=0.275, wr=0.335, tf=1.62, tr=1.60, rim=0.254, arch=0.395,
                style='10', caliper='#e6c000', rim_color='#c41a1a', lock=True),
    body=B,
    cabin=CABIN,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
