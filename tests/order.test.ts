import { describe, expect, it } from 'vitest';
import rawItems from '../src/data/items.json';
import { chapterEnds, chapterOf, presentationOrder } from '../src/lib/order';
import { scoreAnswers } from '../src/lib/scoring';
import type { Item, Response } from '../src/types';

const items = rawItems as Item[];
const order = presentationOrder(items);

describe('presentation order', () => {
  it('is a deterministic permutation of all 289 item IDs', () => {
    expect(order).toHaveLength(289);
    expect(new Set(order.map(i => i.id))).toEqual(new Set(items.map(i => i.id)));
    expect(presentationOrder(items).map(i => i.id)).toEqual(order.map(i => i.id));
  });

  it('never shows two items of the same subscale or domain back to back', () => {
    for (let i = 1; i < order.length; i++) {
      expect(order[i].subscale, `${i}`).not.toBe(order[i - 1].subscale);
      expect(order[i].domain, `${i}`).not.toBe(order[i - 1].domain);
    }
  });

  it('spreads every subscale across the test so each chapter samples most of them', () => {
    const ends = chapterEnds(order.length);
    let start = 0;
    for (const end of ends) {
      const seen = new Set(order.slice(start, end + 1).map(i => i.subscale));
      expect(seen.size).toBeGreaterThanOrEqual(24);
      start = end + 1;
    }
  });

  it('keeps scores identical to source order because scoring is keyed by item ID', () => {
    const answers = Object.fromEntries(order.map((item, n) => [item.id, ((n * 7) % 5 + 1) as Response]));
    const reversed = Object.fromEntries(Object.entries(answers).reverse());
    expect(scoreAnswers(reversed)).toEqual(scoreAnswers(answers));
  });

  it('splits 289 items into seven chapters', () => {
    expect(chapterEnds(289)).toEqual([40, 82, 123, 164, 205, 247, 288]);
    expect([0, 40, 41, 288].map(p => chapterOf(p, 289))).toEqual([0, 0, 1, 6]);
  });
});
