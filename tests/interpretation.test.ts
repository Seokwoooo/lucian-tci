import { describe, expect, it } from 'vitest';
import { domains, subscales } from '../src/data/scales';
import { interpretResults } from '../src/lib/interpretation';
import type { ScoreResult } from '../src/types';

const resultWithMean = (mean: number): ScoreResult => ({
  answered: 289,
  domains: [],
  subscales: subscales.map(scale => ({ code: scale.code, domain: scale.domain, count: 10, sum: mean * 10, mean })),
});

describe('deterministic response-based interpretation', () => {
  it.each([
    [1, 'low'], [2.5, 'low'], [2.500001, 'middle'], [3, 'middle'],
    [3.499999, 'middle'], [3.5, 'high'], [5, 'high'],
  ] as const)('describes all 30 subscales at mean %s as %s', (mean, direction) => {
    const insights = interpretResults(resultWithMean(mean));
    expect(insights).toHaveLength(30);
    expect(insights.map(insight => insight.code)).toEqual(subscales.map(scale => scale.code));
    for (const insight of insights) {
      const metadata = subscales.find(scale => scale.code === insight.code)!;
      expect(insight.direction).toBe(direction);
      expect(insight.mean).toBe(mean);
      expect(insight.text).toContain(insight.code);
      expect(insight.text).toContain(mean.toFixed(2));
      expect(insight.text).toContain('응답');
      expect(insight.text).toContain(direction === 'middle' ? '문항' : metadata[direction]);
    }
  });

  it('states that the middle range may reflect different item responses, without claiming balance', () => {
    for (const insight of interpretResults(resultWithMean(3))) {
      expect(insight.text).toMatch(/중간|섞/);
      expect(insight.text).toMatch(/문항.*다를/);
      expect(insight.text).not.toMatch(/균형|안정적인 유형|정상 범위|평균적인 사람/);
    }
  });

  it('keeps metadata order even when the scored subscales arrive in reverse order', () => {
    const result = resultWithMean(3);
    result.subscales.reverse();
    expect(interpretResults(result).map(insight => insight.code)).toEqual(subscales.map(scale => scale.code));
    expect(interpretResults(result)).toEqual(interpretResults(result));
  });

  it('refuses incomplete or invalid scores rather than inventing descriptions', () => {
    const missing = resultWithMean(3);
    missing.subscales.pop();
    expect(() => interpretResults(missing)).toThrow();
    const duplicate = resultWithMean(3);
    duplicate.subscales.push(duplicate.subscales[0]);
    expect(() => interpretResults(duplicate)).toThrow();
    for (const mean of [NaN, Infinity, 0, 6]) {
      expect(() => interpretResults(resultWithMean(mean))).toThrow();
    }
  });

  it('explains source-specific constructs and limitations transparently', () => {
    expect(subscales).toHaveLength(30);
    expect(domains).toHaveLength(7);
    expect(subscales.map(scale => scale.code)).not.toContain('ST3');
    const byCode = Object.fromEntries(subscales.map(scale => [scale.code, scale]));
    expect(byCode.S1.english).toBe('Satisfaction');
    expect(byCode.S1.caution).toMatch(/책임감/);
    expect(byCode.HA4.english).toBe('Low Self-Efficacy');
    expect(byCode.HA4.caution).toMatch(/피로/);
    expect(byCode.ST4.english).toBe('Conservatism');
    expect(byCode.ST4.caution).toMatch(/정치|종교/);
    expect(byCode.ST5.english).toBe('Femininity');
    expect(byCode.ST5.caution).toMatch(/성별|성 정체성/);
    for (const insight of interpretResults(resultWithMean(5))) {
      if (byCode[insight.code].caution) expect(insight.text).toContain(byCode[insight.code].caution);
      expect(insight.text).not.toMatch(/당신은 .*유형|추천 직업|진단 결과|상위 \d|백분위/);
    }
  });
});
