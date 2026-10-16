import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { assembleItems, extractOfficial, ROOT, VERSION, KEY_SOURCE, TABLE_SOURCE, normalizeWhitespace } from './extract-ipip.mjs';

const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const officialFiles = ['newTCIKey.htm', 'newTCITable.htm', 'newScoringInstructions.htm', 'newPermission.htm', 'newNorms.htm'];

export function validateProvenance(manifest) {
  assert.equal(manifest.retrievedDate, '2026-10-16', 'Client retrieval date');
  assert.equal(manifest.datasetVersion, VERSION, 'Provenance dataset version');
  assert.deepEqual(manifest.sources.map((entry) => entry.file), officialFiles, 'Frozen official source inventory');
  for (const source of manifest.sources) {
    assert.equal(source.url, `https://ipip.ori.org/${source.file}`, 'Official source URL');
    assert.equal(source.retrievedDate, '2026-10-16', 'Source retrieval date');
    const bytes = readFileSync(resolve(ROOT, 'provenance', source.file));
    assert.equal(source.bytes, bytes.length, `Source byte count: ${source.file}`);
    assert.equal(source.sha256, createHash('sha256').update(bytes).digest('hex'), `Source hash: ${source.file}`);
  }
}

export function validateDataset(items, expectedCounts, translations, official = extractOfficial()) {
  assert(Array.isArray(items), 'items.json must contain an Item array');
  assert.equal(items.length, 289, 'Expected 289 item occurrences');
  assert.equal(new Set(items.map((item) => item.id)).size, items.length, 'Unique occurrence IDs');
  assert.deepEqual(expectedCounts, official.expectedCounts, 'Counts must exactly match independent official comparison table');
  assert.equal(expectedCounts.source, TABLE_SOURCE);
  const translated = assembleItems(official.items, translations);
  const required = ['id', 'domain', 'subscale', 'english', 'korean', 'reverse', 'source', 'version'];
  const allowed = new Set([...required, 'reviewNotes']);
  for (const [index, item] of items.entries()) {
    assert(item && typeof item === 'object' && !Array.isArray(item), `Invalid item at position ${index}`);
    for (const key of required) assert(Object.hasOwn(item, key), `Missing ${key}: ${item.id}`);
    for (const key of Object.keys(item)) assert(allowed.has(key), `Unexpected ${key}: ${item.id}`);
    assert.equal(typeof item.reverse, 'boolean', `Boolean polarity: ${item.id}`);
    assert.equal(item.source, KEY_SOURCE, `Official source: ${item.id}`);
    assert.equal(item.version, VERSION, `Dataset version: ${item.id}`);
    assert.equal(item.english, normalizeWhitespace(item.english), `English whitespace: ${item.id}`);
    // Equality is by occurrence and position. Repeated English sentences are permitted.
    assert.deepEqual(item, translated[index], `Official text/key/order/domain/translation mismatch at position ${index + 1} (${item.id})`);
  }
  return { occurrences: items.length, subscales: Object.keys(expectedCounts.subscales).length, domains: Object.keys(expectedCounts.domains).length, positive: items.filter((item) => !item.reverse).length, negative: items.filter((item) => item.reverse).length, uniqueEnglishTexts: new Set(items.map((item) => item.english)).size };
}

function selfTest(items, expectedCounts, translations, manifest) {
  const official = extractOfficial();
  const mutations = [
    ['missing item', (x) => x.items.pop()],
    ['extra item', (x) => x.items.push(structuredClone(x.items[0]))],
    ['duplicate ID', (x) => { x.items[1].id = x.items[0].id; }],
    ['unknown ID', (x) => { x.items[0].id = 'NS1-99'; }],
    ['reordered occurrences', (x) => { [x.items[0], x.items[1]] = [x.items[1], x.items[0]]; }],
    ['English drift', (x) => { x.items[0].english += ' Changed.'; }],
    ['English whitespace drift', (x) => { x.items[0].english = ` ${x.items[0].english}`; }],
    ['polarity flip', (x) => { x.items[0].reverse = !x.items[0].reverse; }],
    ['non-boolean polarity', (x) => { x.items[0].reverse = 0; }],
    ['domain drift', (x) => { x.items[0].domain = 'SD'; }],
    ['S to SD subscale rewrite', (x) => { x.items.find((item) => item.subscale === 'S1').subscale = 'SD1'; }],
    ['invented ST3', (x) => { x.items.at(-1).subscale = 'ST3'; }],
    ['missing Korean', (x) => { x.items[0].korean = ''; x.translations[0].korean = ''; }],
    ['placeholder Korean', (x) => { x.items[0].korean = '번역 예정'; x.translations[0].korean = '번역 예정'; }],
    ['translation drift', (x) => { x.items[0].korean += ' 변경.'; }],
    ['translation English pairing', (x) => { x.translations[0].english += ' Changed.'; }],
    ['missing translation', (x) => x.translations.pop()],
    ['duplicate translation ID', (x) => { x.translations[1].id = x.translations[0].id; }],
    ['unknown translation ID', (x) => { x.translations[0].id = 'NS1-99'; }],
    ['source drift', (x) => { x.items[0].source = 'https://example.com'; }],
    ['version drift', (x) => { x.items[0].version = '0'; }],
    ['table count drift', (x) => { x.expectedCounts.subscales.C2.negative = 1; }],
    ['domain count drift', (x) => { x.expectedCounts.domains.SD = 47; }],
    ['unsupported field', (x) => { x.items[0].clinicalPercentile = 99; }],
    ['invalid review notes', (x) => { x.translations[0].reviewNotes = ['']; }],
  ];
  for (const [name, mutate] of mutations) {
    const changed = structuredClone({ items, expectedCounts, translations });
    mutate(changed);
    assert.throws(() => validateDataset(changed.items, changed.expectedCounts, changed.translations, official), undefined, `Validator accepted ${name}`);
  }
  const changedManifest = structuredClone(manifest);
  changedManifest.sources[0].sha256 = '0'.repeat(64);
  assert.throws(() => validateProvenance(changedManifest), /Source hash/u, 'Validator accepted altered source hash');
  // A repeated sentence must remain a separate occurrence rather than being deduplicated.
  const repeated = structuredClone(official.items);
  repeated[1].english = repeated[0].english;
  const repeatedTranslations = structuredClone(translations);
  repeatedTranslations[1].english = repeated[0].english;
  const merged = assembleItems(repeated, repeatedTranslations);
  assert.equal(merged.length, 289);
  assert.notEqual(merged[0].id, merged[1].id);
  assert.equal(merged[0].english, merged[1].english);
  console.log(`PASS: ${mutations.length + 1} corruption checks rejected; repeated-text occurrence preservation passed.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const items = readJson('src/data/items.json');
  const expectedCounts = readJson('src/data/expected-counts.json');
  const translations = readJson('src/data/translations.ko.json');
  const manifest = readJson('provenance/sources.json');
  validateProvenance(manifest);
  console.log(`PASS: official source SHA-256/bytes/date checked (${manifest.sources.length} frozen pages).`);
  console.log(`PASS: dataset validated ${JSON.stringify(validateDataset(items, expectedCounts, translations))}`);
  if (process.argv.includes('--self-test')) selfTest(items, expectedCounts, translations, manifest);
}
