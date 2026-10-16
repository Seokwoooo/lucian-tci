import type { CSSProperties } from 'react';
import { domains } from '../data/scales';
import { compareMeans } from '../lib/compare';
import { mascotSignals, readPersona, type DomainMeans } from '../lib/persona';
import { Mascot } from './PersonaCard';

/** Side-by-side description of two answer profiles. It never predicts how a relationship will go. */
export function CompareView({ mine, theirs, mineLabel = '나', theirLabel = '친구' }: { mine: DomainMeans; theirs: DomainMeans; mineLabel?: string; theirLabel?: string }) {
  const a = readPersona(mine).persona, b = readPersona(theirs).persona;
  const c = compareMeans(mine, theirs);
  return <div className="compare-view">
    <div className="cv-duo">
      <figure style={{ '--pc': a.color } as CSSProperties}><Mascot signals={mascotSignals(mine)} color={a.color} className="cv-mascot" /><figcaption><small>{mineLabel}</small><b>{a.name}</b></figcaption></figure>
      <span className="cv-badge"><b>{c.sameAxes}/4</b><small>같은 방향</small></span>
      <figure style={{ '--pc': b.color } as CSSProperties}><Mascot signals={mascotSignals(theirs)} color={b.color} className="cv-mascot" /><figcaption><small>{theirLabel}</small><b>{b.name}</b></figcaption></figure>
    </div>
    <h3 className="cv-headline">{c.samePersona ? '같은 캐릭터!' : c.headline}</h3>
    <p className="cv-detail">{c.detail} 가장 닮은 영역은 <b>{c.closest.name}</b>, 가장 다른 영역은 <b>{c.furthest.name}</b>이에요.</p>
    <div className="cv-rows" role="list">{domains.map(d => <div className="cv-row" role="listitem" key={d.code} aria-label={`${d.name}: ${mineLabel} ${mine[d.code].toFixed(2)}, ${theirLabel} ${theirs[d.code].toFixed(2)}`}>
      <span className="cv-name">{d.name}</span>
      <span className="cv-track" aria-hidden="true"><i className="cv-mid" /><b className="cv-dot mine" style={{ left: `${(mine[d.code] - 1) / 4 * 100}%`, background: a.color }} /><b className="cv-dot theirs" style={{ left: `${(theirs[d.code] - 1) / 4 * 100}%`, background: b.color }} /></span>
      <span className="cv-nums" aria-hidden="true"><span style={{ color: 'var(--ink)' }}>{mine[d.code].toFixed(1)}</span> · <span>{theirs[d.code].toFixed(1)}</span></span>
    </div>)}</div>
    <p className="fine">두 사람의 응답 평균이 얼마나 비슷한지만 보여 줘요. 관계가 잘 맞는지, 잘 될지를 판단하지 않습니다.</p>
  </div>;
}
