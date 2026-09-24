# Dodge Charger R/T (1970) con compresor — 5.28 × 1.95 × 1.35 m, batalla 2.97 m
# Muscle car negro: parrilla negra de lado a lado con los faros escondidos y marco cromado, el compresor
# con su toma asomando del capó, luna trasera entre contrafuertes, piloto de lado a lado y parachoques cromados.
L = 5.28

_TOP, _BOT, _WID, _KEYS = abs_keys([
    (0.0, [(0, 0.34), (0.82, 0.34), (0.92, 0.38), (0.955, 0.46), (0.965, 0.56), (0.965, 0.66), (0.955, 0.76), (0.935, 0.84), (0.88, 0.88),
           (0.66, 0.895), (0.33, 0.895), (0, 0.895)]),
    (1.14, [(0, 0.20), (0.86, 0.20), (0.95, 0.24), (0.975, 0.34), (0.98, 0.46), (0.98, 0.60), (0.975, 0.74), (0.96, 0.84), (0.90, 0.905),
            (0.68, 0.92), (0.34, 0.92), (0, 0.92)]),
    (2.2, [(0, 0.20), (0.84, 0.20), (0.93, 0.24), (0.955, 0.34), (0.96, 0.46), (0.96, 0.60), (0.955, 0.72), (0.94, 0.82), (0.88, 0.89),
           (0.66, 0.905), (0.33, 0.905), (0, 0.905)]),
    (3.2, [(0, 0.20), (0.84, 0.20), (0.93, 0.24), (0.955, 0.34), (0.96, 0.46), (0.96, 0.60), (0.955, 0.72), (0.94, 0.82), (0.88, 0.88),
           (0.66, 0.895), (0.33, 0.90), (0, 0.90)]),
    (4.11, [(0, 0.22), (0.86, 0.22), (0.95, 0.26), (0.975, 0.36), (0.98, 0.48), (0.98, 0.60), (0.975, 0.72), (0.96, 0.81), (0.90, 0.87),
            (0.68, 0.88), (0.34, 0.885), (0, 0.885)]),
    (5.28, [(0, 0.28), (0.80, 0.28), (0.90, 0.32), (0.935, 0.40), (0.94, 0.50), (0.94, 0.60), (0.935, 0.70), (0.92, 0.78), (0.86, 0.83),
            (0.64, 0.845), (0.32, 0.85), (0, 0.85)]),
])


def _rear(ctx):
    # piloto de lado a lado con marco cromado, parachoques cromado y dos escapes
    light_unit(ctx, [(-0.86, 0.62), (0.86, 0.62), (0.86, 0.74), (-0.86, 0.74)], 'rear', depth=0.025, lens='lensred', inside='taildark', mirror=False,
               cell=0.02)
    D(ctx, [(-0.92, 0.44), (0.92, 0.44), (0.92, 0.51), (-0.92, 0.51)], 'rear', 'chrome', off=0.003, cell=0.02, mirror=False, avoid=(), graze=0.1)
    exhaust_tips(ctx, [(0.55, 0.32, 'round', 0.08, 0.08)], bezel=0.004, bezel_depth=0.015)


def _rear_in(ctx):
    for sd in (1, -1):
        lightbar(ctx, [(sd * 0.20, 0.68), (sd * 0.82, 0.68)], 0.07, 'rear', mat='led', raise_=0.014, mirror=False)
    D(ctx, strip([(-0.87, 0.615), (0.87, 0.615)], 0.012), 'rear', 'chrome', off=0.003, cell=0.006, mirror=False, avoid=(), graze=0.05)
    D(ctx, strip([(-0.87, 0.745), (0.87, 0.745)], 0.012), 'rear', 'chrome', off=0.003, cell=0.006, mirror=False, avoid=(), graze=0.05)


def _side(ctx):
    side_windows(ctx, [(3.0, 0.96), (2.62, 1.30), (1.9, 1.33), (1.45, 1.26), (1.35, 1.0), (2.1, 0.96)])
    door(ctx, [(2.12, 0.92), (2.14, 0.6), (2.17, 0.26), (3.30, 0.26), (3.32, 0.6), (3.36, 0.90)], handle=(2.24, 0.84, 2.36, 0.86))
    mirror_part(ctx['mb'], 0.92, 3.18, 0.98, w=0.1, h=0.06, d=0.07, stalk=0.03, mat='chrome')
    side_stripe(ctx, [(0.3, 0.30), (5.0, 0.30)], 0.012, 'chrome', graze=0.1)


def _front(ctx):
    mb = ctx['mb']
    # la parrilla de lado a lado con los faros escondidos
    recess(ctx, [(-0.90, 0.50), (0.90, 0.50), (0.90, 0.76), (-0.90, 0.76)], 'front', depth=0.05, walls='chrome', bottom='mesh', mirror=False, cell=0.03)
    D(ctx, [(-0.94, 0.42), (0.94, 0.42), (0.94, 0.48), (-0.94, 0.48)], 'front', 'chrome', off=0.003, cell=0.02, mirror=False, avoid=(), graze=0.1)
    # el compresor con su toma asomando del capó
    box(mb, -0.17, 0.17, 3.30, 3.82, 0.86, 1.02, 'chrome')
    box(mb, -0.19, 0.19, 3.26, 3.86, 1.02, 1.06, 'darkchrome')
    box(mb, -0.14, 0.14, 3.40, 3.70, 1.06, 1.18, 'black')
    for x in (-0.08, 0.08):
        prism(mb, [(p[0] + x, p[1] + 3.55) for p in circle_pts(0.05, 16)], 'z', 1.18, 1.26, 'chrome')


def _front_in(ctx):
    for x in (0.0,):
        led(ctx, [(-0.08, 0.62), (0.08, 0.62), (0.08, 0.66), (-0.08, 0.66)], 'front', mat='c_d6202a', raise_=0.05, mirror=False, cell=0.006)


SPEC = dict(
    id='charger', L=L, W=1.95, color='#18191c', sec='#101113',
    wheels=dict(yf=4.11, yr=1.14, r=0.34, dr=0.01, wf=0.24, wr=0.27, tf=1.52, tr=1.52, rim=0.19, arch=0.37,
                style='5', caliper='#3a3a3c', rim_color='#c9ccd1', lugs=5),
    body=dict(top=_TOP, bottom=_BOT, width=_WID, keys=_KEYS, corners=(2, 7), mats={0: 'under', 1: 'under'}, r_rear=0.05, r_front=0.05,
              nose=[(0.28, 0.02), (0.40, 0.0), (0.76, 0.0), (0.85, 0.04)], nose_zone=0.35,
              nose_x=[(0.0, 0.0), (0.6, 0.01), (0.94, 0.06)],
              tail=[(0.34, 0.03), (0.44, 0.0), (0.89, 0.0)], tail_zone=0.3),
    cabin=dict(
        y0=0.9, y1=3.25,
        roof=[(0.9, 0.88), (1.1, 0.98), (1.35, 1.18), (1.55, 1.30), (1.9, 1.35), (2.35, 1.35), (2.6, 1.31), (2.85, 1.17), (3.05, 1.00), (3.25, 0.86)],
        edge=[(0.9, 0.875), (1.1, 0.965), (1.35, 1.16), (1.55, 1.28), (1.9, 1.325), (2.35, 1.325), (2.6, 1.285), (2.85, 1.15), (3.05, 0.985), (3.25, 0.85)],
        belt=[(0.9, 0.88), (1.6, 0.92), (2.6, 0.91), (3.1, 0.90), (3.25, 0.86)],
        wb=[(0.9, 0.72), (1.5, 0.78), (2.5, 0.80), (3.0, 0.78), (3.25, 0.74)],
        wt=[(0.9, 0.62), (1.5, 0.64), (2.4, 0.66), (2.9, 0.64), (3.25, 0.60)],
        zones=[(2.62, 9, 'glass', None), (1.55, 2.62, 'paint', None), (1.08, 1.55, 'glass', None), (0, 1.08, 'paint', None)],
        ys=(2.62, 1.55, 1.08),
    ),
    details=[_rear, _side, _front],
    inner=[_rear_in, _front_in],
)
