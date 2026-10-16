"""Optional asset regeneration: python -m pip install fonttools brotli.

Subset self-hosted OFL Noto fonts to all characters in this version's source/data.
Generated fonts are committed, so normal npm builds do not require Python.
"""
from pathlib import Path
from fontTools import subset
import json
import shutil
import hashlib

ROOT = Path(__file__).resolve().parent.parent
text = ''.join(chr(i) for i in range(32, 127))
for path in sorted((ROOT / 'src').rglob('*')):
    if path.suffix in ('.ts', '.tsx', '.json'):
        text += path.read_text()
text += (ROOT / 'index.html').read_text()
text += '…–—−·×→↗ⅠⅡⅢⅣⅤ'
points = sorted({ord(char) for char in text})
out = ROOT / 'public/fonts'
out.mkdir(parents=True, exist_ok=True)
generated = []
for weight in (400, 600):
    options = subset.Options()
    options.flavor = 'woff2'
    options.recalc_timestamp = False
    options.name_IDs = ['*']
    source = ROOT / f'node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-korean-{weight}-normal.woff2'
    font = subset.load_font(str(source), options)
    available = set(font.getBestCmap())
    missing = [cp for cp in points if 0xAC00 <= cp <= 0xD7A3 and cp not in available]
    if missing:
        raise RuntimeError(f'Korean characters missing from original font: {missing}')
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=points)
    sub.subset(font)
    destination = out / f'noto-kr-{weight}.woff2'
    subset.save_font(font, str(destination), options)
    generated.append({'file': destination.name, 'weight': weight, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'codepoints': sorted(font.getBestCmap())})
    print(f'{destination.name}: {destination.stat().st_size:,} bytes')
shutil.copyfile(ROOT/'node_modules/@fontsource/noto-sans-kr/LICENSE', out/'OFL.txt')
(out/'coverage.json').write_text(json.dumps({'source':'@fontsource/noto-sans-kr@5.3.1','license':'OFL-1.1','fonts':generated}, ensure_ascii=False))
