import { AXES } from '../data/personas';
import { domains } from '../data/scales';
import { DOMAIN_CODES, type DomainCode } from '../types';
import { personaCode, readPersona, type DomainMeans } from './persona';

/**
 * A comparison link carries only seven domain averages (hundredths), in the URL fragment, which
 * browsers do not send to servers. It never carries item answers, subscale scores, or timings.
 */
const PREFIX = '1-';
const PATTERN = /^1(?:-\d{3}){7}$/;

export function encodeMeans(means: DomainMeans): string {
  return PREFIX + DOMAIN_CODES.map(code => {
    const mean = means[code];
    if (!Number.isFinite(mean) || mean < 1 || mean > 5) throw new Error('비교 링크를 만들 점수가 올바르지 않습니다.');
    let value = Math.round(mean * 100);
    // Keep the H/L direction exact after rounding, so a link never shows another nickname.
    if (mean > 3 && value <= 300) value = 301;
    return String(value).padStart(3, '0');
  }).join('-');
}

export function decodeMeans(token: string | null | undefined): DomainMeans | null {
  if (!token || token.length > 40 || !PATTERN.test(token)) return null;
  const values = token.slice(PREFIX.length).split('-').map(Number);
  if (values.some(v => !Number.isInteger(v) || v < 100 || v > 500)) return null;
  return Object.fromEntries(DOMAIN_CODES.map((code, i) => [code, values[i] / 100])) as DomainMeans;
}

export function compareLink(siteUrl: string, means: DomainMeans): string {
  const { persona } = readPersona(means);
  const url = new URL(`t/${persona.slug}/`, siteUrl);
  url.hash = `vs=${encodeMeans(means)}`;
  return url.href;
}

export interface Comparison {
  sameAxes: number;
  samePersona: boolean;
  closest: { code: DomainCode; name: string; diff: number };
  furthest: { code: DomainCode; name: string; diff: number };
  headline: string;
  detail: string;
}

const HEADLINES = [
  ['정반대 캐릭터!', '네 가지 기질 방향이 모두 달라요. 서로에게 없는 모습을 가진 조합이에요.'],
  ['서로 다른 결', '네 가지 기질 중 한 가지만 같은 방향이에요.'],
  ['반반 닮은꼴', '네 가지 기질 중 두 가지가 같은 방향이에요.'],
  ['꽤 닮은꼴', '네 가지 기질 중 세 가지가 같은 방향이에요.'],
  ['기질 쌍둥이!', '네 가지 기질 방향이 모두 같아요.'],
] as const;

/** Describes similarity of two answer profiles only; it does not predict how a relationship goes. */
export function compareMeans(mine: DomainMeans, theirs: DomainMeans): Comparison {
  const a = personaCode(mine), b = personaCode(theirs);
  const sameAxes = AXES.filter((_, i) => a[i] === b[i]).length;
  const diffs = domains.map(d => ({ code: d.code, name: d.name, diff: Math.abs(mine[d.code] - theirs[d.code]) }));
  const sorted = [...diffs].sort((x, y) => x.diff - y.diff);
  const [headline, detail] = HEADLINES[sameAxes];
  return { sameAxes, samePersona: a === b, closest: sorted[0], furthest: sorted[sorted.length - 1], headline, detail };
}
