# Ferrari 296 GTB Assetto Fiorano — 4.565 × 1.958 × 1.187 m, batalla 2.600 m
# Verde con dos franjas blancas y el dorsal 25: faros en lágrima con la «lágrima» que baja al paragolpes,
# parrilla ancha, techo negro, tomas altas tras las puertas, pilotos finos con el spoiler activo entre
# ellos y el gran escape central único.
import copy
P = inherit('f8')
L = P['L']
HL = along_y((-0.28, -0.85, -0.45), L - 0.1)
WHITE = 'c_f2f3f4'


def _rear(ctx):
    mb = ctx['mb']
    # pilotos finos en las esquinas altas y spoiler activo entre ellos
    for sd in (1, -1):
        light_unit(ctx, [(sd * 0.56, 0.80), (sd * 0.88, 0.815), (sd * 0.91, 0.84), (sd * 0.58, 0.83)], 'rear', depth=0.02, lens='lensred',
                   inside='taildark', mirror=False, smooth=1, cell=0.01)
    recess(ctx, [(-0.50, 0.835), (0.50, 0.835), (0.50, 0.855), (-0.50, 0.855)], 'rear', depth=0.05, walls='black', bottom='black', mirror=False, cell=0.02)
    # parte baja negra con el difusor y el escape central grande
    recess(ctx, [(-0.86, 0.21), (0.86, 0.21), (0.86, 0.50), (0.60, 0.56), (-0.60, 0.56), (-0.86, 0.50)], 'rear', depth=0.04, walls='black',
           bottom='mesh', mirror=False, smooth=1, cell=0.04)
    exhaust_tips(ctx, [(0.0, 0.62, 'oval', 0.20, 0.10)], bezel=0.012, bezel_depth=0.03)
    diffuser(ctx, 0.6, 7, y_len=0.6, z_low=0.17)


def _rear_in(ctx):
    for sd in (1, -1):
        lightbar(ctx, [(sd * 0.60, 0.815), (sd * 0.88, 0.826)], 0.008, 'rear', mat='led', raise_=0.012, mirror=False)


def _side(ctx):
    side_windows(ctx, [(3.0, 0.86), (2.58, 1.13), (2.20, 1.16), (1.82, 1.11), (1.60, 1.01), (1.80, 0.89), (2.4, 0.87)])
    door(ctx, [(1.84, 0.87), (1.86, 0.6), (1.89, 0.30), (2.98, 0.30), (3.0, 0.6), (3.02, 0.85)], handle=(1.95, 0.82, 2.08, 0.845))
    # toma alta en la aleta trasera, detrás de la puerta
    recess(ctx, [(1.84, 0.86), (1.56, 0.90), (1.50, 0.74), (1.62, 0.66), (1.84, 0.70)], 'side', depth=0.06, walls='black', bottom='mesh', smooth=2,
           cell=0.02)
    panel(ctx, [(1.3, 0.16), (3.15, 0.16), (3.1, 0.24), (1.34, 0.25)], 'side', 'black', cell=0.04)
    mirror_part(ctx['mb'], 0.74, 2.95, 0.91, w=0.15, h=0.07, d=0.1, stalk=0.04)
    # librea Assetto Fiorano: dos franjas blancas de punta a cola y el 25
    top_band(ctx, [(0.09, 0.0), (0.21, 0.0), (0.21, 4.7), (0.09, 4.7)], WHITE, mirror=True)
    number(ctx, '25', 2.42, 0.58, 0.24, 'side', mat=WHITE, stroke=0.16)


def _front(ctx):
    # parrilla ancha y baja, splitter negro
    recess(ctx, [(-0.62, 0.19), (0.62, 0.19), (0.66, 0.27), (0.56, 0.34), (-0.56, 0.34), (-0.66, 0.27)], 'front', depth=0.05, walls='black',
           bottom='mesh', mirror=False, smooth=1, cell=0.03)
    D(ctx, [(-0.92, 0.13), (0.92, 0.13), (0.92, 0.16), (-0.92, 0.16)], 'front', 'black', off=0.002, cell=0.03, mirror=False, avoid=(), graze=0.15)
    # faro en lágrima: arriba el grupo óptico, abajo la toma de freno negra
    light_unit(ctx, [(0.52, 0.50), (0.72, 0.505), (0.88, 0.535), (0.92, 0.56), (0.89, 0.585), (0.74, 0.565), (0.56, 0.535)], None, depth=0.05,
               lens='lens', inside='darkchrome', custom=HL, smooth=1, cell=0.01)
    recess(ctx, [(0.70, 0.30), (0.80, 0.31), (0.86, 0.46), (0.80, 0.49), (0.74, 0.44)], 'front', depth=0.05, walls='black', bottom='mesh', smooth=1, cell=0.015)


def _front_in(ctx):
    lightbar(ctx, [(0.56, 0.515), (0.72, 0.522), (0.86, 0.55), (0.895, 0.568)], 0.008, None, mat='drl', raise_=0.03, custom=HL)
    projector(ctx, 0.70, 0.535, 0.02, None, custom=HL, h=0.01)
    projector(ctx, 0.78, 0.545, 0.02, None, custom=HL, h=0.01)
    led(ctx, [(0.0, 0.40), (0.022, 0.42), (0.022, 0.45), (0.0, 0.46), (-0.022, 0.45), (-0.022, 0.42)], 'front', mat='c_f2c400', raise_=0.003,
        mirror=False, cell=0.006)


SPEC = copy.deepcopy(P['SPEC'])
SPEC.update(id='f296', color='#127a66', sec='#15171b', details=[_rear, _side, _front], inner=[_rear_in, _front_in])
SPEC['wheels'].update(r=0.34, dr=0.02, drim=0.0, style='10', caliper='#f2c400', rim_color='#1d1e21', lugs=5)
SPEC['cabin']['zones'] = [(2.58, 9, 'glass', None), (1.9, 2.58, 'sec', None), (1.6, 1.9, 'glass', None), (0.3, 1.6, 'louver', None)]
