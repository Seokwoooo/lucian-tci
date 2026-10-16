import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const VERSION = '2026-10-16.1';
export const KEY_SOURCE = 'https://ipip.ori.org/newTCIKey.htm';
export const TABLE_SOURCE = 'https://ipip.ori.org/newTCITable.htm';
export const DOMAIN_TOTALS = { NS: 34, HA: 39, RD: 40, P: 39, SD: 48, C: 52, ST: 37 };
export const normalizeWhitespace = (text) => text.replace(/\s+/gu, ' ').trim();
const domainOf = (code) => code.match(/^(NS|HA|RD|P|S|C|ST)\d+$/u)?.[1].replace(/^S$/u, 'SD');
const json = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));

/** Parse the official key and comparison table independently, without network access. */
export function extractOfficial() {
  const $ = load(readFileSync(resolve(ROOT, 'provenance/newTCIKey.htm'), 'latin1'));
  const items = [];
  const seen = new Set();
  $('font[size="4"]').each((_, heading) => {
    const match = normalizeWhitespace($(heading).text()).match(/^((?:NS|HA|RD|P|S|C|ST)\d+):\s*(.+)$/u);
    if (!match) return;
    const [, subscale] = match;
    assert(!seen.has(subscale), `Duplicate key heading: ${subscale}`);
    seen.add(subscale);
    const table = $(heading).closest('td').children('table');
    assert.equal(table.length, 1, `Expected one item table: ${subscale}`);
    let reverse;
    let index = 0;
    table.find('tr').each((__, row) => {
      const cells = $(row).children('td');
      assert.equal(cells.length, 2, `Unexpected item row: ${subscale}`);
      const label = normalizeWhitespace(cells.eq(0).text());
      const english = normalizeWhitespace(cells.eq(1).text());
      if (label.includes('keyed')) {
        assert.match(label, /^(?:\+|[\u0096\u2013\u2014-])\s*keyed$/u, `Unknown scoring key: ${label}`);
        reverse = !label.startsWith('+');
      } else {
        assert.equal(label, '', `Unexpected key label: ${subscale}: ${label}`);
      }
      if (!english) return;
      if (english === '(No negative items.)') {
        assert(subscale === 'C2' && reverse === true, 'Unexpected no-negative-items annotation');
        return;
      }
      assert.equal(typeof reverse, 'boolean', `Item without scoring key: ${subscale}`);
      index += 1;
      items.push({ id: `${subscale}-${String(index).padStart(2, '0')}`, domain: domainOf(subscale), subscale, english, reverse, source: KEY_SOURCE, version: VERSION });
    });
  });
  assert.equal(seen.size, 30, 'The official key must contain 30 subscales');
  assert(!seen.has('ST3'), 'The preliminary IPIP key has no ST3 scale');

  const table = load(readFileSync(resolve(ROOT, 'provenance/newTCITable.htm'), 'latin1'));
  const subscales = {};
  let explicitlyAbsentST3 = false;
  table('tr').each((_, row) => {
    const cells = table(row).children('td').map((__, cell) => normalizeWhitespace(table(cell).text())).get();
    if (cells.length < 3) return;
    const code = cells[1].match(/^((?:NS|HA|RD|P|S|C|ST)\d+)\b/u)?.[1];
    if (!code) return;
    if (code === 'ST3') {
      assert.match(cells[0], /No ST3 scale/u);
      explicitlyAbsentST3 = true;
      return;
    }
    const counts = cells[2].match(/^(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)$/u);
    assert(counts, `Missing independent IPIP table counts: ${code}`);
    const [positive, negative, count] = counts.slice(1).map(Number);
    assert.equal(positive + negative, count, `Table arithmetic: ${code}`);
    assert(!subscales[code], `Duplicate comparison table row: ${code}`);
    subscales[code] = { domain: domainOf(code), positive, negative, count };
  });
  assert(explicitlyAbsentST3, 'Expected explicit No ST3 scale row');
  assert.deepEqual([...seen], Object.keys(subscales), 'Key and table subscale order differs');
  for (const [code, expected] of Object.entries(subscales)) {
    const group = items.filter((item) => item.subscale === code);
    assert.equal(group.filter((item) => !item.reverse).length, expected.positive, `${code} positive key count`);
    assert.equal(group.filter((item) => item.reverse).length, expected.negative, `${code} negative key count`);
    assert.equal(group.length, expected.count, `${code} item count`);
  }
  const domains = Object.fromEntries(Object.keys(DOMAIN_TOTALS).map((domain) => [domain, items.filter((item) => item.domain === domain).length]));
  assert.deepEqual(domains, DOMAIN_TOTALS, 'Official domain totals');
  assert.equal(items.length, 289, 'Official item occurrences');
  return { items, expectedCounts: { version: VERSION, source: TABLE_SOURCE, total: items.length, domains, subscales } };
}

export function assembleItems(englishItems, translations = json('src/data/translations.ko.json')) {
  assert(Array.isArray(translations), 'Translations must be an array');
  const byId = new Map();
  for (const translation of translations) {
    assert(!byId.has(translation.id), `Duplicate translation ID: ${translation.id}`);
    byId.set(translation.id, translation);
  }
  assert.equal(byId.size, englishItems.length, 'Translation occurrence count');
  return englishItems.map((item) => {
    const translation = byId.get(item.id);
    assert(translation, `Missing translation: ${item.id}`);
    assert.equal(translation.english, item.english, `Translation English drift: ${item.id}`);
    assert.equal(typeof translation.korean, 'string', `Invalid Korean: ${item.id}`);
    assert.match(translation.korean, /[가-힣]/u, `Missing Korean translation: ${item.id}`);
    assert.equal(translation.korean, normalizeWhitespace(translation.korean), `Korean whitespace: ${item.id}`);
    assert(!/TODO|TBD|placeholder|번역\s*예정/iu.test(translation.korean), `Placeholder: ${item.id}`);
    const result = { ...item, korean: translation.korean };
    if (translation.reviewNotes !== undefined) {
      assert(Array.isArray(translation.reviewNotes) && translation.reviewNotes.every((note) => typeof note === 'string' && note.trim()), `Invalid review notes: ${item.id}`);
      result.reviewNotes = translation.reviewNotes;
    }
    return result;
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { items: englishItems, expectedCounts } = extractOfficial();
  const items = assembleItems(englishItems);
  if (process.argv.includes('--check')) {
    assert.deepEqual(json('src/data/items.json'), items, 'items.json differs from frozen source + translations');
    assert.deepEqual(json('src/data/expected-counts.json'), expectedCounts, 'expected-counts.json differs from official table');
    console.log('PASS: offline extraction is reproducible (289 occurrences, 30 subscales, 7 domains).');
  } else {
    writeFileSync(resolve(ROOT, 'src/data/items.json'), `${JSON.stringify(items, null, 2)}\n`);
    writeFileSync(resolve(ROOT, 'src/data/expected-counts.json'), `${JSON.stringify(expectedCounts, null, 2)}\n`);
    console.log('Extracted 289 occurrences, 30 subscales, 7 domains; merged 289 English-matched Korean translations.');
  }
}
