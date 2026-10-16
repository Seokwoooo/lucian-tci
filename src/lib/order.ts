import type { Item } from '../types';

/** Bump when the presentation order changes; saved positions are rebuilt from answers. */
export const ORDER_VERSION = 'spread-1';

// Fixed tie-break order so the sequence never depends on runtime randomness.
const TIE_BREAK = ['NS1', 'HA3', 'RD2', 'P1', 'S2', 'C3', 'ST1', 'NS2', 'HA1', 'RD1', 'P3', 'S5', 'C1', 'ST2', 'HA2', 'NS4', 'RD3', 'P2', 'S1', 'C2', 'ST4', 'HA4', 'NS3', 'RD4', 'P4', 'S3', 'C4', 'ST5', 'S4', 'C5'];

/**
 * Spread every domain, then every subscale inside it, evenly across the test (weighted round-robin
 * by "due time"), never placing two items of the same domain back to back when another is open.
 * Scoring always uses item IDs, so this order changes only what the visitor sees next, never a score.
 */
export function presentationOrder(items: readonly Item[]): Item[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) groups.set(item.subscale, [...(groups.get(item.subscale) ?? []), item]);
  const count = <K>(map: Map<K, number>, key: K) => map.get(key) ?? 0;
  const subTotal = new Map([...groups].map(([code, list]) => [code, list.length]));
  const subTaken = new Map<string, number>();
  const domainTotal = new Map<string, number>();
  for (const item of items) domainTotal.set(item.domain, count(domainTotal, item.domain) + 1);
  const domainTaken = new Map<string, number>();
  const domainOrder = [...domainTotal.keys()];
  const rank = (code: string) => { const index = TIE_BREAK.indexOf(code); return index < 0 ? TIE_BREAK.length : index; };
  const order: Item[] = [];
  let previous: Item | undefined;
  while (order.length < items.length) {
    const open = domainOrder.filter(d => count(domainTaken, d) < domainTotal.get(d)!);
    const pool = open.filter(d => d !== previous?.domain);
    const due = (d: string) => (count(domainTaken, d) + 0.5) / domainTotal.get(d)!;
    const domain = (pool.length ? pool : open).sort((a, b) => due(a) - due(b) || domainOrder.indexOf(a) - domainOrder.indexOf(b))[0];
    const subs = [...groups.keys()].filter(code => groups.get(code)![0].domain === domain && count(subTaken, code) < subTotal.get(code)!);
    const subDue = (code: string) => (count(subTaken, code) + 0.5) / subTotal.get(code)!;
    const code = subs.sort((a, b) => subDue(a) - subDue(b) || rank(a) - rank(b))[0];
    const next = groups.get(code)![count(subTaken, code)];
    subTaken.set(code, count(subTaken, code) + 1);
    domainTaken.set(domain, count(domainTaken, domain) + 1);
    order.push(next);
    previous = next;
  }
  return order;
}

/** Seven chapters; each boundary is the last 0-based position of a chapter. */
export function chapterEnds(length: number, chapters = 7): number[] {
  return Array.from({ length: chapters }, (_, i) => Math.round(((i + 1) * length) / chapters) - 1);
}
export function chapterOf(position: number, length: number): number {
  return chapterEnds(length).findIndex(end => position <= end);
}
