# Ferrari Daytona SP3 (2022) — 4.686 × 2.050 × 1.142 m, batalla 2.651 m
# La trasera cubierta de lamas horizontales con el piloto como una línea fina debajo, el frontal con la
# «visera» negra de lado a lado que esconde los faros, techo targa negro y grandes tomas en las puertas.
import copy
P = inherit('laferrari')
L = P['L']


def _rear(ctx):
    # toda la trasera negra con las lamas; piloto en línea debajo; dos escapes en el centro
    recess(ctx, [(-0.90, 0.40), (0.90, 0.40), (0.93, 0.60), (0.90, 0.82), (-0.90, 0.82), (-0.93, 0.60)], 'rear', depth=0.06, walls='black',
           bottom='black', mirror=False, smooth=1, cell=0.04)
    light_unit(ctx, [(-0.88, 0.415), (0.88, 0.415), (0.88, 0.44), (-0.88, 0.44)], 'rear', depth=0.02, lens='lensred', inside='taildark',
               mirror=False, cell=0.02)
    recess(ctx, [(-0.84, 0.21), (0.84, 0.21), (0.88, 0.36), (-0.88, 0.36)], 'rear', depth=0.05, walls='black', bottom='mesh', mirror=False, cell=0.04)
    exhaust_tips(ctx, [(0.11, 0.30, 'round', 0.1, 0.1)], bezel=0.01, bezel_depth=0.03)
    P['diffuser'](ctx, 0.6, 7, y_len=0.65, z_low=0.16)


def _rear_in(ctx):
    for i in range(7):
        z = 0.47 + i * 0.05
        lightbar(ctx, [(-0.88, z), (0.88, z)], 0.022, 'rear', mat='paint', raise_=0.055, mirror=False)
    lightbar(ctx, [(-0.86, 0.428), (0.86, 0.428)], 0.012, 'rear', mat='led', raise_=0.012, mirror=False)


def _side(ctx):
    side_windows(ctx, [(3.0, 0.80), (2.54, 1.04), (2.18, 1.085), (1.80, 1.035), (1.62, 0.93), (1.88, 0.81), (2.5, 0.80)])
    door(ctx, [(1.86, 0.80), (1.89, 0.6), (1.93, 0.28), (3.0, 0.28), (3.02, 0.6), (3.04, 0.79)])
    # gran toma en la parte trasera de la puerta hacia la aleta
    recess(ctx, [(2.02, 0.74), (1.60, 0.80), (1.46, 0.66), (1.52, 0.44), (1.80, 0.42), (2.02, 0.52)], 'side', depth=0.07, walls='black',
           bottom='mesh', smooth=2, cell=0.02)
    # salida vertical tras la rueda delantera
    recess(ctx, [(3.18, 0.42), (3.30, 0.46), (3.32, 0.72), (3.20, 0.70)], 'side', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    panel(ctx, [(1.4, 0.16), (3.2, 0.16), (3.15, 0.24), (1.44, 0.25)], 'side', 'carbon', cell=0.04)
    mirror_part(ctx['mb'], 0.72, 2.95, 0.86, w=0.15, h=0.065, d=0.09, stalk=0.05)


def _front(ctx):
    # la visera: banda negra de lado a lado con los faros dentro
    recess(ctx, [(-0.90, 0.47), (0.90, 0.47), (0.92, 0.52), (0.88, 0.56), (-0.88, 0.56), (-0.92, 0.52)], 'front', depth=0.04, walls='black',
           bottom='black', mirror=False, smooth=1, cell=0.02)
    recess(ctx, [(-0.40, 0.18), (0.40, 0.18), (0.36, 0.30), (-0.36, 0.30)], 'front', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.03)
    recess(ctx, [(0.46, 0.19), (0.86, 0.21), (0.90, 0.36), (0.54, 0.33)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.03)


def _front_in(ctx):
    lightbar(ctx, [(0.40, 0.515), (0.88, 0.52)], 0.008, 'front', mat='drl', raise_=0.03)
    for x in (0.62, 0.72):
        projector(ctx, x, 0.505, 0.02, 'front', h=0.01)
    led(ctx, [(0.0, 0.40), (0.022, 0.42), (0.022, 0.45), (0.0, 0.46), (-0.022, 0.45), (-0.022, 0.42)], 'front', mat='c_f2c400', raise_=0.003,
        mirror=False, cell=0.006)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='sp3', color='#b8101c', sec='#141518', W=2.05, details=[_rear, _side, _front], inner=[_rear_in, _front_in])
SPEC['wheels'].update(style='5', caliper='#f2c400', rim_color='#c9ccd1')
SPEC['body']['width'] = [(y, w * 1.02) for (y, w) in SPEC['body']['width']]
SPEC['cabin']['zones'] = [(2.54, 9, 'glass', None), (1.9, 2.54, 'sec', None), (1.62, 1.9, 'glass', None), (0.2, 1.62, 'paint', None)]
