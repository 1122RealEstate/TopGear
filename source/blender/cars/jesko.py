# Koenigsegg Jesko — 4.61 × 2.03 × 1.21 m, batalla 2.70 m
# Alerón de «cuello de cisne» sobre dos pilones, escape central doble, pilotos finos en las esquinas,
# frontal negro con franja verde, faros en lágrima con guía de luz y rejillas sobre las ruedas delanteras.
L = 4.61
HL = along_y((-0.12, -0.92, -0.38), L - 0.26)

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.24), (0.76, 0.24), (0.88, 0.28), (0.915, 0.38), (0.92, 0.50), (0.915, 0.62), (0.90, 0.74), (0.86, 0.83), (0.78, 0.875),
           (0.60, 0.885), (0.30, 0.88), (0, 0.878)]),
    (0.45, [(0, 0.16), (0.84, 0.16), (0.96, 0.21), (0.985, 0.33), (0.99, 0.46), (0.985, 0.60), (0.97, 0.73), (0.93, 0.84), (0.85, 0.915),
            (0.66, 0.93), (0.33, 0.925), (0, 0.92)]),
    (0.86, [(0, 0.12), (0.86, 0.12), (0.98, 0.18), (1.005, 0.30), (1.012, 0.44), (1.005, 0.58), (0.99, 0.72), (0.95, 0.85), (0.86, 0.94),
            (0.68, 0.965), (0.34, 0.955), (0, 0.95)]),
    (1.6, [(0, 0.12), (0.84, 0.12), (0.95, 0.17), (0.97, 0.28), (0.965, 0.42), (0.95, 0.56), (0.93, 0.68), (0.89, 0.79), (0.82, 0.87),
           (0.66, 0.90), (0.33, 0.89), (0, 0.885)]),
    (2.3, [(0, 0.12), (0.82, 0.12), (0.93, 0.16), (0.95, 0.26), (0.945, 0.40), (0.93, 0.54), (0.91, 0.66), (0.87, 0.76), (0.80, 0.82),
           (0.64, 0.84), (0.32, 0.835), (0, 0.83)]),
    (2.95, [(0, 0.12), (0.84, 0.12), (0.95, 0.17), (0.97, 0.28), (0.965, 0.42), (0.955, 0.56), (0.94, 0.68), (0.91, 0.78), (0.84, 0.845),
            (0.66, 0.84), (0.33, 0.83), (0, 0.825)]),
    (3.56, [(0, 0.14), (0.84, 0.14), (0.96, 0.20), (0.995, 0.32), (1.0, 0.45), (0.99, 0.58), (0.97, 0.70), (0.93, 0.81), (0.84, 0.89),
            (0.68, 0.88), (0.36, 0.81), (0, 0.80)]),
    (4.15, [(0, 0.16), (0.82, 0.16), (0.93, 0.21), (0.965, 0.32), (0.97, 0.44), (0.96, 0.56), (0.93, 0.66), (0.88, 0.74), (0.80, 0.79),
            (0.64, 0.78), (0.32, 0.70), (0, 0.69)]),
    (4.61, [(0, 0.16), (0.70, 0.16), (0.80, 0.19), (0.845, 0.26), (0.86, 0.34), (0.85, 0.42), (0.82, 0.49), (0.76, 0.55), (0.66, 0.58),
            (0.50, 0.57), (0.25, 0.53), (0, 0.52)]),
])


def _rear(ctx):
    mb = ctx['mb']
    # trasera negra entre las aletas, con el escape doble ovalado en el centro
    recess(ctx, smooth_poly([(-0.84, 0.26), (0.84, 0.26), (0.89, 0.40), (0.87, 0.60), (0.78, 0.74), (-0.78, 0.74), (-0.87, 0.60), (-0.89, 0.40)], 1),
           'rear', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.03)
    exhaust_tips(ctx, [(0.052, 0.575, 'oval', 0.09, 0.066)], bezel=0.012, bezel_depth=0.03)
    # pilotos: trazos finos en lo alto de cada aleta
    light_unit(ctx, smooth_poly([(0.56, 0.78), (0.82, 0.805), (0.87, 0.825), (0.865, 0.85), (0.81, 0.838), (0.56, 0.81)], 1), 'rear',
               depth=0.02, lens='lensred', inside='taildark', cell=0.008)
    diffuser(ctx, 0.62, 6, y_len=0.55, z_low=0.14)
    # alerón de cuello de cisne: el perfil cuelga de dos pilones que salen de la tapa del motor
    wing(mb, 0.36, 1.27, 0.36, 1.96, th=0.09, mat='carbon', angle=0.1, camber=0.06, plate_h=0.20, sweep=0.02)
    neck = [(1.00, 0.93), (0.80, 0.93), (0.62, 1.08), (0.46, 1.25), (0.36, 1.30), (0.24, 1.29), (0.20, 1.31), (0.26, 1.38), (0.40, 1.40),
            (0.56, 1.34), (0.76, 1.16), (0.94, 1.00)]
    prism(mb, smooth_poly(neck, 1), 'x', 0.31, 0.33, 'wing_carbon', mirror=True)


def _rear_in(ctx):
    lightbar(ctx, [(0.58, 0.795), (0.82, 0.818), (0.862, 0.836)], 0.01, 'rear', mat='led', raise_=0.012)
    for z in (0.44, 0.50):                 # lamas horizontales de la rejilla trasera
        lightbar(ctx, [(-0.80, z), (0.80, z)], 0.012, 'rear', mat='carbon', raise_=0.03, mirror=False)


def _side(ctx):
    side_windows(ctx, [(3.10, 0.85), (2.80, 1.06), (2.40, 1.16), (2.00, 1.15), (1.75, 1.04), (1.95, 0.90), (2.6, 0.86)])
    door(ctx, [(1.74, 0.87), (1.77, 0.6), (1.82, 0.30), (3.02, 0.30), (3.06, 0.6), (3.10, 0.83)])
    # toma lateral grande delante de la rueda trasera y faldón de carbono
    recess(ctx, [(1.80, 0.70), (1.58, 0.79), (1.36, 0.80), (1.24, 0.72), (1.24, 0.54), (1.36, 0.44), (1.58, 0.46)], 'side', depth=0.07, walls='black',
           bottom='mesh', smooth=2, cell=0.02)
    panel(ctx, [(1.3, 0.14), (3.1, 0.14), (3.05, 0.22), (1.34, 0.23)], 'side', 'carbon', cell=0.04)
    mirror_part(ctx['mb'], 0.80, 2.98, 0.95, w=0.15, h=0.07, d=0.09, stalk=0.12, mat='carbon')
    # rejillas de ventilación sobre los pasos de rueda delanteros
    recess(ctx, [(0.62, 3.28), (0.90, 3.30), (0.90, 3.56), (0.64, 3.54)], 'top', depth=0.03, walls='black', bottom='black', smooth=1, cell=0.02)


def _front(ctx):
    mb = ctx['mb']
    # parte baja negra de lado a lado (tomas y splitter)
    recess(ctx, smooth_poly([(-0.95, 0.15), (0.95, 0.15), (0.94, 0.28), (0.82, 0.36), (0.52, 0.41), (0, 0.42), (-0.52, 0.41), (-0.82, 0.36),
                             (-0.94, 0.28)], 1), 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.03)
    prism(mb, [(-0.93, 4.28), (0.93, 4.28), (0.90, 4.40), (0.72, 4.53), (0.42, 4.62), (-0.42, 4.62), (-0.72, 4.53), (-0.90, 4.40)], 'z', 0.095, 0.115,
          'carbon')
    prism(mb, [(0.90, 4.38), (1.01, 4.35), (1.01, 4.44), (0.92, 4.50)], 'z', 0.30, 0.312, 'carbon', mirror=True)    # canards
    # faros en lágrima con la guía de luz por el borde exterior
    light_unit(ctx, [(0.73, 0.555), (0.80, 0.53), (0.865, 0.55), (0.89, 0.60), (0.88, 0.66), (0.845, 0.715), (0.79, 0.74), (0.745, 0.71),
                     (0.72, 0.63)], None, depth=0.045, lens='lens', inside='darkchrome', custom=HL, smooth=1, cell=0.01)
    # extractor del capó perfilado en verde
    recess(ctx, [(-0.40, 3.66), (0.40, 3.66), (0.36, 3.76), (-0.36, 3.76)], 'top', depth=0.04, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.02)
    D(ctx, strip([(-0.37, 3.788), (0.37, 3.788)], 0.012), 'top', 'sec', off=0.002, cell=0.01, mirror=False, avoid=(), graze=0.1)


def _front_in(ctx):
    projector(ctx, 0.80, 0.60, 0.028, None, custom=HL, h=0.014)
    projector(ctx, 0.832, 0.66, 0.02, None, custom=HL, h=0.012)
    lightbar(ctx, [(0.752, 0.574), (0.80, 0.553), (0.849, 0.567), (0.866, 0.604), (0.859, 0.65), (0.834, 0.69)], 0.01, None, mat='drl', raise_=0.02, custom=HL)
    # franja verde en el centro del frontal negro y escudo de Koenigsegg
    led(ctx, [(-0.012, 0.16), (0.012, 0.16), (0.012, 0.36), (-0.012, 0.36)], 'front', mat='sec', raise_=0.02, mirror=False, cell=0.006)
    led(ctx, [(0.0, 0.445), (0.03, 0.46), (0.028, 0.49), (0.0, 0.50), (-0.028, 0.49), (-0.03, 0.46)], 'front', mat='badge', raise_=0.003, mirror=False, cell=0.006)
    for y in (3.32, 3.37, 3.42, 3.47, 3.52):
        lightbar(ctx, [(0.65, y), (0.89, y + 0.01)], 0.018, 'top', mat='carbon', raise_=0.02)


SPEC = dict(
    id='jesko', L=L, W=2.03, color='#eef0f3', sec='#5bd12c',
    wheels=dict(yf=3.56, yr=0.86, r=0.347, dr=0.017, drim=0.0127, wf=0.265, wr=0.325, tf=1.70, tr=1.66, rim=0.254, arch=0.39,
                style='jesko', caliper='#e04a00', rim_color='#23252a', lock=True),
    body=dict(
        top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS,
        corners=(2, 7),
        mats={0: 'under', 1: 'under'},
        r_rear=0.05, r_front=0.06,
        nose=[(0.16, 0.0), (0.30, 0.02), (0.45, 0.10), (0.58, 0.22)], nose_zone=0.6,
        nose_x=[(0.0, 0.0), (0.4, 0.04), (0.7, 0.14), (0.86, 0.28)],
        tail=[(0.24, 0.04), (0.35, 0.0), (0.80, 0.0), (0.88, -0.03)], tail_zone=0.3,
    ),
    cabin=dict(
        y0=0.50, y1=3.42,
        roof=[(0.50, 0.90), (0.9, 0.97), (1.3, 1.06), (1.7, 1.15), (2.05, 1.20), (2.3, 1.21), (2.55, 1.19), (2.8, 1.12), (3.0, 1.03),
              (3.15, 0.95), (3.3, 0.86), (3.42, 0.78)],
        edge=[(0.50, 0.895), (0.9, 0.96), (1.3, 1.045), (1.7, 1.13), (2.05, 1.175), (2.3, 1.185), (2.55, 1.165), (2.8, 1.095), (3.0, 1.01),
              (3.15, 0.93), (3.3, 0.845), (3.42, 0.765)],
        belt=[(0.50, 0.88), (1.2, 0.88), (1.9, 0.86), (2.5, 0.84), (3.0, 0.82), (3.25, 0.80), (3.42, 0.76)],
        wb=[(0.50, 0.30), (0.9, 0.42), (1.4, 0.56), (1.9, 0.66), (2.4, 0.70), (2.8, 0.70), (3.1, 0.66), (3.42, 0.56)],
        wt=[(0.50, 0.18), (0.9, 0.28), (1.4, 0.40), (1.9, 0.50), (2.3, 0.53), (2.6, 0.54), (2.9, 0.52), (3.1, 0.48), (3.42, 0.40)],
        zones=[(2.62, 9, 'glass', None), (1.62, 2.62, 'paint', None), (0.92, 1.62, 'glass', None), (0, 0.92, 'paint', None)],
        ys=(2.62, 1.62, 0.92),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
