# Lamborghini Huracán Super Trofeo EVO2 (2022) — el Huracán de la copa monomarca: ensanchado y bajo,
# toma de aire en el techo, splitter con canards, gran alerón, filos naranjas y el dorsal 63.
import copy
P = inherit('huracan')
L = P['L']
TOPF = P['TOPF']
ORG = 'c_ff7a1a'
WHITE = 'c_f4f4f2'


def _rear(ctx):
    mb = ctx['mb']
    P['_rear'](ctx)
    wing(mb, 0.42, 1.28, 0.38, 1.86, th=0.10, mat='carbon', angle=0.12, camber=0.08, plate_h=0.24, plate_mat='carbon')
    prism(mb, [(0.34, 0.92), (0.14, 0.92), (0.12, 1.24), (0.30, 1.25)], 'x', 0.36, 0.378, 'wing_carbon', mirror=True)


def _side(ctx):
    mb = ctx['mb']
    P['_side'](ctx)
    # toma de aire del techo (snorkel) sobre el habitáculo
    prism(mb, [(1.62, 1.08), (2.02, 1.14), (2.02, 1.26), (1.80, 1.25), (1.62, 1.14)], 'x', -0.14, 0.14, 'sec', smooth=True)
    box(mb, -0.12, 0.12, 2.021, 2.026, 1.155, 1.245, 'black')        # boca de la toma
    # librea: bajos negros con filo naranja y el 63
    panel(ctx, [(0.3, 0.14), (4.3, 0.14), (4.2, 0.36), (0.3, 0.36)], 'side', 'sec', cell=0.03, graze=0.1)
    side_stripe(ctx, [(0.3, 0.37), (4.25, 0.37)], 0.025, ORG, graze=0.1)
    number(ctx, '63', 2.55, 0.62, 0.22, 'side', mat=WHITE, stroke=0.17)


def _front(ctx):
    mb = ctx['mb']
    P['_front'](ctx)
    prism(mb, [(-0.98, 4.18), (0.98, 4.18), (0.96, 4.32), (0.76, 4.46), (0.40, 4.56), (-0.40, 4.56), (-0.76, 4.46), (-0.96, 4.32)], 'z', 0.09, 0.11, 'carbon')
    box(mb, -0.8, 0.8, 4.555, 4.565, 0.09, 0.11, ORG)
    for z in (0.28, 0.36):
        prism(mb, [(0.86, 4.18), (1.02, 4.14), (1.02, 4.24), (0.88, 4.30)], 'z', z, z + 0.012, 'carbon', mirror=True)
    recess(ctx, [(-0.30, 3.95), (0.30, 3.95), (0.26, 4.15), (-0.26, 4.15)], 'top', depth=0.05, walls='black', bottom='mesh', mirror=False, smooth=1, cell=0.02)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='huracanst', color='#8a9278', sec='#16181b', W=2.02, details=[_rear, _side, _front])
SPEC['body']['width'] = [(y, w * 1.04) for (y, w) in SPEC['body']['width']]
SPEC['body']['bottom'] = [(y, z - 0.02) for (y, z) in SPEC['body']['bottom']]
SPEC['wheels'].update(r=0.34, dr=0.01, rim=0.2286, wf=0.30, wr=0.33, tf=1.74, tr=1.70, style='10', caliper='#ff7a1a', rim_color='#1b1c1f', lock=True)
