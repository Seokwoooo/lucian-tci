import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Trash2, ArrowUpRight, X } from 'lucide-react';
import type { Response } from './types';
import { Home } from './pages/Home';
import { Guide } from './pages/Guide';
import { Questionnaire } from './pages/Questionnaire';
import { Review } from './pages/Review';
import { Info } from './pages/Info';
import { PersonaPage } from './pages/Persona';
import { personaBySlug } from './data/personas';
import { loadSession, saveSession, emptySession, clearSession, loadFriend, saveFriend, orderedItems, firstOpenPosition, STORAGE_KEY, FRIEND_KEY, type Session } from './lib/storage';
import { scoreAnswers } from './lib/scoring';
import { currentRoute, go, goPersona, onRouteChange, PAGES, type Page, type Route } from './lib/route';
import { BASE_PATH, REPO_URL } from './config';
const Results = lazy(() => import('./pages/Results'));
const ShareDialog = lazy(() => import('./components/ShareDialog'));

function DeleteDialog({ onClose, onDelete }: { onClose: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current!; const opener = document.activeElement as HTMLElement | null; node.showModal(); return () => { node.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); }; }, []);
  return <dialog ref={ref} className="delete-dialog" aria-labelledby="delete-title" onCancel={e => { e.preventDefault(); onClose(); }}><div className="dialog-heading"><h2 id="delete-title">저장된 답변을 삭제할까요?</h2><button className="icon-button" onClick={onClose} aria-label="삭제 창 닫기"><X /></button></div><p>이 브라우저의 답변, 결과, 진행 상황, 보관한 친구 결과가 모두 삭제됩니다. 삭제한 답변은 복구할 수 없어요. 이미 저장한 이미지·PDF와 외부에 공유한 내용은 남습니다.</p><div className="dialog-actions"><button className="button ghost" autoFocus onClick={onClose}>취소</button><button className="button danger" onClick={onDelete}>모든 답변 삭제</button></div></dialog>;
}

export default function App() {
  const [initial] = useState(() => loadSession());
  const [session, setSession] = useState(initial.session);
  const sessionRef = useRef(initial.session);
  const [issue, setIssue] = useState(initial.issue);
  const [notice, setNotice] = useState('');
  const [route, setRoute] = useState<Route>(currentRoute);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<null | 'card' | 'link'>(null);
  const [friend, setFriend] = useState(() => loadFriend());
  const [fresh, setFresh] = useState(false);
  const answered = Object.keys(session.answers).length;
  const page = route.page === 'result' && !session.complete ? 'home' : route.page;
  const routeKey = route.page === 'persona' ? `persona:${route.slug}:${route.vs ?? ''}` : route.page;
  useEffect(() => onRouteChange(() => setRoute(currentRoute())), []);
  // In-page "#page" links also work from a character path such as /tci/t/<slug>/.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || location.pathname === BASE_PATH) return;
      const target = anchor.getAttribute('href')!.slice(1);
      if (!(PAGES as readonly string[]).includes(target)) return;
      e.preventDefault(); go(target as Page);
    };
    document.addEventListener('click', click); return () => document.removeEventListener('click', click);
  }, []);
  useEffect(() => {
    if (page === 'characters') { document.getElementById('characters')?.scrollIntoView(); document.getElementById('characters')?.focus({ preventScroll: true }); return; }
    window.scrollTo({ top: 0, behavior: 'instant' }); document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [routeKey, page]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === FRIEND_KEY) { setFriend(loadFriend()); return; }
      if (e.key !== STORAGE_KEY) return;
      const loaded = loadSession(); sessionRef.current = loaded.session; setSession(loaded.session); setIssue(loaded.issue); setSharing(null); setNotice('다른 탭의 변경을 반영했습니다.');
      if (!Object.keys(loaded.session.answers).length) go('home');
    };
    window.addEventListener('storage', listener); return () => window.removeEventListener('storage', listener);
  }, []);
  // The ref always holds the latest session, so a delayed auto-advance never overwrites a newer answer.
  function commit(next: Session) { const updated = { ...next, updatedAt: Date.now() }; sessionRef.current = updated; setSession(updated); setIssue(saveSession(updated)); setNotice(''); }
  function move(position: number) { commit({ ...sessionRef.current, position }); if (page !== 'test') go('test'); }
  function answer(value: Response, ms: number) { const s = sessionRef.current; const id = orderedItems[s.position].id; commit({ ...s, answers: { ...s.answers, [id]: value }, complete: false, timings: s.answers[id] ? s.timings : { ...s.timings, [id]: ms } }); }
  function finish() { try { scoreAnswers(sessionRef.current.answers); commit({ ...sessionRef.current, complete: true }); setFresh(true); go('result'); } catch { setIssue('모든 289문항에 올바르게 답했는지 확인해 주세요.'); } }
  function remove() { const error = clearSession(); const empty = emptySession(); sessionRef.current = empty; setSession(empty); setFriend(null); setIssue(error); setDeleting(false); setSharing(null); setNotice(error ? '현재 화면의 답변과 결과는 지웠습니다. 저장소의 삭제 여부는 확인할 수 없습니다.' : '이 브라우저의 답변과 결과를 삭제했습니다.'); go('home'); }
  function startTest() { go(answered ? (session.complete ? 'result' : 'test') : 'guide'); }
  function resume() { if (!session.complete) commit({ ...sessionRef.current, position: firstOpenPosition(sessionRef.current.answers) }); go(session.complete ? 'result' : 'test'); }
  function keepFriend(token: string | null) {
    if (token) { setFriend(token); if (!saveFriend(token)) setNotice('친구 결과를 이 브라우저에 보관하지 못했어요. 검사를 마친 뒤 친구 링크를 다시 열어 주세요.'); }
    if (session.complete) go('result'); else if (answered) resume(); else go('guide');
  }
  const result = session.complete ? scoreAnswers(session.answers) : null;
  const persona = route.page === 'persona' ? personaBySlug.get(route.slug)! : null;
  return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>본문으로 바로가기</a>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#home" onClick={e => { e.preventDefault(); go('home'); }} aria-label="무료 TCI 기질검사 처음으로"><span className="brand-mark" aria-hidden="true">TCI</span><span className="brand-text"><b>무료 TCI 기질검사</b><small>by Lucian Labs</small></span></a>
      <nav aria-label="주요 메뉴"><a href="#characters" className="nav-link" onClick={e => { e.preventDefault(); go('characters'); }}>16가지 캐릭터</a><a href="#about" className="nav-link hide-sm" onClick={e => { e.preventDefault(); go('about'); }}>검사 안내</a>{(answered > 0 || issue || friend) && <button className="header-delete" onClick={() => setDeleting(true)}><Trash2 size={15} /><span>저장된 답변 삭제</span></button>}</nav>
    </div></header>
    {issue && <div className="issue-banner page-width" role="alert">{issue}</div>}{notice && <div className="notice-banner page-width" role="status">{notice}</div>}
    <main id="main-content" tabIndex={-1}>
      {(page === 'home' || page === 'characters') && <Home answered={answered} complete={session.complete} onStart={startTest} onResume={resume} onOpenPersona={slug => goPersona(slug)} />}
      {page === 'guide' && <Guide friend={!!friend} onStart={() => { commit(sessionRef.current); go('test'); }} />}
      {page === 'test' && <Questionnaire items={orderedItems} session={session} saveIssue={issue} onAnswer={answer} onMove={move} onComplete={() => go('review')} />}
      {page === 'review' && <Review items={orderedItems} answers={session.answers} onEdit={move} onFinish={finish} />}
      {page === 'result' && result && <Suspense fallback={<p className="loading-view" role="status">내 답변을 정리하고 있어요…</p>}><Results result={result} fresh={fresh} friendToken={friend} onShare={() => setSharing('card')} onCompare={() => setSharing('link')} onEdit={() => go('review')} onOpenPersona={slug => goPersona(slug)} onClearFriend={() => { saveFriend(null); setFriend(null); }} /></Suspense>}
      {persona && route.page === 'persona' && <PersonaPage persona={persona} vs={route.vs} myResult={result} answered={answered} onStart={keepFriend} onSeeMine={() => go('result')} onOpenPersona={slug => goPersona(slug)} />}
      {(page === 'privacy' || page === 'about' || page === 'scoring') && <Info type={page} />}
    </main>
    <footer className="site-footer page-width"><div><a href="https://lucianlabs.dev" target="_blank" rel="noreferrer" className="footer-brand">Lucian Labs <ArrowUpRight size={14} /></a><p>나를 이해하는 도구를, 누구나 무료로.</p></div><nav aria-label="하단 메뉴"><a href="#about">출처와 한계</a><a href="#scoring">채점 방법</a><a href="#privacy">개인정보 처리 안내</a><a href={REPO_URL} target="_blank" rel="noreferrer">오픈소스</a><a href="https://x.com/lucian__03" target="_blank" rel="noreferrer">만든 사람 𝕏</a></nav><p className="footer-disclosure">IPIP 기반 비공식 자기이해 테스트 · 정식 TCI-RS 검사 아님<br />© 2026 Lucian Labs · 코드 MIT · IPIP 문항 Public Domain</p></footer>
    {deleting && <DeleteDialog onClose={() => setDeleting(false)} onDelete={remove} />}
    {sharing && result && <Suspense fallback={<div role="status" className="notice-banner">공유 도구를 준비하고 있어요…</div>}><ShareDialog result={result} mode={sharing} onClose={() => setSharing(null)} /></Suspense>}
  </>;
}
