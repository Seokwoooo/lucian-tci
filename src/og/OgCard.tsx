// Development-only 1200×630 link-preview layouts, captured by scripts/generate-og.mjs.
// They contain public product copy and fixed example characters only, never a visitor's result.
import type { CSSProperties } from 'react';
import { personaBySlug, personas } from '../data/personas';
import { axisWords } from '../data/personas';
import { exampleSignals } from '../lib/persona';
import { Mascot, StaticCard } from '../components/PersonaCard';

export default function OgCard({ slug }: { slug: string }) {
  const persona = personaBySlug.get(slug);
  if (!persona) {
    const fan = ['curious-cat', 'sunny-captain', 'careful-guardian'].map(s => personaBySlug.get(s)!);
    return <div className="og og-home">
      <div className="og-copy">
        <p className="og-eyebrow">나의 타고난 기질과 성격, 얼마나 알고 계신가요?</p>
        <h1><span className="hl">무료</span> TCI 기질검사</h1>
        <p className="og-price"><span>보통은 <s>유료</s> 검사</span> → <b>여기선 ₩0</b></p>
        <p className="og-sub">289문항 · 30개 세부 척도 · <b>16가지 캐릭터</b> 중 나는?</p>
        <p className="og-foot">lucianlabs.dev/tci · 회원가입 없음 · IPIP 기반 비공식 검사</p>
      </div>
      <div className="og-fan">{fan.map((p, i) => <div key={p.slug} className={`og-fan-card f${i}`}><StaticCard persona={p} signals={exampleSignals(p, 0.7)} /></div>)}</div>
    </div>;
  }
  const no = String(personas.indexOf(persona) + 1).padStart(2, '0');
  return <div className="og og-persona" style={{ '--pc': persona.color } as CSSProperties}>
    <div className="og-art"><Mascot signals={exampleSignals(persona, 0.75)} color={persona.color} className="og-mascot" /></div>
    <div className="og-copy">
      <p className="og-eyebrow">16가지 기질 캐릭터 · No.{no}</p>
      <p className="og-kicker">나의 기질 캐릭터는</p>
      <h1>{persona.name}</h1>
      <p className="og-tagline">{persona.tagline}</p>
      <ul className="og-chips">{(['NS', 'HA', 'RD', 'P'] as const).map((code, i) => <li key={code}>{persona.code[i] === 'H' ? axisWords[code].high : axisWords[code].low}</li>)}</ul>
      <p className="og-foot"><b>너는 무슨 캐릭터?</b> 무료 TCI 기질검사 · lucianlabs.dev/tci</p>
    </div>
  </div>;
}
