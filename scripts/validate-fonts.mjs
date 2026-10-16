import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
async function sourceText(dir) {
  const entries = await readdir(dir, {withFileTypes:true});
  const chunks = await Promise.all(entries.map(entry => entry.isDirectory() ? sourceText(resolve(dir,entry.name)) : /\.(?:ts|tsx|json)$/.test(entry.name) ? readFile(resolve(dir,entry.name),'utf8') : ''));
  return chunks.join('');
}
const text = await sourceText(resolve(root,'src')) + await readFile(resolve(root,'index.html'),'utf8');
const required = new Set([...text].map(c=>c.codePointAt(0)).filter(cp=>cp>=0xac00&&cp<=0xd7a3));
const manifest = JSON.parse(await readFile(resolve(root,'public/fonts/coverage.json'),'utf8'));
for (const font of manifest.fonts) {
  const bytes = await readFile(resolve(root,'public/fonts',font.file));
  if (createHash('sha256').update(bytes).digest('hex') !== font.sha256) throw new Error(`Font asset hash mismatch: ${font.file}`);
  const present = new Set(font.codepoints);
  const missing = [...required].filter(cp=>!present.has(cp));
  if (missing.length) throw new Error(`Regenerate fonts with scripts/subset-fonts.py; ${font.file} is missing: ${String.fromCodePoint(...missing)}`);
}
if(manifest.fonts.length!==2)throw new Error('Both 400 and 600 font assets are required.');
console.log(`Fonts OK: ${required.size} Korean syllables covered at both weights; asset hashes match.`);
