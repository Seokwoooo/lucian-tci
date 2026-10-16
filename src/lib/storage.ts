import data from '../data/items.json';
import type { Answers, Item } from '../types';
import { ORDER_VERSION, presentationOrder } from './order';
import { decodeMeans } from './compare';

export const DATA_VERSION = '2026-10-16.1';
export const STORAGE_KEY = 'lucian-tci:session:v2';
/** v1 stored the position in source (subscale) order; it is migrated once and then removed. */
export const LEGACY_KEY = 'lucian-tci:session:v1';
/** A friend's comparison token the visitor chose to keep for after their own test. */
export const FRIEND_KEY = 'lucian-tci:friend:v1';
export const SERVICE_KEYS = [STORAGE_KEY, LEGACY_KEY, FRIEND_KEY];

export const orderedItems: Item[] = presentationOrder(data as Item[]);
const ids = new Set(data.map(item => item.id));
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const KEYS = ['version', 'answers', 'position', 'complete', 'updatedAt', 'timings'];

/** Strict shape check: unknown keys, item IDs, or out-of-range values reject the whole saved state. */
function parseStored(value: unknown, withOrder: boolean): Omit<Session, 'order'> {
  if (!isRecord(value)) throw new Error('not an object');
  const keys = withOrder ? [...KEYS, 'order'] : KEYS;
  if (Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) throw new Error('unexpected keys');
  if (value.version !== DATA_VERSION || (withOrder && value.order !== ORDER_VERSION)) throw new Error('version');
  const { answers, timings, position, complete, updatedAt } = value;
  if (!isRecord(answers) || !Object.entries(answers).every(([id, v]) => ids.has(id) && typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5)) throw new Error('answers');
  if (!isRecord(timings) || !Object.entries(timings).every(([id, v]) => ids.has(id) && typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 86400000)) throw new Error('timings');
  if (typeof position !== 'number' || !Number.isInteger(position) || position < 0 || position > data.length - 1) throw new Error('position');
  if (typeof complete !== 'boolean' || (complete && Object.keys(answers).length !== data.length)) throw new Error('complete');
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt < 0) throw new Error('updatedAt');
  return { version: DATA_VERSION, answers: answers as Answers, timings: timings as Record<string, number>, position, complete, updatedAt };
}

export interface Session {
  version: typeof DATA_VERSION;
  order: typeof ORDER_VERSION;
  answers: Answers;
  /** Index into orderedItems. */
  position: number;
  complete: boolean;
  updatedAt: number;
  timings: Record<string, number>;
}
export interface StorageLike { getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void }
export function emptySession(): Session { return { version: DATA_VERSION, order: ORDER_VERSION, answers: {}, position: 0, complete: false, updatedAt: Date.now(), timings: {} }; }
export function localStore(): StorageLike | null { try { return window.localStorage; } catch { return null; } }

export function firstOpenPosition(answers: Answers): number {
  const index = orderedItems.findIndex(item => !answers[item.id]);
  return index < 0 ? orderedItems.length - 1 : index;
}

const LOAD_ERROR = '저장된 답변을 불러오지 못했습니다. 저장 정보가 손상되었거나 버전이 다르거나, 브라우저 저장이 차단되었을 수 있습니다. 새로 시작하거나 저장 정보를 삭제해 주세요.';
export function loadSession(storage: StorageLike | null = localStore()): { session: Session; issue: string | null } {
  try {
    if (!storage) throw new Error('storage unavailable');
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return { session: { ...parseStored(JSON.parse(raw), true), order: ORDER_VERSION }, issue: null };
    const legacy = storage.getItem(LEGACY_KEY);
    if (!legacy) return { session: emptySession(), issue: null };
    const old = parseStored(JSON.parse(legacy), false);
    // Answers are keyed by item ID, so they carry over; only the resume position is recomputed.
    const session: Session = { ...old, order: ORDER_VERSION, position: firstOpenPosition(old.answers) };
    if (!saveSession(session, storage)) { try { storage.removeItem(LEGACY_KEY); } catch { /* the v2 copy is already saved */ } }
    return { session, issue: null };
  } catch {
    return { session: emptySession(), issue: LOAD_ERROR };
  }
}
export function saveSession(session: Session, storage: StorageLike | null = localStore()): string | null {
  try {
    if (!storage) throw new Error('storage unavailable');
    parseStored(JSON.parse(JSON.stringify(session)), true);
    storage.setItem(STORAGE_KEY, JSON.stringify(session));
    return null;
  } catch { return '브라우저에 저장하지 못했습니다. 현재 화면에서는 계속할 수 있지만 창을 닫거나 새로고침하면 답변을 잃을 수 있습니다.'; }
}
/** Removes only this service's keys, never other data on the same origin. */
export function clearSession(storage: StorageLike | null = localStore()): string | null {
  try {
    if (!storage) throw new Error('storage unavailable');
    for (const key of SERVICE_KEYS) storage.removeItem(key);
    return null;
  } catch { return '브라우저 저장 정보를 삭제하지 못했습니다. 브라우저 설정에서 이 사이트의 저장 데이터를 삭제해 주세요.'; }
}

export function loadFriend(storage: StorageLike | null = localStore()): string | null {
  try { const token = storage?.getItem(FRIEND_KEY) ?? null; return decodeMeans(token) ? token : null; } catch { return null; }
}
export function saveFriend(token: string | null, storage: StorageLike | null = localStore()): boolean {
  try {
    if (!storage) return false;
    if (token === null) storage.removeItem(FRIEND_KEY);
    else if (decodeMeans(token)) storage.setItem(FRIEND_KEY, token);
    else return false;
    return true;
  } catch { return false; }
}

export function estimateMinutes(timings: number[], remaining: number): number | null {
  const eligible = timings.filter(ms => ms >= 1000 && ms <= 120000).slice(-20).sort((a,b) => a-b);
  if (eligible.length < 10) return null;
  const mid = Math.floor(eligible.length/2);
  const median = eligible.length%2 ? eligible[mid] : (eligible[mid-1]+eligible[mid])/2;
  return Math.max(1, Math.ceil(median * remaining / 60000));
}
