import { describe, expect, test } from 'vitest';
import { emptySession, loadSession, saveSession, clearSession, estimateMinutes, loadFriend, saveFriend, orderedItems, STORAGE_KEY, LEGACY_KEY, FRIEND_KEY, DATA_VERSION } from '../src/lib/storage';

function store() { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k:string,v:string) => { data.set(k,v); }, removeItem: (k:string) => {data.delete(k);} }; }
describe('local session durability', () => {
  test('round-trips ID based responses and cursor', () => {
    const storage = store(); const session = { ...emptySession(), answers: { 'NS1-01': 5 as const }, position: 1 };
    expect(saveSession(session, storage)).toBeNull();
    expect(loadSession(storage).session.answers).toEqual(session.answers);
    expect(loadSession(storage).session.position).toBe(1);
    expect(clearSession(storage)).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
  test.each(['{bad', JSON.stringify({ ...emptySession(), version: 'older' }), JSON.stringify({ ...emptySession(), answers: { 'NS1-01': '5' } }), JSON.stringify({ ...emptySession(), answers: { fake: 2 } }), JSON.stringify({ ...emptySession(), complete: true })])('rejects incompatible or invalid saved state', (raw) => {
    const storage = store(); storage.setItem(STORAGE_KEY, raw);
    expect(loadSession(storage).issue).toBeTruthy();
    expect(loadSession(storage).session.answers).toEqual({});
  });
  test('reports blocked storage without throwing or claiming saved', () => {
    const broken = {getItem() { throw new Error('denied'); }, setItem() {throw new Error('quota'); }, removeItem() {throw new Error('denied');}};
    expect(loadSession(broken).issue).toBeTruthy();
    expect(saveSession(emptySession(), broken)).toBeTruthy();
    expect(clearSession(broken)).toBeTruthy();
  });
  test('estimates from ten measured eligible responses, excludes idle and rapid automation', () => {
    expect(estimateMinutes([8000,8000], 279)).toBeNull();
    expect(estimateMinutes(Array(10).fill(6000), 200)).toBe(20);
    expect(estimateMinutes([...Array(10).fill(6000), 600000, 10], 200)).toBe(20);
  });
  test('migrates a v1 session by item ID and resumes at the first unanswered item in the new order', () => {
    const storage = store();
    const answered = orderedItems.slice(0, 5).map(item => item.id);
    const legacy = { version: DATA_VERSION, answers: Object.fromEntries(answered.map(id => [id, 4])), position: 120, complete: false, updatedAt: 1, timings: {} };
    storage.setItem(LEGACY_KEY, JSON.stringify(legacy));
    const { session, issue } = loadSession(storage);
    expect(issue).toBeNull();
    expect(session.answers).toEqual(legacy.answers);
    expect(session.position).toBe(5);
    expect(storage.getItem(LEGACY_KEY)).toBeNull();
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).order).toBe(session.order);
  });
  test('keeps only a valid friend token and clears every service key, nothing else', () => {
    const storage = store();
    expect(saveFriend('not-a-token', storage)).toBe(false);
    expect(saveFriend('1-416-203-395-300-403-381-326', storage)).toBe(true);
    expect(loadFriend(storage)).toBe('1-416-203-395-300-403-381-326');
    storage.setItem(FRIEND_KEY, '1-999'); expect(loadFriend(storage)).toBeNull();
    storage.setItem(STORAGE_KEY, '{}'); storage.setItem(LEGACY_KEY, '{}'); storage.setItem('other-app', 'keep');
    expect(clearSession(storage)).toBeNull();
    for (const key of [STORAGE_KEY, LEGACY_KEY, FRIEND_KEY]) expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem('other-app')).toBe('keep');
  });
});
