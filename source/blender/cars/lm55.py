# Mazda LM55 Vision Gran Turismo (2014) — prototipo de Le Mans soñado: pontones delanteros, boca en «ala» de
# Mazda con marco cromado, habitáculo cerrado, alerón y librea blanca con filos rojos y negros.
import copy
P = inherit('f499p')
L = P['L']
RED, WHITE = 'c_d6202a', 'c_f4f4f2'


def _side(ctx):
    side_windows(ctx, [(3.52, 0.74), (3.2, 0.93), (2.8, 1.01), (2.4, 1.0), (2.18, 0.92), (2.3, 0.80), (2.9, 0.77), (3.35, 0.74)])
    mirror_part(ctx['mb'], 0.78, 3.95, 0.86, w=0.11, h=0.05, d=0.07, stalk=0.04)
    side_stripe(ctx, [(3.35, 0.60), (2.6, 0.55), (1.6, 0.56), (0.6, 0.66)], 0.03, RED, graze=0.1)
    side_stripe(ctx, [(3.35, 0.64), (2.6, 0.59), (1.6, 0.60), (0.6, 0.70)], 0.012, 'black', graze=0.1)
    number(ctx, '55', 1.78, 0.62, 0.2, 'side', mat='black', stroke=0.16)
    recess(ctx, [(0.70, 3.52), (0.93, 3.55), (0.92, 3.74), (0.72, 3.72)], 'top', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)


def _front(ctx):
    mb = ctx['mb']
    # boca en forma de ala de Mazda bajo el morro
    wingmouth = [(-0.50, 0.30), (0.0, 0.22), (0.50, 0.30), (0.46, 0.36), (0.0, 0.30), (-0.46, 0.36)]
    recess(ctx, wingmouth, 'front', depth=0.3, walls='chrome', bottom='black', mirror=False, smooth=1, cell=0.015)
    recess(ctx, [(-0.40, 0.185), (0.40, 0.185), (0.36, 0.22), (-0.36, 0.22)], 'front', depth=0.3, walls='black', bottom='black', mirror=False, cell=0.02)
    light_unit(ctx, [(0.70, 0.46), (0.91, 0.44), (0.91, 0.50), (0.72, 0.52)], 'front', depth=0.03, lens='lens', inside='black', smooth=1, cell=0.01)
    box(mb, -0.95, 0.95, 4.52, 5.02, 0.075, 0.095, 'carbon')
    box(mb, -0.95, 0.95, 5.015, 5.025, 0.075, 0.095, RED)


def _front_in(ctx):
    lightbar(ctx, [(0.72, 0.475), (0.90, 0.465)], 0.01, 'front', mat='drl', raise_=0.025)
    led(ctx, ellipse(0.0, 0.40, 0.04, 0.025, 20), 'front', mat='chrome', raise_=0.003, mirror=False, cell=0.006)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='lm55', color='#eef0f3', sec='#1b1c1f', details=[P['_rear'], _side, _front], inner=[P['_rear_in'], _front_in])
SPEC['wheels'].update(caliper='#d6202a', rim_color='#1b1c1f')
