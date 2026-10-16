import { describe, expect, it } from 'vitest';
import { compareLink, compareMeans, decodeMeans, encodeMeans } from '../src/lib/compare';
import { parseRoute } from '../src/lib/route';
import { personaCode, type DomainMeans } from '../src/lib/persona';

const m = (values: Partial<DomainMeans> = {}): DomainMeans => ({ NS: 4.16, HA: 2.03, RD: 3.95, P: 3, SD: 4.03, C: 3.81, ST: 3.26, ...values });

describe('comparison links', () => {
  it('round-trips seven averages at two decimals and nothing else', () => {
    const token = encodeMeans(m());
    expect(token).toBe('1-416-203-395-300-403-381-326');
    expect(decodeMeans(token)).toEqual(m());
  });

  it('keeps the high/low direction exact after rounding', () => {
    const near = m({ NS: 3.004, HA: 2.996 });
    const decoded = decodeMeans(encodeMeans(near))!;
    expect(personaCode(decoded)).toBe(personaCode(near));
  });

  it.each([null, '', '1-416-203', '2-416-203-395-300-403-381-326', '1-099-203-395-300-403-381-326', '1-501-203-395-300-403-381-326', '1-416-203-395-300-403-381-326-1', '1-41a-203-395-300-403-381-326', `1-${'9'.repeat(60)}`])('rejects malformed token %s', token => {
    expect(decodeMeans(token)).toBeNull();
  });

  it('puts scores only in the fragment of the character path', () => {
    const url = new URL(compareLink('https://lucianlabs.dev/tci/', m()));
    expect(url.pathname).toBe('/tci/t/party-maker/');
    expect(url.search).toBe('');
    expect(url.hash).toBe('#vs=1-416-203-395-300-403-381-326');
  });

  it('describes similarity by matching directions without predicting relationships', () => {
    const same = compareMeans(m(), m());
    expect(same.sameAxes).toBe(4);
    expect(same.samePersona).toBe(true);
    const opposite = compareMeans(m(), m({ NS: 2, HA: 4, RD: 2, P: 4 }));
    expect(opposite.sameAxes).toBe(0);
    expect(opposite.furthest.diff).toBeGreaterThan(opposite.closest.diff);
    expect(`${opposite.headline}${opposite.detail}`).not.toMatch(/궁합|잘 맞|연애|성공/);
  });
});

describe('routes', () => {
  it('reads character paths, comparison fragments and ordinary pages', () => {
    expect(parseRoute('/tci/', '#test')).toEqual({ page: 'test' });
    expect(parseRoute('/tci/', '')).toEqual({ page: 'home' });
    expect(parseRoute('/tci/', '#nope')).toEqual({ page: 'home' });
    expect(parseRoute('/tci/t/curious-cat/', '')).toEqual({ page: 'persona', slug: 'curious-cat', vs: null });
    expect(parseRoute('/tci/t/curious-cat/', '#vs=1-416-203-395-300-403-381-326')).toEqual({ page: 'persona', slug: 'curious-cat', vs: '1-416-203-395-300-403-381-326' });
    expect(parseRoute('/tci/t/curious-cat/', '#about')).toEqual({ page: 'about' });
    expect(parseRoute('/tci/t/not-a-type/', '')).toEqual({ page: 'home' });
    expect(parseRoute('/tci/', '#vs=1-416-203-395-300-403-381-326')).toEqual({ page: 'persona', slug: 'party-maker', vs: '1-416-203-395-300-403-381-326' });
  });
});
