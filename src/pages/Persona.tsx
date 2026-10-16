import { useEffect, type CSSProperties } from 'react';
import { ArrowRight, Check, Zap, BatteryLow, Users } from 'lucide-react';
import type { Persona } from '../data/personas';
import { personas } from '../data/personas';
import { decodeMeans } from '../lib/compare';
import { exampleSignals, mascotSignals, meansOf, oppositeOf, readPersona } from '../lib/persona';
import type { ScoreResult } from '../types';
import { NICKNAME_NOTE, TIME_ESTIMATE } from '../config';
import { MiniCard, PersonaCard } from '../components/PersonaCard';
import { CompareView } from '../components/Compare';

export function PersonaPage({ persona, vs, myResult, answered, onStart, onSeeMine, onOpenPersona }: {
  persona: Persona; vs: string | null; myResult: ScoreResult | null; answered: number;
  onStart: (friendToken: string | null) => void; onSeeMine: () => void; onOpenPersona: (slug: string) => void;
}) {
  const friend = decodeMeans(vs);
  const friendReading = friend ? readPersona(friend) : null;
  // A comparison link always shows the character that its own scores produce.
  const shown = friendReading?.persona ?? persona;
  useEffect(() => {
    const previous = document.title;
    document.title = friend ? `친구의 기질 캐릭터는 ‘${shown.name}’ — 무료 TCI 기질검사` : `${shown.name} — 16가지 기질 캐릭터 | 무료 TCI 기질검사`;
    return () => { document.title = previous; };
  }, [friend, shown]);
  const opposite = oppositeOf(shown);
  const startLabel = myResult ? '내 결과 보기' : answered ? '이어서 검사하기' : '나도 무료로 검사하기';
  return <div className="persona-page page-width" style={{ '--pc': shown.color } as CSSProperties}>
    <section className="result-hero persona-hero">
      <div className="rh-copy">
        <p className="kicker">{friend ? '친구가 보낸 결과예요' : `16가지 기질 캐릭터 · No.${String(personas.indexOf(shown) + 1).padStart(2, '0')}`}</p>
        <h1><span className="rh-emoji" aria-hidden="true">{shown.emoji}</span>{friend ? <>친구의 캐릭터는<br />‘{shown.name}’</> : shown.name}</h1>
        <p className="rh-tagline">{shown.tagline}</p>
        <p className="rs-summary">{shown.summary}</p>
        <div className="rh-actions">
          {friend && !myResult
            ? <button className="button primary xl" onClick={() => onStart(vs)}><Users size={19} /> 나도 검사하고 비교하기</button>
            : <button className="button primary xl" onClick={() => myResult ? onSeeMine() : onStart(null)}>{startLabel} <ArrowRight size={19} /></button>}
        </div>
        <p className="fine">289문항 · {TIME_ESTIMATE} · 회원가입 없음 · 100% 무료</p>
      </div>
      <div className="rh-card"><PersonaCard persona={shown} signals={friend ? mascotSignals(friend) : exampleSignals(shown, 0.7)} axes={friendReading?.axes} gear={friendReading?.gear} caption={friend ? '친구의 기질 캐릭터' : '기질 캐릭터'} width={290} /></div>
    </section>

    {friend && <section className="rs-block" id="friend-compare">
      <div className="rs-head"><span className="kicker">나 vs 친구</span><h2>{myResult ? '우리 둘을 비교하면' : '검사를 마치면 이렇게 비교돼요'}</h2></div>
      {myResult ? <CompareView mine={meansOf(myResult)} theirs={friend} /> : <div className="compare-cta"><p>검사를 시작하면 친구의 결과를 이 브라우저에 보관해 두었다가, 내 결과가 나오면 바로 비교해 드려요. 친구 결과에는 7개 영역 평균만 들어 있어요.</p><button className="button primary" onClick={() => onStart(vs)}>나도 검사하고 비교하기 <ArrowRight size={17} /></button></div>}
    </section>}

    <section className="rs-block rs-about">
      <div className="trait-box"><h3>{shown.name}의 이런 모습</h3><ul className="trait-list">{shown.traits.map(t => <li key={t}><Check size={16} aria-hidden="true" />{t}</li>)}</ul></div>
      <blockquote className="quote"><small>자주 듣는 말</small>“{shown.quote}”</blockquote>
    </section>
    <section className="rs-two">
      <article className="rs-card good"><h2><Zap size={20} aria-hidden="true" />이럴 때 빛나요</h2><ul>{shown.strengths.map(s => <li key={s}>{s}</li>)}</ul></article>
      <article className="rs-card care"><h2><BatteryLow size={20} aria-hidden="true" />이럴 땐 지칠 수 있어요</h2><ul>{shown.watchouts.map(s => <li key={s}>{s}</li>)}</ul></article>
    </section>
    <section className="rs-block">
      <div className="rs-head"><span className="kicker">정반대 캐릭터</span><h2>{opposite.name}</h2><p>네 가지 기질 방향이 모두 반대인 캐릭터예요.</p></div>
      <div className="related-single"><MiniCard persona={opposite} signals={exampleSignals(opposite)} onOpen={() => onOpenPersona(opposite.slug)} /></div>
    </section>
    <section className="rs-block">
      <div className="rs-head"><span className="kicker">16 CHARACTERS</span><h2>다른 캐릭터도 구경해 보세요</h2></div>
      <div className="character-grid">{personas.map(p => <MiniCard key={p.slug} persona={p} signals={exampleSignals(p)} onOpen={() => onOpenPersona(p.slug)} active={p === shown} />)}</div>
      <p className="fine">{NICKNAME_NOTE}</p>
    </section>
  </div>;
}
