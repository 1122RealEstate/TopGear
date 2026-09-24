'''Vistas previas de los coches (estudio, cámaras y hoja de 4 vistas).'''
import bpy, math, os
import numpy as np
from mathutils import Vector


def setup_studio():
    sc = bpy.context.scene
    for ob in list(bpy.data.objects):
        if ob.name in ('Cube', 'Light', 'Camera'):
            bpy.data.objects.remove(ob)
    try:
        sc.render.engine = 'BLENDER_EEVEE'
    except TypeError:
        pass
    sc.render.resolution_x, sc.render.resolution_y = 800, 450
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast' if 'AgX - Medium High Contrast' in [i.identifier for i in sc.view_settings.bl_rna.properties['look'].enum_items] else 'None'
    if hasattr(sc.eevee, 'use_raytracing'):
        sc.eevee.use_raytracing = True
    sc.eevee.taa_render_samples = 32
    # mundo: cielo degradado
    w = bpy.data.worlds.get('tg_studio') or bpy.data.worlds.new('tg_studio')
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    mr = nt.nodes.new('ShaderNodeMapRange')
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    mr.inputs['From Min'].default_value = -1.0
    mr.inputs['From Max'].default_value = 1.0
    nt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
    cr = ramp.color_ramp
    cr.elements[0].position = 0.5
    cr.elements[0].color = (0.05, 0.05, 0.055, 1)
    cr.elements[1].position = 1.0
    cr.elements[1].color = (0.35, 0.42, 0.55, 1)
    e = cr.elements.new(0.52)
    e.color = (0.8, 0.82, 0.85, 1)
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 1.0
    nt.links.new(bg.outputs[0], out.inputs[0])
    coll = bpy.data.collections.get('studio') or bpy.data.collections.new('studio')
    if coll.name not in sc.collection.children:
        sc.collection.children.link(coll)
    if not bpy.data.objects.get('floor'):
        me = bpy.data.meshes.new('floor')
        s = 40
        me.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
        fl = bpy.data.objects.new('floor', me)
        coll.objects.link(fl)
        m = bpy.data.materials.new('floor_mat')
        m.use_nodes = True
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (0.08, 0.08, 0.085, 1)
        b.inputs['Roughness'].default_value = 0.45
        me.materials.append(m)
    for name, loc, rot, size, en in (('key', (3, -4, 7), (0.6, 0.2, 0.5), 6, 900), ('fill', (-5, 3, 4), (0.9, -0.6, 2.5), 5, 300), ('top', (0, 2.2, 6), (0, 0, 0), 5, 500)):
        ob = bpy.data.objects.get(name)
        if not ob:
            ld = bpy.data.lights.new(name, 'AREA')
            ob = bpy.data.objects.new(name, ld)
            coll.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = rot
        ob.data.size = size
        ob.data.energy = en
    for name in ('cam',):
        if not bpy.data.objects.get(name):
            cd = bpy.data.cameras.new(name)
            ob = bpy.data.objects.new(name, cd)
            coll.objects.link(ob)
            sc.camera = ob


def aim(cam, loc, target):
    cam.location = loc
    d = (Vector(target) - Vector(loc))
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def show_only(car_id):
    for c in bpy.data.collections:
        if c.name.startswith('car_'):
            vis = c.name == 'car_' + car_id
            c.hide_render = not vis
            c.hide_viewport = not vis


def render_sheet(S, path, views=('game', 'rear34', 'front34', 'side')):
    sc = bpy.context.scene
    setup_studio()
    show_only(S['id'])
    cam = bpy.data.objects['cam']
    sc.camera = cam
    L, H = S['L'], 1.25
    tmp = []
    for v in views:
        cam.data.type = 'PERSP'
        if v == 'game':
            phi, D = 0.19, 2.6
            loc = (0, (0.45 - D * math.cos(phi)) * L, (0.1 + D * math.sin(phi)) * L)
            cam.location = loc
            cam.rotation_euler = (math.pi / 2 - phi, 0, 0)
            cam.data.lens = 150
        elif v == 'rear34':
            aim(cam, (-4.2, -4.6, 2.4), (0, L * 0.42, 0.55))
            cam.data.lens = 55
        elif v == 'front34':
            aim(cam, (4.6, L + 4.0, 1.9), (0, L * 0.52, 0.5))
            cam.data.lens = 55
        elif v == 'side':
            cam.data.type = 'ORTHO'
            cam.data.ortho_scale = L * 1.12
            cam.location = (12, L / 2, 0.55)
            cam.rotation_euler = (math.pi / 2, 0, math.pi / 2)
        elif v == 'rear':
            cam.data.type = 'ORTHO'
            cam.data.ortho_scale = 2.4
            cam.location = (0, -12, 0.62)
            cam.rotation_euler = (math.pi / 2, 0, 0)
        elif v == 'top':
            cam.data.type = 'ORTHO'
            cam.data.ortho_scale = L * 1.12
            cam.location = (0, L / 2, 12)
            cam.rotation_euler = (0, 0, -math.pi / 2)
        elif v == 'wheel':
            W = S['wheels']
            aim(cam, (W['tf'] / 2 + 1.6, W['yf'] + 0.9, W['r'] + 0.25), (W['tf'] / 2 + 0.05, W['yf'], W['r']))
            cam.data.lens = 60
        elif v == 'tail':
            aim(cam, (0.9, -1.9, 0.95), (0.35, 0.0, 0.55))
            cam.data.lens = 50
        elif v == 'head':
            aim(cam, (1.3, L + 1.6, 1.05), (0.55, L - 0.3, 0.5))
            cam.data.lens = 50
        elif v == 'cabin':
            aim(cam, (2.6, L * 0.62, 1.45), (0.4, L * 0.5, 0.95))
            cam.data.lens = 45
        elif v == 'front':
            cam.data.type = 'ORTHO'
            cam.data.ortho_scale = 2.4
            cam.location = (0, L + 12, 0.62)
            cam.rotation_euler = (math.pi / 2, 0, math.pi)
        f = path + '_' + v + '.png'
        sc.render.filepath = f
        bpy.ops.render.render(write_still=True)
        tmp.append(f)
    # hoja 2x2
    imgs = []
    for f in tmp:
        im = bpy.data.images.load(f, check_existing=False)
        a = np.empty(im.size[0] * im.size[1] * 4, dtype=np.float32)
        im.pixels.foreach_get(a)
        imgs.append(a.reshape(im.size[1], im.size[0], 4))
        bpy.data.images.remove(im)
    h, w = imgs[0].shape[:2]
    cols = 2 if len(imgs) <= 4 else 3
    rows = (len(imgs) + cols - 1) // cols
    sheet = np.zeros((h * rows, w * cols, 4), dtype=np.float32)
    for i, a in enumerate(imgs):
        r, c = i // cols, i % cols
        sheet[(rows - 1 - r) * h:(rows - r) * h, c * w:(c + 1) * w] = a
    out = bpy.data.images.new('sheet', w * cols, h * rows, alpha=True)
    out.pixels.foreach_set(sheet.ravel())
    out.filepath_raw = path + '.png'
    out.file_format = 'PNG'
    out.save()
    bpy.data.images.remove(out)
    for f in tmp:
        os.remove(f)
    return path + '.png'
