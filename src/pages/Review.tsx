import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Answers, Item } from '../types';
import { RESPONSE_LABELS } from '../config';
export function Review({items,answers,onEdit,onFinish}:{items:Item[];answers:Answers;onEdit:(n:number)=>void;onFinish:()=>void}) {
  const [page,setPage] = useState(0);
  const [onlyMissing,setOnlyMissing] = useState(false);
  const missing = items.filter(item => !answers[item.id]);
  const filtered = onlyMissing ? missing : items;
  const pages = Math.max(1,Math.ceil(filtered.length/20));
  return <section className="narrow-page review-page"><span className="eyebrow">마지막으로 확인해 주세요</span><h1>내가 남긴 답변들</h1><p className="lede">{items.length - missing.length} / {items.length}문항 완료</p>
    <div className="soft-note">{missing.length ? <>아직 <strong>{missing.length}문항</strong>이 남아 있어요. 모든 문항에 답하면 결과를 확인할 수 있습니다.</> : <>289문항에 모두 답했어요. 수정할 답변이 없다면 아래에서 결과를 확인해 주세요.</>}</div>
    <div className="review-actions"><button className="button secondary" onClick={() => onEdit(Math.max(0,items.findIndex(item=>!answers[item.id])))}>{missing.length ? '첫 미응답 문항으로' : '첫 문항부터 다시 보기'}</button><button className="button primary" disabled={missing.length > 0} onClick={onFinish}>답변 확정하고 결과 보기 <ArrowRight size={16}/></button></div>
    <label className="checkline"><input type="checkbox" checked={onlyMissing} onChange={e=>{setOnlyMissing(e.target.checked);setPage(0);}}/> 미응답 문항만 보기</label>
    <ol className="review-list">{filtered.slice(page*20,(page+1)*20).map(item => { const index = items.findIndex(value => value.id===item.id); return <li key={item.id}><button onClick={() => onEdit(index)}><span className="review-num">{String(index+1).padStart(3,'0')}</span><span className="review-text"><strong>{item.korean}</strong><span>{answers[item.id] ? RESPONSE_LABELS[answers[item.id]-1] : '아직 답하지 않았어요'}</span></span>{answers[item.id] ? <Check size={17}/> : <ArrowRight size={17}/>}<span className="sr-only">답변 수정</span></button></li>; })}</ol>
    {!filtered.length && <p className="empty-copy">미응답 문항이 없어요.</p>}
    <div className="pagination"><button className="button secondary" disabled={page===0} onClick={()=>setPage(page-1)}><ArrowLeft size={16}/> 이전 목록</button><span>{page+1} / {pages}</span><button className="button secondary" disabled={page>=pages-1} onClick={()=>setPage(page+1)}>다음 목록 <ArrowRight size={16}/></button></div>
  </section>;
}
