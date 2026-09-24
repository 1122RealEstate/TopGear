'''
Top Gear · Supercar Legends — generador de coches para Blender (4.2+ / 5.x)
===========================================================================
Carrocería paramétrica por secciones, habitáculo, pasos de rueda, detalles
proyectados sobre la chapa (pilotos, cristales, rejillas…), piezas 3D
(escapes, alerones, difusor, retrovisores) y ruedas con la llanta de cada marca.

Unidades: metros. El coche mira hacia +Y: Y = 0 en la cola e Y = L en el morro;
X hacia la derecha (visto desde atrás) y Z hacia arriba (suelo en Z = 0).

Se ejecuta dentro de Blender:  exec(open('.../carlib.py').read())
'''
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils import geometry as mgeo


# ------------------------------------------------------------------ utilidades
def clamp(v, a, b):
    return a if v < a else b if v > b else v


def lerp(a, b, t):
    return a + (b - a) * t


def smoothstep(a, b, x):
    t = clamp((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


class Curve:
    '''Interpolación cúbica monótona (PCHIP) de puntos (x, y); fuera del rango
    devuelve el valor del extremo.'''

    def __init__(self, pts):
        if callable(pts):
            self.f = pts
            return
        self.f = None
        if not isinstance(pts, (list, tuple)):
            pts = [(0.0, float(pts))]
        pts = sorted((float(a), float(b)) for a, b in pts)
        self.x = [p[0] for p in pts]
        self.y = [p[1] for p in pts]
        n = len(pts)
        self.m = [0.0] * n
        if n < 2:
            return
        h = [max(1e-9, self.x[i + 1] - self.x[i]) for i in range(n - 1)]
        d = [(self.y[i + 1] - self.y[i]) / h[i] for i in range(n - 1)]
        if n == 2:
            self.m = [d[0], d[0]]
            return

        def edge(h0, h1, d0, d1):
            mm = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1)
            if mm * d0 <= 0:
                return 0.0
            if d0 * d1 <= 0 and abs(mm) > abs(3 * d0):
                return 3 * d0
            return mm

        m = [0.0] * n
        m[0] = edge(h[0], h[1], d[0], d[1])
        m[-1] = edge(h[-1], h[-2], d[-1], d[-2])
        for i in range(1, n - 1):
            if d[i - 1] * d[i] <= 0:
                m[i] = 0.0
            else:
                w1 = 2 * h[i] + h[i - 1]
                w2 = h[i] + 2 * h[i - 1]
                m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
        self.m = m

    def __call__(self, x):
        if self.f:
            return self.f(x)
        xs, ys, m = self.x, self.y, self.m
        n = len(xs)
        if n == 1 or x <= xs[0]:
            return ys[0]
        if x >= xs[-1]:
            return ys[-1]
        lo, hi = 0, n - 1
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if xs[mid] <= x:
                lo = mid
            else:
                hi = mid
        h = xs[hi] - xs[lo]
        t = (x - xs[lo]) / h
        t2 = t * t
        t3 = t2 * t
        return (2 * t3 - 3 * t2 + 1) * ys[lo] + (t3 - 2 * t2 + t) * h * m[lo] + (-2 * t3 + 3 * t2) * ys[hi] + (t3 - t2) * h * m[hi]


def cr(p0, p1, p2, p3, t, alpha=0.5):
    '''Catmull-Rom centrípeta entre p1 y p2 (vectores 2D o 3D).'''
    d12 = (p2 - p1).length
    if d12 < 1e-9:
        return p1.copy()
    t0 = 0.0
    t1 = t0 + max((p1 - p0).length, 1e-5) ** alpha
    t2 = t1 + d12 ** alpha
    t3 = t2 + max((p3 - p2).length, 1e-5) ** alpha
    tt = t1 + (t2 - t1) * t

    def L(a, b, ta, tb):
        return a + (b - a) * ((tt - ta) / (tb - ta))

    a1 = L(p0, p1, t0, t1)
    a2 = L(p1, p2, t1, t2)
    a3 = L(p2, p3, t2, t3)
    b1 = L(a1, a2, t0, t2)
    b2 = L(a2, a3, t1, t3)
    return L(b1, b2, t1, t2)


def dense_section(ctrl, corners, subs, mirror_ends=True):
    '''Muestrea una media sección [(x, z)] (de centro-abajo a centro-arriba)
    con Catmull-Rom. corners: índices con arista viva. subs: subdivisiones
    por tramo. Devuelve [(x, z, tramo, es_control)].'''
    N = len(ctrl)
    P = [Vector((c[0], c[1])) for c in ctrl]
    out = []
    for i in range(N - 1):
        p1, p2 = P[i], P[i + 1]
        if i == 0:
            p0 = Vector((-P[1].x, P[1].y)) if mirror_ends else 2 * p1 - p2
        elif i in corners:
            p0 = 2 * p1 - p2
        else:
            p0 = P[i - 1]
        if i + 1 == N - 1:
            p3 = Vector((-P[N - 2].x, P[N - 2].y)) if mirror_ends else 2 * p2 - p1
        elif (i + 1) in corners:
            p3 = 2 * p2 - p1
        else:
            p3 = P[i + 2]
        n = subs[i]
        for k in range(n):
            q = cr(p0, p1, p2, p3, k / n) if k else p1
            out.append((q.x, q.y, i, k == 0))
    out.append((P[-1].x, P[-1].y, N - 2, True))
    if mirror_ends:
        out[0] = (0.0, out[0][1], out[0][2], True)
        out[-1] = (0.0, out[-1][1], out[-1][2], True)
    return out


def full_ring(half):
    '''Media sección (x >= 0) -> anillo cerrado completo (derecha y espejo).'''
    ring = [(h[0], h[1], h[2], h[3], 1) for h in half]
    ring += [(-h[0], h[1], h[2], h[3], -1) for h in reversed(half[1:-1])]
    return ring


# ------------------------------------------------------------------ materiales
# nombre: (color, metálico, rugosidad, laca, emisión, intensidad)
MAT_DEF = {
    'paint': ((0.8, 0.1, 0.1), 0.0, 0.32, 1.0, None, 0),
    'sec': ((0.02, 0.02, 0.025), 0.0, 0.32, 1.0, None, 0),
    'stripe': ((0.92, 0.92, 0.92), 0.0, 0.32, 1.0, None, 0),
    'black': ((0.012, 0.012, 0.014), 0.0, 0.22, 0.7, None, 0),
    'matte': ((0.025, 0.025, 0.028), 0.0, 0.65, 0.0, None, 0),
    'carbon': ((0.035, 0.037, 0.042), 0.2, 0.3, 1.0, None, 0),
    'glass': ((0.012, 0.014, 0.018), 0.0, 0.04, 1.0, None, 0),
    'chrome': ((0.92, 0.92, 0.94), 1.0, 0.06, 0.0, None, 0),
    'rim': ((0.72, 0.73, 0.75), 1.0, 0.25, 0.3, None, 0),
    'rubber': ((0.035, 0.035, 0.038), 0.0, 0.85, 0.0, None, 0),
    'caliper': ((0.8, 0.05, 0.05), 0.0, 0.35, 0.6, None, 0),
    'disc': ((0.32, 0.32, 0.33), 1.0, 0.45, 0.0, None, 0),
    'tail': ((0.4, 0.0, 0.012), 0.0, 0.08, 1.0, (1.0, 0.02, 0.04), 3.0),
    'taildark': ((0.07, 0.0, 0.006), 0.0, 0.08, 1.0, None, 0),
    'reverse': ((0.8, 0.8, 0.82), 0.0, 0.08, 1.0, None, 0),
    'head': ((0.55, 0.57, 0.6), 1.0, 0.12, 1.0, None, 0),
    'drl': ((0.9, 0.95, 1.0), 0.0, 0.2, 1.0, (0.9, 0.95, 1.0), 4.0),
    'amber': ((0.7, 0.32, 0.0), 0.0, 0.1, 1.0, (1.0, 0.45, 0.0), 0.4),
    'mesh': ((0.018, 0.018, 0.02), 0.3, 0.45, 0.0, None, 0),
    'louver': ((0.02, 0.02, 0.024), 0.0, 0.35, 0.4, None, 0),
    'exhaust': ((0.6, 0.57, 0.54), 1.0, 0.22, 0.0, None, 0),
    'hole': ((0.0, 0.0, 0.0), 0.0, 1.0, 0.0, None, 0),
    'well': ((0.012, 0.012, 0.013), 0.0, 0.9, 0.0, None, 0),
    'under': ((0.02, 0.02, 0.022), 0.0, 0.8, 0.0, None, 0),
    'plate': ((0.85, 0.85, 0.82), 0.0, 0.4, 0.0, None, 0),
    'badge': ((0.9, 0.9, 0.92), 1.0, 0.08, 0.0, None, 0),
    'interior': ((0.03, 0.03, 0.035), 0.0, 0.7, 0.0, None, 0),
    'hidden': ((1.0, 0.0, 1.0), 0.0, 0.5, 0.0, None, 0),
    'lens': ((0.9, 0.92, 0.95), 0.0, 0.02, 1.0, None, 0),        # lente clara (transparente en el juego)
    'lensred': ((0.6, 0.02, 0.03), 0.0, 0.02, 1.0, None, 0),     # lente roja (transparente)
    'gap': ((0.004, 0.004, 0.005), 0.0, 0.9, 0.0, None, 0),       # juntas de puertas y capós
    'darkchrome': ((0.2, 0.21, 0.23), 1.0, 0.15, 0.0, None, 0),
    'led': ((1.0, 0.1, 0.12), 0.0, 0.2, 0.0, (1.0, 0.05, 0.08), 6.0),   # LED rojo (siempre algo encendido)
    'tread': ((0.02, 0.02, 0.022), 0.0, 0.95, 0.0, None, 0),
    'seat': ((0.05, 0.045, 0.045), 0.0, 0.6, 0.0, None, 0),
}
ALPHA = {'lens': 0.18, 'lensred': 0.55, 'glass': 0.72}
MAT_NAMES = list(MAT_DEF.keys())


def mat_def(name):
    '''Definición de un material: los de MAT_DEF, 'wing_<mat>' (pieza del alerón) y
    'c_RRGGBB' (pintura de decoración de color fijo: franjas, dorsales, libreas).'''
    if name in MAT_DEF:
        return MAT_DEF[name]
    if name.startswith('wing_'):
        return mat_def(name[5:])
    if name.startswith('c_') and len(name) == 8:
        return (hex_lin('#' + name[2:]), 0.0, 0.32, 1.0, None, 0)
    raise KeyError(name)


def get_mat(name, color=None, _done=set()):
    '''Material de Blender (para vistas previas); el juego usa su propia tabla.'''
    mname = 'tg_' + name
    m = bpy.data.materials.get(mname)
    if m is None:
        m = bpy.data.materials.new(mname)
        m.use_nodes = True
    if mname not in _done or color is not None:
        _done.add(mname)
        d = mat_def(name)
        bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        base = color if color is not None else d[0]
        bsdf.inputs['Base Color'].default_value = (*base, 1.0)
        bsdf.inputs['Metallic'].default_value = d[1]
        bsdf.inputs['Roughness'].default_value = d[2]
        if 'Coat Weight' in bsdf.inputs:
            bsdf.inputs['Coat Weight'].default_value = d[3]
            bsdf.inputs['Coat Roughness'].default_value = 0.03
        if d[4]:
            bsdf.inputs['Emission Color'].default_value = (*d[4], 1.0)
            bsdf.inputs['Emission Strength'].default_value = d[5]
        if name in ALPHA and name != 'glass':  # (los 'wing_*' nunca son transparentes)
            bsdf.inputs['Alpha'].default_value = ALPHA[name]
            try:
                m.surface_render_method = 'BLENDED'
            except Exception:
                pass
        m.diffuse_color = (*base, 1.0)
        m.use_backface_culling = True
    return m


def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_lin(h):
    h = h.lstrip('#')
    return tuple(srgb_to_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4))


# ------------------------------------------------------------------ mallas
class MB:
    '''Constructor de malla con índice de material por cara.'''

    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []            # nombres; índice = material_index

    def mi(self, name):
        if name not in self.mats:
            self.mats.append(name)
        return self.mats.index(name)

    def v(self, co):
        return self.bm.verts.new(co)

    def f(self, verts, mat, smooth=True):
        try:
            fc = self.bm.faces.new(verts)
        except ValueError:
            return None
        fc.material_index = self.mi(mat)
        fc.smooth = smooth
        return fc

    def f_out(self, verts, mat, out, smooth=True):
        '''Crea la cara con la normal hacia 'out' (Vector).'''
        n = Vector((0.0, 0.0, 0.0))
        k = len(verts)
        for i in range(k):
            a, b = verts[i].co, verts[(i + 1) % k].co
            n.x += (a.y - b.y) * (a.z + b.z)
            n.y += (a.z - b.z) * (a.x + b.x)
            n.z += (a.x - b.x) * (a.y + b.y)
        if n.dot(out) < 0:
            verts = list(verts)[::-1]
        return self.f(verts, mat, smooth)

    def tri_fan(self, center, ring, mat, flip=False, smooth=True):
        n = len(ring)
        for i in range(n):
            a, b = ring[i], ring[(i + 1) % n]
            self.f((center, b, a) if flip else (center, a, b), mat, smooth)

    def to_object(self, name, coll, recalc=True):
        bm = self.bm
        bm.verts.index_update()
        if recalc:
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        for n in self.mats:
            me.materials.append(get_mat(n))
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        return ob


def loft(mb, rings, mat_of, closed=True, sharp_idx=(), caps=(True, True), cap_mat='paint', smooth=True):
    '''rings: lista de anillos [(x, y, z, tramo)], todos del mismo tamaño.
    mat_of(tramo, y) -> nombre de material. Devuelve la matriz de vértices.'''
    V = [[mb.v((p[0], p[1], p[2])) for p in r] for r in rings]
    R = len(rings[0])
    faces = []
    for j in range(len(rings) - 1):
        a, b = V[j], V[j + 1]
        ym = (rings[j][0][1] + rings[j + 1][0][1]) * 0.5
        for k in range(R if closed else R - 1):
            k1 = (k + 1) % R
            seg = rings[j][k][3]
            if rings[j][k][4] < 0:          # lado izquierdo: el tramo es el del punto siguiente
                seg = rings[j][k1][3]
            fc = mb.f((a[k], b[k], b[k1], a[k1]), mat_of(seg, ym, rings[j][k][4]), smooth)
            if fc:
                faces.append(fc)
    for k in sharp_idx:
        for j in range(len(rings) - 1):
            e = mb.bm.edges.get((V[j][k], V[j + 1][k]))
            if e:
                e.smooth = False
    if caps[0]:
        c = mb.v(tuple(sum(p[i] for p in rings[0]) / R for i in range(3)))
        mb.tri_fan(c, V[0], cap_mat)
    if caps[1]:
        c = mb.v(tuple(sum(p[i] for p in rings[-1]) / R for i in range(3)))
        mb.tri_fan(c, V[-1], cap_mat, flip=True)
    return V


def stations(y0, y1, dy, extra=(), refine=()):
    '''Estaciones a lo largo de Y con paso dy, más puntos obligatorios y
    zonas de refinado [(ya, yb, dy2)].'''
    must = sorted({round(e, 5) for e in extra if y0 <= e <= y1} | {round(y0, 5), round(y1, 5)})
    cand = set()
    n = max(1, int(math.ceil((y1 - y0) / dy)))
    for i in range(n + 1):
        cand.add(round(y0 + (y1 - y0) * i / n, 5))
    for (a, b, d2) in refine:
        a, b = max(a, y0), min(b, y1)
        if b <= a:
            continue
        m = max(1, int(math.ceil((b - a) / d2)))
        for i in range(m + 1):
            cand.add(round(a + (b - a) * i / m, 5))
    out = list(must)
    for y in sorted(cand):
        if all(abs(y - q) > 0.006 for q in out):
            out.append(y)
    return sorted(out)


# ------------------------------------------------------------------ carrocería
def body_rings(S):
    '''Anillos de la carrocería inferior (chapa, sin habitáculo).'''
    B = S['body']
    L = S['L']
    top, bot, wid = Curve(B['top']), Curve(B['bottom']), Curve(B['width'])
    keys = B['keys']
    N = len(keys[0][1])
    U = [Curve([(ky, pts[i][0]) for ky, pts in keys]) for i in range(N)]
    Vv = [Curve([(ky, pts[i][1]) for ky, pts in keys]) for i in range(N)]
    corners = set(B.get('corners', ()))
    zdef = B.get('zdef')          # deformación opcional de alturas f(x, y, z)
    # inclinación del frontal y de la trasera: cuánto retrocede la cara a cada altura
    nose = Curve(B['nose']) if 'nose' in B else None
    tail = Curve(B['tail']) if 'tail' in B else None
    nz, tz = B.get('nose_zone', 0.45), B.get('tail_zone', 0.35)
    # planta: la cara frontal/trasera puede curvarse (flecha) según |x|
    nose_x = Curve(B['nose_x']) if 'nose_x' in B else None
    tail_x = Curve(B['tail_x']) if 'tail_x' in B else None

    def ctrl(y):
        hw, zb, zt = wid(y), bot(y), top(y)
        pts = []
        for i in range(N):
            x = 0.0 if i in (0, N - 1) else U[i](y) * hw
            pts.append((x, zb + Vv[i](y) * (zt - zb)))
        return pts

    ref = ctrl(L * 0.5)
    ds = B.get('ds', 0.04)
    subs = B.get('subs') or [max(1, round(math.dist(ref[i], ref[i + 1]) / ds)) for i in range(N - 1)]
    rr, rf = B.get('r_rear', 0.05), B.get('r_front', 0.09)
    fw, rw = S['wheels']['yf'], S['wheels']['yr']
    ra = S['wheels']['arch']
    main = stations(rr, L - rf, B.get('dy', 0.06), extra=B.get('ys', ()),
                    refine=[(rw - ra * 1.3, rw + ra * 1.3, 0.035), (fw - ra * 1.3, fw + ra * 1.3, 0.035)] + list(B.get('refine', ())))

    def make(y, delta=0.0, capf=None, yout=None):
        half = dense_section(ctrl(y), corners, subs)
        zb, zt = bot(y), top(y)
        cz = zb + (zt - zb) * B.get('cap_cz', 0.5)
        r_end = rr if y < L * 0.5 else rf
        ring = []
        for (x, z, seg, isc) in half:
            vx, vz = x, z - cz
            l = math.hypot(vx, vz) or 1e-9
            if capf is None:
                s = max(0.0, (l - delta) / l)
            else:
                s = max(0.0, (l - r_end) / l) * capf
            ring.append((vx * s, cz + vz * s, seg, isc))
        rg = full_ring([(p[0], p[1], p[2], p[3]) for p in ring])
        yy = y if yout is None else yout
        out = []
        for (x, z, seg, isc, side) in rg:
            yv = yy
            if nose and yv > L - nz:
                yv -= nose(z) * smoothstep(L - nz, L, yv)
            if nose_x and yv > L - nz:
                yv -= nose_x(abs(x)) * smoothstep(L - nz, L, yy)
            if tail and yv < tz:
                yv += tail(z) * smoothstep(tz, 0.0, yv)
            if tail_x and yy < tz:
                yv += tail_x(abs(x)) * smoothstep(tz, 0.0, yy)
            if zdef:
                z = zdef(x, yv, z)
            out.append((x, yv, z, seg, side))
        return out

    rings = []
    K = B.get('round_steps', 5)
    capn = B.get('cap_rings', 3)
    # tapa trasera (anillos concéntricos) y redondeo
    for c in range(1, capn + 1):
        rings.append(make(rr, capf=c / (capn + 1), yout=0.0))
    for k in range(K + 1):
        th = (k / K) * math.pi / 2
        d = rr * (1 - math.cos(th))
        rings.append(make(rr, delta=rr * (1 - math.sin(th)), yout=d))
    for y in main[1:-1]:
        rings.append(make(y))
    for k in range(K, -1, -1):
        th = (k / K) * math.pi / 2
        d = rf * (1 - math.cos(th))
        rings.append(make(L - rf, delta=rf * (1 - math.sin(th)), yout=L - d))
    for c in range(capn, 0, -1):
        rings.append(make(L - rf, capf=c / (capn + 1), yout=L))
    # índices densos de las aristas vivas
    sharp = []
    acc = 0
    idx_of_ctrl = [0]
    for s in subs:
        acc += s
        idx_of_ctrl.append(acc)
    R = len(rings[0])
    for c in corners:
        k = idx_of_ctrl[c]
        sharp.append(k)
        if 0 < k < idx_of_ctrl[-1]:
            sharp.append(R - k)
    return rings, sharp, subs


def build_body(S, mb):
    B = S['body']
    segm = B.get('mats', {})
    rear_mat = B.get('rear_mat', 'paint')
    rings, sharp, subs = body_rings(S)
    split = B.get('mat_fn')

    def mat_of(seg, y, side):
        if split:
            m = split(seg, y, side)
            if m:
                return m
        return segm.get(seg, 'paint')
    V = loft(mb, rings, mat_of, closed=True, sharp_idx=sharp, cap_mat=rear_mat)
    return V


def canopy_rings(S):
    C = S['cabin']
    roof, edge, belt = Curve(C['roof']), Curve(C['edge']), Curve(C['belt'])
    wb, wt = Curve(C['wb']), Curve(C['wt'])
    bulge = Curve(C.get('bulge', 0.012))
    pil = C.get('pillar', 0.05)
    tumble = C.get('tumble', 0.5)

    def ctrl(y):
        zb, zr, ze = belt(y), roof(y), edge(y)
        ze = min(ze, zr - 0.002)
        hb, ht = wb(y), wt(y)
        bg = bulge(y)
        base = min(zb, ze) - 0.12
        h = ze - zb
        return [
            (0.0, base), (hb + 0.004, base), (hb, zb),
            (lerp(hb, ht, tumble * 0.9) + bg, zb + h * 0.45),
            (lerp(hb, ht, 0.94) + bg * 0.25, zb + h * 0.94),
            (ht, ze),
            (max(0.02, ht - pil), ze + (zr - ze) * 0.3),
            (ht * 0.52, ze + (zr - ze) * 0.9),
            (0.0, zr),
        ]
    subs = C.get('subs', [1, 1, 3, 4, 1, 2, 3, 3])
    corners = set(C.get('corners', (1, 2, 5)))
    ys = stations(C['y0'], C['y1'], C.get('dy', 0.05), extra=C.get('ys', ()), refine=C.get('refine', ()))
    rings = []
    for y in ys:
        half = dense_section(ctrl(y), corners, subs)
        rings.append([(x, y, z, seg, side) for (x, z, seg, isc, side) in full_ring(half)])
    return rings, subs


def build_canopy(S, mb):
    C = S['cabin']
    zones = C['zones']        # [(y_desde, y_hasta, material_centro)]
    pillar_mat = C.get('pillar_mat', 'paint')
    side_mat = C.get('side_mat', 'paint')
    rings, subs = canopy_rings(S)

    def mat_of(seg, y, side):
        if seg == 0:
            return 'hidden'
        if seg in (1, 2, 3, 4):
            return side_mat
        if seg == 5:
            for (a, b, m, pm) in zones:
                if a <= y <= b and pm:
                    return pm
            return pillar_mat
        for (a, b, m, pm) in zones:
            if a <= y <= b:
                return m
        return 'paint'
    loft(mb, rings, mat_of, closed=True, cap_mat='hidden')


# ------------------------------------------------------------------ booleanas
def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)


def cut_arches(ob, S, coll):
    W = S['wheels']
    mb = MB()
    wmi = mb.mi('well')
    for (y, tw, tr) in ((W['yf'], W['wf'], W['tf']), (W['yr'], W['wr'], W['tr'])):
        r = W['arch']
        x_in = tr / 2 - tw / 2 - W.get('well_in', 0.07)
        x_out = S['W'] / 2 + 0.3
        for sd in (1, -1):
            m = Matrix.Translation((sd * (x_in + x_out) / 2, y, W['r'] + W.get('arch_dz', 0.0))) @ Matrix.Rotation(math.pi / 2, 4, 'Y')
            geo = bmesh.ops.create_cone(mb.bm, cap_ends=True, segments=56, radius1=r, radius2=r, depth=x_out - x_in, matrix=m)
            for f in {f for v in geo['verts'] for f in v.link_faces}:
                f.material_index = wmi
                f.smooth = True
    cut = mb.to_object(ob.name + '_cut', coll)
    mod = ob.modifiers.new('arches', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.material_mode = 'TRANSFER'
    mod.use_self = bool(S['body'].get('extra'))    # piezas solapadas dentro de la chapa
    mod.object = cut
    apply_modifiers(ob)
    bpy.data.objects.remove(cut)


# ------------------------------------------------------------------ proyección
class Target:
    '''BVH de varias mallas (espacio mundo) con el material de cada cara.'''

    def __init__(self, obs):
        verts, polys, pm = [], [], []
        for ob in obs:
            me = ob.data
            mw = ob.matrix_world
            base = len(verts)
            verts += [mw @ v.co for v in me.vertices]
            for p in me.polygons:
                polys.append([base + i for i in p.vertices])
                slot = me.materials[p.material_index] if p.material_index < len(me.materials) else None
                pm.append(slot.name[3:] if slot else 'paint')
        self.bvh = BVHTree.FromPolygons(verts, polys)
        self.pm = pm

    def cast(self, o, d, dist=50.0):
        loc, nor, idx, _ = self.bvh.ray_cast(o, d, dist)
        if loc is None:
            return None
        return loc, nor, self.pm[idx]


def clip_poly(poly, x0, y0, x1, y1):
    def clip(pts, inside, inter):
        out = []
        n = len(pts)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            ia, ib = inside(a), inside(b)
            if ia:
                out.append(a)
                if not ib:
                    out.append(inter(a, b))
            elif ib:
                out.append(inter(a, b))
        return out

    def ix(a, b, x):
        t = (x - a[0]) / (b[0] - a[0])
        return (x, a[1] + (b[1] - a[1]) * t)

    def iy(a, b, y):
        t = (y - a[1]) / (b[1] - a[1])
        return (a[0] + (b[0] - a[0]) * t, y)
    p = poly
    for inside, inter in ((lambda q: q[0] >= x0, lambda a, b: ix(a, b, x0)), (lambda q: q[0] <= x1, lambda a, b: ix(a, b, x1)),
                          (lambda q: q[1] >= y0, lambda a, b: iy(a, b, y0)), (lambda q: q[1] <= y1, lambda a, b: iy(a, b, y1))):
        if len(p) < 3:
            return []
        p = clip(p, inside, inter)
    return p


def fill_polygon(poly, cell):
    '''Triangula un polígono 2D en una rejilla (para que siga la curvatura).
    Devuelve (vértices [(u, v)], triángulos [(i, j, k)], bordes {(i, j)}).'''
    us = [p[0] for p in poly]
    vs = [p[1] for p in poly]
    u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
    nu = max(1, int(math.ceil((u1 - u0) / cell)))
    nv = max(1, int(math.ceil((v1 - v0) / cell)))
    du, dv = (u1 - u0) / nu, (v1 - v0) / nv
    verts, index, tris = [], {}, []

    def vid(p):
        key = (round(p[0], 6), round(p[1], 6))
        i = index.get(key)
        if i is None:
            i = len(verts)
            index[key] = i
            verts.append(key)
        return i
    for i in range(nu):
        for j in range(nv):
            piece = clip_poly(poly, u0 + i * du, v0 + j * dv, u0 + (i + 1) * du, v0 + (j + 1) * dv)
            if len(piece) < 3:
                continue
            ids = [vid(p) for p in piece]
            clean = []
            for q in ids:
                if not clean or clean[-1] != q:
                    clean.append(q)
            if len(clean) > 1 and clean[0] == clean[-1]:
                clean.pop()
            if len(clean) < 3:
                continue
            pts3 = [Vector((verts[q][0], verts[q][1], 0.0)) for q in clean]
            for t in mgeo.tessellate_polygon([pts3]):
                a, b, c = clean[t[0]], clean[t[1]], clean[t[2]]
                if a != b and b != c and a != c:
                    tris.append((a, b, c))
    return verts, tris


def poly_area(poly):
    a = 0.0
    for i in range(len(poly)):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % len(poly)]
        a += x0 * y1 - x1 * y0
    return a * 0.5


# zona válida de cada proyección (evita impactos dentro del coche o en el otro extremo)
LIMITS = {
    'rear': lambda p, L: p.y < 0.9,
    'front': lambda p, L: p.y > L - 0.9,
    'side': lambda p, L: abs(p.x) > 0.3,
    'top': lambda p, L: p.z > 0.25,
}

PROJ = {
    # u, v -> origen del rayo; dirección
    'side': (lambda u, v, L: Vector((20.0, u, v)), Vector((-1, 0, 0))),
    'rear': (lambda u, v, L: Vector((u, -20.0, v)), Vector((0, 1, 0))),
    'front': (lambda u, v, L: Vector((u, L + 20.0, v)), Vector((0, -1, 0))),
    'top': (lambda u, v, L: Vector((u, v, 20.0)), Vector((0, 0, -1))),
    'bottom': (lambda u, v, L: Vector((u, v, -20.0)), Vector((0, 0, 1))),
}


def decal(mb, tgt, poly, proj, mat, L, off=0.0025, cell=0.03, mirror=True, only=None, avoid=('glass',), raise_=0.0, base=None, custom=None, graze=0.12, reach=0.45):
    '''Proyecta un polígono 2D sobre la carrocería y crea una capa fina.
    proj: 'side' (u = Y, v = Z, desde +X) · 'rear' (u = X, v = Z) · 'front' ·
    'top' (u = X, v = Y) · o custom=(origen(u, v, L), dirección).
    mirror: duplica en el lado izquierdo (x -> -x).
    raise_: relieve extra sobre la chapa (crea paredes laterales).'''
    if custom:
        org, d = custom
    else:
        org, d = PROJ[proj]
    d = Vector(d).normalized()
    verts, tris = fill_polygon(poly, cell)
    pos, bpos, nrm = [], [], []
    # alcance: descarta impactos mucho más hondos que el más cercano (rayos que
    # pasan por encima de la chapa y caen lejos, p. ej. sobre el capó)
    hits = [tgt.cast(org(u, v, L), d) for (u, v) in verts]
    ts = [(h[0] - org(u, v, L)).dot(d) for h, (u, v) in zip(hits, verts) if h is not None]
    tmin = min(ts) if ts else 0.0
    lim = LIMITS.get(proj) if not custom else None
    for (u, v), h in zip(verts, hits):
        if h is not None and (h[0] - org(u, v, L)).dot(d) > tmin + reach:
            h = None
        if h is not None and lim and not lim(h[0], L):
            h = None
        if h is None or (only and h[2] not in only) or (avoid and h[2] in avoid):
            pos.append(None)
            bpos.append(None)
            nrm.append(None)
            continue
        loc, nor, _ = h
        if nor.dot(d) > 0:
            nor = -nor
        if -nor.dot(d) < graze:
            pos.append(None)
            bpos.append(None)
            nrm.append(None)
            continue
        pos.append(loc + nor * (off + raise_))
        bpos.append(loc + nor * (base if base is not None else -0.002))
        nrm.append(nor)
    count = 0
    for sd in ((1, -1) if mirror else (1,)):
        S = lambda p: Vector((p.x * sd, p.y, p.z))
        vv = [mb.v(S(p)) if p is not None else None for p in pos]
        edges = {}
        for (a, b, c) in tris:
            if vv[a] is None or vv[b] is None or vv[c] is None:
                continue
            nav = nrm[a] + nrm[b] + nrm[c]
            fc = mb.f_out((vv[a], vv[b], vv[c]), mat, Vector((nav.x * sd, nav.y, nav.z)))
            if fc:
                count += 1
                cen = (S(pos[a]) + S(pos[b]) + S(pos[c])) / 3
                for (i, j) in ((a, b), (b, c), (c, a)):
                    k = (min(i, j), max(i, j))
                    if k in edges:
                        edges[k] = None
                    else:
                        edges[k] = cen
        if raise_ > 0:
            bv = {}
            for (i, j), cen in edges.items():
                if cen is None or bpos[i] is None or bpos[j] is None:
                    continue
                for q in (i, j):
                    if q not in bv:
                        bv[q] = mb.v(S(bpos[q]))
                mid = (S(pos[i]) + S(pos[j])) / 2
                mb.f_out((vv[i], vv[j], bv[j], bv[i]), mat, mid - cen, smooth=False)
    return count


# ------------------------------------------------------------------ piezas
def shape_pts(kind, w, h, n=28, r=None):
    '''Contorno 2D centrado (antihorario): 'round', 'oval', 'rect' (redondeado), 'hex', 'trap'.'''
    pts = []
    if kind in ('round', 'oval'):
        for i in range(n):
            a = 2 * math.pi * i / n
            pts.append((math.cos(a) * w / 2, math.sin(a) * h / 2))
    elif kind == 'hex':
        for i in range(6):
            a = 2 * math.pi * i / 6
            pts.append((math.cos(a) * w / 2, math.sin(a) * h / 2))
    elif kind == 'trap':
        pts = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2 * 0.8, h / 2), (-w / 2 * 0.8, h / 2)]
    else:
        rr = min(w, h) * 0.3 if r is None else min(r, w / 2 - 1e-4, h / 2 - 1e-4)
        k = max(2, n // 4)
        for (cx, cy, a0) in ((w / 2 - rr, -h / 2 + rr, -90), (w / 2 - rr, h / 2 - rr, 0), (-w / 2 + rr, h / 2 - rr, 90), (-w / 2 + rr, -h / 2 + rr, 180)):
            for i in range(k + 1):
                a = math.radians(a0 + 90 * i / k)
                pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return pts


def tube(mb, pts2, y_tip, depth, mat_out='exhaust', mat_in='hole', wall=0.006, xc=0.0, zc=0.0, mirror=False, lip=0.0):
    '''Salida de escape: tubo a lo largo de +Y (hacia dentro del coche) con
    pared, borde y fondo negro. pts2: contorno (x, z) relativo a (xc, zc).'''
    cx = sum(p[0] for p in pts2) / len(pts2)
    cz = sum(p[1] for p in pts2) / len(pts2)
    n = len(pts2)
    for sd in ((1, -1) if mirror else (1,)):
        X = lambda q: sd * (xc + q)
        outer, inner, back_o, back_i = [], [], [], []
        dirs = []
        for (x, z) in pts2:
            dx, dz = x - cx, z - cz
            l = math.hypot(dx, dz) or 1e-9
            ux, uz = dx / l, dz / l
            dirs.append(Vector((sd * ux, 0.0, uz)))
            outer.append(mb.v((X(x + ux * lip), y_tip, zc + z + uz * lip)))
            inner.append(mb.v((X(x - ux * wall), y_tip, zc + z - uz * wall)))
            back_o.append(mb.v((X(x), y_tip + depth, zc + z)))
            back_i.append(mb.v((X(x - ux * wall), y_tip + depth * 0.35, zc + z - uz * wall)))
        for i in range(n):
            j = (i + 1) % n
            out = dirs[i] + dirs[j]
            mb.f_out((outer[i], outer[j], back_o[j], back_o[i]), mat_out, out)
            mb.f_out((inner[i], inner[j], back_i[j], back_i[i]), mat_out, -out)
            mb.f_out((outer[i], outer[j], inner[j], inner[i]), mat_out, Vector((0, -1, 0)), smooth=False)
        c = mb.v((sd * (xc + cx), y_tip + depth * 0.35, zc + cz))
        for i in range(n):
            j = (i + 1) % n
            mb.f_out((c, back_i[i], back_i[j]), mat_in, Vector((0, -1, 0)))


def box(mb, x0, x1, y0, y1, z0, z1, mat, mirror=False, smooth=False):
    for sd in ((1, -1) if mirror else (1,)):
        xa, xb = sorted((x0 * sd, x1 * sd))
        v = [mb.v(p) for p in ((xa, y0, z0), (xb, y0, z0), (xb, y1, z0), (xa, y1, z0), (xa, y0, z1), (xb, y0, z1), (xb, y1, z1), (xa, y1, z1))]
        for q in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
            mb.f([v[i] for i in q], mat, smooth)


def orient_ccw(pts, tris):
    out = []
    for t in tris:
        a, b, c = pts[t[0]], pts[t[1]], pts[t[2]]
        if (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0:
            t = (t[0], t[2], t[1])
        out.append(t)
    return out


def prism(mb, poly, axis, a0, a1, mat, mirror=False, smooth=False, cap0=True, cap1=True, mats=None):
    '''Extruye un polígono 2D. axis 'x': poly en (y, z), extrusión en X de a0 a a1;
    'y': poly en (x, z), extrusión en Y; 'z': poly en (x, y), extrusión en Z.'''
    if poly_area(poly) < 0:
        poly = poly[::-1]
    mats = mats or {}
    n = len(poly)
    tris = orient_ccw(poly, mgeo.tessellate_polygon([[Vector((p[0], p[1], 0)) for p in poly]]))
    for sd in ((1, -1) if mirror else (1,)):
        def P(p, a):
            if axis == 'x':
                return Vector((a * sd, p[0], p[1]))
            if axis == 'y':
                return Vector((p[0] * sd, a, p[1]))
            return Vector((p[0] * sd, p[1], a))

        def D(u, v):   # dirección 2D -> 3D
            if axis == 'x':
                return Vector((0, u, v))
            if axis == 'y':
                return Vector((u * sd, 0, v))
            return Vector((u * sd, v, 0))
        ax = {'x': Vector((sd, 0, 0)), 'y': Vector((0, 1, 0)), 'z': Vector((0, 0, 1))}[axis]
        if a1 < a0:
            ax = -ax
        A = [mb.v(P(p, a0)) for p in poly]
        Bv = [mb.v(P(p, a1)) for p in poly]
        for i in range(n):
            j = (i + 1) % n
            ex, ey = poly[j][0] - poly[i][0], poly[j][1] - poly[i][1]
            mb.f_out((A[i], A[j], Bv[j], Bv[i]), mats.get('side', mat), D(ey, -ex), smooth)
        for t in tris:
            if cap0:
                mb.f_out((A[t[0]], A[t[1]], A[t[2]]), mats.get('cap0', mat), -ax, False)
            if cap1:
                mb.f_out((Bv[t[0]], Bv[t[1]], Bv[t[2]]), mats.get('cap1', mat), ax, False)


def airfoil(chord, th, n=12, camber=0.04):
    '''Perfil alar: y hacia atrás desde el borde de ataque (negativo), z arriba.'''
    up, lo = [], []
    for i in range(n + 1):
        x = (1 - math.cos(math.pi * i / n)) / 2
        t = 5 * th * (0.2969 * math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4)
        c = camber * 4 * x * (1 - x)
        up.append((x, c + t))
        lo.append((x, c - t))
    pts = up + lo[::-1][1:-1]
    return [(-p[0] * chord, p[1] * chord) for p in pts]


def wing(mb, y_le, z, chord, span, th=0.12, mat='carbon', angle=-0.12, camber=0.05, plates=True, plate_mat=None, plate_h=0.09, sweep=0.0, dihedral=0.0, segs=8,
         tag=True):
    '''Alerón: perfil extruido a lo largo de X con placas laterales.
    angle > 0 levanta el borde de salida. tag: sus caras usan 'wing_<mat>' para que
    el juego pueda quitar el alerón cuando se desprende en un choque.'''
    wt = (lambda m: m if m.startswith('wing_') else 'wing_' + m) if tag else (lambda m: m)
    mat = wt(mat)
    plate_mat = wt(plate_mat) if plate_mat else None
    prof = airfoil(chord, th, camber=camber)
    ca, sa = math.cos(angle), math.sin(angle)
    prof = [(p[0] * ca - p[1] * sa, -p[0] * sa + p[1] * ca) for p in prof]
    rings = []
    for k in range(segs + 1):
        x = -span / 2 + span * k / segs
        t = abs(x) / (span / 2)
        rings.append([(x, y_le - sweep * t * t + p[0], z + dihedral * t * t + p[1]) for p in prof])
    V = [[mb.v(p) for p in r] for r in rings]
    n = len(prof)
    cy = y_le - chord * 0.45
    for k in range(segs):
        for i in range(n):
            j = (i + 1) % n
            q = (V[k][i], V[k][j], V[k + 1][j], V[k + 1][i])
            mid = sum((v.co for v in q), Vector()) / 4
            zc = z + dihedral * (abs(mid.x) / (span / 2)) ** 2
            mb.f_out(q, mat, Vector((0, mid.y - cy, (mid.z - zc) * 4)))
    for r, sd in ((V[0], -1), (V[-1], 1)):
        c = mb.v(tuple(sum(v.co[i] for v in r) / n for i in range(3)))
        for i in range(n):
            mb.f_out((c, r[i], r[(i + 1) % n]), mat, Vector((sd, 0, 0)), smooth=False)
    if plates:
        pm = plate_mat or mat
        for sd in (-1, 1):
            x = sd * (span / 2 + 0.004)
            yo, zo = -sweep, dihedral
            poly = [(y_le + yo + 0.03, z + zo + 0.035), (y_le + yo - chord - 0.05, z + zo + 0.045), (y_le + yo - chord - 0.07, z + zo - plate_h),
                    (y_le + yo + 0.01, z + zo - plate_h * 0.7)]
            prism(mb, poly, 'x', x - 0.0045, x + 0.0045, pm)


def ring(mb, c, axis, R, r, mat, n=28, m=8):
    '''Toro: centro c, eje 'x' | 'y' | 'z', radio mayor R y de sección r (volantes, aros).'''
    c = Vector(c)
    ax = {'x': Vector((1, 0, 0)), 'y': Vector((0, 1, 0)), 'z': Vector((0, 0, 1))}[axis]
    t1 = Vector((0, 0, 1)) if axis != 'z' else Vector((1, 0, 0))
    if axis == 'x':
        t1 = Vector((0, 1, 0))
    t2 = ax.cross(t1).normalized()
    V = []
    for i in range(n):
        a = 2 * math.pi * i / n
        rd = t1 * math.cos(a) + t2 * math.sin(a)
        V.append([mb.v(c + rd * (R + r * math.cos(2 * math.pi * j / m)) + ax * (r * math.sin(2 * math.pi * j / m))) for j in range(m)])
    for i in range(n):
        i1 = (i + 1) % n
        for j in range(m):
            j1 = (j + 1) % m
            q = (V[i][j], V[i1][j], V[i1][j1], V[i][j1])
            mid = sum((v.co for v in q), Vector()) / 4
            a = 2 * math.pi * (i + 0.5) / n
            rc = c + (t1 * math.cos(a) + t2 * math.sin(a)) * R
            mb.f_out(q, mat, mid - rc)


def mirror_part(mb, x, y, z, w=0.16, h=0.07, d=0.09, stalk=0.07, mat='paint', stalk_mat='black'):
    '''Retrovisor: carcasa elipsoidal sobre un brazo (ambos lados).'''
    for sd in (1, -1):
        c = Vector((sd * (x + stalk + w * 0.45), y, z))
        res_u, res_v = 14, 8
        V = []
        for i in range(res_v + 1):
            a = -math.pi / 2 + math.pi * i / res_v
            row = []
            for j in range(res_u):
                b = 2 * math.pi * j / res_u
                px = math.cos(a) * math.cos(b) * w / 2
                py = math.sin(b) * math.cos(a) * d / 2
                pz = math.sin(a) * h / 2
                if py < 0:
                    py *= 0.35
                row.append(mb.v(c + Vector((px, py, pz))))
            V.append(row)
        for i in range(res_v):
            for j in range(res_u):
                j1 = (j + 1) % res_u
                q = (V[i][j], V[i][j1], V[i + 1][j1], V[i + 1][j])
                mid = sum((v.co for v in q), Vector()) / 4
                mb.f_out(q, mat, mid - c)
        xa, xb = sd * (x - 0.012), sd * (x + stalk + 0.02)
        box(mb, min(xa, xb), max(xa, xb), y - 0.012, y + 0.02, z - h * 0.35, z - h * 0.05, stalk_mat)


# ------------------------------------------------------------------ ruedas
def make_wheel(Wd, style, coll, name):
    '''Rueda completa centrada en el origen, eje en X, cara exterior hacia +X.
    Wd: dict(r=radio exterior, w=ancho, rim=radio de la llanta, cal_a=ángulo de la pinza,
    lock=tuerca central, lugs=nº de tuercas).'''
    R, w, rr = Wd['r'], Wd['w'], Wd['rim']
    mb = MB()
    seg = 40
    h = R - rr

    def revolve(profile, mat, closed=False, smooth=True, n=seg, a0=0.0, a1=2 * math.pi, out=1, caps=False, mats=None):
        '''Revoluciona un perfil (axial, radial) alrededor de X. out=1: normal a la
        izquierda del sentido del perfil (hacia fuera si el perfil va de +X a -X por arriba).'''
        full = abs(a1 - a0 - 2 * math.pi) < 1e-6
        steps = n if full else n + 1
        rows = []
        for i in range(steps):
            a = a0 + (a1 - a0) * i / n
            ca, sa = math.cos(a), math.sin(a)
            rows.append([mb.v((p[0], ca * p[1], sa * p[1])) for p in profile])
        m = len(profile)
        pc = (sum(p[0] for p in profile) / m, sum(p[1] for p in profile) / m)
        for i in range(n):
            i1 = (i + 1) % steps if full else i + 1
            am = a0 + (a1 - a0) * (i + 0.5) / n
            for k in range(m - (0 if closed else 1)):
                k1 = (k + 1) % m
                ex, er = profile[k1][0] - profile[k][0], profile[k1][1] - profile[k][1]
                nx, nr = er, -ex
                if closed:
                    mx, mr = (profile[k][0] + profile[k1][0]) / 2 - pc[0], (profile[k][1] + profile[k1][1]) / 2 - pc[1]
                    if nx * mx + nr * mr < 0:
                        nx, nr = -nx, -nr
                else:
                    nx, nr = -nx * out, -nr * out
                o = Vector((nx, math.cos(am) * nr, math.sin(am) * nr))
                mt = mats[k] if mats else mat
                mb.f_out((rows[i][k], rows[i][k1], rows[i1][k1], rows[i1][k]), mt, o, smooth)
        if caps and not full:
            for i, sgn in ((0, -1), (steps - 1, 1)):
                a = a0 + (a1 - a0) * i / n
                t = Vector((0, -math.sin(a), math.cos(a))) * sgn
                c = mb.v((pc[0], math.cos(a) * pc[1], math.sin(a) * pc[1]))
                for k in range(m):
                    mb.f_out((c, rows[i][k], rows[i][(k + 1) % m]), mat, t, smooth=False)
        return rows

    # ---- neumático: flanco con protector de llanta, hombro redondeado y 4 ranuras en la banda
    side = [(0.44, -0.004), (0.47, 0.05), (0.492, 0.1), (0.487, 0.16), (0.5, 0.42), (0.497, 0.66), (0.482, 0.82), (0.455, 0.93), (0.42, 0.985)]
    tire = [(p[0] * w, rr + p[1] * h if p[1] < 0.9 else R - (1 - p[1]) * h * 0.6) for p in side]
    tire[-1] = (0.42 * w, R - 0.004)
    gw, gd = 0.011, 0.008
    tread = [(0.38 * w, R)]
    for gx in (0.2, -0.2):
        c = gx * w
        tread += [(c + gw / 2, R), (c + gw / 2, R - gd), (c - gw / 2, R - gd), (c - gw / 2, R)]
    tread.append((-0.38 * w, R))
    prof = tire + tread + [(-p[0], p[1]) for p in reversed(tire)]
    mats = []
    for k in range(len(prof) - 1):
        a, b = prof[k], prof[k + 1]
        mats.append('tread' if (a[1] < R - 0.001 and b[1] < R - 0.001 and abs(a[0]) < 0.35 * w and abs(b[0]) < 0.35 * w) else 'rubber')
    revolve(prof, 'rubber', out=-1, mats=mats)
    # ---- llanta: pestaña exterior escalonada, barril y fondo
    face = 0.43 * w
    revolve([(face - 0.014, rr - 0.012), (face + 0.002, rr - 0.004), (face + 0.007, rr + 0.004), (face + 0.006, rr + 0.013),
             (face - 0.002, rr + 0.016), (face - 0.008, rr + 0.01)], 'rim', closed=True)
    revolve([(face - 0.014, rr - 0.012), (face - 0.05, rr - 0.018), (-0.3 * w, rr - 0.03), (-0.43 * w, rr - 0.012)], 'darkchrome', out=1)
    revolve([(-0.43 * w, rr - 0.012), (-0.43 * w, 0.02)], 'well', out=1)
    # ---- freno: disco con campana, taladros y pinza
    rd = rr - 0.03
    ad = face - 0.105
    revolve([(ad + 0.015, 0.13), (ad + 0.015, rd), (ad - 0.015, rd), (ad - 0.015, 0.13)], 'disc', closed=True, smooth=False, n=36)
    revolve([(ad + 0.03, 0.02), (ad + 0.03, 0.135), (ad + 0.012, 0.135), (ad + 0.012, 0.02)], 'darkchrome', closed=True, smooth=False, n=32)
    X = Vector((1, 0, 0))
    for ring_r in (rd - 0.024, rd - 0.06):
        nh = 14
        for i in range(nh):
            a = 2 * math.pi * (i + (0.5 if ring_r < rd - 0.04 else 0)) / nh
            cy, cz = math.cos(a) * ring_r, math.sin(a) * ring_r
            pts = [mb.v((ad + 0.0162, cy + math.cos(2 * math.pi * j / 8) * 0.0045, cz + math.sin(2 * math.pi * j / 8) * 0.0045)) for j in range(8)]
            c = mb.v((ad + 0.0162, cy, cz))
            for j in range(8):
                mb.f_out((c, pts[j], pts[(j + 1) % 8]), 'hole', X, smooth=False)
    ca = math.radians(Wd.get('cal_a', 150))
    revolve([(ad + 0.048, rd - 0.075), (ad + 0.052, rd - 0.02), (ad + 0.045, rd + 0.014), (ad + 0.01, rd + 0.02), (ad - 0.03, rd + 0.016),
             (ad - 0.03, rd - 0.075)], 'caliper', closed=True, smooth=True, n=10, a0=ca - 0.45, a1=ca + 0.45, caps=True)
    spokes(mb, style, R, rr, face, w, Wd)
    return mb.to_object(name, coll, recalc=False)


def spokes(mb, style, R, rr, face, w, Wd):
    rh = 0.078                         # radio del buje
    ro = rr - 0.008                    # hasta el aro
    dish = {'5': 0.05, '6': 0.045, '10': 0.035, 'Y': 0.045, 'turbine': 0.022, 'aero': 0.014, 'jesko': 0.035, 'mesh': 0.03,
            'wire': 0.02, 'dish': 0.012, 'star': 0.04, 'rally': 0.03}.get(style, 0.04)
    th = 0.024
    X = Vector((1, 0, 0))

    def ax(r):                          # cara de los radios: llanta cóncava
        t = clamp((r - rh) / (ro - rh), 0, 1)
        return face - dish * (1 - t) ** 1.25

    def add_poly(poly2, count, rot0=0.0, mat='rim', thick=th, lift=0.001, bevel=0.0045):
        '''Pieza plana con cara frontal biselada (arista achaflanada) y lados.'''
        base = offset_poly(poly2, bevel) if bevel else poly2
        for c in range(count):
            a = rot0 + 2 * math.pi * c / count
            ca, sa = math.cos(a), math.sin(a)
            rot = lambda P: [(p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca) for p in P]
            outer, inner = rot(poly2), rot(base)
            if poly_area(outer) < 0:
                outer, inner = outer[::-1], inner[::-1]
            n = len(outer)
            O = [mb.v((ax(math.hypot(*p)) + lift - (bevel * 0.8 if bevel else 0), p[0], p[1])) for p in outer]
            I = [mb.v((ax(math.hypot(*p)) + lift, p[0], p[1])) for p in inner] if bevel else O
            Bk = [mb.v((ax(math.hypot(*p)) - thick, p[0], p[1])) for p in outer] if thick else None
            tris = mgeo.tessellate_polygon([[Vector((p[0], p[1], 0)) for p in inner]])
            for t in tris:
                mb.f_out((I[t[0]], I[t[1]], I[t[2]]), mat, X)
            if bevel:
                for i in range(n):
                    j = (i + 1) % n
                    ey, ez = outer[j][0] - outer[i][0], outer[j][1] - outer[i][1]
                    mb.f_out((I[i], I[j], O[j], O[i]), mat, X * 0.7 + Vector((0, ez, -ey)).normalized() * 0.7, smooth=False)
            if Bk:
                for t in mgeo.tessellate_polygon([[Vector((p[0], p[1], 0)) for p in outer]]):
                    mb.f_out((Bk[t[0]], Bk[t[1]], Bk[t[2]]), mat, -X)
                for i in range(n):
                    j = (i + 1) % n
                    ey, ez = outer[j][0] - outer[i][0], outer[j][1] - outer[i][1]
                    mb.f_out((O[i], O[j], Bk[j], Bk[i]), mat, Vector((0, ez, -ey)), smooth=False)

    def spoke(w0, w1, r0=rh * 0.8, r1=ro, bend=0.0, n=8, waist=0.0):
        '''Radio que se estrecha de w0 (buje) a w1 (aro), curvado 'bend' rad.'''
        left, right = [], []
        for i in range(n + 1):
            t = i / n
            r = lerp(r0, r1, t)
            ww = lerp(w0, w1, t) / 2 * (1 - waist * math.sin(math.pi * t))
            if t > 0.86:                    # ensanche al unirse al aro
                ww *= 1 + (t - 0.86) * 2.2
            a = bend * t * t
            ca, sa = math.cos(a), math.sin(a)
            for arr, s in ((left, -1), (right, 1)):
                px, py = s * ww, r
                arr.append((px * ca - py * sa, px * sa + py * ca))
        return right + left[::-1]

    if style == '5':
        add_poly(spoke(0.08, 0.058, waist=0.12), 5)
    elif style == '6':
        add_poly(spoke(0.064, 0.046, waist=0.1), 6)
    elif style == '10':
        for off in (-0.14, 0.14):
            add_poly(spoke(0.036, 0.029), 5, rot0=off)
    elif style == 'Y':
        add_poly(spoke(0.064, 0.05, r1=rh + (ro - rh) * 0.46), 5)
        for off in (-0.2, 0.2):
            add_poly(spoke(0.036, 0.031, r0=rh + (ro - rh) * 0.34, r1=ro), 5, rot0=off)
    elif style == 'turbine':
        add_poly(spoke(0.032, 0.026, bend=0.35, n=10), 14, bevel=0.003)
    elif style == 'jesko':
        add_poly(spoke(0.052, 0.034, bend=0.3, n=10), 10, bevel=0.004)
    elif style == 'mesh':
        for off in (-0.16, 0.16):
            add_poly(spoke(0.03, 0.024, bend=0.5 if off > 0 else -0.5, n=10), 10, rot0=off, bevel=0.003)
    elif style == 'wire':
        # radios de alambre cruzados (clásicos) con buje grande de palomilla
        for c in range(40):
            a0 = 2 * math.pi * c / 40
            tw = 0.18 if c % 2 else -0.18
            p0 = (math.cos(a0) * rh * 0.9, math.sin(a0) * rh * 0.9)
            p1 = (math.cos(a0 + tw) * ro, math.sin(a0 + tw) * ro)
            dx, dy = p1[0] - p0[0], p1[1] - p0[1]
            l = math.hypot(dx, dy)
            nx, ny = -dy / l * 0.0028, dx / l * 0.0028
            add_poly([(p0[0] + nx, p0[1] + ny), (p1[0] + nx, p1[1] + ny), (p1[0] - nx, p1[1] - ny), (p0[0] - nx, p0[1] - ny)], 1, thick=0.006, bevel=0.0)
    elif style == 'dish':
        # llanta de disco de carreras (años 70-90) con agujeros de ventilación
        disc = [(math.cos(2 * math.pi * i / 48) * ro, math.sin(2 * math.pi * i / 48) * ro) for i in range(48)]
        add_poly(disc, 1, thick=0.0, bevel=0.0)
        for c in range(8):
            a = 2 * math.pi * c / 8
            add_poly([(math.cos(a) * ro * 0.62 + math.cos(2 * math.pi * i / 14) * 0.022, math.sin(a) * ro * 0.62 + math.sin(2 * math.pi * i / 14) * 0.022)
                      for i in range(14)], 1, mat='hole', thick=0.0, lift=0.003, bevel=0.0)
    elif style == 'star':
        # estrella de 5 brazos anchos (F40, Fuchs, clásicos de carreras)
        add_poly(spoke(0.1, 0.07, waist=0.2), 5, bevel=0.005)
    elif style == 'rally':
        # 8 radios rectos y robustos (llantas de rally)
        add_poly(spoke(0.05, 0.042, waist=0.05), 8, bevel=0.004)
    elif style == 'aero':
        ring = [(math.cos(2 * math.pi * i / 48) * ro, math.sin(2 * math.pi * i / 48) * ro) for i in range(48)]
        add_poly(ring, 1, thick=0.0, bevel=0.0)
        for c in range(5):
            a = 2 * math.pi * c / 5
            slot = [(math.cos(a - 0.25 + 0.5 * i / 8) * ro * 0.84, math.sin(a - 0.25 + 0.5 * i / 8) * ro * 0.84) for i in range(9)]
            slot += [(math.cos(a + 0.25 - 0.5 * i / 8) * ro * 0.6, math.sin(a + 0.25 - 0.5 * i / 8) * ro * 0.6) for i in range(9)]
            add_poly(slot, 1, mat='hole', thick=0.0, lift=0.003, bevel=0.0)
    # buje, tuercas y tapa central
    add_poly([(math.cos(2 * math.pi * i / 24) * rh, math.sin(2 * math.pi * i / 24) * rh) for i in range(24)], 1, bevel=0.004)
    top = ax(rh) + 0.001
    if Wd.get('lock'):
        hexa = [(math.cos(2 * math.pi * i / 6 + 0.3) * 0.045, math.sin(2 * math.pi * i / 6 + 0.3) * 0.045) for i in range(6)]
        prism(mb, hexa, 'x', top, top + 0.03, 'darkchrome')
        prism(mb, circle_pts(0.025, 16), 'x', top + 0.03, top + 0.036, 'badge')
    else:
        for i in range(Wd.get('lugs', 5)):
            a = 2 * math.pi * i / Wd.get('lugs', 5) + math.pi / 2
            cy, cz = math.cos(a) * 0.056, math.sin(a) * 0.056
            hexa = [(cy + math.cos(2 * math.pi * k / 6) * 0.0105, cz + math.sin(2 * math.pi * k / 6) * 0.0105) for k in range(6)]
            prism(mb, hexa, 'x', top - 0.002, top + 0.012, 'darkchrome')
        prism(mb, circle_pts(0.028, 20), 'x', top - 0.002, top + 0.008, 'badge')


def circle_pts(r, n):
    return [(math.cos(2 * math.pi * i / n) * r, math.sin(2 * math.pi * i / n) * r) for i in range(n)]


def offset_poly(poly, d):
    '''Encoge (d > 0) o agranda (d < 0) un polígono 2D (bisectrices).'''
    n = len(poly)
    s = 1 if poly_area(poly) > 0 else -1
    out = []
    for i in range(n):
        p0, p1, p2 = Vector(poly[i - 1]), Vector(poly[i]), Vector(poly[(i + 1) % n])
        e0 = (p1 - p0)
        e1 = (p2 - p1)
        if e0.length < 1e-9 or e1.length < 1e-9:
            out.append(tuple(p1))
            continue
        e0.normalize()
        e1.normalize()
        n0 = Vector((-e0.y, e0.x)) * s
        n1 = Vector((-e1.y, e1.x)) * s
        b = n0 + n1
        if b.length < 1e-6:
            b = n0
        b.normalize()
        k = max(0.3, b.dot(n0))
        q = p1 + b * (d / k)
        out.append((q.x, q.y))
    return out


# ------------------------------------------------------------------ escena
def clear_collection(name):
    coll = bpy.data.collections.get(name)
    if coll:
        for ob in list(coll.objects):
            me = ob.data if ob.type == 'MESH' else None
            bpy.data.objects.remove(ob)
            if me and me.users == 0:
                bpy.data.meshes.remove(me)
    else:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    # visible: Blender no evalúa (ni aplica booleanas con) objetos de colecciones ocultas
    coll.hide_viewport = False
    coll.hide_render = False
    return coll


def set_sharp(ob, angle):
    '''Aristas vivas por ángulo (conserva las marcadas) y sombreado suave.'''
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    lim = math.radians(angle)
    for e in bm.edges:
        if len(e.link_faces) == 2:
            if e.calc_face_angle(0.0) > lim:
                e.smooth = False
        else:
            e.smooth = False
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(me)
    bm.free()


def remove_mat_faces(ob, names):
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    kill = [f for f in bm.faces if f.material_index < len(me.materials) and me.materials[f.material_index] and me.materials[f.material_index].name[3:] in names]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    bm.to_mesh(me)
    bm.free()


def join(obs, name):
    obs = [o for o in obs if o]
    base = obs[0]
    with bpy.context.temp_override(active_object=base, selected_editable_objects=obs, selected_objects=obs):
        bpy.ops.object.join()
    base.name = name
    base.data.name = name
    return base


def set_paint(S):
    get_mat('paint', hex_lin(S['color']))
    get_mat('sec', hex_lin(S.get('sec', '#15171b')))
    get_mat('wing_paint', hex_lin(S['color']))
    get_mat('wing_sec', hex_lin(S.get('sec', '#15171b')))
    get_mat('stripe', hex_lin(S.get('stripe', '#f2f2f2')))
    get_mat('caliper', hex_lin(S['wheels'].get('caliper', '#c41a1a')))
    get_mat('rim', hex_lin(S['wheels'].get('rim_color', '#b9bdc4')))


def build_car(S):
    '''Construye un coche completo en la colección car_<id>.'''
    coll = clear_collection('car_' + S['id'])
    set_paint(S)
    L = S['L']
    # 1) carrocería inferior + pasos de rueda
    mb = MB()
    build_body(S, mb)
    for fn in S['body'].get('extra', ()):      # piezas cerradas que forman parte de la chapa (p. ej. pontones)
        fn(S, mb)
    body = mb.to_object(S['id'] + '_body', coll, recalc=False)
    cut_arches(body, S, coll)
    # 2) habitáculo
    mb = MB()
    build_canopy(S, mb)
    cab = mb.to_object(S['id'] + '_cabin', coll, recalc=False)
    remove_mat_faces(cab, ('hidden',))
    # 3) detalles: 1ª pasada (sobre la chapa intacta), huecos con booleanas y 2ª pasada (dentro de los huecos)
    tgt = Target([body, cab])
    mb = MB()
    cut = MB()
    ctx = dict(S=S, L=L, tgt=tgt, tgt_cab=Target([cab]), mb=mb, cut=cut, body=body, cab=cab, coll=coll)
    for fn in S.get('details', ()):
        fn(ctx)
    if cut.bm.faces:
        cutter = cut.to_object(S['id'] + '_holes', coll, recalc=False)
        mod = body.modifiers.new('holes', 'BOOLEAN')
        mod.operation = 'DIFFERENCE'
        mod.solver = 'EXACT'
        mod.material_mode = 'TRANSFER'
        mod.use_self = True
        mod.object = cutter
        apply_modifiers(body)
        bpy.data.objects.remove(cutter)
    else:
        cut.bm.free()
    ctx['tgt'] = Target([body, cab])
    for fn in S.get('inner', ()):
        fn(ctx)
    det = mb.to_object(S['id'] + '_details', coll, recalc=False) if mb.bm.faces else None
    if det is None:
        mb.bm.free()
    parts = [body, cab] + ([det] if det else [])
    for ob in parts:
        set_sharp(ob, S.get('sharp_angle', 42))
    car = join(parts, S['id'])
    # 4) ruedas
    W = S['wheels']
    ex = dict(cal_a=W.get('cal_a', 150), lock=W.get('lock', False), lugs=W.get('lugs', 5))
    wf = make_wheel(dict(r=W['r'], w=W['wf'], rim=W['rim'], **ex), W['style'], coll, S['id'] + '_wheel_f')
    wr = make_wheel(dict(r=W['r'] + W.get('dr', 0.0), w=W['wr'], rim=W['rim'] + W.get('drim', 0.0), **ex), W['style'], coll, S['id'] + '_wheel_r')
    for ob in (wf, wr):
        set_sharp(ob, 50)
    place_wheels(S, coll, wf, wr)
    return car


def place_wheels(S, coll, wf, wr):
    W = S['wheels']
    wf.location = (W['tf'] / 2, W['yf'], W['r'])
    wr.location = (W['tr'] / 2, W['yr'], W['r'] + W.get('dr', 0.0))
    for src, name in ((wf, '_wl_f'), (wr, '_wl_r')):
        inst = bpy.data.objects.new(S['id'] + name, src.data)
        inst.location = (-src.location.x, src.location.y, src.location.z)
        inst.scale = (-1, 1, 1)
        coll.objects.link(inst)
