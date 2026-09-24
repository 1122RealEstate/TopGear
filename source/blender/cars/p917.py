# Porsche 917K (1970, librea Gulf) — 4.14 × 2.03 × 0.94 m, batalla 2.30 m
# Cuña bajísima con faros redondos en los guardabarros, cúpula del habitáculo, cola corta con dos
# aletas, franja naranja central, faldón naranja y el dorsal 22 en círculo blanco.
L = 4.14
TOPF = along((0, -0.5, -0.86), zr=0.55)

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.30), (0.80, 0.30), (0.93, 0.34), (0.96, 0.44), (0.97, 0.56), (0.965, 0.66), (0.95, 0.72), (0.90, 0.76), (0.78, 0.765),
           (0.55, 0.75), (0.28, 0.745), (0, 0.745)]),
    (0.94, [(0, 0.14), (0.86, 0.14), (0.98, 0.20), (1.01, 0.32), (1.015, 0.45), (1.01, 0.58), (0.99, 0.68), (0.95, 0.75), (0.86, 0.78),
            (0.66, 0.765), (0.34, 0.755), (0, 0.755)]),
    (1.6, [(0, 0.12), (0.84, 0.12), (0.96, 0.18), (0.99, 0.30), (0.99, 0.42), (0.98, 0.54), (0.96, 0.63), (0.92, 0.68), (0.84, 0.70),
           (0.64, 0.69), (0.32, 0.685), (0, 0.685)]),
    (2.3, [(0, 0.12), (0.82, 0.12), (0.93, 0.17), (0.95, 0.28), (0.95, 0.40), (0.94, 0.50), (0.92, 0.58), (0.88, 0.63), (0.80, 0.65),
           (0.62, 0.645), (0.30, 0.64), (0, 0.64)]),
    (3.24, [(0, 0.14), (0.86, 0.14), (0.98, 0.20), (1.01, 0.32), (1.015, 0.45), (1.0, 0.56), (0.97, 0.65), (0.90, 0.71), (0.78, 0.72),
            (0.62, 0.66), (0.32, 0.565), (0, 0.55)]),
    (3.8, [(0, 0.15), (0.84, 0.15), (0.95, 0.19), (0.98, 0.28), (0.985, 0.38), (0.975, 0.47), (0.94, 0.55), (0.87, 0.60), (0.76, 0.60),
           (0.60, 0.54), (0.32, 0.47), (0, 0.46)]),
    (4.14, [(0, 0.16), (0.74, 0.16), (0.86, 0.19), (0.90, 0.24), (0.905, 0.30), (0.89, 0.35), (0.84, 0.39), (0.74, 0.41), (0.58, 0.40),
            (0.40, 0.37), (0.20, 0.355), (0, 0.35)]),
])


def _rear(ctx):
    mb = ctx['mb']
    # rejilla del motor, dos pares de escapes y pilotos redondos pequeños
    recess(ctx, [(-0.70, 0.31), (0.70, 0.31), (0.72, 0.58), (-0.72, 0.58)], 'rear', depth=0.06, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.04)
    exhaust_tips(ctx, [(0.16, 0.37, 'round', 0.085, 0.085), (0.36, 0.37, 'round', 0.085, 0.085)], bezel=0.006, bezel_depth=0.02)
    for z in (0.62, 0.69):
        light_unit(ctx, circle_poly(0.82, z, 0.032, 24), 'rear', depth=0.02, lens='lensred', inside='taildark', cell=0.01)
    # las dos aletas de la cola corta
    for x in (0.60,):
        prism(mb, [(0.02, 0.74), (0.62, 0.755), (0.40, 0.84), (0.06, 0.87)], 'x', x - 0.008, x + 0.008, 'paint', mirror=True)


def _rear_in(ctx):
    for z in (0.62, 0.69):
        led(ctx, circle_poly(0.82, z, 0.022, 20), mat='led', raise_=0.012, cell=0.008)


def _side(ctx):
    side_windows(ctx, [(2.75, 0.66), (2.45, 0.86), (2.05, 0.90), (1.75, 0.84), (1.62, 0.72), (1.9, 0.67)])
    door(ctx, [(1.66, 0.68), (1.70, 0.5), (1.74, 0.24), (2.78, 0.24), (2.80, 0.5), (2.84, 0.64)])
    recess(ctx, [(1.20, 0.60), (1.50, 0.62), (1.50, 0.69), (1.22, 0.68)], 'side', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.02)
    mirror_part(ctx['mb'], 0.78, 2.98, 0.74, w=0.09, h=0.07, d=0.06, stalk=0.06, mat='paint')
    # librea Gulf: faldón naranja, franja central naranja y dorsal 22
    panel(ctx, [(0.08, 0.16), (3.72, 0.16), (3.72, 0.29), (0.08, 0.29)], 'side', 'sec', cell=0.03, graze=0.25)
    top_band(ctx, [(-0.14, 0.0), (0.14, 0.0), (0.14, 4.2), (-0.14, 4.2)], 'sec')
    roundel(ctx, 2.22, 0.45, 0.16, 'side')
    number(ctx, '22', 2.22, 0.45, 0.17, 'side', mat='black', stroke=0.17)


def _front(ctx):
    recess(ctx, ellipse(0.0, 0.26, 0.30, 0.055, 32), 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.02)
    # faros redondos bajo cúpulas en lo alto de cada guardabarros
    light_unit(ctx, ellipse(0.64, 3.90, 0.12, 0.15, 36), None, depth=0.05, lens='lens', inside='black', custom=TOPF, cell=0.012)


def _front_in(ctx):
    projector(ctx, 0.66, 3.92, 0.075, None, custom=TOPF, h=0.03, ring=0.012)
    projector(ctx, 0.56, 3.84, 0.04, None, custom=TOPF, h=0.02)


SPEC = dict(
    id='p917', L=L, W=2.03, color='#8ec9e6', sec='#f26b1d',
    wheels=dict(yf=3.24, yr=0.94, r=0.30, dr=0.018, drim=0.0, wf=0.26, wr=0.34, tf=1.62, tr=1.60, rim=0.19, arch=0.345,
                style='dish', caliper='#b8b8b8', rim_color='#26282c', lock=True),
    body=dict(
        top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS,
        corners=(2,),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.06,
        nose=[(0.16, 0.0), (0.26, 0.02), (0.36, 0.07)], nose_zone=0.45,
        nose_x=[(0.0, 0.0), (0.4, 0.03), (0.7, 0.12), (0.9, 0.26)],
        tail=[(0.30, 0.03), (0.40, 0.0), (0.76, 0.0)], tail_zone=0.3,
    ),
    cabin=dict(
        y0=1.25, y1=3.1,
        roof=[(1.25, 0.70), (1.5, 0.80), (1.8, 0.89), (2.1, 0.935), (2.35, 0.94), (2.55, 0.92), (2.75, 0.84), (2.9, 0.72), (3.0, 0.62), (3.1, 0.54)],
        edge=[(1.25, 0.69), (1.5, 0.785), (1.8, 0.87), (2.1, 0.915), (2.35, 0.92), (2.55, 0.90), (2.75, 0.825), (2.9, 0.705), (3.0, 0.61), (3.1, 0.53)],
        belt=[(1.25, 0.66), (1.8, 0.65), (2.4, 0.63), (2.8, 0.60), (3.0, 0.55), (3.1, 0.52)],
        wb=[(1.25, 0.34), (1.6, 0.52), (2.0, 0.60), (2.4, 0.62), (2.8, 0.58), (3.1, 0.50)],
        wt=[(1.25, 0.14), (1.6, 0.34), (2.0, 0.42), (2.3, 0.44), (2.6, 0.43), (2.8, 0.40), (3.1, 0.32)],
        zones=[(2.42, 9, 'glass', None), (1.78, 2.42, 'paint', None), (1.45, 1.78, 'glass', None), (0, 1.45, 'paint', None)],
        ys=(2.42, 1.78, 1.45),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
