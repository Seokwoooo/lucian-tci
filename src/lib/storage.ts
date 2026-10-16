import { z } from 'zod';
import data from '../data/items.json';
import type { Answers } from '../types';

export const DATA_VERSION = '2026-10-16.1';
export const STORAGE_KEY = 'lucian-tci:session:v1';
const ids = new Set(data.map(item => item.id));
const responseSchema = z.number().int().min(1).max(5);
const schema = z.object({
  version: z.literal(DATA_VERSION),
  answers: z.record(z.string(), responseSchema).refine(value => Object.keys(value).every(id => ids.has(id))),
  position: z.number().int().min(0).max(data.length - 1),
  complete: z.boolean(),
  updatedAt: z.number().finite().nonnegative(),
  timings: z.record(z.string(), z.number().finite().nonnegative().max(86400000)).refine(value => Object.keys(value).every(id => ids.has(id))),
}).strict().refine(value => !value.complete || Object.keys(value.answers).length === data.length);

export interface Session {
  version: typeof DATA_VERSION;
  answers: Answers;
  position: number;
  complete: boolean;
  updatedAt: number;
  timings: Record<string, number>;
}
export interface StorageLike { getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void }
export function emptySession(): Session { return { version: DATA_VERSION, answers: {}, position: 0, complete: false, updatedAt: Date.now(), timings: {} }; }
export function localStore(): StorageLike | null { try { return window.localStorage; } catch { return null; } }
export function loadSession(storage: StorageLike | null = localStore()): { session: Session; issue: string | null } {
  try {
    if (!storage) throw new Error('storage unavailable');
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { session: emptySession(), issue: null };
    return { session: schema.parse(JSON.parse(raw)) as Session, issue: null };
  } catch {
    return { session: emptySession(), issue: '저장된 답변을 불러오지 못했습니다. 저장 정보가 손상되었거나 버전이 다르거나, 브라우저 저장이 차단되었을 수 있습니다. 새로 시작하거나 저장 정보를 삭제해 주세요.' };
  }
}
export function saveSession(session: Session, storage: StorageLike | null = localStore()): string | null {
  try {
    if (!storage) throw new Error('storage unavailable');
    schema.parse(session);
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
    return null;
  } catch { return '브라우저에 저장하지 못했습니다. 현재 화면에서는 계속할 수 있지만 창을 닫거나 새로고침하면 답변을 잃을 수 있습니다.'; }
}
export function clearSession(storage: StorageLike | null = localStore()): string | null {
  try {
    if (!storage) throw new Error('storage unavailable');
    storage.removeItem(STORAGE_KEY);
    return null;
  } catch { return '브라우저 저장 정보를 삭제하지 못했습니다. 브라우저 설정에서 이 사이트의 저장 데이터를 삭제해 주세요.'; }
}
export function estimateMinutes(timings: number[], remaining: number): number | null {
  const eligible = timings.filter(ms => ms >= 1500 && ms <= 120000).slice(-20).sort((a,b) => a-b);
  if (eligible.length < 10) return null;
  const mid = Math.floor(eligible.length/2);
  const median = eligible.length%2 ? eligible[mid] : (eligible[mid-1]+eligible[mid])/2;
  return Math.max(1, Math.ceil(median * remaining / 60000));
}
