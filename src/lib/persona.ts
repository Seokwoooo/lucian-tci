import { AXES, axisWords, characterGear, personaByCode, personas, type AxisCode, type Persona } from '../data/personas';
import { NO_HEADLINE, subscaleLines } from '../data/narratives';
import { domains, subscales } from '../data/scales';
import type { Answers, DomainCode, Item, ScoreResult, SubscaleScore } from '../types';

export type DomainMeans = Record<DomainCode, number>;

export interface AxisReading {
  code: AxisCode;
  mean: number;
  high: boolean;
  /** Signed distance from the response-scale midpoint, scaled to -1…1. */
  signed: number;
  word: string;
  degree: '살짝' | '꽤' | '뚜렷이';
}

export interface PersonaReading {
  persona: Persona;
  axes: AxisReading[];
  gear: { code: 'SD' | 'C' | 'ST'; mean: number; item: string; power: string; name: string };
}

export function meansOf(result: ScoreResult): DomainMeans {
  return Object.fromEntries(result.domains.map(score => [score.code, score.mean])) as DomainMeans;
}

/** The documented rule: H when the domain average is above the scale midpoint 3, otherwise L. */
export function personaCode(means: Pick<DomainMeans, AxisCode>): string {
  return AXES.map(code => {
    const mean = means[code];
    if (!Number.isFinite(mean) || mean < 1 || mean > 5) throw new Error(`${code} 평균이 올바르지 않습니다.`);
    return mean > 3 ? 'H' : 'L';
  }).join('');
}

function degree(mean: number): AxisReading['degree'] {
  const distance = Math.abs(mean - 3);
  return distance < 0.25 ? '살짝' : distance < 0.75 ? '꽤' : '뚜렷이';
}

export function readPersona(means: DomainMeans): PersonaReading {
  const persona = personaByCode.get(personaCode(means))!;
  const axes = AXES.map(code => {
    const mean = means[code];
    const high = mean > 3;
    return { code, mean, high, signed: Math.max(-1, Math.min(1, (mean - 3) / 2)), word: high ? axisWords[code].high : axisWords[code].low, degree: degree(mean) };
  });
  const gearCode = (['SD', 'C', 'ST'] as const).reduce((best, code) => means[code] > means[best] ? code : best, 'SD' as 'SD' | 'C' | 'ST');
  const gear = { code: gearCode, mean: means[gearCode], ...characterGear[gearCode], name: domains.find(d => d.code === gearCode)!.name };
  return { persona, axes, gear };
}

/** Signed strengths used only to draw a mascot; a gallery persona uses a fixed example strength. */
export function mascotSignals(means: Pick<DomainMeans, AxisCode>): Record<AxisCode, number> {
  return Object.fromEntries(AXES.map(code => [code, Math.max(-1, Math.min(1, (means[code] - 3) / 2))])) as Record<AxisCode, number>;
}
export function exampleSignals(persona: Persona, strength = 0.6): Record<AxisCode, number> {
  return Object.fromEntries(AXES.map((code, i) => [code, persona.code[i] === 'H' ? strength : -strength])) as Record<AxisCode, number>;
}

export function oppositeOf(persona: Persona): Persona {
  return personaByCode.get([...persona.code].map(c => (c === 'H' ? 'L' : 'H')).join(''))!;
}
/** Personas that differ from this one in exactly one temperament direction. */
export function neighborsOf(persona: Persona): { persona: Persona; axis: AxisCode }[] {
  return AXES.map((axis, i) => ({ axis, persona: personaByCode.get(persona.code.slice(0, i) + (persona.code[i] === 'H' ? 'L' : 'H') + persona.code.slice(i + 1))! }));
}

export interface StrongPoint { code: string; nick: string; mean: number; text: string; domain: DomainCode }
/** Subscales furthest from the midpoint, at most one per domain; never the culturally loaded ST4·ST5. */
export function strongestPoints(result: ScoreResult, count = 3): StrongPoint[] {
  const seen = new Set<DomainCode>();
  return [...result.subscales].filter(s => !NO_HEADLINE.has(s.code))
    .sort((a, b) => Math.abs(b.mean - 3) - Math.abs(a.mean - 3) || a.code.localeCompare(b.code))
    .filter(s => { if (seen.has(s.domain)) return false; seen.add(s.domain); return true; })
    .slice(0, count)
    .map(s => ({ code: s.code, domain: s.domain, mean: s.mean, nick: subscaleLines[s.code].nick, text: s.mean > 3 ? subscaleLines[s.code].high : subscaleLines[s.code].low }));
}

export interface Twist { domain: DomainCode; domainMean: number; sub: SubscaleScore; nick: string; text: string }
/**
 * A "twist": a subscale on the other side of the midpoint from its own domain average, by at least
 * one full point. It shows that one domain number hides different directions underneath.
 */
export function findTwist(result: ScoreResult): Twist | null {
  let best: Twist | null = null;
  let bestGap = 0;
  for (const domain of result.domains) {
    for (const sub of result.subscales.filter(s => s.domain === domain.code && !NO_HEADLINE.has(s.code))) {
      const opposite = (domain.mean > 3 && sub.mean < 3) || (domain.mean < 3 && sub.mean > 3);
      const gap = Math.abs(domain.mean - sub.mean);
      if (opposite && gap >= 1 && gap > bestGap) {
        bestGap = gap;
        best = { domain: domain.code, domainMean: domain.mean, sub, nick: subscaleLines[sub.code].nick, text: sub.mean > 3 ? subscaleLines[sub.code].high : subscaleLines[sub.code].low };
      }
    }
  }
  return best;
}

/** Interim domain averages from answered items only, for the between-chapter teaser. */
export function interimMeans(answers: Answers, items: readonly Item[]): Partial<DomainMeans> {
  const sums = new Map<string, { sum: number; count: number }>();
  for (const item of items) {
    const value = answers[item.id];
    if (!value) continue;
    const entry = sums.get(item.subscale) ?? { sum: 0, count: 0 };
    entry.sum += item.reverse ? 6 - value : value;
    entry.count++;
    sums.set(item.subscale, entry);
  }
  const out: Partial<DomainMeans> = {};
  for (const domain of domains) {
    const means = subscales.filter(s => s.domain === domain.code && sums.has(s.code)).map(s => sums.get(s.code)!.sum / sums.get(s.code)!.count);
    if (means.length) out[domain.code] = means.reduce((a, b) => a + b, 0) / means.length;
  }
  return out;
}

export const allPersonas = personas;
