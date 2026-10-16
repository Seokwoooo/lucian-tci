import type { AxisCode } from '../data/personas';

/**
 * A mascot drawn only from four signed temperament signals (-1…1) and a body color.
 * NS → flame tufts or a calm curl, HA → worried round eyes or relaxed smiling eyes,
 * RD → blush and a heart or headphones, P → a headband or a cup of tea.
 * The same string is used in the page and drawn onto export canvases, so it has no external refs.
 */
export type Signals = Record<AxisCode, number>;

const INK = '#1D1B2F';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const f = (n: number) => Number(n.toFixed(1));

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function mascotSvg(signals: Signals, color: string, { background = true, title = '' } = {}): string {
  const ns = signals.NS, ha = signals.HA, rd = signals.RD, p = signals.P;
  const dark = shade(color, -0.28), light = shade(color, 0.55), pale = shade(color, 0.82);
  const parts: string[] = [];
  if (background) {
    parts.push(`<circle cx="100" cy="104" r="92" fill="${pale}"/>`);
    parts.push(`<g fill="${light}"><circle cx="34" cy="52" r="5"/><circle cx="170" cy="40" r="4"/><circle cx="178" cy="150" r="3"/><path d="M28 132l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>`);
  }
  parts.push('<ellipse cx="100" cy="184" rx="54" ry="7" fill="#1D1B2F" opacity=".09"/>');

  // P low: a cup of tea held at the side, drawn behind the arm.
  const relaxed = p <= 0;

  // NS high: flame tufts that grow with the signal.
  if (ns > 0) {
    const s = 0.75 + clamp(ns) * 0.65;
    parts.push(`<g fill="${color}" transform="translate(100 74) scale(1 ${f(s)}) translate(-100 -74)"><path d="M100 26C114 42 118 58 100 76 82 58 86 42 100 26Z"/><path d="M72 42C86 52 92 64 84 80 68 74 64 58 72 42Z"/><path d="M128 42C114 52 108 64 116 80 132 74 136 58 128 42Z"/></g>`);
  }
  // Body.
  parts.push(`<path d="M100 62C142 62 168 98 170 134 172 166 146 180 100 180 54 180 28 166 30 134 32 98 58 62 100 62Z" fill="${color}"/>`);
  parts.push(`<ellipse cx="100" cy="150" rx="42" ry="24" fill="#fff" opacity=".28"/>`);
  parts.push(`<path d="M58 84C66 74 78 68 90 66" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>`);
  // RD low: headphones band over the head.
  if (rd <= 0) parts.push(`<path d="M33 110C30 34 170 34 167 110" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`);
  // NS low: a calm single curl.
  if (ns <= 0) parts.push(`<path d="M100 63C97 50 106 42 114 48 120 53 112 60 106 55" fill="none" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>`);
  // Arms.
  parts.push(`<ellipse cx="34" cy="142" rx="10" ry="15" fill="${dark}" transform="rotate(20 34 142)"/>`);
  if (!relaxed) parts.push(`<ellipse cx="166" cy="124" rx="10" ry="15" fill="${dark}" transform="rotate(-35 166 124)"/>`);

  // P high: headband with tails.
  if (p > 0) {
    parts.push(`<path d="M44 90Q100 70 156 90L157 101Q100 82 43 101Z" fill="#fff"/><circle cx="100" cy="85" r="5" fill="#FF4D5E"/>`);
    const tail = 6 + clamp(p) * 10;
    parts.push(`<path d="M155 93C166 ${f(88 - tail / 3)} 176 ${f(92 - tail / 4)} ${f(180 + tail / 2)} ${f(100 - tail / 3)}L${f(176 + tail / 2)} ${f(106 - tail / 4)}C170 101 164 99 156 101Z" fill="#fff"/>`);
  }

  // Eyes and mouth by HA.
  const eyeY = 116;
  if (ha > 0) {
    parts.push(`<g><circle cx="78" cy="${eyeY}" r="11" fill="#fff"/><circle cx="122" cy="${eyeY}" r="11" fill="#fff"/><circle cx="80" cy="${eyeY + 1}" r="6.5" fill="${INK}"/><circle cx="124" cy="${eyeY + 1}" r="6.5" fill="${INK}"/><circle cx="82" cy="${eyeY - 2}" r="2.2" fill="#fff"/><circle cx="126" cy="${eyeY - 2}" r="2.2" fill="#fff"/></g>`);
    parts.push(`<path d="M66 ${p > 0 ? 106 : 102}L88 ${p > 0 ? 101 : 96}M112 ${p > 0 ? 101 : 96}L134 ${p > 0 ? 106 : 102}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`);
    parts.push(`<path d="M90 138Q95 133 100 138T110 138" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`);
    if (ha > 0.35) parts.push(`<path d="M150 98C154 106 156 110 156 113 156 117 153 119 150 119 147 119 144 117 144 113 144 110 146 106 150 98Z" fill="#8FD3FF" stroke="#fff" stroke-width="2"/>`);
  } else {
    parts.push(`<path d="M68 ${eyeY + 2}Q78 ${eyeY - 9} 88 ${eyeY + 2}M112 ${eyeY + 2}Q122 ${eyeY - 9} 132 ${eyeY + 2}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`);
    const open = 8 + clamp(-ha) * 8;
    parts.push(`<path d="M86 131Q100 ${f(131 + open * 1.6)} 114 131Z" fill="${INK}"/><path d="M93 ${f(133 + open * 0.5)}Q100 ${f(130 + open * 1.2)} 107 ${f(133 + open * 0.5)}Z" fill="#FF7A8A"/>`);
  }

  // RD: blush and heart, or headphone cups.
  if (rd > 0) {
    const o = 0.45 + clamp(rd) * 0.45;
    parts.push(`<ellipse cx="62" cy="132" rx="9" ry="6" fill="#FF7A9A" opacity="${f(o)}"/><ellipse cx="138" cy="132" rx="9" ry="6" fill="#FF7A9A" opacity="${f(o)}"/>`);
    parts.push(`<path d="M160 58C160 52 152 50 150 56 148 50 140 52 140 58 140 64 150 70 150 70 150 70 160 64 160 58Z" fill="#FF5C8A"/>`);
  } else {
    parts.push(`<rect x="24" y="104" width="18" height="32" rx="8" fill="${INK}"/><rect x="158" y="104" width="18" height="32" rx="8" fill="${INK}"/><rect x="28" y="110" width="6" height="20" rx="3" fill="${light}"/><rect x="166" y="110" width="6" height="20" rx="3" fill="${light}"/>`);
  }

  if (relaxed) {
    parts.push(`<g><path d="M150 140h26v18a9 9 0 0 1-9 9h-8a9 9 0 0 1-9-9z" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M176 145c8 0 8 12 0 12" fill="none" stroke="${INK}" stroke-width="3.5"/><path d="M158 132c-3-4 3-6 0-10M168 132c-3-4 3-6 0-10" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></g>`);
    parts.push(`<ellipse cx="156" cy="152" rx="9" ry="12" fill="${dark}"/>`);
  }

  const label = title ? `<title>${title.replace(/[<&>]/g, '')}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${label}${parts.join('')}</svg>`;
}

export function mascotDataUrl(signals: Signals, color: string, background = true): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mascotSvg(signals, color, { background }))}`;
}
