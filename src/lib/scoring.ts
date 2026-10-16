import rawItems from '../data/items.json';
import { domains, subscales } from '../data/scales';
import type { Answers, Item, Response, ScoreResult, SubscaleScore } from '../types';

const canonicalItems = rawItems as Item[];

function validateItemKeys(items: readonly Item[]): Map<string, Item> {
  if (!items.length) throw new Error('채점할 문항이 없습니다.');
  const byId = new Map<string, Item>();
  const knownSubscales = new Map(subscales.map(scale => [scale.code, scale]));
  for (const item of items) {
    if (typeof item.id !== 'string' || !item.id || typeof item.reverse !== 'boolean') {
      throw new Error('문항 ID 또는 역채점 키가 올바르지 않습니다.');
    }
    if (byId.has(item.id)) throw new Error(`중복 문항 ID: ${item.id}`);
    const scale = knownSubscales.get(item.subscale);
    if (!scale) throw new Error(`알 수 없는 하위척도: ${item.subscale}`);
    if (scale.domain !== item.domain) throw new Error(`문항 영역이 하위척도와 다릅니다: ${item.id}`);
    byId.set(item.id, item);
  }
  return byId;
}

/** Validate complete answers by default; allowPartial is only for saved drafts. */
export function validateAnswers(
  input: unknown,
  items: readonly Item[] = canonicalItems,
  allowPartial = false,
): Answers {
  const byId = validateItemKeys(items);
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('답변은 문항 ID를 키로 하는 객체여야 합니다.');
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('답변은 일반 객체여야 합니다.');
  }
  const entries: [string, Response][] = [];
  for (const id of Reflect.ownKeys(input)) {
    if (typeof id !== 'string' || !byId.has(id)) {
      throw new Error(`알 수 없는 문항 ID: ${String(id)}`);
    }
    const value: unknown = (input as Record<string, unknown>)[id];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`답변은 1부터 5까지의 정수여야 합니다: ${id}`);
    }
    entries.push([id, value as Response]);
  }
  if (!allowPartial && entries.length !== byId.size) {
    throw new Error(`답변이 누락되었습니다: ${byId.size - entries.length}개`);
  }
  return Object.fromEntries(entries);
}

/** Pure scoring: keyed item sums, subscale means, then equal-weight domain means. */
export function scoreAnswers(input: unknown, items: readonly Item[] = canonicalItems): ScoreResult {
  const answers = validateAnswers(input, items);
  const totals = new Map<string, { count: number; sum: number }>();
  for (const item of items) {
    const value = item.reverse ? 6 - answers[item.id] : answers[item.id];
    const total = totals.get(item.subscale) ?? { count: 0, sum: 0 };
    total.count++;
    total.sum += value;
    totals.set(item.subscale, total);
  }
  // Metadata order is stable even when the provided key or response object is shuffled.
  const scoredSubscales: SubscaleScore[] = subscales.flatMap(scale => {
    const total = totals.get(scale.code);
    return total ? [{ code: scale.code, domain: scale.domain, ...total, mean: total.sum / total.count }] : [];
  });
  return {
    answered: items.length,
    subscales: scoredSubscales,
    domains: domains.flatMap(domain => {
      const children = scoredSubscales.filter(scale => scale.domain === domain.code);
      return children.length ? [{
        code: domain.code,
        mean: children.reduce((sum, scale) => sum + scale.mean, 0) / children.length,
        subscales: children.map(scale => scale.code),
      }] : [];
    }),
  };
}
