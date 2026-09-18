# Ищет русские строки вне пар { ru, en } в app/**/*.tsx. Эвристика: строки с
# кириллицей, не комментарии и не внутри значения `ru:`. Запуск: python3 scripts/checks/ru-audit.py

import re, sys, glob
# Heuristic: report lines with Cyrillic that are not comments and not part of a `ru:` value
# (a `ru:` value may span lines until a line containing `en:`).
files = sys.argv[1:] or sorted(glob.glob('app/**/*.tsx', recursive=True))
for f in files:
    lines = open(f).read().split('\n')
    in_ru = False; in_block = False; out = []
    for i, l in enumerate(lines, 1):
        s = l.strip()
        if '/*' in s and '*/' not in s: in_block = True
        if in_block:
            if '*/' in s: in_block = False
            continue
        if s.startswith('//') or s.startswith('*') or s.startswith('{/*'): continue
        if re.search(r'\bru:', s): in_ru = True
        if re.search(r'\ben:', s) or (in_ru and (s.endswith('},') or s.endswith('}'))) : 
            if re.search(r'\ben:', s): in_ru = False
        if in_ru: continue
        if re.search(r'\ben:', s): continue
        # strip inline comments
        s2 = re.sub(r'/\*.*?\*/', '', s); s2 = re.sub(r'//.*$', '', s2)
        if re.search(r'[А-Яа-яЁё]', s2):
            out.append(f"{i}: {s2[:110]}")
    if out:
        print(f"== {f} ({len(out)})")
        for o in out[:12]: print("  ", o)
