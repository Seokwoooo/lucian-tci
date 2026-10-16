// Lucian UX/UI Prompt #039 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#039
// Adapted: React-controlled tabs; the panel slides in from the direction of travel.
import { useId, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import './lucian.css';

export function PillTabs<T extends string>({ label, tabs, value, onChange, children }: {
  label: string; tabs: { value: T; label: string }[]; value: T; onChange: (value: T) => void; children: ReactNode;
}) {
  const id = useId();
  const pill = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, tabs.findIndex(tab => tab.value === value));
  const previous = useRef(index);
  const direction = useRef(0);
  if (previous.current !== index) { direction.current = index > previous.current ? 1 : -1; previous.current = index; }
  const list = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  function movePill(animate: boolean) {
    const node = pill.current, tab = buttons.current[indexRef.current];
    if (!node || !tab || !tab.offsetWidth) return;
    if (!animate) node.style.transition = 'none';
    node.style.setProperty('--x', tab.offsetLeft + 'px');
    node.style.setProperty('--w', tab.offsetWidth + 'px');
    if (!animate) { void node.offsetWidth; node.style.transition = ''; }
  }
  const first = useRef(true);
  useLayoutEffect(() => { movePill(!first.current); first.current = false; }, [index]);
  // Re-measure when the tab row gets or changes its size, e.g. inside a dialog that opens after mount.
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => movePill(false));
    observer.observe(list.current!);
    return () => observer.disconnect();
  }, []);
  function select(i: number, focus = false) { onChange(tabs[i].value); if (focus) buttons.current[i]?.focus(); }
  return <div className="ux u039">
    <div className="u039-tabs" role="tablist" aria-label={label} ref={list}>
      <span className="u039-pill" ref={pill} aria-hidden="true" />
      {tabs.map((tab, i) => <button key={tab.value} ref={el => { buttons.current[i] = el; }} className="u039-tab" type="button" role="tab" id={`${id}-t${i}`}
        aria-selected={i === index} aria-controls={`${id}-p`} tabIndex={i === index ? 0 : -1} onClick={() => select(i)}
        onKeyDown={e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); } }}>{tab.label}</button>)}
    </div>
    <div className="u039-panel" role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${index}`}>
      <div key={value} className="u039-slide" style={{ '--from': `${direction.current * 70}%` } as CSSProperties}>{children}</div>
    </div>
  </div>;
}
