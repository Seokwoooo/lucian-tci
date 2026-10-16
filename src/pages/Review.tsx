import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import type { Answers, Item } from '../types';
import { RESPONSE_LABELS } from '../config';

export function Review({ items, answers, onEdit, onFinish }: { items: Item[]; answers: Answers; onEdit: (n: number) => void; onFinish: () => void }) {
  const [page, setPage] = useState(0);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const missing = items.filter(item => !answers[item.id]);
  const filtered = onlyMissing ? missing : items;
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const done = !missing.length;
  return <section className="narrow-page review-page">
    {done ? <div className="review-hero done">
      <span className="review-burst" aria-hidden="true"><Sparkles size={28} /></span>
      <p className="kicker">289 / 289 완료</p>
      <h1>끝까지 해냈어요!<br />이제 캐릭터를 만나 볼까요?</h1>
      <p className="lede">답변을 고치고 싶다면 아래 목록에서 바꿀 수 있어요.</p>
      <button className="button primary xl" onClick={onFinish}>답변 확정하고 결과 보기 <ArrowRight size={20} /></button>
    </div> : <div className="review-hero">
      <p className="kicker">{items.length - missing.length} / {items.length}문항 완료</p>
      <h1>내가 남긴 답변들</h1>
      <p className="lede">아직 <strong>{missing.length}문항</strong>이 남아 있어요. 모든 문항에 답하면 캐릭터를 확인할 수 있어요.</p>
      <div className="review-actions"><button className="button primary" onClick={() => onEdit(Math.max(0, items.findIndex(item => !answers[item.id])))}>남은 문항 이어서 하기 <ArrowRight size={16} /></button><button className="button ghost" disabled onClick={onFinish}>답변 확정하고 결과 보기</button></div>
    </div>}
    <details className="review-details" open={!done}>
      <summary>답변 목록 보기·고치기</summary>
      <label className="checkline"><input type="checkbox" checked={onlyMissing} onChange={e => { setOnlyMissing(e.target.checked); setPage(0); }} /> 미응답 문항만 보기</label>
      <ol className="review-list">{filtered.slice(page * 20, (page + 1) * 20).map(item => { const index = items.indexOf(item); return <li key={item.id}><button onClick={() => onEdit(index)}><span className="review-num">{String(index + 1).padStart(3, '0')}</span><span className="review-text"><strong>{item.korean}</strong><span>{answers[item.id] ? RESPONSE_LABELS[answers[item.id] - 1] : '아직 답하지 않았어요'}</span></span>{answers[item.id] ? <Check size={17} /> : <ArrowRight size={17} />}<span className="sr-only">답변 수정</span></button></li>; })}</ol>
      {!filtered.length && <p className="empty-copy">미응답 문항이 없어요.</p>}
      <div className="pagination"><button className="button ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft size={16} /> 이전 목록</button><span>{page + 1} / {pages}</span><button className="button ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>다음 목록 <ArrowRight size={16} /></button></div>
    </details>
  </section>;
}
