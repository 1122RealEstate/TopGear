# Cadillac Project GTP Hypercar / V-Series.R (2023) — LMDh: pontones delanteros con los faros en cuchilla
# vertical, habitáculo cerrado, aleta central, alerón de lado a lado, pilotos verticales, negro y oro con el 9.
import copy
P = inherit('f499p')
L = P['L']
GOLD, WHITE = 'c_c9a13b', 'c_f4f4f2'


def _rear(ctx):
    mb = ctx['mb']
    recess(ctx, [(0.12, 0.26), (0.72, 0.26), (0.72, 0.36), (0.64, 0.48), (0.48, 0.54), (0.26, 0.54), (0.14, 0.46)], 'rear', depth=0.4, walls='carbon',
           bottom='black', smooth=2, cell=0.035)
    exhaust_tips(ctx, [(0.0, 0.64, 'round', 0.1, 0.1)], bezel=0.01, bezel_depth=0.03)
    # pilotos verticales en cuchilla y barra fina bajo el alerón
    light_unit(ctx, [(0.84, 0.46), (0.90, 0.46), (0.90, 0.80), (0.84, 0.80)], 'rear', depth=0.02, lens='lensred', inside='taildark', smooth=1, cell=0.01)
    light_unit(ctx, [(-0.80, 0.77), (0.80, 0.77), (0.80, 0.785), (-0.80, 0.785)], 'rear', depth=0.012, lens='lensred', inside='taildark', mirror=False, cell=0.01)
    wing(mb, 0.40, 1.02, 0.34, 1.96, th=0.09, mat='carbon', angle=0.1, camber=0.06, plate_h=0.26, plate_mat='carbon')
    prism(mb, [(0.20, 0.78), (0.7, 0.79), (1.2, 0.86), (1.75, 0.97), (1.6, 1.03), (1.0, 1.035), (0.5, 1.04), (0.20, 1.04)], 'x', -0.007, 0.007, 'paint')


def _rear_in(ctx):
    lightbar(ctx, [(0.87, 0.48), (0.87, 0.78)], 0.02, 'rear', mat='led', raise_=0.012)
    lightbar(ctx, [(-0.78, 0.778), (0.78, 0.778)], 0.007, 'rear', mat='led', raise_=0.01, mirror=False)


def _side(ctx):
    side_windows(ctx, [(3.52, 0.74), (3.2, 0.93), (2.8, 1.01), (2.4, 1.0), (2.18, 0.92), (2.3, 0.80), (2.9, 0.77), (3.35, 0.74)])
    mirror_part(ctx['mb'], 0.78, 3.95, 0.86, w=0.11, h=0.05, d=0.07, stalk=0.04)
    side_stripe(ctx, [(3.3, 0.70), (2.4, 0.64), (1.5, 0.64), (0.6, 0.72)], 0.03, GOLD, graze=0.1)
    top_band(ctx, [(0.70, 3.45), (0.76, 3.45), (0.76, 4.85), (0.70, 4.85)], GOLD, mirror=True)
    number(ctx, '9', 1.78, 0.62, 0.24, 'side', mat=WHITE, stroke=0.17)
    recess(ctx, [(0.70, 3.52), (0.93, 3.55), (0.92, 3.74), (0.72, 3.72)], 'top', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)


def _front(ctx):
    mb = ctx['mb']
    recess(ctx, [(-0.46, 0.185), (0.46, 0.185), (0.42, 0.30), (-0.42, 0.30)], 'front', depth=0.4, walls='black', bottom='black', mirror=False, smooth=1, cell=0.03)
    # faros en cuchilla vertical en la cara exterior de cada pontón
    light_unit(ctx, [(0.84, 0.36), (0.905, 0.36), (0.905, 0.56), (0.84, 0.56)], 'front', depth=0.03, lens='lens', inside='black', smooth=1, cell=0.01)
    box(mb, -0.95, 0.95, 4.52, 5.02, 0.075, 0.095, 'carbon')
    prism(mb, [(4.55, 0.09), (4.99, 0.09), (4.93, 0.24), (4.65, 0.27)], 'x', 0.92, 0.93, 'carbon', mirror=True)
    led(ctx, [(0.0, 0.43), (0.05, 0.46), (0.04, 0.50), (0.0, 0.51), (-0.04, 0.50), (-0.05, 0.46)], 'front', mat=GOLD, raise_=0.003, mirror=False, cell=0.006)


def _front_in(ctx):
    lightbar(ctx, [(0.872, 0.38), (0.872, 0.54)], 0.02, 'front', mat='drl', raise_=0.025)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='gtp', color='#17181b', sec='#c9a13b', details=[_rear, _side, _front], inner=[_rear_in, _front_in])
SPEC['wheels'].update(caliper='#c9a13b', rim_color='#c9a13b')
