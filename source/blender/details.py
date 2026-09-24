'''Detalles reutilizables (cristales, pilotos, rejillas, difusor, escapes…).
Cada función recibe ctx = dict(S, L, tgt, mb, …) y añade geometría a ctx['mb'].'''
import math
from mathutils import Vector


def smooth_poly(poly, iters=2):
    '''Chaikin: redondea las esquinas de un polígono cerrado.'''
    pts = [tuple(p) for p in poly]
    for _ in range(iters):
        out = []
        n = len(pts)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            out.append((a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25))
            out.append((a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75))
        pts = out
    return pts


def ellipse(cx, cy, rx, ry, n=24, a0=0.0):
    return [(cx + math.cos(a0 + 2 * math.pi * i / n) * rx, cy + math.sin(a0 + 2 * math.pi * i / n) * ry) for i in range(n)]


def along(d, zr=0.0):
    '''Proyector oblicuo: (u, v) son X e Y sobre el plano Z = zr; rayo en dirección d.'''
    d = Vector(d).normalized()
    return (lambda u, v, L: Vector((u, v, zr)) - d * 20.0, d)


def along_y(d, yr):
    '''Proyector oblicuo: (u, v) son X y Z sobre el plano Y = yr.'''
    d = Vector(d).normalized()
    return (lambda u, v, L: Vector((u, yr, v)) - d * 20.0, d)


def D(ctx, poly, proj, mat, **kw):
    return decal(ctx['mb'], ctx['tgt'], poly, proj, mat, ctx['L'], **kw)


def densify(poly, step=0.03, closed=True):
    out = []
    n = len(poly)
    for i in range(n if closed else n - 1):
        a, b = Vector(poly[i]), Vector(poly[(i + 1) % n])
        k = max(1, int(math.ceil((b - a).length / step)))
        for j in range(k):
            q = a.lerp(b, j / k)
            out.append((q.x, q.y))
    if not closed:
        out.append(tuple(poly[-1]))
    return out


def side_windows(ctx, poly, frame=0.014, smooth=1, cell=0.025, top=0.022, bottom=0.012):
    '''Ventanilla lateral: marco negro + cristal proyectados solo sobre el habitáculo.
    El contorno se recorta a la franja válida del lateral del habitáculo
    (entre la línea de cintura y la arista del techo).'''
    C = ctx['S']['cabin']
    edge, belt = Curve(C['edge']), Curve(C['belt'])
    p = smooth_poly(poly, smooth) if smooth else poly
    p = densify(p, 0.02)
    p = [(y, clamp(z, belt(y) + bottom, edge(y) - top)) for (y, z) in p]
    # quita puntos repetidos tras el recorte
    q = []
    for pt in p:
        if not q or abs(pt[0] - q[-1][0]) + abs(pt[1] - q[-1][1]) > 1e-4:
            q.append(pt)
    fr = [(y, clamp(z, belt(y) + bottom * 0.3, edge(y) - top * 0.45)) for (y, z) in densify(offset_poly(q, -frame), 0.02)]
    tg = ctx['tgt_cab']
    decal(ctx['mb'], tg, fr, 'side', 'black', ctx['L'], off=0.0018, cell=cell, avoid=(), graze=0.03)
    decal(ctx['mb'], tg, q, 'side', 'glass', ctx['L'], off=0.0032, cell=cell, avoid=(), graze=0.03)


def lamp(ctx, poly, proj='rear', housing='taildark', lens='tail', rim=0.008, cell=0.012, mirror=True, raise_=0.004, smooth=0, custom=None):
    '''Piloto con carcasa oscura y lente emisiva en relieve.'''
    p = smooth_poly(poly, smooth) if smooth else poly
    if housing:
        D(ctx, offset_poly(p, -rim), proj, housing, off=0.002, cell=cell, mirror=mirror, avoid=(), custom=custom)
    if lens:
        D(ctx, p, proj, lens, off=0.003, cell=cell, mirror=mirror, raise_=raise_, avoid=(), custom=custom)


def panel(ctx, poly, proj, mat, cell=0.03, mirror=True, off=0.0022, smooth=0, **kw):
    p = smooth_poly(poly, smooth) if smooth else poly
    D(ctx, p, proj, mat, off=off, cell=cell, mirror=mirror, avoid=kw.pop('avoid', ()), **kw)


def exhausts(ctx, items, depth=0.3, y_tip=-0.018):
    '''items: [(x, z, forma, ancho, alto)] (lado derecho; se reflejan si x > 0).'''
    for (x, z, kind, w, h) in items:
        pts = shape_pts(kind, w, h, n=28)
        tube(ctx['mb'], pts, y_tip, depth, xc=x, zc=z, mirror=x > 0.001, wall=min(w, h) * 0.08, lip=0.0)


def diffuser(ctx, x_half, fins, y_len=0.62, z_low=0.16, thick=0.008, mat='matte', y0=0.05):
    '''Aletas verticales bajo la trasera; su borde superior entra en la carrocería.'''
    B = Curve(ctx['S']['body']['bottom'])
    for i in range(fins):
        x = -x_half + (2 * x_half) * (i + 0.5) / fins if fins > 1 else 0.0
        poly = [(y0, max(z_low + 0.03, B(y0) - 0.12)), (y_len, z_low), (y_len, B(y_len) + 0.02), (y_len * 0.5, B(y_len * 0.5) + 0.03), (y0, B(y0) + 0.03)]
        prism(ctx['mb'], poly, 'x', x - thick / 2, x + thick / 2, mat)


def fins_under(ctx, xs, y0, y1, z0, z1, thick=0.008, mat='carbon'):
    for x in xs:
        box(ctx['mb'], x - thick / 2, x + thick / 2, y0, y1, z0, z1, mat)


# ---------------------------------------------------------------- huecos reales
def _proj(proj, custom=None):
    if custom:
        return custom
    org, d = PROJ[proj]
    return org, Vector(d).normalized()


def recess(ctx, poly, proj='rear', depth=0.03, walls='black', bottom='mesh', mirror=True, cell=0.035, custom=None, smooth=0, out=0.06, reach=0.45):
    '''Hueco con profundidad uniforme tallado en la carrocería (booleana).
    El contorno se proyecta sobre la chapa; el fondo queda 'depth' más adentro
    en la dirección de proyección.'''
    p = smooth_poly(poly, smooth) if smooth else poly
    org, d = _proj(proj, custom)
    tgt, L, cb = ctx['tgt'], ctx['L'], ctx['cut']
    verts, tris = fill_polygon(p, cell)
    hits = []
    for (u, v) in verts:
        o = org(u, v, L)
        h = tgt.cast(o, d)
        hits.append((o, h[0] if h else None))
    lim = LIMITS.get(proj) if not custom else None
    if lim:
        hits = [(o, h if (h is not None and lim(h, L)) else None) for (o, h) in hits]
    ts = [(h - o).dot(d) for (o, h) in hits if h is not None]
    if ts:
        tmin = min(ts)
        hits = [(o, h if (h is not None and (h - o).dot(d) <= tmin + reach) else None) for (o, h) in hits]
    ok = [(o, h) for (o, h) in hits if h is not None]
    if not ok:
        return
    tavg = sum((h - o).dot(d) for (o, h) in ok) / len(ok)
    tops, bots = [], []
    for (o, h) in hits:
        t = (h - o).dot(d) if h is not None else tavg
        tops.append(o + d * (t - out))
        bots.append(o + d * (t + depth))
    # aristas de borde (usadas por un solo triángulo), en el sentido del triángulo
    cnt = {}
    for (a, b, c) in tris:
        for (i, j) in ((a, b), (b, c), (c, a)):
            k = (min(i, j), max(i, j))
            cnt[k] = cnt.get(k, 0) + 1
    for sd in ((1, -1) if mirror else (1,)):
        Sx = lambda q: Vector((q.x * sd, q.y, q.z))
        T = [cb.v(Sx(q)) for q in tops]
        B = [cb.v(Sx(q)) for q in bots]
        dd = Vector((d.x * sd, d.y, d.z))
        for (a, b, c) in tris:
            cb.f_out((T[a], T[b], T[c]), walls, -dd, smooth=False)
            cb.f_out((B[a], B[b], B[c]), bottom, dd, smooth=False)
        cen = {}
        for (a, b, c) in tris:
            for (i, j) in ((a, b), (b, c), (c, a)):
                if cnt[(min(i, j), max(i, j))] == 1:
                    cen[(i, j)] = (Sx(tops[a]) + Sx(tops[b]) + Sx(tops[c])) / 3
        for (i, j), cc in cen.items():
            mid = (Sx(tops[i]) + Sx(tops[j])) / 2
            o = mid - cc
            o -= dd * o.dot(dd)
            cb.f_out((T[i], T[j], B[j], B[i]), walls, o, smooth=False)


def strip(pts, w):
    '''Polígono fino alrededor de una polilínea 2D (para juntas y líneas).'''
    n = len(pts)
    left, right = [], []
    for i in range(n):
        p = Vector(pts[i])
        a = Vector(pts[max(0, i - 1)])
        b = Vector(pts[min(n - 1, i + 1)])
        t = (b - a).normalized()
        nn = Vector((-t.y, t.x))
        left.append(tuple(p + nn * w / 2))
        right.append(tuple(p - nn * w / 2))
    return left + right[::-1]


def gap_line(ctx, pts, proj='side', w=0.0045, mat='gap', mirror=True, custom=None, avoid=('glass', 'lens', 'lensred')):
    '''Junta de carrocería (puertas, capós) como línea fina sobre la chapa.'''
    D(ctx, strip(pts, w), proj, mat, off=0.0012, cell=0.012, mirror=mirror, avoid=avoid, custom=custom, graze=0.05)


def door(ctx, outline, handle=None, w=0.0045):
    '''Contorno de la puerta (lista de puntos Y, Z en el lateral, abierta) y manilla.'''
    gap_line(ctx, outline, 'side', w)
    if handle:
        (y0, z0, y1, z1) = handle
        recess(ctx, [(y0, z0), (y1, z0), (y1, z1), (y0, z1)], 'side', depth=0.012, walls='black', bottom='black', smooth=2, cell=0.006)


def circle_poly(cx, cy, r, n=24):
    return [(cx + math.cos(2 * math.pi * i / n) * r, cy + math.sin(2 * math.pi * i / n) * r) for i in range(n)]


def light_unit(ctx, poly, proj='rear', depth=0.022, lens='lensred', inside='taildark', mirror=True, custom=None, smooth=0, cell=0.015):
    '''Faro o piloto: hueco oscuro + lente transparente al ras de la chapa.
    Los elementos interiores (LED, lupas) se añaden en la 2ª pasada.'''
    p = smooth_poly(poly, smooth) if smooth else poly
    recess(ctx, p, proj, depth=depth, walls=inside, bottom=inside, mirror=mirror, cell=cell, custom=custom)
    if lens:
        D(ctx, p, proj, lens, off=0.0008, cell=cell, mirror=mirror, avoid=(), custom=custom, graze=0.02)


def led(ctx, poly, proj='rear', mat='led', mirror=True, custom=None, raise_=0.004, cell=0.012, smooth=0):
    '''Elemento emisivo dentro de un hueco (2ª pasada).'''
    p = smooth_poly(poly, smooth) if smooth else poly
    D(ctx, p, proj, mat, off=0.001, cell=cell, mirror=mirror, raise_=raise_, avoid=('lens', 'lensred'), custom=custom, graze=0.02)


def exhaust_tips(ctx, items, depth=0.3, y_tip=-0.012, bezel=0.018, bezel_depth=0.05):
    '''Escapes: hueco negro alrededor + boquilla con labio y tubo interior.
    items: [(x, z, forma, ancho, alto)] (x > 0 se refleja).'''
    for (x, z, kind, w, h) in items:
        m = x > 0.001
        outline = [(x + px, z + pz) for (px, pz) in shape_pts(kind, w + bezel * 2, h + bezel * 2, n=32)]
        recess(ctx, outline, 'rear', depth=bezel_depth, walls='black', bottom='black', mirror=m, cell=0.012)
        pts = shape_pts(kind, w, h, n=32)
        tube(ctx['mb'], pts, y_tip, depth, xc=x, zc=z, mirror=m, wall=max(0.004, min(w, h) * 0.07), lip=0.004)


def _frame(n):
    n = n.normalized()
    a = Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))
    t1 = n.cross(a).normalized()
    t2 = n.cross(t1).normalized()
    return n, t1, t2


def projector(ctx, u, v, r, proj='front', custom=None, h=0.012, ring=0.009, mirror=True, lens='glass', ring_mat='chrome', seg=24):
    '''Lupa de proyector 3D dentro de un faro (2ª pasada): aro cromado + cúpula de cristal.'''
    org, d = _proj(proj, custom)
    hit = ctx['tgt'].cast(org(u, v, ctx['L']), d)
    if not hit:
        return
    P, N, _ = hit
    if N.dot(d) > 0:
        N = -N
    N = (N * 0.4 - d * 0.6).normalized()       # mira hacia fuera, cerca de la dirección de proyección
    mb = ctx['mb']
    for sd in ((1, -1) if mirror else (1,)):
        S = lambda q: Vector((q.x * sd, q.y, q.z))
        n, t1, t2 = _frame(S(N))
        c = S(P)
        ro, ri = r + ring, r
        base_o = [mb.v(c + (t1 * math.cos(2 * math.pi * i / seg) + t2 * math.sin(2 * math.pi * i / seg)) * ro - n * 0.004) for i in range(seg)]
        top_o = [mb.v(c + (t1 * math.cos(2 * math.pi * i / seg) + t2 * math.sin(2 * math.pi * i / seg)) * ro + n * h) for i in range(seg)]
        top_i = [mb.v(c + (t1 * math.cos(2 * math.pi * i / seg) + t2 * math.sin(2 * math.pi * i / seg)) * ri + n * h) for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg
            radial = (t1 * math.cos(2 * math.pi * (i + 0.5) / seg) + t2 * math.sin(2 * math.pi * (i + 0.5) / seg))
            mb.f_out((base_o[i], base_o[j], top_o[j], top_o[i]), ring_mat, radial)
            mb.f_out((top_o[i], top_o[j], top_i[j], top_i[i]), ring_mat, n, smooth=False)
        # cúpula de la lente
        rows = [top_i]
        for k in range(1, 5):
            a = (math.pi / 2) * k / 4
            rr, hh = ri * math.cos(a), ri * 0.55 * math.sin(a)
            if k == 4:
                rows.append([mb.v(c + n * (h + hh))])
                break
            rows.append([mb.v(c + (t1 * math.cos(2 * math.pi * i / seg) + t2 * math.sin(2 * math.pi * i / seg)) * rr + n * (h + hh)) for i in range(seg)])
        for k in range(len(rows) - 1):
            A, B = rows[k], rows[k + 1]
            for i in range(seg):
                j = (i + 1) % seg
                if len(B) == 1:
                    mb.f_out((A[i], A[j], B[0]), lens, n)
                else:
                    mb.f_out((A[i], A[j], B[j], B[i]), lens, n)


def lightbar(ctx, pts, w, proj='front', mat='drl', raise_=0.02, custom=None, mirror=True):
    '''Guía de luz LED (tira) sobre el fondo de un faro o piloto (2ª pasada).'''
    led(ctx, strip(pts, w), proj, mat=mat, raise_=raise_, custom=custom, mirror=mirror, cell=0.01)


# ---------------------------------------------------------------- utilidades de forma
def abs_keys(secs):
    '''Secciones absolutas [(y, [(x, z)…])] -> curvas de techo/suelo/anchura y claves (u, v)
    para body(top=…, bottom=…, width=…, keys=…).'''
    top, bot, wid, keys = [], [], [], []
    for (y, pts) in secs:
        hw = max(p[0] for p in pts)
        zb = min(p[1] for p in pts)
        zt = max(p[1] for p in pts)
        top.append((y, zt))
        bot.append((y, zb))
        wid.append((y, hw))
        keys.append((y, [(p[0] / hw, (p[1] - zb) / (zt - zb)) for p in pts]))
    return top, bot, wid, keys


def chaikin_open(pts, iters=2):
    '''Chaikin para polilíneas abiertas (conserva los extremos).'''
    for _ in range(iters):
        out = [pts[0]]
        for a, b in zip(pts[:-1], pts[1:]):
            out.append((a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25))
            out.append((a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75))
        out.append(pts[-1])
        pts = out
    return pts


# ---------------------------------------------------------------- decoraciones de carreras
def side_stripe(ctx, pts, w, mat, mirror=True, avoid=('glass', 'lens', 'lensred'), **kw):
    '''Franja fina o ancha a lo largo del costado (pts en (Y, Z)).'''
    D(ctx, strip(pts, w), 'side', mat, off=kw.pop('off', 0.0024), cell=kw.pop('cell', min(0.02, max(0.006, w / 2))), mirror=mirror, avoid=avoid,
      graze=kw.pop('graze', 0.06), **kw)


def top_band(ctx, poly, mat, mirror=False, avoid=('glass', 'lens', 'lensred'), **kw):
    '''Banda vista desde arriba (capó, techo, cola): poly en (X, Y).'''
    D(ctx, poly, 'top', mat, off=kw.pop('off', 0.0024), cell=kw.pop('cell', 0.02), mirror=mirror, avoid=avoid, graze=kw.pop('graze', 0.08), **kw)


# números de dorsal con trazos (caja de 0,6 × 1)
DIGITS = {
    '0': [[(0.0, 0.15), (0.0, 0.85), (0.1, 1.0), (0.5, 1.0), (0.6, 0.85), (0.6, 0.15), (0.5, 0.0), (0.1, 0.0), (0.0, 0.15)]],
    '1': [[(0.14, 0.8), (0.36, 1.0), (0.36, 0.0)]],
    '2': [[(0.0, 0.84), (0.12, 1.0), (0.48, 1.0), (0.6, 0.85), (0.6, 0.62), (0.0, 0.0), (0.62, 0.0)]],
    '3': [[(0.0, 0.88), (0.12, 1.0), (0.48, 1.0), (0.6, 0.86), (0.6, 0.64), (0.46, 0.52), (0.2, 0.52)],
          [(0.46, 0.52), (0.6, 0.4), (0.6, 0.14), (0.48, 0.0), (0.12, 0.0), (0.0, 0.12)]],
    '4': [[(0.46, 0.0), (0.46, 1.0), (0.0, 0.32), (0.62, 0.32)]],
    '5': [[(0.58, 1.0), (0.06, 1.0), (0.02, 0.56), (0.42, 0.6), (0.6, 0.44), (0.6, 0.16), (0.46, 0.0), (0.12, 0.0), (0.0, 0.12)]],
    '6': [[(0.54, 0.96), (0.4, 1.0), (0.14, 1.0), (0.0, 0.82), (0.0, 0.14), (0.12, 0.0), (0.48, 0.0), (0.6, 0.14), (0.6, 0.42), (0.46, 0.56),
           (0.12, 0.56), (0.0, 0.44)]],
    '7': [[(0.0, 1.0), (0.62, 1.0), (0.22, 0.0)]],
    '8': [[(0.3, 0.54), (0.06, 0.66), (0.04, 0.86), (0.16, 1.0), (0.44, 1.0), (0.56, 0.86), (0.54, 0.66), (0.3, 0.54), (0.04, 0.4), (0.0, 0.14),
           (0.14, 0.0), (0.46, 0.0), (0.6, 0.14), (0.56, 0.4), (0.3, 0.54)]],
    '9': [[(0.6, 0.56), (0.48, 0.44), (0.12, 0.44), (0.0, 0.58), (0.0, 0.86), (0.14, 1.0), (0.46, 1.0), (0.6, 0.86), (0.6, 0.14), (0.46, 0.0),
           (0.2, 0.0), (0.06, 0.04)]],
}
DIGITS.update({
    ' ': [],
    'G': [[(0.6, 0.84), (0.48, 1.0), (0.12, 1.0), (0.0, 0.85), (0.0, 0.15), (0.12, 0.0), (0.48, 0.0), (0.6, 0.15), (0.6, 0.45), (0.32, 0.45)]],
    'T': [[(0.0, 1.0), (0.62, 1.0)], [(0.31, 1.0), (0.31, 0.0)]],
    'R': [[(0.0, 0.0), (0.0, 1.0), (0.46, 1.0), (0.6, 0.86), (0.6, 0.64), (0.46, 0.52), (0.0, 0.52)], [(0.3, 0.52), (0.62, 0.0)]],
    'S': [[(0.6, 0.86), (0.48, 1.0), (0.12, 1.0), (0.0, 0.86), (0.0, 0.66), (0.12, 0.54), (0.48, 0.46), (0.6, 0.34), (0.6, 0.14), (0.48, 0.0),
           (0.12, 0.0), (0.0, 0.14)]],
    'X': [[(0.0, 1.0), (0.62, 0.0)], [(0.62, 1.0), (0.0, 0.0)]],
    'V': [[(0.0, 1.0), (0.31, 0.0), (0.62, 1.0)]],
    'W': [[(0.0, 1.0), (0.14, 0.0), (0.31, 0.62), (0.48, 0.0), (0.62, 1.0)]],
    'C': [[(0.6, 0.85), (0.48, 1.0), (0.12, 1.0), (0.0, 0.85), (0.0, 0.15), (0.12, 0.0), (0.48, 0.0), (0.6, 0.15)]],
    'E': [[(0.6, 1.0), (0.0, 1.0), (0.0, 0.0), (0.6, 0.0)], [(0.0, 0.52), (0.45, 0.52)]],
    'P': [[(0.0, 0.0), (0.0, 1.0), (0.46, 1.0), (0.6, 0.86), (0.6, 0.62), (0.46, 0.5), (0.0, 0.5)]],
    'O': [[(0.0, 0.15), (0.0, 0.85), (0.12, 1.0), (0.48, 1.0), (0.6, 0.85), (0.6, 0.15), (0.48, 0.0), (0.12, 0.0), (0.0, 0.15)]],
    'I': [[(0.31, 0.0), (0.31, 1.0)]],
    'L': [[(0.0, 1.0), (0.0, 0.0), (0.6, 0.0)]],
    'N': [[(0.0, 0.0), (0.0, 1.0), (0.62, 0.0), (0.62, 1.0)]],
    'A': [[(0.0, 0.0), (0.31, 1.0), (0.62, 0.0)], [(0.12, 0.38), (0.5, 0.38)]],
    'M': [[(0.0, 0.0), (0.0, 1.0), (0.31, 0.5), (0.62, 1.0), (0.62, 0.0)]],
    'D': [[(0.0, 0.0), (0.0, 1.0), (0.4, 1.0), (0.62, 0.78), (0.62, 0.22), (0.4, 0.0), (0.0, 0.0)]],
    'B': [[(0.0, 0.0), (0.0, 1.0), (0.44, 1.0), (0.58, 0.88), (0.58, 0.64), (0.44, 0.52), (0.0, 0.52)], [(0.44, 0.52), (0.62, 0.4), (0.62, 0.12), (0.48, 0.0), (0.0, 0.0)]],
    'U': [[(0.0, 1.0), (0.0, 0.15), (0.12, 0.0), (0.48, 0.0), (0.6, 0.15), (0.6, 1.0)]],
    'H': [[(0.0, 0.0), (0.0, 1.0)], [(0.62, 0.0), (0.62, 1.0)], [(0.0, 0.52), (0.62, 0.52)]],
    'Z': [[(0.0, 1.0), (0.62, 1.0), (0.0, 0.0), (0.62, 0.0)]],
    'Y': [[(0.0, 1.0), (0.31, 0.5), (0.62, 1.0)], [(0.31, 0.5), (0.31, 0.0)]],
    'K': [[(0.0, 0.0), (0.0, 1.0)], [(0.6, 1.0), (0.0, 0.42)], [(0.18, 0.58), (0.62, 0.0)]],
    'F': [[(0.6, 1.0), (0.0, 1.0), (0.0, 0.0)], [(0.0, 0.52), (0.45, 0.52)]],
    'J': [[(0.6, 1.0), (0.6, 0.15), (0.48, 0.0), (0.12, 0.0), (0.0, 0.15)]],
    '-': [[(0.1, 0.5), (0.52, 0.5)]],
})
_FROM_LEFT = (lambda u, v, L: Vector((-20.0, u, v)), Vector((1, 0, 0)))


def number(ctx, txt, u, v, h, proj='side', mat='black', stroke=0.16, raise_=0.003, both=True, slant=0.0):
    '''Número de carreras legible desde fuera. proj 'side' (u = Y, v = Z; ambos costados),
    'front' / 'rear' (u = X, v = Z) o 'top' (u = X, v = Y; se lee desde delante).'''
    adv = 0.8 * h
    total = len(txt) * adv - 0.2 * h
    jobs = []
    for sd in ((1, -1) if (proj == 'side' and both) else (1,)):
        polys = []
        for i, ch in enumerate(txt):
            for line in DIGITS.get(ch.upper(), []):
                pts = []
                for (gx, gy) in line:
                    k = i * adv + (gx + slant * gy) * h
                    if proj == 'side':
                        pts.append((u - total / 2 + k, v - h / 2 + gy * h) if sd > 0 else (u + total / 2 - k, v - h / 2 + gy * h))
                    elif proj == 'front':
                        pts.append((u + total / 2 - k, v - h / 2 + gy * h))
                    elif proj == 'rear':
                        pts.append((u - total / 2 + k, v - h / 2 + gy * h))
                    else:
                        pts.append((u + total / 2 - k, v + h / 2 - gy * h))
                polys.append(strip(pts, stroke * h))
        jobs.append((sd, polys))
    for sd, polys in jobs:
        for poly in polys:
            if proj == 'side' and sd < 0:
                D(ctx, poly, None, mat, off=0.002, cell=min(0.008, stroke * h / 2), mirror=False, custom=_FROM_LEFT, avoid=(), graze=0.05, raise_=raise_)
            else:
                D(ctx, poly, proj, mat, off=0.002, cell=min(0.008, stroke * h / 2), mirror=False, avoid=(), graze=0.05, raise_=raise_)


def roundel(ctx, u, v, r, proj='side', mat='c_f4f4f2', mirror=True, n=36):
    '''Fondo redondo del dorsal.'''
    D(ctx, circle_poly(u, v, r, n), proj, mat, off=0.0018, cell=min(0.015, r / 4), mirror=mirror, avoid=('glass',), graze=0.05)


# ---------------------------------------------------------------- habitáculo abierto (barchettas, roadsters)
def open_cockpit(ctx, y0, y1, hw, depth=0.32, seats=(0.3,), wheel_y=None, smooth=2):
    '''Hueco del habitáculo abierto en la carrocería, con asientos y volante (el del
    conductor en seats[0]). y0 < y1 (y1 hacia delante).'''
    recess(ctx, [(-hw, y0), (hw, y0), (hw, y1), (-hw, y1)], 'top', depth=depth, walls='interior', bottom='interior', mirror=False,
           smooth=smooth, cell=0.03)
    tgt, mb = ctx['tgt'], ctx['mb']
    for i, sx in enumerate(seats):
        for sd in ((1, -1) if abs(sx) > 0.01 else (1,)):
            x = sd * sx
            h = tgt.cast(Vector((x, (y0 + y1) / 2, 20.0)), Vector((0, 0, -1)))
            ztop = h[0].z if h else 0.8
            zf = ztop - depth
            yb = y0 + 0.06
            prof = [(yb, zf), (yb + 0.5, zf), (yb + 0.5, zf + 0.1), (yb + 0.14, zf + 0.12), (yb + 0.06, zf + 0.62), (yb - 0.02, zf + 0.62)]
            prism(mb, prof, 'x', x - 0.2, x + 0.2, 'seat')
            if i == 0 and sd > 0 and wheel_y:
                ring(mb, (x, wheel_y, ztop - 0.04), 'y', 0.16, 0.013, 'black')
                box(mb, x - 0.02, x + 0.02, wheel_y, min(y1, wheel_y + 0.3), ztop - 0.07, ztop - 0.03, 'black')
