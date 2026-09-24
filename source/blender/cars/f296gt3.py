# Ferrari 296 GT3 (2023) — el GT3 de carreras sobre el 296: carrocería ensanchada y baja, splitter de
# carbono con canards, rejillas sobre las ruedas delanteras, gran alerón en cuello de cisne y bajos de carbono.
import copy
P = inherit('f296')
L = P['L']
HL = P['HL']


def _rear(ctx):
    mb = ctx['mb']
    for sd in (1, -1):
        light_unit(ctx, [(sd * 0.56, 0.80), (sd * 0.88, 0.815), (sd * 0.91, 0.84), (sd * 0.58, 0.83)], 'rear', depth=0.02, lens='lensred',
                   inside='taildark', mirror=False, smooth=1, cell=0.01)
    recess(ctx, [(-0.88, 0.19), (0.88, 0.19), (0.88, 0.56), (-0.88, 0.56)], 'rear', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.04)
    exhaust_tips(ctx, [(0.13, 0.62, 'round', 0.1, 0.1)], bezel=0.01, bezel_depth=0.03)
    diffuser(ctx, 0.72, 9, y_len=0.7, z_low=0.14)
    wing(mb, 0.52, 1.30, 0.40, 1.88, th=0.10, mat='carbon', angle=0.12, camber=0.08, plate_h=0.24, sweep=0.02)
    neck = [(0.86, 0.90), (0.66, 0.90), (0.54, 1.12), (0.46, 1.30), (0.40, 1.345), (0.30, 1.335), (0.26, 1.35), (0.32, 1.43), (0.46, 1.45),
            (0.58, 1.38), (0.72, 1.16), (0.82, 0.98)]
    prism(mb, smooth_poly(neck, 1), 'x', 0.33, 0.35, 'wing_carbon', mirror=True)


def _side(ctx):
    side_windows(ctx, [(3.0, 0.86), (2.58, 1.13), (2.20, 1.16), (1.82, 1.11), (1.60, 1.01), (1.80, 0.89), (2.4, 0.87)])
    door(ctx, [(1.84, 0.87), (1.86, 0.6), (1.89, 0.30), (2.98, 0.30), (3.0, 0.6), (3.02, 0.85)])
    recess(ctx, [(1.84, 0.86), (1.56, 0.90), (1.50, 0.74), (1.62, 0.66), (1.84, 0.70)], 'side', depth=0.06, walls='black', bottom='mesh', smooth=2,
           cell=0.02)
    # salida de aire tras la rueda delantera y taloneras de carbono
    recess(ctx, [(3.20, 0.44), (3.32, 0.48), (3.34, 0.76), (3.22, 0.74)], 'side', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    panel(ctx, [(1.2, 0.14), (3.2, 0.14), (3.15, 0.27), (1.24, 0.28)], 'side', 'carbon', cell=0.04)
    mirror_part(ctx['mb'], 0.74, 2.95, 0.91, w=0.14, h=0.07, d=0.09, stalk=0.07)
    recess(ctx, [(0.58, 3.45), (0.88, 3.47), (0.88, 3.90), (0.60, 3.88)], 'top', depth=0.03, walls='black', bottom='black', smooth=1, cell=0.02)


def _front(ctx):
    mb = ctx['mb']
    P['_front'](ctx)
    prism(mb, [(-0.98, 4.30), (0.98, 4.30), (0.96, 4.44), (0.76, 4.58), (0.40, 4.66), (-0.40, 4.66), (-0.76, 4.58), (-0.96, 4.44)], 'z', 0.085, 0.105, 'carbon')
    for z in (0.26, 0.34):
        prism(mb, [(0.86, 4.30), (1.02, 4.26), (1.02, 4.36), (0.88, 4.42)], 'z', z, z + 0.012, 'carbon', mirror=True)
    recess(ctx, [(-0.36, 4.10), (0.36, 4.10), (0.32, 4.30), (-0.32, 4.30)], 'top', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.02)


def _front_in(ctx):
    P['_front_in'](ctx)
    for y in (3.52, 3.59, 3.66, 3.73, 3.80):
        lightbar(ctx, [(0.60, y), (0.87, y + 0.01)], 0.022, 'top', mat='carbon', raise_=0.02)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='f296gt3', color='#d10a0a', sec='#15171b', details=[_rear, _side, _front], inner=[P['_rear_in'], _front_in], W=2.05)
SPEC['body']['width'] = [(y, w * 1.04) for (y, w) in SPEC['body']['width']]
SPEC['body']['bottom'] = [(y, z - 0.02) for (y, z) in SPEC['body']['bottom']]
SPEC['wheels'].update(r=0.345, dr=0.01, rim=0.2286, wf=0.30, wr=0.33, tf=1.76, tr=1.72, style='5', caliper='#d0d0d0', rim_color='#1b1c1f', lock=True)
SPEC['cabin']['zones'] = [(2.58, 9, 'glass', None), (1.9, 2.58, 'paint', None), (1.6, 1.9, 'glass', None), (0.3, 1.6, 'louver', None)]
