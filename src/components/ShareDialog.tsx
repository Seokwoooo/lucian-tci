import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Link, Share2, X, FileDown } from 'lucide-react';
import { domains } from '../data/scales';
import { interpretResults } from '../lib/interpretation';
import { buildSummaryText, downloadPng, downloadPdf, type ExportSelection } from '../lib/export';
import type { ScoreResult } from '../types';
import { SITE_URL } from '../config';

export default function ShareDialog({result,onClose}:{result:ScoreResult;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [selection,setSelection]=useState<ExportSelection>({includeSummary:false,domains:[],includeSubscales:false});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [fallback,setFallback]=useState('');
  useEffect(()=>{setFallback('');setMessage('');},[selection]);
  useEffect(()=>{const node=dialog.current!;node.showModal();return()=>node.close();},[]);
  const insights=interpretResults(result);
  const selected=selection.domains.length>0;
  const text=selected?buildSummaryText(result,insights,selection,SITE_URL):'';
  async function run(fn:()=>Promise<void>,success:string) {setBusy(true);setMessage('');try{await fn();setMessage(success);}catch(error){setMessage(error instanceof Error?error.message:'처리하지 못했습니다. 다시 시도해 주세요.');}finally{setBusy(false);}}
  async function copy(value:string) {setFallback('');try{await navigator.clipboard.writeText(value);}catch{setFallback(value);throw new Error('자동 복사를 사용할 수 없어 아래에 내용을 표시했습니다. 직접 선택해 복사해 주세요.');}}
  function shareX(){ const url=new URL('https://x.com/intent/post'); url.searchParams.set('text',text);window.open(url.toString(),'_blank','noopener,noreferrer'); }
  return <dialog className="share-dialog" ref={dialog} aria-labelledby="share-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <div className="dialog-heading"><div><span className="eyebrow">내가 고른 내용만</span><h2 id="share-title">결과 저장·공유</h2></div><button className="icon-button" aria-label="공유 창 닫기" disabled={busy} onClick={onClose}><X/></button></div>
    <p className="muted">포함할 영역을 먼저 골라 주세요. 원문 답변은 포함되지 않습니다. PNG·PDF는 이 기기에만 저장됩니다.</p>
    <fieldset className="share-choices"><legend>저장·공유에 포함할 영역</legend>{domains.map(domain=><label key={domain.code} className="checkline"><input type="checkbox" disabled={busy} checked={selection.domains.includes(domain.code)} onChange={e=>setSelection({...selection,domains:e.target.checked?[...selection.domains,domain.code]:selection.domains.filter(x=>x!==domain.code)})}/><span>{domain.name}</span></label>)}</fieldset>
    <label className="checkline"><input type="checkbox" disabled={busy} checked={selection.includeSummary} onChange={e=>setSelection({...selection,includeSummary:e.target.checked})}/> 선택한 영역의 요약 설명도 포함</label>
    <label className="checkline"><input type="checkbox" disabled={busy} checked={selection.includeSubscales} onChange={e=>setSelection({...selection,includeSubscales:e.target.checked})}/> PDF에 선택한 영역의 하위척도 상세도 포함</label>
    <details className="share-preview" open><summary>공유할 텍스트 미리보기</summary><pre tabIndex={0} role="region" aria-label="공유할 텍스트">{text||'영역을 선택하면 여기에 공유할 내용이 표시됩니다.'}</pre></details>
    <div className="share-buttons"><button className="button secondary" disabled={!selected||busy} onClick={()=>run(()=>downloadPng(result,insights,selection,SITE_URL),'PNG 저장 요청을 보냈습니다. 브라우저 다운로드를 확인해 주세요.')}><Download size={17}/> PNG 저장</button><button className="button secondary" disabled={!selected||busy} onClick={()=>run(()=>downloadPdf(result,insights,selection,SITE_URL),'PDF 저장 요청을 보냈습니다. 브라우저 다운로드를 확인해 주세요.')}><FileDown size={17}/> PDF 다운로드</button><button className="button secondary" disabled={!selected||busy} onClick={()=>run(()=>copy(text),'선택한 결과 요약을 복사했습니다.')}><Copy size={17}/> 결과 요약 복사</button><button className="button secondary" disabled={!selected||busy} onClick={shareX}>𝕏 선택한 결과 공유</button>{typeof navigator.share==='function'&&<button className="button secondary" disabled={!selected||busy} onClick={()=>run(()=>navigator.share({title:'내 응답으로 살펴본 기질과 성격',text}),'기기 공유 메뉴를 사용했습니다.')}><Share2 size={17}/> 기기 공유 메뉴</button>}<button className="button secondary" disabled={busy} onClick={()=>run(()=>copy(SITE_URL),'개인 결과가 없는 검사 사이트 링크를 복사했습니다.')}><Link size={17}/> 일반 링크 복사</button></div>
    <div className="share-notes"><p>일반 링크는 검사 사이트 주소만 담습니다. X·기기 공유 버튼을 누르면 위 미리보기의 내용이 해당 서비스로 전달됩니다. 카카오톡은 기기 공유 메뉴가 지원하는 경우 선택할 수 있습니다.</p><p>PDF는 한국어 모양을 보존하는 이미지형 문서로, 텍스트 검색·선택은 지원하지 않습니다. 읽기용 텍스트는 ‘결과 요약 복사’를 이용해 주세요.</p></div>
    <div role="status" className="export-status">{busy?'파일을 만들고 있어요. 잠시만 기다려 주세요.':message}</div>{fallback&&<textarea className="copy-fallback" readOnly value={fallback} aria-label="직접 복사할 내용" onFocus={e=>e.target.select()}/>}
  </dialog>;
}
