import base64, io, json, sys, os
from fontTools import subset
from fontTools.ttLib import TTFont
from PIL import Image
P = os.environ.get('PORTFOLIO', os.path.expanduser('~/Desktop/kamalraaj-portfolio'))
out = {}
chars = ''.join(chr(c) for c in range(32, 127)) + '’★·↗…'
def font(path, key):
    f = TTFont(path)
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['kern', 'liga', 'tnum']
    s = subset.Subsetter(opts); s.populate(text=chars); s.subset(f)
    b = io.BytesIO(); f.flavor = 'woff2'; f.save(b)
    out[key] = 'data:font/woff2;base64,' + base64.b64encode(b.getvalue()).decode()
font(f'{P}/fonts/inter-tight-latin.woff2', 'fDisplay')
font(f'{P}/fonts/inter-latin.woff2', 'fSans')
font(f'{P}/fonts/jetbrains-mono-latin.woff2', 'fMono')
def photo(path, key, w):
    im = Image.open(path).convert('RGB'); h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS); b = io.BytesIO(); im.save(b, 'JPEG', quality=74, optimize=True, progressive=True)
    out[key] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
photo(f'{P}/assets/photo-iitm-foss-booth-720.webp', 'snapA', 380)
photo(f'{P}/assets/photo-tamil-foss.webp', 'snapB', 280)
L = f'{P}/assets/oss/logos'
for n in os.listdir(L):
    k, ext = os.path.splitext(n)
    if ext == '.svg':
        out['logo_' + k] = 'data:image/svg+xml;base64,' + base64.b64encode(open(f'{L}/{n}', 'rb').read()).decode()
    else:
        im = Image.open(f'{L}/{n}').convert('RGBA'); im.thumbnail((64, 64), Image.LANCZOS); b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
        out['logo_' + k] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
json.dump(out, open(sys.argv[1], 'w'))
for k, v in out.items(): print(k, len(v))
from fontTools.varLib import instancer
W = {}
for key, path, wts in [('display', f'{P}/fonts/inter-tight-latin.woff2', [700, 800]), ('sans', f'{P}/fonts/inter-latin.woff2', [400, 600])]:
    for wt in wts:
        f = TTFont(path); f = instancer.instantiateVariableFont(f, {'wght': wt})
        cmap = f.getBestCmap(); upm = f['head'].unitsPerEm; hm = f['hmtx']
        W[f'{key}{wt}'] = {c: hm[cmap[ord(c)]][0] / upm for c in chars if ord(c) in cmap}
json.dump(W, open(sys.argv[1].replace('assets', 'widths'), 'w'))
print('widths', list(W))
