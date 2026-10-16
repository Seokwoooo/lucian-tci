import { personaBySlug } from '../data/personas';
import { BASE_PATH } from '../config';
import { decodeMeans } from './compare';
import { readPersona } from './persona';

export const PAGES = ['home', 'characters', 'guide', 'test', 'review', 'result', 'about', 'privacy', 'scoring'] as const;
export type Page = (typeof PAGES)[number];
export type Route = { page: Page } | { page: 'persona'; slug: string; vs: string | null };

/** Persona pages live at /tci/t/<slug>/ so link previews can show that character; scores stay in #vs=. */
export function parseRoute(pathname: string, hash: string): Route {
  const fragment = hash.replace(/^#/, '');
  const vs = fragment.startsWith('vs=') ? fragment.slice(3) : null;
  const known = (PAGES as readonly string[]).includes(fragment);
  const match = pathname.match(/\/t\/([a-z-]+)\/?$/);
  if (match && personaBySlug.has(match[1]) && !known) return { page: 'persona', slug: match[1], vs };
  if (vs) {
    const means = decodeMeans(vs);
    if (means) return { page: 'persona', slug: readPersona(means).persona.slug, vs };
  }
  return { page: known ? fragment as Page : 'home' };
}

export function currentRoute(): Route { return parseRoute(location.pathname, location.hash); }

const EVENT = 'lucian-route';
export function onRouteChange(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  window.addEventListener(EVENT, listener);
  return () => { window.removeEventListener('hashchange', listener); window.removeEventListener('popstate', listener); window.removeEventListener(EVENT, listener); };
}

export function go(page: Page): void {
  if (location.pathname !== BASE_PATH) { history.pushState(null, '', `${BASE_PATH}#${page}`); window.dispatchEvent(new Event(EVENT)); }
  else if (location.hash === `#${page}`) window.dispatchEvent(new Event(EVENT));
  else location.hash = page;
}
export function goPersona(slug: string, vs: string | null = null): void {
  history.pushState(null, '', `${BASE_PATH}t/${slug}/${vs ? `#vs=${vs}` : ''}`);
  window.dispatchEvent(new Event(EVENT));
}
export function personaPath(slug: string): string { return `${BASE_PATH}t/${slug}/`; }
