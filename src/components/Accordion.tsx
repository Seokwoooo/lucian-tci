// Lucian UX/UI Prompt #044 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#044
import { useId, useRef, useState, type ReactNode } from 'react';
import './lucian.css';

export function Accordion({ items }: { items: { title: string; content: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className="ux u044">{items.map((item, i) => <div key={item.title} className={`u044-it ${open === i ? 'open' : ''}`}>
    <button ref={el => { buttons.current[i] = el; }} className="u044-q" id={`${id}-q${i}`} aria-controls={`${id}-a${i}`} aria-expanded={open === i}
      onClick={() => setOpen(open === i ? null : i)} onKeyDown={event => {
        const n = event.key === 'ArrowDown' ? i + 1 : event.key === 'ArrowUp' ? i - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
        if (n !== null) { event.preventDefault(); buttons.current[(n + items.length) % items.length]?.focus(); }
      }}><span className="u044-n">{String(i + 1).padStart(2,'0')}</span><span className="u044-t">{item.title}</span><span className="u044-pm" aria-hidden="true" /></button>
    <div className="u044-body" id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} aria-hidden={open !== i} inert={open !== i}><div><div className="u044-a">{item.content}</div></div></div>
  </div>)}</div>;
}
