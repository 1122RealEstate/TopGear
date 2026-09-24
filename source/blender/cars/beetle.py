# Volkswagen Beetle Gr.3 (Gran Turismo) — 4.40 × 2.00 × 1.30 m, batalla 2.54 m
# El Escarabajo convertido en coche de GT: aletas redondas muy ensanchadas, faros redondos, techo en arco,
# gran alerón, splitter, librea blanca con la trasera violeta y el dorsal 53.
L = 4.40
PURP, WHITE = 'sec', 'c_f4f4f2'

BODY, CABIN = hatch(L, 2.0, 1.32, 0.86, 3.40, zb=0.13, belt=0.90, hood=0.80, nose=0.66, tail=0.86, flare=0.12, ws=2.72, roof_f=2.05,
                    roof_r=1.45, rw=0.40, cab_w=0.74, cab_t=0.54, r=1.0, tail_zb=0.26, nose_zb=0.13)
CABIN['zones'] = [(2.05, 9, 'glass', None), (1.45, 2.05, 'paint', None), (0.95, 1.45, 'glass', None), (0, 0.95, 'paint', None)]
CABIN['ys'] = (2.05, 1.45, 0.95)


def _rear(ctx):
    mb = ctx['mb']
    for sd in (1, -1):
        light_unit(ctx, ellipse(sd * 0.70, 0.74, 0.11, 0.07, 28), 'rear', depth=0.02, lens='lensred', inside='taildark', mirror=False, cell=0.012)
    recess(ctx, [(-0.86, 0.24), (0.86, 0.24), (0.86, 0.40), (-0.86, 0.40)], 'rear', depth=0.04, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.12, 0.32, 'round', 0.1, 0.1)], bezel=0.008, bezel_depth=0.02)
    P = [(0.62, 0.84), (0.44, 0.84), (0.36, 1.00), (0.30, 1.18), (0.26, 1.215), (0.18, 1.21), (0.15, 1.22), (0.19, 1.29), (0.30, 1.30), (0.40, 1.24),
         (0.50, 1.06), (0.58, 0.92)]
    wing(mb, 0.36, 1.18, 0.34, 1.80, th=0.09, mat='carbon', angle=0.12, camber=0.07, plate_h=0.22, plate_mat='sec')
    prism(mb, smooth_poly(P, 1), 'x', 0.33, 0.35, 'wing_carbon', mirror=True)
    diffuser(ctx, 0.66, 7, y_len=0.5, z_low=0.14)


def _rear_in(ctx):
    for sd in (1, -1):
        led(ctx, ellipse(sd * 0.70, 0.74, 0.08, 0.045, 24), mat='led', raise_=0.012, mirror=False, cell=0.01)


def _side(ctx):
    side_windows(ctx, [(2.56, 0.94), (2.30, 1.20), (1.8, 1.27), (1.35, 1.25), (1.0, 1.10), (1.1, 0.93), (1.8, 0.92)])
    door(ctx, [(1.72, 0.92), (1.73, 0.6), (1.75, 0.22), (2.72, 0.22), (2.74, 0.6), (2.76, 0.90)])
    mirror_part(ctx['mb'], 0.74, 2.62, 0.96, w=0.13, h=0.07, d=0.08, stalk=0.06, mat='paint')
    # librea: aleta trasera violeta con barrido hacia delante, faldón negro y el 53 en panel blanco
    panel(ctx, [(0.05, 0.16), (1.45, 0.16), (0.95, 0.90), (0.05, 0.90)], 'side', PURP, cell=0.03, graze=0.12)
    panel(ctx, [(1.2, 0.14), (3.2, 0.14), (3.15, 0.22), (1.24, 0.23)], 'side', 'carbon', cell=0.04)
    D(ctx, [(1.95, 0.44), (2.35, 0.44), (2.35, 0.76), (1.95, 0.76)], 'side', WHITE, off=0.0026, cell=0.02, avoid=('glass',), graze=0.1)
    number(ctx, '53', 2.15, 0.60, 0.2, 'side', mat='black', stroke=0.17, raise_=0.0035)


def _front(ctx):
    mb = ctx['mb']
    # faros redondos en las aletas y el frontal con grandes tomas
    light_unit(ctx, ellipse(0.62, 0.62, 0.10, 0.09, 32), 'front', depth=0.04, lens='lens', inside='darkchrome', cell=0.01)
    recess(ctx, [(-0.80, 0.18), (0.80, 0.18), (0.80, 0.40), (0.30, 0.44), (-0.30, 0.44), (-0.80, 0.40)], 'front', depth=0.05, walls='black',
           bottom='mesh', mirror=False, smooth=1, cell=0.03)
    prism(mb, [(-0.96, 4.12), (0.96, 4.12), (0.94, 4.26), (0.74, 4.38), (0.40, 4.46), (-0.40, 4.46), (-0.74, 4.38), (-0.94, 4.26)], 'z', 0.08, 0.10, 'carbon')


def _front_in(ctx):
    projector(ctx, 0.62, 0.62, 0.06, 'front', h=0.025, ring=0.012)
    led(ctx, circle_poly(0.0, 0.58, 0.05, 24), 'front', mat='chrome', raise_=0.004, mirror=False, cell=0.008)


SPEC = dict(
    id='beetle', L=L, W=2.0, color='#f2f3f5', sec='#5b3fd0',
    wheels=dict(yf=3.40, yr=0.86, r=0.345, dr=0.01, wf=0.30, wr=0.32, tf=1.72, tr=1.70, rim=0.2286, arch=0.40,
                style='5', caliper='#c41a1a', rim_color='#2a2c30', lock=True),
    body=BODY, cabin=CABIN,
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
