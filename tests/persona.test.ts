import { describe, expect, it } from 'vitest';
import rawItems from '../src/data/items.json';
import { personas } from '../src/data/personas';
import { NO_HEADLINE, band, subscaleLines, subscaleSentence } from '../src/data/narratives';
import { subscales } from '../src/data/scales';
import { findTwist, interimMeans, neighborsOf, oppositeOf, personaCode, readPersona, strongestPoints, type DomainMeans } from '../src/lib/persona';
import { scoreAnswers } from '../src/lib/scoring';
import type { Item, ScoreResult } from '../src/types';

const items = rawItems as Item[];
const means = (values: Partial<DomainMeans> = {}): DomainMeans => ({ NS: 3, HA: 3, RD: 3, P: 3, SD: 3, C: 3, ST: 3, ...values });
const withSubscales = (fn: (code: string) => number): ScoreResult => {
  const subs = subscales.map(s => ({ code: s.code, domain: s.domain, count: 10, sum: fn(s.code) * 10, mean: fn(s.code) }));
  const domainCodes = [...new Set(subscales.map(s => s.domain))];
  return { answered: 289, subscales: subs, domains: domainCodes.map(code => { const c = subs.filter(s => s.domain === code); return { code, subscales: c.map(s => s.code), mean: c.reduce((a, s) => a + s.mean, 0) / c.length }; }) };
};

describe('16 character nicknames', () => {
  it('covers every H/L combination exactly once with unique names, slugs and colors', () => {
    const codes = personas.map(p => p.code);
    expect(new Set(codes).size).toBe(16);
    for (const a of 'HL') for (const b of 'HL') for (const c of 'HL') for (const d of 'HL') expect(codes).toContain(a + b + c + d);
    expect(new Set(personas.map(p => p.slug)).size).toBe(16);
    expect(new Set(personas.map(p => p.name)).size).toBe(16);
    expect(personas.every(p => /^[a-z]+(-[a-z]+)*$/.test(p.slug) && /^#[0-9A-F]{6}$/i.test(p.color))).toBe(true);
    expect(personas.every(p => p.traits.length === 4 && p.strengths.length === 3 && p.watchouts.length === 2 && p.tags.length === 3)).toBe(true);
  });

  it('uses "above 3" as high and treats exactly 3 as low', () => {
    expect(personaCode(means())).toBe('LLLL');
    expect(personaCode(means({ NS: 3.0001, HA: 3, RD: 5, P: 1 }))).toBe('HLHL');
    expect(readPersona(means({ NS: 4.1, HA: 2.3, RD: 3.9, P: 3.4 })).persona.name).toBe('햇살 캡틴');
    expect(() => personaCode(means({ NS: Number.NaN }))).toThrow();
    expect(() => personaCode(means({ HA: 5.5 }))).toThrow();
  });

  it('describes distance from the midpoint and picks the highest character domain as gear', () => {
    const reading = readPersona(means({ NS: 3.1, HA: 2.4, RD: 4.5, SD: 3.2, C: 4.6, ST: 4.6 }));
    expect(reading.axes.map(a => a.degree)).toEqual(['살짝', '꽤', '뚜렷이', '살짝']);
    expect(reading.gear.code).toBe('C');
    expect(readPersona(means()).gear.code).toBe('SD');
  });

  it('finds the all-flipped opposite and the four one-axis neighbours', () => {
    for (const p of personas) {
      expect(oppositeOf(oppositeOf(p))).toBe(p);
      expect([...oppositeOf(p).code].every((c, i) => c !== p.code[i])).toBe(true);
      const near = neighborsOf(p);
      expect(near).toHaveLength(4);
      for (const n of near) expect([...n.persona.code].filter((c, i) => c !== p.code[i])).toHaveLength(1);
    }
  });
});

describe('highlights stay grounded in subscale scores', () => {
  it('picks at most one strongest subscale per domain and never ST4 or ST5', () => {
    const result = withSubscales(code => (code === 'ST4' || code === 'ST5' ? 5 : code === 'NS1' ? 4.9 : code === 'NS2' ? 4.8 : code === 'HA3' ? 1.2 : 3.2));
    const top = strongestPoints(result);
    expect(top.map(t => t.code)).toEqual(['NS1', 'HA3', 'C1']);
    expect(top.some(t => NO_HEADLINE.has(t.code))).toBe(false);
    expect(new Set(top.map(t => t.domain)).size).toBe(top.length);
    expect(top[1].text).toBe(subscaleLines.HA3.low);
  });

  it('reports a twist only for an opposite-side subscale at least one point from its domain', () => {
    const twist = findTwist(withSubscales(code => (code === 'NS3' ? 1.5 : code.startsWith('NS') ? 4.5 : 3)));
    expect(twist?.sub.code).toBe('NS3');
    expect(twist?.text).toBe(subscaleLines.NS3.low);
    expect(findTwist(withSubscales(() => 3.4))).toBeNull();
    expect(findTwist(withSubscales(code => (code === 'ST4' ? 1 : code.startsWith('ST') ? 4.8 : 3)))).toBeNull();
  });

  it('chooses sentences with the documented 2.5 / 3.5 bands', () => {
    expect([1, 2.5, 2.51, 3.49, 3.5, 5].map(band)).toEqual(['low', 'low', 'middle', 'middle', 'high', 'high']);
    expect(subscaleSentence('NS1', 4)).toBe(subscaleLines.NS1.high);
    expect(subscaleSentence('NS1', 3)).toContain('상황에 따라');
    expect(Object.keys(subscaleLines).sort()).toEqual(subscales.map(s => s.code).sort());
  });

  it('computes interim averages from answered items only, with reverse keys applied', () => {
    const first = items.filter(i => i.subscale === 'NS1');
    const answers = Object.fromEntries(first.map(i => [i.id, i.reverse ? 1 : 5] as const));
    const interim = interimMeans(answers, items);
    expect(interim.NS).toBe(5);
    expect(interim.HA).toBeUndefined();
  });

  it('agrees with full scoring once every item is answered', () => {
    const answers = Object.fromEntries(items.map((i, n) => [i.id, ((n % 5) + 1) as 1 | 2 | 3 | 4 | 5]));
    const full = scoreAnswers(answers);
    const interim = interimMeans(answers, items);
    for (const d of full.domains) expect(interim[d.code]).toBeCloseTo(d.mean, 10);
  });
});
