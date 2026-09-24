'''Construye y renderiza coches:  exec(open(RUN).read()); run(['huracan'])'''
import bpy, os, time
BASE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else '/Users/1122realestate/Downloads/Top Gear/source/blender'


def load(car_id):
    G = {'__name__': 'tg_' + car_id}
    for f in ('carlib.py', 'details.py', 'preview.py'):
        p = os.path.join(BASE, f)
        exec(compile(open(p).read(), p, 'exec'), G)
    p = os.path.join(BASE, 'cars', car_id + '.py')
    exec(compile(open(p).read(), p, 'exec'), G)
    return G


def run(ids, out_dir, views=('game', 'rear34', 'front34', 'side'), render=True):
    res = []
    for cid in ids:
        t = time.time()
        G = load(cid)
        car = G['build_car'](G['SPEC'])
        n = len(car.data.polygons)
        img = G['render_sheet'](G['SPEC'], os.path.join(out_dir, cid), views) if render else None
        res.append((cid, n, round(time.time() - t, 1), img))
    return res
