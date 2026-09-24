'''
Importa un modelo de coche ya hecho (Sketchfab / glTF) y lo prepara para el juego.
===============================================================================
1. Junta sus mallas (con transformaciones), lo orienta (morro hacia +Y), lo escala
   al largo real y lo apoya en el suelo con la cola en Y = 0.
2. Localiza las 4 ruedas (piezas bajas en las esquinas) y guarda la delantera
   derecha como plantilla centrada en el origen (el juego la gira y la copia).
3. Clasifica cada material en la tabla del juego (pintura, cristal, faros,
   pilotos, llanta, goma, cromo…) por nombre y propiedades, y hornea su color
   (o su textura) en los vértices.
4. Reduce polígonos hasta el presupuesto y exporta con export_game.write_car.

Uso (dentro de Blender, tras importar el modelo en la colección 'src_<id>'):
    prepare_import(car_id, cfg)   ->  estadísticas
cfg: L (m), color, flip (bool), overrides {nombre material: material juego},
     budget (triángulos de carrocería), keep_interior, wheel_budget.
'''
import bpy, bmesh, math, re, os
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

KEYS = [
    # (expresión, material del juego)
    (r'glass|window|windscreen|windshield|vidrio|cristal|glas', 'glass'),
    (r'tail.?light|rear.?light|brake|stop.?lamp|taillamp|rearlamp|backlight', 'tail'),
    (r'indicator|blinker|turn.?signal|amber|orange.?light', 'amber'),
    (r'head.?light|headlamp|front.?light|lamp.?glass|light.?glass|lens', 'lens'),
    (r'\bdrl\b|daytime|led', 'emit'),
    (r'light|lamp', 'head'),
    (r'tire|tyre|rubber|neumatic|goma', 'rubber'),
    (r'caliper|brake.?cal', 'caliper'),
    (r'disc|disk|rotor', 'metal'),
    (r'rim|wheel|alloy|llanta|spoke', 'rim'),
    (r'chrome|cromo|mirror.?glass|reflector', 'chrome'),
    (r'carbon|cf_|fibra', 'carbon'),
    (r'grill|grille|mesh|honeycomb|vent', 'mesh'),
    (r'exhaust|muffler|tailpipe|escape', 'metal'),
    (r'interior|seat|leather|dash|steer|cabin|alcantara|belt|pedal|gauge', 'interior'),
    (r'paint|body|carpaint|exterior|coat|chassis|shell|carroc', 'paint'),
    (r'plastic|trim|black|rubber.?trim|matte', 'plastic'),
    (r'metal|steel|alu', 'metal'),
]


def principled(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)


def base_color(mat):
    b = principled(mat)
    if b is None:
        c = mat.diffuse_color if mat else (0.5, 0.5, 0.5, 1)
        return tuple(c[:3]), None
    inp = b.inputs['Base Color']
    img = None
    if inp.is_linked:
        n = inp.links[0].from_node
        seen = 0
        while n is not None and n.type != 'TEX_IMAGE' and seen < 6:
            nxt = None
            for i in n.inputs:
                if i.is_linked:
                    nxt = i.links[0].from_node
                    break
            n = nxt
            seen += 1
        if n is not None and n.type == 'TEX_IMAGE' and n.image:
            img = n.image
    return tuple(inp.default_value[:3]), img


def lin2srgb(c):
    c = max(0.0, min(1.0, c))
    return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def classify(mat, area, overrides):
    name = (mat.name if mat else '').lower()
    if mat and mat.name in overrides:
        return overrides[mat.name]
    for pat, gm in KEYS:
        if re.search(pat, name):
            return gm
    b = principled(mat)
    if b is None:
        return 'plastic'
    col, img = base_color(mat)
    metal = b.inputs['Metallic'].default_value
    rough = b.inputs['Roughness'].default_value
    trans = b.inputs['Transmission Weight'].default_value if 'Transmission Weight' in b.inputs else 0
    alpha = b.inputs['Alpha'].default_value
    emis = b.inputs['Emission Strength'].default_value if 'Emission Strength' in b.inputs else 0
    ecol = b.inputs['Emission Color'].default_value if 'Emission Color' in b.inputs else (0, 0, 0, 1)
    if emis > 0.05 and max(ecol[:3]) > 0.05:
        r, g, bb = ecol[:3]
        if r > 0.5 and g < 0.3:
            return 'tail'
        if r > 0.5 and g > 0.25 and bb < 0.2:
            return 'amber'
        return 'emit'
    if trans > 0.5 or alpha < 0.6:
        return 'glass'
    if metal > 0.5:
        return 'chrome' if rough < 0.15 else 'metal'
    lum = 0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2]
    if lum < 0.03:
        return 'gloss' if rough < 0.3 else 'plastic'
    return 'plastic'


def gather(coll):
    '''Todas las mallas de la colección, con transformación aplicada, en un bmesh.'''
    obs = [o for o in coll.all_objects if o.type == 'MESH' and not o.hide_render]
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    mats, mat_ix = [], {}
    part = bm.faces.layers.int.new('part')
    uvl = None
    for pi, ob in enumerate(obs):
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        me.transform(ob.matrix_world)
        remap = []
        for m in me.materials:
            key = m.name if m else '_none'
            if key not in mat_ix:
                mat_ix[key] = len(mats)
                mats.append(m)
            remap.append(mat_ix[key])
        tmp = bmesh.new()
        tmp.from_mesh(me)
        tuv = tmp.loops.layers.uv.active
        # copia manual (para conservar pieza, material y UV)
        vmap = {v: bm.verts.new(v.co) for v in tmp.verts}
        if uvl is None:
            uvl = bm.loops.layers.uv.new('UV')
        for f in tmp.faces:
            try:
                nf = bm.faces.new([vmap[v] for v in f.verts])
            except ValueError:
                continue
            nf.material_index = remap[f.material_index] if f.material_index < len(remap) else 0
            nf[part] = pi
            nf.smooth = f.smooth
            if tuv is not None:
                for l0, l1 in zip(f.loops, nf.loops):
                    l1[uvl].uv = l0[tuv].uv
        tmp.free()
        ev.to_mesh_clear()
    return bm, mats, obs


def orient(bm, L, flip=None):
    '''Largo en Y, morro +Y, cola en Y = 0, suelo Z = 0, centrado en X. Devuelve la escala.'''
    xs = [v.co.x for v in bm.verts]
    ys = [v.co.y for v in bm.verts]
    if (max(xs) - min(xs)) > (max(ys) - min(ys)):
        bmesh.ops.rotate(bm, verts=bm.verts[:], matrix=Matrix.Rotation(math.pi / 2, 3, 'Z'))
    if flip:
        bmesh.ops.rotate(bm, verts=bm.verts[:], matrix=Matrix.Rotation(math.pi, 3, 'Z'))
    lo = Vector([min(v.co[i] for v in bm.verts) for i in range(3)])
    hi = Vector([max(v.co[i] for v in bm.verts) for i in range(3)])
    s = L / (hi.y - lo.y)
    for v in bm.verts:
        v.co = Vector(((v.co.x - (lo.x + hi.x) / 2) * s, (v.co.y - lo.y) * s, (v.co.z - lo.z) * s))
    return s


def find_wheels(bm, part_layer, L):
    '''Piezas conexas bajas en las 4 esquinas -> [(centro, radio, ancho, caras)].'''
    faces = bm.faces[:]
    seen = set()
    comps = []
    for f in faces:
        if f in seen:
            continue
        stack, comp = [f], []
        seen.add(f)
        while stack:
            g = stack.pop()
            comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h not in seen:
                        seen.add(h)
                        stack.append(h)
        comps.append(comp)
    cand = []
    for comp in comps:
        vs = {v for f in comp for v in f.verts}
        lo = Vector([min(v.co[i] for v in vs) for i in range(3)])
        hi = Vector([max(v.co[i] for v in vs) for i in range(3)])
        c = (lo + hi) / 2
        d = hi - lo
        if hi.z < 0.95 and lo.z < 0.25 and abs(c.x) > 0.45 and d.z < 0.95 and d.y < 0.95:
            cand.append((comp, lo, hi, c))
    corners = {}
    for comp, lo, hi, c in cand:
        key = (c.x > 0, c.y > L / 2)
        corners.setdefault(key, []).append((comp, lo, hi, c))
    out = {}
    for key, parts in corners.items():
        lo = Vector([min(p[1][i] for p in parts) for i in range(3)])
        hi = Vector([max(p[2][i] for p in parts) for i in range(3)])
        r = (hi.z - lo.z) / 2
        c = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z + r))
        out[key] = dict(center=c, r=r, w=hi.x - lo.x, faces=[f for p in parts for f in p[0]])
    return out


def components(faces):
    seen = set()
    comps = []
    for f in faces:
        if f in seen:
            continue
        stack, comp = [f], []
        seen.add(f)
        while stack:
            g = stack.pop()
            comp.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h not in seen:
                        seen.add(h)
                        stack.append(h)
        comps.append(comp)
    return comps


def bbox(faces):
    vs = {v for f in faces for v in f.verts}
    lo = Vector([min(v.co[i] for v in vs) for i in range(3)])
    hi = Vector([max(v.co[i] for v in vs) for i in range(3)])
    return lo, hi


def wheels_of(bm, L, W=None):
    '''Busca un neumático por esquina (pieza casi cilíndrica, eje X, apoyada en el
    suelo) y le añade las piezas que caen dentro de su cilindro (llanta, disco,
    pinza, tuercas). Devuelve {(derecha, delante): dict(center, r, w, faces)}.'''
    comps = [(c,) + bbox(c) for c in components(bm.faces[:])]
    tires = {}
    for comp, lo, hi in comps:
        d = hi - lo
        c = (lo + hi) / 2
        dia = max(d.y, d.z)
        if 0.45 < dia < 1.0 and abs(d.y - d.z) < 0.18 * dia and 0.1 < d.x < 0.5 and lo.z < 0.12 and abs(c.x) > 0.35:
            key = (c.x > 0, c.y > L / 2)
            if key not in tires or dia > tires[key][2]:
                tires[key] = (comp, c, dia, d.x)
    out = {}
    for key, (comp, c, dia, w) in tires.items():
        r = dia / 2
        faces = list(comp)
        for comp2, lo, hi in comps:
            if comp2 is comp:
                continue
            c2 = (lo + hi) / 2
            d2 = hi - lo
            inside = abs(c2.x - c.x) < w * 0.9 and math.hypot(c2.y - c.y, c2.z - c.z) < r * 0.95 and max(d2.y, d2.z) < dia * 1.02
            if inside:
                faces += comp2
        out[key] = dict(center=Vector((c.x, c.y, r)), r=r, w=w, faces=faces)
    return out


def bm_to_object(bm, faces, name, coll, mats, matrix=None):
    '''Copia unas caras de un bmesh a un objeto nuevo (con materiales y UV).'''
    nb = bmesh.new()
    uvl = bm.loops.layers.uv.get('UV')
    nuv = nb.loops.layers.uv.new('UV')
    vmap = {}
    for f in faces:
        vs = []
        for v in f.verts:
            nv = vmap.get(v)
            if nv is None:
                co = v.co if matrix is None else matrix @ v.co
                nv = vmap[v] = nb.verts.new(co)
            vs.append(nv)
        try:
            nf = nb.faces.new(vs)
        except ValueError:
            continue
        nf.material_index = f.material_index
        nf.smooth = f.smooth
        if uvl is not None:
            for l0, l1 in zip(f.loops, nf.loops):
                l1[nuv].uv = l0[uvl].uv
    me = bpy.data.meshes.new(name)
    nb.to_mesh(me)
    nb.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    return ob


def decimate(ob, target):
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if tris <= target:
        return tris
    mod = ob.modifiers.new('dec', 'DECIMATE')
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = max(0.02, target / tris)
    mod.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def sampler(img):
    '''Muestreo (vecino más cercano) de una imagen en coordenadas UV -> RGB lineal.'''
    if img is None or not img.has_data and not img.pixels:
        return None
    w, h = img.size
    if w == 0 or h == 0:
        return None
    px = list(img.pixels)
    lin = img.colorspace_settings.name.lower() in ('non-color', 'linear', 'linear rec.709')

    def f(uv):
        x = int((uv[0] % 1.0) * (w - 1))
        y = int((uv[1] % 1.0) * (h - 1))
        i = (y * w + x) * 4
        return (px[i], px[i + 1], px[i + 2]) if lin else tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in px[i:i + 3])
    return f


def prepare_import(car_id, cfg):
    '''Prepara y exporta el modelo importado en la colección src_<id>.'''
    E = cfg['E']                                  # espacio de nombres de export_game
    L = cfg['L']
    src = bpy.data.collections['src_' + car_id]
    src.hide_viewport = False
    bm, mats, obs = gather(src)
    orient(bm, L, cfg.get('flip'))
    ov = cfg.get('overrides', {})
    # área por material (para decidir la pintura principal)
    area = {}
    for f in bm.faces:
        area[f.material_index] = area.get(f.material_index, 0) + f.calc_area()
    gmat = {}
    for i, m in enumerate(mats):
        gmat[i] = classify(m, area.get(i, 0), ov)
    if 'paint' not in gmat.values():
        # la pintura = el material de color más extenso que no sea negro ni metálico
        best, ba = None, 0
        for i, m in enumerate(mats):
            if gmat[i] in ('plastic', 'gloss') and area.get(i, 0) > ba:
                col, img = base_color(m)
                if 0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2] > 0.04:
                    best, ba = i, area.get(i, 0)
        if best is not None:
            gmat[best] = 'paint'
    if not cfg.get('keep_interior'):
        kill = [f for f in bm.faces if gmat.get(f.material_index) == 'interior']
        bmesh.ops.delete(bm, geom=kill, context='FACES')
    for i in gmat:
        if gmat[i] == 'interior':
            gmat[i] = 'plastic'
    coll = bpy.data.collections.get('imp_' + car_id) or bpy.data.collections.new('imp_' + car_id)
    if coll.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(coll)
    for o in list(coll.objects):
        bpy.data.objects.remove(o)
    wh = wheels_of(bm, L)
    if (True, True) not in wh:
        raise ValueError('no encuentro la rueda delantera derecha; ruedas: %s' % list(wh))
    fr = wh[(True, True)]
    wheel_faces = set(f for w in wh.values() for f in w['faces'])
    body_faces = [f for f in bm.faces if f not in wheel_faces]
    body = bm_to_object(bm, body_faces, car_id, coll, mats)
    c = fr['center']
    wheel = bm_to_object(bm, fr['faces'], car_id + '_wheel_f', coll, mats, Matrix.Translation(-c))
    # ruedas de referencia en su sitio (para la oclusión)
    placed = [bm_to_object(bm, w['faces'], car_id + '_wref_%d' % k, coll, mats) for k, w in enumerate(wh.values())]
    bm.free()
    tb = decimate(body, cfg.get('budget', 45000))
    tw = decimate(wheel, cfg.get('wheel_budget', 5000))
    for ob in (body, wheel):
        for p in ob.data.polygons:
            p.use_smooth = True
    samplers = {i: sampler(base_color(m)[1]) for i, m in enumerate(mats)}
    names = {m.name if m else '_none': i for i, m in enumerate(mats)}

    def mat_of(n):
        return gmat.get(names.get(n, -1), 'plastic')

    def color_of(n, p, uv=None):
        i = names.get(n, -1)
        m = mats[i] if i >= 0 else None
        col, img = base_color(m) if m else ((0.5, 0.5, 0.5), None)
        s = samplers.get(i)
        if s is not None and uv is not None:
            col = s(uv)
        return tuple(int(round(lin2srgb(c) * 255)) for c in col)
    occl = [E['bvh_of']([body] + placed)]
    bv, bt = E['mesh_data'](body, occl, False, mat_of, color_of, ao_k=cfg.get('ao_k', 14), raw_names=True)
    wocc = [E['bvh_of']([wheel])]
    wv, wt = E['mesh_data'](wheel, wocc, False, mat_of, color_of, local=True, ao_k=10, ao_dist=0.25, ground=False, raw_names=True)
    # ruedas traseras
    rr = wh.get((True, False)) or fr
    palette = {}
    b1, m1 = E['pack_mesh'](bv, bt, palette)
    b2, m2 = E['pack_mesh'](wv, wt, palette)
    m1.update(name='body', mirror=False)
    m2.update(name='wheel', mirror=False)
    MATS = E['MATS']
    lights = E['clusters'](bv, bt, lambda mm, cc: mm in (MATS.index('tail'), MATS.index('lensred')) and cc.y < 0.6 and cc.x > -0.01)
    exh = E['clusters'](bv, bt, lambda mm, cc: mm == MATS.index('metal') and cc.y < 0.4 and cc.z < 0.7 and cc.x > -0.01)
    meta = dict(
        id=car_id, L=L, W=round(2 * max(abs(v[0]) for v in bv), 4), H=round(max(v[2] for v in bv), 4), meshes=[m1, m2],
        wheels=dict(yf=round(fr['center'].y, 4), yr=round(rr['center'].y, 4), tf=round(2 * abs(fr['center'].x), 4), tr=round(2 * abs(rr['center'].x), 4),
                    rf=round(fr['r'], 4), rr=round(rr['r'], 4), wf=round(fr['w'], 4), wr=round(rr['w'], 4), rimf=0, rimr=0),
        lights=lights, exhausts=exh, heads=[],
        colors=dict(paint=cfg['color'], sec=cfg.get('sec', '#15171b'), stripe=cfg.get('stripe', '#f2f2f2'), caliper=cfg.get('caliper', '#c41a1a'), rim=cfg.get('rim', '#b9bdc4')),
        source=cfg.get('credit', 'import'),
        palette=[[k[0], '#%02x%02x%02x' % k[1:]] for k, _ in sorted(palette.items(), key=lambda kv: kv[1])],
    )
    st = E['write_car'](car_id, meta, b1 + b2)
    st.update(body_tris=tb, wheel_tris=tw, mats={(m.name if m else '_none'): gmat[i] for i, m in enumerate(mats)})
    return st
