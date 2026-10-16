import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Sprout, Trash2, ArrowUpRight, X } from 'lucide-react';
import itemData from './data/items.json';
import type { Item, Response } from './types';
import { Home } from './pages/Home';
import { Guide } from './pages/Guide';
import { Questionnaire } from './pages/Questionnaire';
import { Review } from './pages/Review';
import { Info } from './pages/Info';
import { loadSession, saveSession, emptySession, clearSession, STORAGE_KEY, type Session } from './lib/storage';
import { scoreAnswers } from './lib/scoring';
import { REPO_URL } from './config';
const Results = lazy(()=>import('./pages/Results'));
const ShareDialog = lazy(()=>import('./components/ShareDialog'));
const items = itemData as Item[];
type Route = 'home'|'guide'|'test'|'review'|'result'|'about'|'privacy'|'scoring';
function getRoute():Route { const hash = location.hash.slice(1); return ['home','guide','test','review','result','about','privacy','scoring'].includes(hash) ? hash as Route : 'home'; }
function go(route:Route){location.hash=route;}

function DeleteDialog({onClose,onDelete}:{onClose:()=>void;onDelete:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className="delete-dialog" aria-labelledby="delete-title" onCancel={e=>{e.preventDefault();onClose();}}><div className="dialog-heading"><h2 id="delete-title">저장된 답변을 삭제할까요?</h2><button className="icon-button" onClick={onClose} aria-label="삭제 창 닫기"><X/></button></div><p>이 브라우저의 답변, 결과, 진행 상황이 모두 삭제됩니다. 삭제한 답변은 복구할 수 없어요. 이미 저장한 PNG·PDF와 외부에 공유한 내용은 남습니다.</p><div className="dialog-actions"><button className="button secondary" autoFocus onClick={onClose}>취소</button><button className="button danger" onClick={onDelete}>모든 답변 삭제</button></div></dialog>;
}
export default function App() {
  const [initial] = useState(()=>loadSession());
  const [session,setSession] = useState(initial.session);
  const [issue,setIssue] = useState(initial.issue);
  const [notice,setNotice] = useState('');
  const [route,setRoute] = useState(getRoute);
  const [deleting,setDeleting] = useState(false);
  const [sharing,setSharing] = useState(false);
  const answered = Object.keys(session.answers).length;
  const currentRoute = route==='result' && !session.complete ? 'home' : route;
  useEffect(()=>{const listener=()=>setRoute(getRoute());window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener);},[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});document.getElementById('main-content')?.focus({preventScroll:true});},[currentRoute]);
  useEffect(()=>{const listener=(e:StorageEvent)=>{if(e.key!==STORAGE_KEY)return;const loaded=loadSession();setSession(loaded.session);setIssue(loaded.issue);setSharing(false);setNotice('다른 탭의 변경을 반영했습니다.');if(!Object.keys(loaded.session.answers).length)go('home');};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);},[]);
  function commit(next:Session){const updated={...next,updatedAt:Date.now()};setSession(updated);setIssue(saveSession(updated));setNotice('');}
  function move(position:number){commit({...session,position});go('test');}
  function answer(value:Response,ms:number){const id=items[session.position].id;commit({...session,answers:{...session.answers,[id]:value},complete:false,timings:session.answers[id]?session.timings:{...session.timings,[id]:ms}});}
  function finish(){try{scoreAnswers(session.answers);commit({...session,complete:true});go('result');}catch{setIssue('모든 289문항에 올바르게 답했는지 확인해 주세요.');}}
  function remove(){const error=clearSession();setSession(emptySession());setIssue(error);setDeleting(false);setSharing(false);setNotice(error?'현재 화면의 답변과 결과는 지웠습니다. 저장소의 삭제 여부는 확인할 수 없습니다.':'이 브라우저의 답변과 결과를 삭제했습니다.');go('home');}
  const result = session.complete ? scoreAnswers(session.answers) : null;
  return <>
    <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>본문으로 바로가기</a>
    <header className="site-header"><div className="header-inner"><a className="brand" href="#home" aria-label="무료 TCI 기질검사 처음으로"><span className="brand-symbol"><Sprout size={23}/></span><span>lucian<span className="brand-light"> labs</span><small>무료 TCI 기질검사</small></span></a><nav aria-label="주요 메뉴"><a href="#about" className="header-about">검사 안내</a>{(answered>0||issue)&&<button className="header-delete" onClick={()=>setDeleting(true)}><Trash2 size={15}/><span>저장된 답변 삭제</span></button>}<a href={REPO_URL} target="_blank" rel="noreferrer" className="open-source-link">오픈소스 <ArrowUpRight size={14}/></a></nav></div></header>
    {issue&&<div className="issue-banner page-width" role="alert">{issue}</div>}{notice&&<div className="notice-banner page-width" role="status">{notice}</div>}
    <main id="main-content" tabIndex={-1}>
      {currentRoute==='home'&&<Home answered={answered} complete={session.complete} onStart={()=>go('guide')} onResume={()=>go(session.complete?'result':'test')}/>}
      {currentRoute==='guide'&&<Guide onStart={()=>{commit(session);go('test');}}/>}
      {currentRoute==='test'&&<Questionnaire items={items} session={session} saveIssue={issue} onAnswer={answer} onMove={move} onReview={()=>go('review')}/>}
      {currentRoute==='review'&&<Review items={items} answers={session.answers} onEdit={move} onFinish={finish}/>}
      {currentRoute==='result'&&result&&<Suspense fallback={<p className="loading-view" role="status">내 답변을 정리하고 있어요…</p>}><Results result={result} onShare={()=>setSharing(true)} onEdit={()=>go('review')}/></Suspense>}
      {['privacy','about','scoring'].includes(currentRoute)&&<Info type={currentRoute as 'privacy'|'about'|'scoring'}/>}
    </main>
    <footer className="site-footer page-width"><div><a href="https://lucianlabs.dev" target="_blank" rel="noreferrer" className="footer-brand">Lucian Labs <ArrowUpRight size={14}/></a><p>나를 이해하는 도구를, 누구나 무료로.</p></div><nav aria-label="하단 메뉴"><a href="#about">출처와 한계</a><a href="#scoring">채점 방법</a><a href="#privacy">개인정보 처리 안내</a><a href="https://x.com/lucian__03" target="_blank" rel="noreferrer">만든 사람 𝕏</a></nav><p className="footer-disclosure">IPIP 기반 비공식 자기이해 테스트 · 정식 TCI-RS 검사 아님<br/>© 2026 Lucian Labs · 코드 MIT · IPIP 문항 Public Domain</p></footer>
    {deleting&&<DeleteDialog onClose={()=>setDeleting(false)} onDelete={remove}/>}
    {sharing&&result&&<Suspense fallback={<div role="status" className="notice-banner">공유 도구를 준비하고 있어요…</div>}><ShareDialog result={result} onClose={()=>setSharing(false)}/></Suspense>}
  </>;
}
