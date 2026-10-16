import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import items from '../data/items.json';
import { scoreAnswers } from '../lib/scoring';
import { interpretResults } from '../lib/interpretation';
import { renderShareImage } from '../lib/export';
import { DOMAIN_CODES } from '../types';

export default function ExampleDialog({onClose,onStart}:{onClose:()=>void;onStart:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [image,setImage]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{
    const node=dialog.current!;const opener=document.activeElement as HTMLElement|null;node.showModal();let active=true;
    // Explicitly labelled neutral example; it never reads or writes the visitor's answers.
    const result=scoreAnswers(Object.fromEntries(items.map(item=>[item.id,3])));
    renderShareImage(result,interpretResults(result),{domains:[...DOMAIN_CODES],includeSummary:false,includeSubscales:false})
      .then(canvas=>{if(active)setImage(canvas.toDataURL('image/png'));})
      .catch(()=>{if(active)setError('예시 이미지를 불러오지 못했습니다. 검사와 결과 확인은 그대로 이용할 수 있어요.');});
    return()=>{active=false;node.close();if(opener?.isConnected)opener.focus({preventScroll:true});};
  },[]);
  return <dialog className="example-dialog" ref={dialog} aria-labelledby="example-title" onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="dialog-heading"><div><span className="eyebrow">이런 한 장을 만들 수 있어요</span><h2 id="example-title">내 결과, 나답게 남기기</h2></div><button className="icon-button" aria-label="예시 닫기" onClick={onClose}><X/></button></div>
    <p className="example-disclosure">미리보기 예시입니다. 모든 289문항에 ‘보통이다’로 답한 경우를 계산했으며, 실제 사람의 결과나 평균이 아닙니다.</p>
    {image?<img className="example-image" src={image} alt="모든 영역의 참고값이 3.00인 중립 응답 예시. 비공식 IPIP 검사 결과 카드."/>:<p role="status">{error||'예시 카드를 만들고 있어요…'}</p>}
    <p className="small muted">검사가 끝나면 공유할 영역을 직접 고를 수 있어요. 예시 확인은 내 답변에 영향을 주지 않습니다.</p>
    <button className="button primary full-width" onClick={onStart}>이제 내 마음 알아보기 <ArrowRight size={17}/></button>
  </dialog>;
}
