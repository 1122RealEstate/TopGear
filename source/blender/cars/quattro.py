# Audi Sport Quattro S1 E2 (1985, Grupo B) — 4.16 × 1.86 × 1.34 m, batalla 2.22 m
# Compacto cuadrado con pasos de rueda ensanchados, el gran frontal con seis faros auxiliares, alerón
# trasero enorme, librea blanca con la mitad baja amarilla y filos rojo y negro.
L = 4.16
YEL = 'sec'
RED = 'c_d8202a'

BODY, CABIN = hatch(L, 1.86, 1.34, 0.89, 3.11, zb=0.16, belt=0.92, hood=0.86, nose=0.76, tail=0.92, flare=0.08, ws=2.72, roof_f=2.28,
                    roof_r=1.08, rw=0.62, cab_w=0.78, cab_t=0.63, r=0.3)


def _rear(ctx):
    mb = ctx['mb']
    # banda de pilotos de lado a lado y el escape lateral
    light_unit(ctx, [(-0.84, 0.66), (0.84, 0.66), (0.84, 0.76), (-0.84, 0.76)], 'rear', depth=0.02, lens='lensred', inside='taildark',
               mirror=False, smooth=1, cell=0.015)
    recess(ctx, [(-0.84, 0.32), (0.84, 0.32), (0.84, 0.40), (-0.84, 0.40)], 'rear', depth=0.03, walls='black', bottom='black', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.55, 0.35, 'round', 0.09, 0.09)], bezel=0.006, bezel_depth=0.02)
    # el gran alerón del E2 sobre la tapa del maletero
    wing(mb, 0.42, 1.10, 0.36, 1.66, th=0.08, mat='c_f4f4f2', angle=0.1, camber=0.06, plate_h=0.20, plate_mat='sec')
    prism(mb, [(0.34, 0.90), (0.14, 0.90), (0.14, 1.10), (0.30, 1.11)], 'x', 0.30, 0.318, 'wing_sec', mirror=True)


def _rear_in(ctx):
    for x in (0.40, 0.72):
        lightbar(ctx, [(x - 0.1, 0.71), (x + 0.1, 0.71)], 0.04, 'rear', mat='led', raise_=0.012)


def _side(ctx):
    side_windows(ctx, [(2.55, 0.95), (2.28, 1.25), (1.8, 1.29), (1.15, 1.28), (0.9, 1.15), (0.95, 0.96), (1.7, 0.95)])
    door(ctx, [(1.62, 0.93), (1.64, 0.6), (1.68, 0.24), (2.62, 0.24), (2.64, 0.6), (2.68, 0.92)], handle=(1.72, 0.84, 1.86, 0.86))
    mirror_part(ctx['mb'], 0.78, 2.58, 0.98, w=0.13, h=0.08, d=0.08, stalk=0.04, mat='paint')
    # librea: mitad baja amarilla con filos rojo y negro, rótulo en la aleta trasera
    panel(ctx, [(0.05, 0.17), (4.12, 0.17), (4.12, 0.52), (0.05, 0.52)], 'side', YEL, cell=0.03, graze=0.15)
    side_stripe(ctx, [(0.05, 0.54), (4.12, 0.54)], 0.025, RED, graze=0.15)
    side_stripe(ctx, [(0.05, 0.575), (4.12, 0.575)], 0.02, 'black', graze=0.15)
    number(ctx, 'QUATTRO', 1.42, 0.70, 0.075, 'side', mat='black', stroke=0.17, slant=0.18)
    # tomas de aire traseras (los radiadores van detrás)
    recess(ctx, [(0.62, 0.62), (0.88, 0.64), (0.88, 0.80), (0.64, 0.80)], 'side', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)


def _front(ctx):
    # parrilla negra con los faros principales en las esquinas y el faldón con la ranura
    recess(ctx, [(-0.58, 0.54), (0.58, 0.54), (0.58, 0.72), (-0.58, 0.72)], 'front', depth=0.04, walls='black', bottom='black', mirror=False, smooth=1, cell=0.03)
    light_unit(ctx, [(0.62, 0.56), (0.84, 0.56), (0.84, 0.70), (0.62, 0.70)], 'front', depth=0.03, lens='lens', inside='darkchrome', smooth=1, cell=0.012)
    recess(ctx, [(-0.74, 0.22), (0.74, 0.22), (0.74, 0.33), (-0.74, 0.33)], 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.03)
    panel(ctx, [(-0.86, 0.34), (0.86, 0.34), (0.86, 0.50), (-0.86, 0.50)], 'front', YEL, mirror=False, cell=0.03, graze=0.2)


def _front_in(ctx):
    # seis faros auxiliares en el frontal
    for (x, z, r) in ((0.16, 0.63, 0.068), (0.36, 0.63, 0.068), (0.26, 0.44, 0.06)):
        projector(ctx, x, z, r, 'front', h=0.05, ring=0.014)
    projector(ctx, 0.70, 0.63, 0.045, 'front', h=0.015)
    lightbar(ctx, [(0.64, 0.59), (0.82, 0.59)], 0.012, 'front', mat='amber', raise_=0.02)
    for i in range(4):
        D(ctx, strip(circle_poly(-0.105 + i * 0.07, 0.785, 0.035, 20) + [(-0.105 + i * 0.07 + 0.035, 0.785)], 0.007), 'front', 'chrome',
          off=0.003, cell=0.004, mirror=False, avoid=(), graze=0.05)


SPEC = dict(
    id='quattro', L=L, W=1.86, color='#f4f4f2', sec='#f4b400',
    wheels=dict(yf=3.11, yr=0.89, r=0.31, dr=0.0, wf=0.25, wr=0.25, tf=1.56, tr=1.54, rim=0.203, arch=0.36,
                style='rally', caliper='#c41a1a', rim_color='#eeeeee', lugs=5),
    body=BODY,
    cabin=CABIN,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
