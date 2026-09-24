# Porsche 911 GT3 R (992, 2023) — el GT3 de carreras: carrocería ensanchada, splitter con aletas,
# canards, cuello de cisne más ancho y librea amarilla y negra con el dorsal 17.
import copy
P = inherit('gt3rs')
L = P['L']
TOPF = P['TOPF']


def race_kit(ctx):
    '''Splitter grande con canards (común a los 911 GT3 R).'''
    mb = ctx['mb']
    prism(mb, [(-0.96, 4.26), (0.96, 4.26), (0.94, 4.40), (0.74, 4.54), (0.40, 4.62), (-0.40, 4.62), (-0.74, 4.54), (-0.94, 4.40)], 'z', 0.085, 0.105, 'carbon')
    for z in (0.28, 0.36):
        prism(mb, [(0.86, 4.30), (1.0, 4.26), (1.0, 4.36), (0.88, 4.42)], 'z', z, z + 0.012, 'carbon', mirror=True)


def _rear(ctx):
    mb = ctx['mb']
    bar = [(-0.90, 0.772), (0.90, 0.772), (0.915, 0.80), (0.90, 0.823), (-0.90, 0.823), (-0.915, 0.80)]
    light_unit(ctx, bar, 'rear', depth=0.018, lens='lensred', inside='taildark', mirror=False, cell=0.02)
    recess(ctx, [(-0.88, 0.20), (0.88, 0.20), (0.88, 0.46), (-0.88, 0.46)], 'rear', depth=0.04, walls='black', bottom='mesh', mirror=False, cell=0.04)
    exhaust_tips(ctx, [(0.085, 0.33, 'round', 0.1, 0.1)], bezel=0.01, bezel_depth=0.03)
    diffuser(ctx, 0.7, 9, y_len=0.6, z_low=0.14)
    wing(mb, 0.54, 1.33, 0.40, 1.86, th=0.10, mat='carbon', angle=0.12, camber=0.08, plate_h=0.26, sweep=0.02)
    neck = [(0.86, 0.95), (0.66, 0.95), (0.54, 1.14), (0.46, 1.33), (0.40, 1.375), (0.30, 1.365), (0.26, 1.38), (0.32, 1.46), (0.46, 1.48),
            (0.58, 1.41), (0.72, 1.20), (0.82, 1.03)]
    prism(mb, smooth_poly(neck, 1), 'x', 0.29, 0.31, 'wing_carbon', mirror=True)


def _side(ctx):
    side_windows(ctx, [(2.78, 0.89), (2.44, 1.22), (2.05, 1.28), (1.6, 1.23), (1.3, 1.08), (1.45, 0.94), (2.1, 0.905)])
    door(ctx, [(1.72, 0.9), (1.74, 0.6), (1.77, 0.32), (2.80, 0.32), (2.81, 0.6), (2.83, 0.88)])
    recess(ctx, [(1.24, 0.64), (1.55, 0.70), (1.56, 0.80), (1.28, 0.78)], 'side', depth=0.04, walls='black', bottom='mesh', smooth=1, cell=0.03)
    recess(ctx, [(3.12, 0.46), (3.25, 0.50), (3.27, 0.78), (3.14, 0.76)], 'side', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.02)
    mirror_part(ctx['mb'], 0.73, 2.72, 0.93, w=0.14, h=0.07, d=0.09, stalk=0.07, mat='paint')
    recess(ctx, [(0.56, 3.30), (0.86, 3.32), (0.86, 3.72), (0.58, 3.70)], 'top', depth=0.03, walls='black', bottom='black', smooth=1, cell=0.02)
    # librea: bajos y taloneras negros, franjas negras en el capó y dorsal 17
    panel(ctx, [(0.35, 0.16), (4.3, 0.16), (4.2, 0.40), (3.2, 0.40), (2.9, 0.36), (1.4, 0.36), (1.0, 0.42), (0.35, 0.42)], 'side', 'sec', cell=0.04)
    top_band(ctx, [(0.12, 3.20), (0.26, 3.20), (0.30, 4.46), (0.16, 4.46)], 'sec', mirror=True)
    number(ctx, '17', 2.28, 0.62, 0.22, 'side', mat='sec', stroke=0.17)


def _front(ctx):
    P['_front'](ctx)
    race_kit(ctx)


B = copy.deepcopy(P['B'])
B['width'] = [(y, w * 1.035) for (y, w) in B['width']]
B['bottom'] = [(y, z - 0.02) for (y, z) in B['bottom']]

SPEC = dict(
    id='gt3r992', L=L, W=1.97, color='#d3da22', sec='#121316',
    wheels=dict(yf=3.55, yr=1.10, r=0.345, dr=0.012, drim=0.0, wf=0.30, wr=0.33, tf=1.70, tr=1.68, rim=0.2286, arch=0.395,
                style='10', caliper='#d0202a', rim_color='#1b1c1f', lock=True),
    body=B,
    cabin=copy.deepcopy(P['CABIN']),
    details=[_rear, _side, _front],
    inner=[P['_rear_in'], P['_front_in']],
)
SPEC['cabin']['zones'] = [(2.45, 9, 'glass', None), (1.62, 2.45, 'sec', None), (0.95, 1.62, 'glass', None), (0.55, 0.95, 'paint', None),
                          (0.22, 0.55, 'louver', None), (0, 0.22, 'paint', None)]
