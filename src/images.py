"""Fetch any Fluent emoji the unit asks for (requestImages) and report missing image keys.
usage: python3 src/images.py units/<id>.json"""
import json, sys, os, re, subprocess, urllib.parse
ROOT = os.path.join(os.path.dirname(__file__), '..')
IMG = os.path.join(ROOT, 'assets', 'img')
LST = [l.strip() for l in open(os.path.join(ROOT, 'assets', 'list3d.txt'))]
key = lambda n: re.sub(r'[^a-z0-9]+', '_', n.lower()).strip('_')
for f in sys.argv[1:]:
    d = json.load(open(f))
    for name in d.get('requestImages', []):
        k = key(name)
        if os.path.exists(f'{IMG}/{k}.png'): continue
        c = sorted([p[7:] for p in LST if p.startswith('assets/' + name + '/')], key=lambda p: (0 if '/Default/' in p else 1, len(p)))
        if not c: print('NOT FOUND', name); continue
        url = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/' + urllib.parse.quote(c[0])
        r = subprocess.run(['curl', '-s', '-f', '-o', f'{IMG}/{k}.png', url])
        print('got' if r.returncode == 0 else 'FAIL', k)
    miss = set()
    def walk(o):
        if isinstance(o, dict):
            for kk, v in o.items():
                if kk == 'pics' and isinstance(v, list): miss.update(p for p in v if not os.path.exists(f'{IMG}/{p}.png'))
                if kk == 'pic' and isinstance(v, str) and not os.path.exists(f'{IMG}/{v}.png'): miss.add(v)
                walk(v)
        elif isinstance(o, list):
            for x in o: walk(x)
    walk(d)
    print(f, 'missing image keys:', sorted(miss) or 'none')
