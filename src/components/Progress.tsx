// Lucian UX/UI Prompt #083 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#083
import type { CSSProperties } from 'react';
import './lucian.css';

export function Progress({ answered, total }: { answered: number; total: number }) {
  const percent = Math.round(answered / total * 100);
  return <div className={`ux u083 is-det ${answered === total ? 'is-done' : ''}`}>
    <div className="u083-meta"><span>{answered} / {total}문항 완료</span><span>{percent}%</span></div>
    <div className="u083-trk" role="progressbar" aria-label="검사 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} aria-valuetext={`${total}문항 중 ${answered}문항 완료`}><span className="u083-fill" style={{ '--p': answered / total } as CSSProperties} /></div>
  </div>;
}
