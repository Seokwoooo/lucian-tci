import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { personas } from './src/data/personas';

const SITE = 'https://lucianlabs.dev/tci/';
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Emits /t/<slug>/index.html with that character's link-preview tags. Scores never reach these pages. */
function characterPages(): Plugin {
  return {
    name: 'lucian-character-pages',
    apply: 'build',
    writeBundle(options) {
      const dir = options.dir ?? 'dist';
      const html = readFileSync(join(dir, 'index.html'), 'utf8');
      for (const persona of personas) {
        const url = `${SITE}t/${persona.slug}/`;
        const title = `나의 기질 캐릭터는 ‘${persona.name}’ ${persona.emoji} | 무료 TCI 기질검사`;
        const description = `${persona.tagline}. 289문항 무료 TCI 기질검사로 16가지 캐릭터 중 나를 찾아보세요. IPIP 공개 문항 기반 비공식 검사입니다.`;
        const replacements: [RegExp, string][] = [
          [/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`],
          [/(<meta name="description" content=")[^"]*/, `$1${escape(description)}`],
          [/(<link rel="canonical" href=")[^"]*/, `$1${url}`],
          [/(<meta property="og:title" content=")[^"]*/, `$1${escape(title)}`],
          [/(<meta property="og:description" content=")[^"]*/, `$1${escape(description)}`],
          [/(<meta property="og:url" content=")[^"]*/, `$1${url}`],
          [/(<meta property="og:image" content=")[^"]*/, `$1${SITE}og/${persona.slug}.png`],
          [/(<meta name="twitter:image:alt" content=")[^"]*/, `$1${escape(`${persona.name} 캐릭터 그림. 무료 TCI 기질검사의 16가지 기질 캐릭터 중 하나.`)}`],
        ];
        let page = html;
        for (const [pattern, value] of replacements) {
          if (!pattern.test(page)) throw new Error(`Missing tag for character page: ${pattern}`);
          page = page.replace(pattern, value);
        }
        mkdirSync(join(dir, 't', persona.slug), { recursive: true });
        writeFileSync(join(dir, 't', persona.slug, 'index.html'), page);
      }
    },
  };
}

export default defineConfig({
  base: '/tci/',
  plugins: [react(), tailwindcss(), characterPages()],
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  build: { sourcemap: false },
});
