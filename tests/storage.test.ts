import { describe, expect, test } from 'vitest';
import { emptySession, loadSession, saveSession, clearSession, estimateMinutes, STORAGE_KEY } from '../src/lib/storage';

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
});
