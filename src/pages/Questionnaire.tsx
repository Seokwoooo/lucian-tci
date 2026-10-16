import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, Coffee } from 'lucide-react';
import { Progress } from '../components/Progress';
import { Mascot } from '../components/PersonaCard';
import { RESPONSE_LABELS } from '../config';
import { domains } from '../data/scales';
import { domainStories } from '../data/narratives';
import { chapterEnds, chapterOf } from '../lib/order';
import { interimMeans } from '../lib/persona';
import { estimateMinutes, type Session } from '../lib/storage';
import type { DomainCode, Item, Response } from '../types';

const CHEERS = [
  '좋은 출발이에요! 벌써 7분의 1을 왔어요.',
  '리듬을 탔네요. 생각보다 빠르죠?',
  '거의 절반이에요. 캐릭터 윤곽이 보이기 시작해요.',
  '반을 넘었어요! 여기서부터는 내리막길이에요.',
  '거의 다 왔어요. 조금만 더 힘내요!',
  '마지막 파트만 남았어요. 곧 캐릭터가 공개돼요!',
];
const SIZES = [54, 44, 36, 44, 54];
const ADVANCE_MS = 240;

function Milestone({ chapter, items, session, onContinue }: { chapter: number; items: Item[]; session: Session; onContinue: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { button.current?.focus(); }, []);
  const interim = interimMeans(session.answers, items);
  const codes = (Object.keys(interim) as DomainCode[]);
  const top = codes.sort((a, b) => Math.abs(interim[b]! - 3) - Math.abs(interim[a]! - 3))[0];
  const domain = domains.find(d => d.code === top);
  const value = top ? interim[top]! : 3;
  const story = top ? domainStories[top][value > 3 ? 'high' : 'low'] : null;
  const signals = { NS: ((interim.NS ?? 3) - 3) / 2, HA: ((interim.HA ?? 3) - 3) / 2, RD: ((interim.RD ?? 3) - 3) / 2, P: ((interim.P ?? 3) - 3) / 2 };
  const answered = Object.keys(session.answers).length;
  return <section className="milestone" aria-labelledby="milestone-title">
    <div className="milestone-dots" aria-hidden="true">{chapterEnds(items.length).map((_, i) => <span key={i} className={i <= chapter ? 'on' : ''} />)}</div>
    <p className="kicker">PART {chapter + 1} / 7 완료</p>
    <h1 id="milestone-title" tabIndex={-1}>{CHEERS[chapter]}</h1>
    <div className="silhouette" style={{ '--blur': `${(5 - chapter) * 2.4}px` } as CSSProperties}>
      <Mascot signals={signals} color="#1D1B2F" background={false} className="silhouette-mascot" />
      <span className="silhouette-q" aria-hidden="true">?</span>
    </div>
    <p className="silhouette-caption">캐릭터 윤곽이 드러나는 중… <b>{chapter + 1}/7</b></p>
    {domain && story && <div className="clue"><span className="clue-label">중간 단서</span><p>지금까지는 <b className="marker" style={{ '--mk': domain.color } as CSSProperties}>{domain.name}</b> 쪽 신호가 가장 뚜렷해요. “{story.title}”</p><small>지금까지 답한 {answered}문항 기준이라 최종 결과와 달라질 수 있어요.</small></div>}
    <button ref={button} className="button primary xl" onClick={onContinue}>PART {chapter + 2} 시작하기 <ArrowRight size={20} /></button>
    <a className="text-link" href="#home"><Coffee size={16} /> 잠시 쉬기 · 자동 저장됨</a>
  </section>;
}

export function Questionnaire({ items, session, saveIssue, onAnswer, onMove, onComplete }: { items: Item[]; session: Session; saveIssue: string | null; onAnswer: (answer: Response, ms: number) => void; onMove: (position: number) => void; onComplete: () => void }) {
  const item = items[session.position];
  const answered = Object.keys(session.answers).length;
  const value = session.answers[item.id];
  const heading = useRef<HTMLHeadingElement>(null);
  const entered = useRef(performance.now());
  const hiddenAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<(() => void) | null>(null);
  // The lock belongs to one position, so it is released the moment the next item renders.
  const [pickedAt, setPickedAt] = useState<{ position: number; value: number } | null>(null);
  const picked = pickedAt?.position === session.position ? pickedAt.value : null;
  const [milestone, setMilestone] = useState<number | null>(null);
  const ends = chapterEnds(items.length);
  const chapter = chapterOf(session.position, items.length);
  useEffect(() => { entered.current = performance.now(); hiddenAt.current = null; if (milestone === null) heading.current?.focus({ preventScroll: true }); }, [session.position, milestone]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  // Closing or reloading during the short advance animation still saves the next position.
  useEffect(() => {
    const flush = () => { if (timer.current && pending.current) { clearTimeout(timer.current); pending.current(); } };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);
  useEffect(() => { const listener = () => { if (document.hidden) hiddenAt.current = performance.now(); else if (hiddenAt.current !== null) { entered.current += performance.now() - hiddenAt.current; hiddenAt.current = null; } }; document.addEventListener('visibilitychange', listener); return () => document.removeEventListener('visibilitychange', listener); }, []);

  function answer(response: Response) {
    if (picked !== null || milestone !== null) return;
    const firstTime = !value;
    const position = session.position;
    onAnswer(response, Math.max(0, performance.now() - entered.current));
    setPickedAt({ position, value: response });
    pending.current = () => {
      timer.current = null;
      pending.current = null;
      setPickedAt(null);
      if (position === items.length - 1) { onComplete(); return; }
      onMove(position + 1);
      if (firstTime && ends.includes(position)) setMilestone(ends.indexOf(position));
    };
    timer.current = setTimeout(() => pending.current?.(), ADVANCE_MS);
  }
  const back = () => { if (picked === null && session.position > 0) onMove(session.position - 1); };
  const next = () => { if (picked !== null || !value) return; if (session.position === items.length - 1) onComplete(); else onMove(session.position + 1); };
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || milestone !== null || document.querySelector('dialog[open]')) return;
      const target = e.target as HTMLElement;
      if (target.matches('input,textarea,select,[contenteditable=true]')) return;
      if (/^[1-5]$/.test(e.key)) { e.preventDefault(); answer(Number(e.key) as Response); }
      else if (e.key === 'ArrowLeft' && !target.closest('[role=tablist]')) { e.preventDefault(); back(); }
      else if ((e.key === 'ArrowRight' || (e.key === 'Enter' && !target.closest('button,a'))) && value) { e.preventDefault(); next(); }
    };
    document.addEventListener('keydown', keydown); return () => document.removeEventListener('keydown', keydown);
  });

  if (milestone !== null) return <div className="narrow-page"><Milestone chapter={milestone} items={items} session={session} onContinue={() => setMilestone(null)} /></div>;
  const estimated = estimateMinutes(Object.values(session.timings), items.length - answered);
  const shown = picked ?? value;
  return <section className="question-page narrow-page">
    <div className="test-top"><a href="#home" className="text-link"><ArrowLeft size={16} /> 잠시 쉬기</a><span className="save-state" role="status">{saveIssue ? '이 기기에 저장되지 않음' : <><LockKeyhole size={13} />{answered ? '자동 저장됨' : '답하면 자동 저장'}</>}</span></div>
    <div className="part-row"><span className="part-label">PART {chapter + 1}<small> / 7</small></span><span className="part-dots" aria-hidden="true">{ends.map((_, i) => <i key={i} className={i < chapter ? 'done' : i === chapter ? 'now' : ''} />)}</span></div>
    <Progress answered={answered} total={items.length} />
    <div className="question-card" key={item.id}>
      <span className="q-badge">Q.{String(session.position + 1).padStart(3, '0')}</span>
      <h1 ref={heading} tabIndex={-1} id="question-heading" className="question-title">{item.korean}</h1>
      <p className="q-hint" id="q-hint">평소의 나와 얼마나 맞나요? 고르면 바로 다음 문항으로 넘어가요.</p>
      <div className="scale" role="group" aria-labelledby="question-heading" aria-describedby="q-hint">
        {RESPONSE_LABELS.map((label, i) => <button key={i} type="button" className={`scale-dot d${i + 1} ${shown === i + 1 ? 'selected' : ''}`} style={{ '--s': `${SIZES[i]}px` } as CSSProperties} aria-pressed={value === i + 1} aria-label={`${i + 1}. ${label}`} onClick={() => answer((i + 1) as Response)}><span aria-hidden="true" /></button>)}
      </div>
      <div className="scale-labels" aria-hidden="true"><span>전혀 아니다</span><span>보통</span><span>매우 그렇다</span></div>
      <div className="question-nav"><button className="button ghost" disabled={session.position === 0 || picked !== null} onClick={back}><ArrowLeft size={17} /> 이전</button><button className="button ghost" disabled={!value || picked !== null} onClick={next}>다음 <ArrowRight size={17} /></button></div>
      <p className="keyboard-help">키보드 <kbd>1</kbd>~<kbd>5</kbd> 선택 · <kbd>←</kbd> 이전 · <kbd>→</kbd> 다음</p>
    </div>
    <div className="test-bottom"><p>{answered === items.length ? '모든 문항에 답했어요! 답변을 확인하고 결과를 볼 수 있어요.' : estimated ? `지금 속도면 약 ${estimated}분 남았어요.` : '10문항쯤 답하면 남은 시간을 알려 드릴게요.'}</p><a className="text-link" href="#review">답변 목록</a></div>
    <p className="test-disclaimer">IPIP 공개 문항 기반 비공식 검사 · 정식 TCI-RS와 다릅니다.</p>
  </section>;
}
