# Porsche 911 GT3 R (991.2, 2019) — blanco de fábrica: alerón sobre dos soportes, splitter y canards,
# franja «PORSCHE» en lo alto del parabrisas y llantas negras de tuerca central.
import copy
P = inherit('gt3r992')


def _rear(ctx):
    mb = ctx['mb']
    bar = [(-0.90, 0.772), (0.90, 0.772), (0.915, 0.80), (0.90, 0.823), (-0.90, 0.823), (-0.915, 0.80)]
    light_unit(ctx, bar, 'rear', depth=0.018, lens='lensred', inside='taildark', mirror=False, cell=0.02)
    recess(ctx, [(-0.88, 0.20), (0.88, 0.20), (0.88, 0.46), (-0.88, 0.46)], 'rear', depth=0.04, walls='black', bottom='mesh', mirror=False, cell=0.04)
    exhaust_tips(ctx, [(0.52, 0.32, 'round', 0.1, 0.1)], bezel=0.01, bezel_depth=0.03)
    diffuser(ctx, 0.7, 9, y_len=0.6, z_low=0.14)
    # alerón clásico sobre dos soportes que salen de la tapa del motor
    wing(mb, 0.40, 1.24, 0.40, 1.84, th=0.10, mat='c_f2f3f5', angle=0.12, camber=0.08, plate_h=0.22, plate_mat='carbon', sweep=0.0)
    prism(mb, [(0.30, 0.90), (0.12, 0.90), (0.10, 1.20), (0.26, 1.21)], 'x', 0.34, 0.358, 'wing_carbon', mirror=True)


def _side(ctx):
    side_windows(ctx, [(2.78, 0.89), (2.44, 1.22), (2.05, 1.28), (1.6, 1.23), (1.3, 1.08), (1.45, 0.94), (2.1, 0.905)])
    door(ctx, [(1.72, 0.9), (1.74, 0.6), (1.77, 0.32), (2.80, 0.32), (2.81, 0.6), (2.83, 0.88)])
    recess(ctx, [(1.24, 0.64), (1.55, 0.70), (1.56, 0.80), (1.28, 0.78)], 'side', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.03)
    recess(ctx, [(3.12, 0.46), (3.25, 0.50), (3.27, 0.78), (3.14, 0.76)], 'side', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    panel(ctx, [(1.4, 0.16), (3.1, 0.16), (3.06, 0.26), (1.44, 0.27)], 'side', 'carbon', cell=0.04)
    mirror_part(ctx['mb'], 0.73, 2.72, 0.93, w=0.14, h=0.07, d=0.09, stalk=0.07, mat='paint')
    recess(ctx, [(0.56, 3.30), (0.86, 3.32), (0.86, 3.72), (0.58, 3.70)], 'top', depth=0.03, walls='black', bottom='black', smooth=1, cell=0.02)
    # franja del parabrisas con el nombre
    top_band(ctx, [(-0.62, 2.36), (0.62, 2.36), (0.62, 2.50), (-0.62, 2.50)], 'sec', avoid=())
    number(ctx, 'PORSCHE', 0.0, 2.43, 0.075, 'top', mat='c_f2f3f5', stroke=0.17, raise_=0.004)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='gt3r', color='#f2f3f5', sec='#141518', details=[_rear, _side, P['_front']])
SPEC['wheels'].update(caliper='#f0c000', rim_color='#18191c')
SPEC['cabin']['zones'] = [(2.45, 9, 'glass', None), (1.62, 2.45, 'paint', None), (0.95, 1.62, 'glass', None), (0.55, 0.95, 'paint', None),
                          (0.22, 0.55, 'louver', None), (0, 0.22, 'paint', None)]
