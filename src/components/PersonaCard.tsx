// Lucian UX/UI Prompt #052 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#052
// Adapted: portrait trading-card size, persona content on both faces, lock control removed.
import { useEffect, useRef, type CSSProperties } from 'react';
import type { Persona } from '../data/personas';
import { axisWords } from '../data/personas';
import { personas } from '../data/personas';
import type { AxisReading } from '../lib/persona';
import { mascotSvg, type Signals } from '../lib/mascot';
import { SITE_HOST } from '../config';
import './lucian.css';

export function Mascot({ signals, color, label, className = 'mascot', background = true }: { signals: Signals; color: string; label?: string; className?: string; background?: boolean }) {
  // The SVG is generated from numbers and fixed strings only, never from visitor text.
  return <span className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: mascotSvg(signals, color, { background }) }} />;
}

function CardFront({ persona, signals, caption }: { persona: Persona; signals: Signals; caption: string }) {
  const number = String(personas.indexOf(persona) + 1).padStart(2, '0');
  return <span className="pc-frame">
    <span className="pc-top"><b>No.{number}</b><span>LUCIAN TCI</span></span>
    <Mascot signals={signals} color={persona.color} className="pc-mascot" />
    <span className="pc-kicker">{caption}</span>
    <span className="pc-name">{persona.name}</span>
    <span className="pc-tagline">{persona.tagline}</span>
    <span className="pc-tags">{persona.tags.map(tag => <span key={tag}>#{tag}</span>)}</span>
  </span>;
}

/** A non-interactive front face for decorative previews. */
export function StaticCard({ persona, signals, caption = '기질 캐릭터' }: { persona: Persona; signals: Signals; caption?: string }) {
  return <span className="static-card" style={{ '--pc': persona.color } as CSSProperties}><span className="u052-front static-face"><CardFront persona={persona} signals={signals} caption={caption} /></span></span>;
}

export function PersonaCard({ persona, signals, axes, gear, width = 300, caption }: {
  persona: Persona; signals: Signals; axes?: AxisReading[]; gear?: { item: string; power: string }; width?: number; caption?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const number = String(personas.indexOf(persona) + 1).padStart(2, '0');
  useEffect(() => {
    const root = ref.current!;
    const card = root.querySelector<HTMLButtonElement>('.u052-card')!;
    const flipB = root.querySelector<HTMLButtonElement>('.u052-flip')!;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ang = 0, sx = 0, start = 0, moved = false, down = false, lastX = 0, vx = 0;
    function apply(a: number) {
      root.style.setProperty('--ry', a + 'deg');
      // 홀로그램 띠는 카드가 도는 만큼 옆으로 흐릅니다
      root.style.setProperty('--sh', (50 + Math.sin(a * Math.PI / 180) * 60).toFixed(1) + '%');
    }
    function settle(a: number) {
      ang = Math.round(a / 180) * 180;
      apply(ang);
      const back = Math.abs(ang / 180) % 2 === 1;
      card.setAttribute('aria-label', `${persona.name} 캐릭터 카드, ${back ? '뒷면 기질 스탯' : '앞면'}. 눌러서 뒤집기`);
      flipB.lastChild!.textContent = back ? '앞면 보기' : '스탯 보기';
    }
    const flip = () => settle(ang + 180);
    const onDown = (e: PointerEvent) => { if (e.button !== 0) return; down = true; moved = false; sx = lastX = e.clientX; start = ang; vx = 0; card.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; card.classList.add('drag'); }
      if (!moved) return;
      vx = e.clientX - lastX; lastX = e.clientX;
      apply(start + dx * 0.9);
    };
    const up = (e: PointerEvent) => { if (!down) return; down = false; card.classList.remove('drag'); if (!moved) return; settle(start + (e.clientX - sx) * 0.9 + vx * 8); };
    const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); moved = false; return; } flip(); };
    const enter = (e: PointerEvent) => { if (e.pointerType === 'mouse' && !rm) root.style.setProperty('--tilt', '8deg'); };
    const leave = () => root.style.setProperty('--tilt', '0deg');
    card.addEventListener('pointerdown', onDown); card.addEventListener('pointermove', onMove); card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
    card.addEventListener('click', onClick); card.addEventListener('pointerenter', enter); card.addEventListener('pointerleave', leave);
    flipB.addEventListener('click', flip);
    settle(0);
    return () => {
      card.removeEventListener('pointerdown', onDown); card.removeEventListener('pointermove', onMove); card.removeEventListener('pointerup', up); card.removeEventListener('pointercancel', up);
      card.removeEventListener('click', onClick); card.removeEventListener('pointerenter', enter); card.removeEventListener('pointerleave', leave);
      flipB.removeEventListener('click', flip);
    };
  }, [persona]);
  const style = { '--cw': `${width}px`, '--pc': persona.color } as CSSProperties;
  return <div ref={ref} className="ux u052" style={style}>
    <button className="u052-card" type="button" aria-label={`${persona.name} 캐릭터 카드, 앞면. 눌러서 뒤집기`}>
      <span className="u052-f u052-front" aria-hidden="true"><CardFront persona={persona} signals={signals} caption={caption ?? '나의 기질 캐릭터'} /></span>
      <span className="u052-f u052-back" aria-hidden="true">
        <span className="pc-back-title"><b>기질 스탯</b><span>No.{number} {persona.name}</span></span>
        <span className="pc-stats">{(axes ?? []).map(axis => <span className="pc-stat" key={axis.code}>
          <span className="pc-stat-label"><span>{axisWords[axis.code].low}</span><b>{axisWords[axis.code].short}</b><span>{axisWords[axis.code].high}</span></span>
          <span className="pc-stat-track"><i style={{ left: `${(axis.mean - 1) / 4 * 100}%` }} /></span>
        </span>)}
        {!axes && <span className="pc-stat-empty">검사를 마치면 내 점수로 채워져요</span>}</span>
        {gear && <span className="pc-gear"><small>성격 무기</small><b>{gear.item}</b><span>{gear.power}</span></span>}
        <span className="pc-back-foot">{SITE_HOST}</span>
      </span>
    </button>
    <div className="u052-bar">
      <button className="u052-b u052-flip" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/></svg>스탯 보기</button>
    </div>
  </div>;
}

export function MiniCard({ persona, signals, onOpen, active = false }: { persona: Persona; signals: Signals; onOpen: () => void; active?: boolean }) {
  return <button type="button" className={`mini-card ${active ? 'is-active' : ''}`} style={{ '--pc': persona.color } as CSSProperties} onClick={onOpen}>
    <Mascot signals={signals} color={persona.color} className="mini-mascot" />
    <span className="mini-name">{persona.name}</span>
    <span className="mini-tagline">{persona.tagline}</span>
  </button>;
}
