# Hyundai i20 WRC (2016) — 4.10 × 1.875 × 1.40 m, batalla 2.57 m
# Compacto de rally con pasos ensanchados, gran alerón de techo, frontal con parrilla de marco rojo,
# librea gris azulado con bloques rojos y azul marino, y llantas naranjas.
L = 4.10
RED, WHITE = 'c_e23a2a', 'c_f4f4f2'

BODY, CABIN = hatch(L, 1.875, 1.40, 0.68, 3.25, zb=0.16, belt=0.94, hood=0.88, nose=0.74, tail=0.99, flare=0.09, ws=2.72, roof_f=2.30,
                    roof_r=0.60, rw=0.28, cab_w=0.76, cab_t=0.63, r=0.5, tail_zb=0.28)


def _rear(ctx):
    mb = ctx['mb']
    for sd in (1, -1):
        light_unit(ctx, [(sd * 0.54, 0.80), (sd * 0.84, 0.76), (sd * 0.86, 0.86), (sd * 0.58, 0.90)], 'rear', depth=0.02, lens='lensred',
                   inside='taildark', mirror=False, smooth=1, cell=0.012)
    recess(ctx, [(-0.84, 0.28), (0.84, 0.28), (0.84, 0.42), (-0.84, 0.42)], 'rear', depth=0.04, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.0, 0.34, 'round', 0.1, 0.1)], bezel=0.006, bezel_depth=0.02)
    wing(mb, 0.72, 1.37, 0.32, 1.64, th=0.08, mat='sec', angle=0.14, camber=0.06, plate_h=0.24, plate_mat='sec')


def _rear_in(ctx):
    for sd in (1, -1):
        lightbar(ctx, [(sd * 0.60, 0.84), (sd * 0.82, 0.81)], 0.03, 'rear', mat='led', raise_=0.012, mirror=False)


def _side(ctx):
    side_windows(ctx, [(2.54, 0.97), (2.30, 1.31), (1.7, 1.36), (0.66, 1.35), (0.44, 1.23), (0.48, 0.99), (1.5, 0.97)])
    door(ctx, [(1.72, 0.96), (1.73, 0.6), (1.75, 0.24), (2.64, 0.24), (2.66, 0.6), (2.68, 0.95)])
    gap_line(ctx, [(0.88, 0.96), (0.88, 0.6), (0.90, 0.30)])
    mirror_part(ctx['mb'], 0.74, 2.55, 1.0, w=0.13, h=0.08, d=0.08, stalk=0.04, mat='sec')
    # librea: bloques rojo y azul marino en diagonal por el costado
    panel(ctx, [(2.9, 0.17), (3.9, 0.17), (3.9, 0.55), (2.3, 0.90), (1.9, 0.90)], 'side', RED, cell=0.03, graze=0.12)
    panel(ctx, [(0.05, 0.17), (1.9, 0.17), (1.1, 0.95), (0.05, 0.95)], 'side', 'sec', cell=0.03, graze=0.12)
    number(ctx, '3', 2.35, 0.55, 0.2, 'side', mat=WHITE, stroke=0.18)


def _front(ctx):
    # parrilla con marco rojo y los faros afilados
    recess(ctx, [(-0.46, 0.34), (0.46, 0.34), (0.50, 0.50), (0.40, 0.62), (-0.40, 0.62), (-0.50, 0.50)], 'front', depth=0.05, walls=RED,
           bottom='mesh', mirror=False, smooth=1, cell=0.02)
    light_unit(ctx, [(0.50, 0.66), (0.84, 0.62), (0.86, 0.70), (0.54, 0.74)], 'front', depth=0.03, lens='lens', inside='darkchrome', smooth=1, cell=0.012)
    recess(ctx, [(-0.80, 0.20), (0.80, 0.20), (0.80, 0.30), (-0.80, 0.30)], 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.03)
    recess(ctx, [(0.14, 3.72), (0.40, 3.70), (0.40, 3.88), (0.16, 3.90)], 'top', depth=0.03, walls='black', bottom='mesh', smooth=1, cell=0.015)


def _front_in(ctx):
    projector(ctx, 0.62, 0.68, 0.035, 'front', h=0.015)
    projector(ctx, 0.74, 0.67, 0.03, 'front', h=0.015)
    lightbar(ctx, [(0.53, 0.665), (0.84, 0.63)], 0.008, 'front', mat='drl', raise_=0.02)
    number(ctx, 'I20', 0.0, 0.47, 0.1, 'front', mat=WHITE, stroke=0.2, raise_=0.052)


SPEC = dict(
    id='i20wrc', L=L, W=1.875, color='#8c9bb1', sec='#1b2a4a',
    wheels=dict(yf=3.25, yr=0.68, r=0.325, dr=0.0, wf=0.235, wr=0.235, tf=1.62, tr=1.62, rim=0.2286, arch=0.37,
                style='6', caliper='#1b1c1f', rim_color='#e2572a', lock=True),
    body=BODY, cabin=CABIN,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
