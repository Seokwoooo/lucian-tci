import { describe, expect, it } from 'vitest';
import rawItems from '../src/data/items.json';
import type { Answers, Item, Response } from '../src/types';
import { scoreAnswers, validateAnswers } from '../src/lib/scoring';

const items = rawItems as Item[];
// Independently transcribed from the official IPIP comparison table, not the runtime key.
const keyCounts: Record<string, [number, number]> = {
  NS1: [7, 3], NS2: [4, 6], NS3: [2, 2], NS4: [6, 4],
  HA1: [5, 5], HA2: [3, 7], HA3: [5, 5], HA4: [5, 4],
  RD1: [7, 3], RD2: [5, 5], RD3: [5, 5], RD4: [5, 5],
  P1: [6, 4], P2: [6, 3], P3: [9, 1], P4: [8, 2],
  S1: [1, 9], S2: [5, 5], S3: [5, 5], S4: [2, 6], S5: [5, 5],
  C1: [6, 6], C2: [8, 0], C3: [6, 6], C4: [3, 7], C5: [6, 4],
  ST1: [8, 3], ST2: [7, 2], ST4: [6, 3], ST5: [6, 2],
};
const responses = (value: Response): Answers => Object.fromEntries(items.map(item => [item.id, value]));
const fixtureItem = (id: string, subscale: string, reverse = false): Item => ({
  id, domain: 'NS', subscale, reverse, english: id, korean: id,
  source: 'test fixture', version: 'test',
});

describe('official-key scoring', () => {
  it('returns all 30 subscales and seven domains at 3 for neutral answers', () => {
    const result = scoreAnswers(responses(3));
    expect(result.answered).toBe(289);
    expect(result.subscales.map(scale => scale.code)).toEqual(Object.keys(keyCounts));
    expect(result.domains.map(domain => domain.code)).toEqual(['NS', 'HA', 'RD', 'P', 'SD', 'C', 'ST']);
    for (const scale of result.subscales) {
      const [positive, negative] = keyCounts[scale.code];
      expect(scale.count).toBe(positive + negative);
      expect(scale.sum).toBe((positive + negative) * 3);
      expect(scale.mean).toBe(3);
    }
    expect(result.domains.every(domain => domain.mean === 3)).toBe(true);
  });

  it.each([1, 5] as const)('matches independent positive/negative counts for every subscale at raw response %i', value => {
    const result = scoreAnswers(responses(value));
    for (const scale of result.subscales) {
      const [positive, negative] = keyCounts[scale.code];
      const expectedSum = positive * value + negative * (6 - value);
      expect(scale.sum, scale.code).toBe(expectedSum);
      expect(scale.mean, scale.code).toBe(expectedSum / (positive + negative));
    }
    // In particular, HA and ST retain their keyed direction; neither is reversed again.
    for (const domain of result.domains) {
      const expected = domain.subscales.map(code => {
        const [positive, negative] = keyCounts[code];
        return (positive * value + negative * (6 - value)) / (positive + negative);
      });
      expect(domain.mean, domain.code).toBe(expected.reduce((sum, mean) => sum + mean, 0) / expected.length);
    }
  });

  it.each([1, 5] as const)('uses the correct polarity at every official position to produce scored value %i', scored => {
    const answers: Answers = {};
    for (const [code, [positive, negative]] of Object.entries(keyCounts)) {
      for (let position = 1; position <= positive + negative; position++) {
        answers[`${code}-${String(position).padStart(2, '0')}`] = (position <= positive ? scored : 6 - scored) as Response;
      }
    }
    const result = scoreAnswers(answers);
    expect(result.subscales.every(scale => scale.mean === scored && scale.sum === scored * scale.count)).toBe(true);
    expect(result.domains.every(domain => domain.mean === scored)).toBe(true);
  });

  it('weights unequal-count subscales equally and preserves unrounded arithmetic', () => {
    const customItems = [fixtureItem('a', 'NS1'), fixtureItem('b', 'NS2'), fixtureItem('c', 'NS2'), fixtureItem('d', 'NS2')];
    const result = scoreAnswers({ a: 5, b: 1, c: 1, d: 2 }, customItems);
    expect(result.subscales).toEqual([
      { code: 'NS1', domain: 'NS', count: 1, sum: 5, mean: 5 },
      { code: 'NS2', domain: 'NS', count: 3, sum: 4, mean: 4 / 3 },
    ]);
    expect(result.domains).toEqual([{ code: 'NS', mean: (5 + 4 / 3) / 2, subscales: ['NS1', 'NS2'] }]);
    expect(result.domains[0].mean).not.toBe(9 / 4);
  });

  it('is invariant to item and answer order and does not mutate either input', () => {
    const answers = Object.fromEntries(items.map((item, index) => [item.id, (index % 5) + 1])) as Answers;
    const expected = scoreAnswers(answers);
    const shuffledItems = [...items].reverse();
    const shuffledAnswers = Object.fromEntries(Object.entries(answers).reverse());
    const beforeItems = JSON.stringify(shuffledItems);
    const beforeAnswers = JSON.stringify(shuffledAnswers);
    expect(scoreAnswers(shuffledAnswers, shuffledItems)).toEqual(expected);
    expect(JSON.stringify(shuffledItems)).toBe(beforeItems);
    expect(JSON.stringify(shuffledAnswers)).toBe(beforeAnswers);
  });
});

describe('strict answer validation', () => {
  it('rejects a missing answer and an extra answer without returning partial scores', () => {
    const missing = responses(3);
    delete missing[items[0].id];
    expect(() => scoreAnswers(missing)).toThrow(/누락/);
    expect(() => scoreAnswers({ ...responses(3), unexpected: 3 })).toThrow(/알 수 없는/);
  });

  it.each([0, 6, -1, 2.5, NaN, Infinity, '3', true, null, undefined, {}, [3]])('rejects invalid response %j without coercion', value => {
    expect(() => scoreAnswers({ ...responses(3), [items[0].id]: value })).toThrow(/정수/);
  });

  it.each([null, undefined, [], 'answers', 3, new Map(), new Date()])('rejects invalid answer container %j', input => {
    expect(() => validateAnswers(input)).toThrow(/객체/);
  });

  it('supports strict partial validation for drafts while scoring always requires completion', () => {
    const draft = { [items[0].id]: 4 };
    expect(validateAnswers(draft, items, true)).toEqual(draft);
    expect(validateAnswers({}, items, true)).toEqual({});
    expect(() => validateAnswers({ ...draft, unexpected: 3 }, items, true)).toThrow(/알 수 없는/);
    expect(() => validateAnswers({ [items[0].id]: '4' }, items, true)).toThrow(/정수/);
    expect(() => scoreAnswers(draft)).toThrow(/누락/);
  });

  it('returns an independent copy and accepts plain objects with null prototype', () => {
    const input = Object.assign(Object.create(null), responses(3));
    const validated = validateAnswers(input);
    expect(validated).toEqual(responses(3));
    validated[items[0].id] = 5;
    expect(input[items[0].id]).toBe(3);
  });

  it('does not accept inherited responses or symbol IDs', () => {
    const inherited = Object.create(responses(3));
    expect(() => validateAnswers(inherited)).toThrow();
    expect(() => validateAnswers({ ...responses(3), [Symbol('unknown')]: 3 })).toThrow(/알 수 없는/);
  });

  it('rejects malformed item keys before scoring', () => {
    const item = fixtureItem('a', 'NS1');
    expect(() => scoreAnswers({ a: 3 }, [item, item])).toThrow(/중복/);
    expect(() => scoreAnswers({}, [])).toThrow(/문항/);
    expect(() => scoreAnswers({ a: 3 }, [{ ...item, subscale: 'ST3' }])).toThrow(/하위척도/);
    expect(() => scoreAnswers({ a: 3 }, [{ ...item, domain: 'HA' }])).toThrow(/영역/);
  });
});
