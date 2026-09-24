# Volkswagen Polo R WRC (2015) — 3.98 × 1.875 × 1.39 m, batalla 2.47 m
# Compacto de rally: pasos muy ensanchados, alerón en el borde del techo con placas grandes, tomas en el capó,
# librea azul con la trasera plateada, el sol amarillo en el capó y el dorsal 1.
L = 3.98
SIL, YEL = 'c_c8ccd2', 'c_f5c518'

BODY, CABIN = hatch(L, 1.875, 1.39, 0.66, 3.13, zb=0.16, belt=0.94, hood=0.87, nose=0.74, tail=0.99, flare=0.09, ws=2.62, roof_f=2.22,
                    roof_r=0.58, rw=0.26, cab_w=0.76, cab_t=0.63, r=0.45, tail_zb=0.28)


def _rear(ctx):
    mb = ctx['mb']
    for sd in (1, -1):
        light_unit(ctx, [(sd * 0.56, 0.78), (sd * 0.84, 0.76), (sd * 0.86, 0.88), (sd * 0.60, 0.90)], 'rear', depth=0.02, lens='lensred',
                   inside='taildark', mirror=False, smooth=1, cell=0.012)
    recess(ctx, [(-0.84, 0.28), (0.84, 0.28), (0.84, 0.42), (-0.84, 0.42)], 'rear', depth=0.04, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.30, 0.34, 'round', 0.09, 0.09)], bezel=0.006, bezel_depth=0.02)
    wing(mb, 0.70, 1.36, 0.30, 1.62, th=0.08, mat='sec', angle=0.14, camber=0.06, plate_h=0.24, plate_mat='sec')


def _rear_in(ctx):
    for sd in (1, -1):
        lightbar(ctx, [(sd * 0.62, 0.83), (sd * 0.82, 0.82)], 0.03, 'rear', mat='led', raise_=0.012, mirror=False)


def _side(ctx):
    side_windows(ctx, [(2.44, 0.97), (2.22, 1.30), (1.6, 1.35), (0.64, 1.34), (0.42, 1.22), (0.46, 0.99), (1.4, 0.97)])
    door(ctx, [(1.66, 0.96), (1.67, 0.6), (1.69, 0.24), (2.56, 0.24), (2.58, 0.6), (2.60, 0.95)])
    gap_line(ctx, [(0.84, 0.96), (0.84, 0.6), (0.86, 0.30)])
    mirror_part(ctx['mb'], 0.74, 2.45, 1.0, w=0.13, h=0.08, d=0.08, stalk=0.04, mat='paint')
    # librea: trasera plateada en diagonal, faldón rojo y el 1
    panel(ctx, [(0.05, 0.17), (1.5, 0.17), (0.9, 1.0), (0.05, 1.0)], 'side', SIL, cell=0.03, graze=0.12)
    side_stripe(ctx, [(0.3, 0.26), (3.7, 0.26)], 0.06, 'sec', graze=0.15)
    number(ctx, '1', 2.1, 0.60, 0.22, 'side', mat='c_f4f4f2', stroke=0.18)
    roundel(ctx, 0.0, 3.55, 0.20, 'top', mat=YEL, mirror=False)


def _front(ctx):
    recess(ctx, [(-0.50, 0.58), (0.50, 0.58), (0.46, 0.70), (-0.46, 0.70)], 'front', depth=0.04, walls='black', bottom='black', mirror=False, smooth=1, cell=0.02)
    light_unit(ctx, [(0.52, 0.62), (0.82, 0.60), (0.84, 0.70), (0.54, 0.72)], 'front', depth=0.03, lens='lens', inside='darkchrome', smooth=1, cell=0.012)
    recess(ctx, [(-0.80, 0.20), (0.80, 0.20), (0.80, 0.44), (0.40, 0.46), (-0.40, 0.46), (-0.80, 0.44)], 'front', depth=0.05, walls='black',
           bottom='mesh', mirror=False, smooth=1, cell=0.03)
    recess(ctx, [(0.14, 3.62), (0.40, 3.60), (0.40, 3.78), (0.16, 3.80)], 'top', depth=0.03, walls='black', bottom='mesh', smooth=1, cell=0.015)


def _front_in(ctx):
    projector(ctx, 0.62, 0.66, 0.035, 'front', h=0.015)
    projector(ctx, 0.74, 0.655, 0.03, 'front', h=0.015)
    lightbar(ctx, [(0.55, 0.625), (0.82, 0.61)], 0.008, 'front', mat='drl', raise_=0.02)
    led(ctx, circle_poly(0.0, 0.64, 0.05, 24), 'front', mat='chrome', raise_=0.045, mirror=False, cell=0.008)


SPEC = dict(
    id='polowrc', L=L, W=1.875, color='#1c2f7a', sec='#d6202a',
    wheels=dict(yf=3.13, yr=0.66, r=0.325, dr=0.0, wf=0.235, wr=0.235, tf=1.62, tr=1.62, rim=0.2286, arch=0.37,
                style='rally', caliper='#c41a1a', rim_color='#b9bdc4', lock=True),
    body=BODY, cabin=CABIN,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
