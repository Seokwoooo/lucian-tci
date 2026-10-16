import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { Progress } from '../components/Progress';
import { RESPONSE_LABELS } from '../config';
import { estimateMinutes, type Session } from '../lib/storage';
import type { Item, Response } from '../types';

export function Questionnaire({ items, session, saveIssue, onAnswer, onMove, onReview }: { items: Item[]; session: Session; saveIssue: string|null; onAnswer:(answer:Response,ms:number)=>void; onMove:(position:number)=>void; onReview:()=>void }) {
  const item = items[session.position];
  const answered = Object.keys(session.answers).length;
  const value = session.answers[item.id];
  const heading = useRef<HTMLHeadingElement>(null);
  const entered = useRef(performance.now());
  const hiddenAt = useRef<number | null>(null);
  useEffect(() => { entered.current = performance.now(); hiddenAt.current = null; heading.current?.focus({preventScroll:true}); }, [session.position]);
  useEffect(() => { const listener = () => { if (document.hidden) hiddenAt.current = performance.now(); else if (hiddenAt.current !== null) { entered.current += performance.now() - hiddenAt.current; hiddenAt.current = null; } }; document.addEventListener('visibilitychange',listener); return () => document.removeEventListener('visibilitychange', listener); }, []);
  function answer(response:Response) { onAnswer(response, Math.max(0,performance.now()-entered.current)); }
  function next() { if (!value) return; if (session.position === items.length-1) onReview(); else onMove(session.position+1); }
  useEffect(() => {
    const keydown = (e:KeyboardEvent) => {
      if(e.ctrlKey || e.metaKey || e.altKey || e.repeat || document.querySelector('dialog[open]')) return;
      const target = e.target as HTMLElement;
      if(target.matches('input:not([type=radio]),textarea,select,[contenteditable=true]')) return;
      if (/^[1-5]$/.test(e.key)) { e.preventDefault(); answer(Number(e.key) as Response); }
      else if (e.key === 'Enter' && !target.closest('button,a') && value) { e.preventDefault(); next(); }
    };
    document.addEventListener('keydown',keydown); return () => document.removeEventListener('keydown',keydown);
  });
  const estimated = estimateMinutes(Object.values(session.timings), items.length-answered);
  return <section className="question-page narrow-page">
    <div className="test-top"><a href="#home" className="text-link"><ArrowLeft size={16}/> 잠시 쉬기</a><span className="save-state" role="status">{saveIssue ? '이 기기에 저장되지 않음' : <><LockKeyhole size={13}/>{answered ? '이 기기에 자동 저장됨' : '답변하면 자동 저장'}</>}</span></div>
    <Progress answered={answered} total={items.length}/>
    <div className="question-card">
      <div className="question-overline"><span>질문 <b>{String(session.position+1).padStart(3,'0')}</b><span className="muted"> / {items.length}</span></span><span className="small muted">평소의 나와 얼마나 맞나요?</span></div>
      <h1 ref={heading} tabIndex={-1} id="question-heading" className="question-title">{item.korean}</h1>
      <fieldset className="answer-options" aria-labelledby="question-heading"><legend className="sr-only">나와 맞는 정도 선택</legend>{RESPONSE_LABELS.map((label,i) => <label key={`${item.id}-${i}`} className={`answer-option ${value === i+1 ? 'selected' : ''}`}><input type="radio" name={item.id} value={i+1} checked={value === i+1} onChange={() => answer((i+1) as Response)}/><span className="answer-number">{i+1}</span><span>{label}</span><span className="answer-indicator" aria-hidden="true">{value === i+1 && <Check size={14}/>}</span></label>)}</fieldset>
      <div className="question-nav"><button className="button secondary" disabled={session.position === 0} onClick={() => onMove(session.position-1)}><ArrowLeft size={17}/> 이전</button><button className="button primary next-button" disabled={!value} onClick={next}>{session.position === items.length-1 ? '최종 답변 확인' : '다음 문항'}<ArrowRight size={17}/></button></div>
      <p className="keyboard-help">키보드 <kbd>1</kbd> ~ <kbd>5</kbd> 선택 · <kbd>Enter</kbd> 다음 문항</p>
    </div>
    <div className="test-bottom"><p>{answered === items.length ? '모든 문항에 답했어요. 답변을 확인하고 결과를 볼 수 있습니다.' : estimated ? `지금 속도로 약 ${estimated}분 남았어요. 최근 응답 시간을 바탕으로 한 추정입니다.` : '내 속도로 천천히. 10개 이상의 응답이 쌓이면 예상 남은 시간을 안내해요.'}</p><button className="text-link" onClick={onReview}>답변 목록·문항 이동</button></div>
    <p className="test-disclaimer">IPIP 공개 문항 기반 비공식 검사 · 정식 TCI-RS와 다릅니다.</p>
  </section>;
}
