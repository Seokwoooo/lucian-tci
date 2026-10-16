import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Download, PencilLine, Users, Sparkles, Zap, BatteryLow, Check, Shuffle, X } from 'lucide-react';
import { domains, subscales } from '../data/scales';
import { axisWords } from '../data/personas';
import { band, domainStories, subscaleLines, subscaleSentence } from '../data/narratives';
import { findTwist, mascotSignals, meansOf, neighborsOf, oppositeOf, readPersona, strongestPoints, exampleSignals } from '../lib/persona';
import { decodeMeans } from '../lib/compare';
import type { ScoreResult } from '../types';
import { DISCLAIMER, NICKNAME_NOTE } from '../config';
import { Mascot, MiniCard, PersonaCard } from '../components/PersonaCard';
import { CompareView } from '../components/Compare';

function Reveal({ color, onDone }: { color: string; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => done.current(), quick ? 0 : 1700);
    return () => clearTimeout(timer);
  }, []);
  return <div className="reveal" role="status" style={{ '--pc': color } as CSSProperties}><span className="reveal-ring" aria-hidden="true" /><p>289개의 답으로<br />내 캐릭터를 찾는 중…</p></div>;
}

export default function Results({ result, fresh, friendToken, onShare, onCompare, onEdit, onOpenPersona, onClearFriend }: {
  result: ScoreResult; fresh: boolean; friendToken: string | null; onShare: () => void; onCompare: () => void; onEdit: () => void; onOpenPersona: (slug: string) => void; onClearFriend: () => void;
}) {
  const means = meansOf(result);
  const reading = readPersona(means);
  const { persona, axes, gear } = reading;
  const [revealed, setRevealed] = useState(!fresh);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (revealed && fresh) title.current?.focus({ preventScroll: true }); }, [revealed, fresh]);
  const twist = findTwist(result);
  const strongest = strongestPoints(result);
  const friend = decodeMeans(friendToken);
  const opposite = oppositeOf(persona);
  const signals = mascotSignals(means);
  if (!revealed) return <Reveal color={persona.color} onDone={() => setRevealed(true)} />;
  return <div className="result-page page-width" style={{ '--pc': persona.color } as CSSProperties}>
    <section className="result-hero">
      <div className="rh-copy">
        <p className="kicker">289개의 답으로 찾은 나의 기질 캐릭터</p>
        <h1 ref={title} tabIndex={-1}><span className="rh-emoji" aria-hidden="true">{persona.emoji}</span>{persona.name}</h1>
        <p className="rh-tagline">{persona.tagline}</p>
        <ul className="axis-chips" aria-label="캐릭터를 정한 네 가지 기질 방향">{axes.map(axis => <li key={axis.code}><span>{axisWords[axis.code].short}</span><b>{axis.word}</b><small>{axis.degree}</small></li>)}</ul>
        <p className="rh-gear"><Sparkles size={16} aria-hidden="true" />성격 무기 <b>{gear.item}</b> · {gear.power} <small>({gear.name} {gear.mean.toFixed(2)})</small></p>
        <div className="rh-actions">
          <button className="button primary xl" onClick={onShare}><Download size={19} /> 내 카드 저장·공유</button>
          <button className="button ghost xl" onClick={onCompare}><Users size={19} /> 친구와 비교하기</button>
        </div>
        <p className="fine">IPIP 기반 비공식 결과 · 정식 TCI-RS와 다릅니다. 캐릭터 이름은 점수 방향에 붙인 별명이에요.</p>
      </div>
      <div className="rh-card"><PersonaCard persona={persona} signals={signals} axes={axes} gear={gear} width={300} /></div>
    </section>

    <section className="rs-block rs-about">
      <div className="rs-head"><span className="kicker">한마디로</span><h2>이런 사람이에요</h2></div>
      <p className="rs-summary">{persona.summary}</p>
      <div className="trait-box"><h3>이런 모습, 익숙하지 않나요?</h3><ul className="trait-list">{persona.traits.map(t => <li key={t}><Check size={16} aria-hidden="true" />{t}</li>)}</ul></div>
      <blockquote className="quote"><small>주변에서 자주 듣는 말</small>“{persona.quote}”</blockquote>
    </section>

    <section className="rs-two">
      <article className="rs-card good"><h2><Zap size={20} aria-hidden="true" />이럴 때 빛나요</h2><ul>{persona.strengths.map(s => <li key={s}>{s}</li>)}</ul></article>
      <article className="rs-card care"><h2><BatteryLow size={20} aria-hidden="true" />이럴 땐 지칠 수 있어요</h2><ul>{persona.watchouts.map(s => <li key={s}>{s}</li>)}</ul></article>
    </section>

    <section className="rs-block">
      <div className="rs-head"><span className="kicker">캐릭터를 만든 재료</span><h2>4가지 기질 조합</h2><p>네 기질의 평균이 3보다 높은지 낮은지로 캐릭터가 정해져요. 막대 가운데 선이 3이에요.</p></div>
      <div className="axis-board">{axes.map(axis => { const d = domains.find(x => x.code === axis.code)!; const story = domainStories[axis.code][band(axis.mean)]; return <article className="axis-row" key={axis.code} style={{ '--dc': d.color } as CSSProperties}>
        <header><h3>{d.name}</h3><span className="axis-score">{axis.mean.toFixed(2)}<small> / 5</small></span></header>
        <div className="axis-ends" aria-hidden="true"><span className={!axis.high ? 'on' : ''}>{axisWords[axis.code].low}</span><span className={axis.high ? 'on' : ''}>{axisWords[axis.code].high}</span></div>
        <div className="axis-track" role="meter" aria-valuemin={1} aria-valuemax={5} aria-valuenow={Number(axis.mean.toFixed(2))} aria-label={`${d.name} ${axis.mean.toFixed(2)}점, ${axis.word} 쪽`}><i className="axis-mid" /><b style={{ left: `${(axis.mean - 1) / 4 * 100}%` }} /></div>
        <p><strong>{story.title}</strong> {story.text}</p>
      </article>; })}</div>
    </section>

    <section className="rs-block">
      <div className="rs-head"><span className="kicker">지금의 나를 받쳐 주는 힘</span><h2>3가지 성격 영역</h2><p>가장 높은 영역이 내 캐릭터의 ‘성격 무기’가 돼요.</p></div>
      <div className="char-grid">{(['SD', 'C', 'ST'] as const).map(code => { const d = domains.find(x => x.code === code)!; const m = means[code]; const story = domainStories[code][band(m)]; return <article key={code} className={`char-card ${gear.code === code ? 'is-gear' : ''}`} style={{ '--dc': d.color } as CSSProperties}>
        {gear.code === code && <span className="gear-badge">성격 무기 · {gear.item}</span>}
        <h3>{d.name}</h3><div className="char-score"><b>{m.toFixed(2)}</b><small> / 5</small></div>
        <div className="char-bar" aria-hidden="true"><i style={{ width: `${(m - 1) / 4 * 100}%` }} /></div>
        <p><strong>{story.title}</strong> {story.text}</p>{domainStories[code].note && <p className="fine">{domainStories[code].note}</p>}
      </article>; })}</div>
    </section>

    <section className="rs-two">
      <article className="rs-card twist"><h2><Shuffle size={20} aria-hidden="true" />나도 몰랐던 반전 포인트</h2>{twist ? <>
        <p className="twist-line"><b>{domains.find(d => d.code === twist.domain)!.name}</b>은(는) {twist.domainMean > 3 ? '높은' : '낮은'} 편인데, 세부적으로 <b>‘{twist.nick}’</b>은(는) 반대예요.</p>
        <p className="twist-quote">“{twist.text}”</p><small className="fine">{twist.sub.code} {twist.sub.mean.toFixed(2)} / 영역 평균 {twist.domainMean.toFixed(2)}</small>
      </> : <p className="twist-line">영역 안의 세부 성향이 대부분 같은 방향이에요. 겉과 속의 결이 꽤 일관된 편이에요.</p>}</article>
      <article className="rs-card top3"><h2><Sparkles size={20} aria-hidden="true" />가장 뚜렷하게 나온 세부 성향</h2><ol>{strongest.map(s => <li key={s.code}><b>{s.nick}</b><span>{s.text}</span><small>{s.code} · {s.mean.toFixed(2)}</small></li>)}</ol></article>
    </section>

    <section className="rs-block" id="friend-compare">
      <div className="rs-head"><span className="kicker">같이 하면 더 재밌어요</span><h2>친구와 비교하기</h2></div>
      {friend ? <><CompareView mine={means} theirs={friend} /><button className="text-link" onClick={onClearFriend}><X size={15} /> 저장된 친구 결과 지우기</button></>
        : <div className="compare-cta"><div className="duo" aria-hidden="true"><Mascot signals={signals} color={persona.color} className="duo-a" /><span className="duo-vs">VS</span><span className="duo-q">?</span></div><p>비교 링크를 친구에게 보내 보세요. 친구가 검사를 마치면 두 캐릭터를 나란히 비교할 수 있어요. 링크에는 7개 영역 평균만 담겨요.</p><button className="button primary" onClick={onCompare}><Users size={17} /> 비교 링크 만들기</button></div>}
    </section>

    <section className="rs-block">
      <div className="rs-head"><span className="kicker">자세히 보고 싶다면</span><h2>7가지 영역 · 30가지 세부 결과</h2><p>영역을 펼치면 설명과 모든 하위척도를 볼 수 있어요. 점수는 역채점 후 문항 응답 평균(1~5)이에요.</p></div>
      <div className="domain-details">{domains.map(domain => { const score = result.domains.find(x => x.code === domain.code)!; const story = domainStories[domain.code][band(score.mean)]; return <details key={domain.code} className="domain-detail" style={{ '--dc': domain.color } as CSSProperties}>
        <summary><span className="dd-dot" aria-hidden="true" /><span className="dd-name">{domain.name}<small>{story.title}</small></span><span className="dd-bar" aria-hidden="true"><i style={{ width: `${(score.mean - 1) / 4 * 100}%` }} /></span><span className="dd-score">{score.mean.toFixed(2)}</span><span className="dd-plus" aria-hidden="true">+</span></summary>
        <div className="dd-body"><p>{domain.description}</p><dl className="direction-pair"><div><dt>낮은 방향</dt><dd>{domain.low}</dd></div><div><dt>높은 방향</dt><dd>{domain.high}</dd></div></dl><p className="fine">{domain.caution}</p>
          <ul className="sub-list">{result.subscales.filter(s => s.domain === domain.code).map(sub => { const meta = subscales.find(s => s.code === sub.code)!; return <li key={sub.code}>
            <div className="sub-head"><b>{subscaleLines[sub.code].nick}</b><small>{sub.code} · {meta.english}</small><span>{sub.mean.toFixed(2)}</span></div>
            <span className="sub-bar" aria-hidden="true"><i style={{ width: `${(sub.mean - 1) / 4 * 100}%` }} /></span>
            <p>{subscaleSentence(sub.code, sub.mean)}</p>
            <p className="fine">{meta.name} · {sub.count}문항 · 원점수 {sub.sum} (가능 범위 {sub.count}~{sub.count * 5}){meta.caution ? ` · ${meta.caution}` : ''}</p>
          </li>; })}</ul>
        </div>
      </details>; })}</div>
    </section>

    <section className="rs-block">
      <div className="rs-head"><span className="kicker">다른 캐릭터와 비교하면</span><h2>정반대 캐릭터와 닮은꼴</h2><p>네 기질 방향이 모두 반대인 캐릭터, 한 가지만 다른 캐릭터예요.</p></div>
      <div className="related">
        <div className="related-opposite"><span className="related-label">정반대 캐릭터</span><MiniCard persona={opposite} signals={exampleSignals(opposite)} onOpen={() => onOpenPersona(opposite.slug)} /></div>
        <div className="related-near"><span className="related-label">한 끗 차이 닮은꼴</span><div className="related-grid">{neighborsOf(persona).map(n => <div key={n.persona.slug}><MiniCard persona={n.persona} signals={exampleSignals(n.persona)} onOpen={() => onOpenPersona(n.persona.slug)} /><small>{axisWords[n.axis].short}만 반대</small></div>)}</div></div>
      </div>
    </section>

    <aside className="result-limit"><h2>결과를 읽을 때 기억해 주세요</h2><p>{DISCLAIMER}</p><p>{NICKNAME_NOTE} 한국어 번역의 신뢰도·타당도와 한국인 규준은 검증되지 않았어요. 이 결과는 지금의 응답을 설명할 뿐, 타고난 원인이나 고정된 성격을 확정하지 않습니다.</p><p>자기초월 영역의 ST4·ST5는 원문의 정치·종교·문화 취향 문항을 포함해요. 성별, 영성의 수준, 도덕적 우열로 해석하지 마세요.</p></aside>
    <div className="result-end"><button className="button ghost" onClick={onEdit}><PencilLine size={17} /> 답변 검토·수정</button><button className="button primary" onClick={onShare}>내 카드 저장·공유 <ArrowRight size={17} /></button></div>
  </div>;
}
