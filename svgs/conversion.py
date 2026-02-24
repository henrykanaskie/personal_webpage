import re

name = "daimler"
svg = f"./svg_data/{name}.svg"
jsfile = f"{name}Paths.ts"
with open(f'{svg}', 'r') as f:
  content = f.read()

paths = re.findall(r'<path[^>]*\bd="(.*?)"', content, re.DOTALL)

cleaned = []
for p in paths:
  clean = ' '.join(p.split()).strip()
  cleaned.append(clean)


print(f'found {len(cleaned)} paths')


indexed = [(i, p) for i, p in enumerate(cleaned)]
indexed.sort(key=lambda x: len(x[1]), reverse=True)
top75 = set(i for i, p in indexed[:75])
kept = [p for i, p in enumerate(cleaned) if i in top75]

with open(f'{jsfile}', 'w') as f:
  f.write(f'export const {name}Paths = [\n')
  for i, p in enumerate(kept):
    comma = ',' if i < len(kept) - 1 else ''
    f.write(f'  "{p}"{comma}\n')

  f.write('];\n')