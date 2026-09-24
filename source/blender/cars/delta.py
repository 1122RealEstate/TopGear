# Lancia Delta HF Integrale Evoluzione (1992, Martini Racing) — 3.90 × 1.77 × 1.365 m, batalla 2.48 m
# Compacto cuadrado de cinco puertas con los pasos ensanchados, la parrilla negra con cuatro faros redondos,
# spoiler de techo, franjas Martini (azul oscuro, celeste y rojo) y la franja del parabrisas.
L = 3.90
DB, LB, RD = 'c_1a2a6c', 'c_26a9e0', 'c_d6202a'

BODY, CABIN = hatch(L, 1.77, 1.365, 0.62, 3.10, zb=0.15, belt=0.93, hood=0.87, nose=0.80, tail=0.97, flare=0.07, ws=2.58, roof_f=2.18,
                    roof_r=0.55, rw=0.22, cab_w=0.74, cab_t=0.62, r=0.2, tail_zb=0.28)


def _rear(ctx):
    mb = ctx['mb']
    for sd in (1, -1):
        light_unit(ctx, [(sd * 0.50, 0.74), (sd * 0.80, 0.74), (sd * 0.80, 0.86), (sd * 0.50, 0.86)], 'rear', depth=0.02, lens='lensred',
                   inside='taildark', mirror=False, cell=0.012)
    recess(ctx, [(-0.78, 0.30), (0.78, 0.30), (0.78, 0.40), (-0.78, 0.40)], 'rear', depth=0.03, walls='black', bottom='black', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.50, 0.33, 'round', 0.08, 0.08)], bezel=0.006, bezel_depth=0.02)
    # spoiler del techo, regulable, en blanco
    wing(mb, 0.66, 1.33, 0.20, 1.34, th=0.06, mat='paint', angle=0.2, camber=0.03, plates=True, plate_h=0.06)


def _rear_in(ctx):
    for sd in (1, -1):
        lightbar(ctx, [(sd * 0.54, 0.80), (sd * 0.76, 0.80)], 0.05, 'rear', mat='led', raise_=0.012, mirror=False)


def _side(ctx):
    side_windows(ctx, [(2.40, 0.96), (2.18, 1.28), (1.6, 1.32), (0.60, 1.31), (0.40, 1.20), (0.45, 0.98), (1.4, 0.96)])
    door(ctx, [(1.62, 0.95), (1.63, 0.6), (1.65, 0.24), (2.52, 0.24), (2.54, 0.6), (2.56, 0.94)], handle=(1.70, 0.86, 1.82, 0.88))
    gap_line(ctx, [(0.80, 0.95), (0.80, 0.6), (0.82, 0.30)])
    mirror_part(ctx['mb'], 0.72, 2.42, 0.99, w=0.12, h=0.08, d=0.08, stalk=0.04, mat='paint')
    # franjas Martini a lo largo del costado, que suben por la aleta trasera
    for (z, m) in ((0.64, DB), (0.595, LB), (0.55, RD)):
        side_stripe(ctx, chaikin_open([(3.6, z), (2.4, z), (1.2, z), (0.55, z + 0.04), (0.2, z + 0.16)]), 0.034, m, graze=0.1)
    for (x0, m) in ((-0.20, DB), (-0.10, LB), (0.0, RD)):
        top_band(ctx, [(x0, 2.62), (x0 + 0.085, 2.62), (x0 + 0.085, 3.95), (x0, 3.95)], m)
    # franja del parabrisas
    top_band(ctx, [(-0.62, 2.10), (0.62, 2.10), (0.62, 2.20), (-0.62, 2.20)], 'c_f4f4f2', avoid=())
    number(ctx, 'MARTINI', 0.0, 2.15, 0.06, 'top', mat='black', stroke=0.17, raise_=0.004)


def _front(ctx):
    recess(ctx, [(-0.80, 0.56), (0.80, 0.56), (0.80, 0.76), (-0.80, 0.76)], 'front', depth=0.04, walls='black', bottom='black', mirror=False, smooth=1, cell=0.03)
    recess(ctx, [(-0.70, 0.22), (0.70, 0.22), (0.70, 0.36), (-0.70, 0.36)], 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.03)


def _front_in(ctx):
    for x in (0.46, 0.66):
        projector(ctx, x, 0.66, 0.072, 'front', h=0.03, ring=0.014)
    projector(ctx, 0.52, 0.29, 0.045, 'front', h=0.02)
    led(ctx, [(0.0, 0.60), (0.05, 0.64), (0.05, 0.72), (0.0, 0.74), (-0.05, 0.72), (-0.05, 0.64)], 'front', mat='chrome', raise_=0.045, mirror=False, cell=0.008)


SPEC = dict(
    id='delta', L=L, W=1.77, color='#f4f4f2', sec='#1a2a6c',
    wheels=dict(yf=3.10, yr=0.62, r=0.30, dr=0.0, wf=0.21, wr=0.21, tf=1.50, tr=1.50, rim=0.203, arch=0.345,
                style='10', caliper='#c41a1a', rim_color='#c0c4ca', lugs=5),
    body=BODY, cabin=CABIN,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
