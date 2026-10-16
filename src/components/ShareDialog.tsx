import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Link, Share2, X, FileDown, Users } from 'lucide-react';
import { canvasBlob, cardFilename, downloadBlob, downloadReport, renderCard, shareText, summaryText, type CardFormat } from '../lib/export';
import { compareLink, encodeMeans } from '../lib/compare';
import { meansOf, readPersona } from '../lib/persona';
import type { ScoreResult } from '../types';
import { SITE_URL } from '../config';
import { PillTabs } from './PillTabs';

export default function ShareDialog({ result, mode = 'card', onClose }: { result: ScoreResult; mode?: 'card' | 'link'; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const linkButton = useRef<HTMLButtonElement>(null);
  const [format, setFormat] = useState<CardFormat>('feed');
  const [includeScores, setIncludeScores] = useState(true);
  const [preview, setPreview] = useState<{ key: string; url: string }>({ key: '', url: '' });
  const [previewIssue, setPreviewIssue] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState('');
  const means = meansOf(result);
  const { persona } = readPersona(means);
  const personaLink = new URL(`t/${persona.slug}/`, SITE_URL).href;
  const key = `${format}-${includeScores}`;
  const options = { format, includeScores };
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

  useEffect(() => {
    const node = dialog.current!; const opener = document.activeElement as HTMLElement | null; node.showModal();
    if (mode === 'link') requestAnimationFrame(() => { linkButton.current?.scrollIntoView({ block: 'center' }); linkButton.current?.focus(); });
    return () => { node.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, [mode]);
  useEffect(() => {
    let active = true; setPreviewIssue('');
    renderCard(result, options).then(canvas => { if (active) setPreview({ key, url: canvas.toDataURL('image/png') }); })
      .catch(() => { if (active) setPreviewIssue('카드 미리보기를 만들지 못했어요. 다시 시도해 주세요.'); });
    return () => { active = false; };
  }, [result, key]);

  async function run(fn: () => Promise<void>, success: string) {
    setBusy(true); setMessage(''); setFallback('');
    try { await fn(); setMessage(success); }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') setMessage(''); else setMessage(error instanceof Error ? error.message : '처리하지 못했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); }
    catch { setFallback(value); throw new Error('자동 복사를 쓸 수 없어 아래에 내용을 표시했어요. 직접 선택해 복사해 주세요.'); }
  }
  async function shareImage() {
    const blob = await canvasBlob(await renderCard(result, options));
    const file = new File([blob], cardFilename(result, options), { type: 'image/png' });
    if (!navigator.canShare({ files: [file] })) throw new Error('이 기기는 이미지 바로 공유를 지원하지 않아요. ‘이미지 저장’ 후 올려 주세요.');
    await navigator.share({ files: [file], title: `나의 기질 캐릭터 ${persona.name}`, text: `${shareText(result)}\n${personaLink}` });
  }
  function shareX() {
    const url = new URL('https://x.com/intent/post');
    url.searchParams.set('text', shareText(result));
    url.searchParams.set('url', personaLink);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }
  const friendLink = () => compareLink(SITE_URL, means);

  return <dialog className="share-dialog" ref={dialog} aria-labelledby="share-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className="dialog-heading"><div><p className="kicker">자랑해도 돼요</p><h2 id="share-title">내 캐릭터 카드 저장·공유</h2></div><button className="icon-button" aria-label="공유 창 닫기" disabled={busy} onClick={onClose}><X /></button></div>
    <div className="share-layout">
      <div className="share-preview">
        <PillTabs label="카드 크기" value={format} onChange={setFormat} tabs={[{ value: 'feed', label: '피드 4:5' }, { value: 'story', label: '스토리 9:16' }]}>
          {preview.key === key && preview.url
            ? <img className={`card-image ${format}`} src={preview.url} alt={`${persona.name} 캐릭터 카드 미리보기${includeScores ? ', 7개 영역 점수 포함' : ', 점수 없음'}`} />
            : <div className={`card-placeholder ${format}`} role="status">{previewIssue || '카드를 만들고 있어요…'}</div>}
        </PillTabs>
        <label className="switch"><input type="checkbox" role="switch" checked={includeScores} disabled={busy} onChange={e => setIncludeScores(e.target.checked)} /><span aria-hidden="true" /> 카드에 7개 영역 점수 넣기</label>
      </div>
      <div className="share-controls">
        <div className="share-buttons">
          <button className="button primary" disabled={busy} onClick={() => run(async () => downloadBlob(await canvasBlob(await renderCard(result, options)), cardFilename(result, options)), '이미지를 저장했어요. 다운로드 폴더나 사진 앱을 확인해 주세요.')}><Download size={17} /> 이미지 저장</button>
          {canShareFiles && <button className="button sunny" disabled={busy} onClick={() => run(shareImage, '공유 메뉴를 열었어요.')}><Share2 size={17} /> 인스타·카톡으로 바로 공유</button>}
          <button className="button ghost" disabled={busy} onClick={shareX}>𝕏 에 올리기</button>
          <button className="button ghost" disabled={busy} onClick={() => run(() => copy(summaryText(result, includeScores, personaLink)), '결과 요약을 복사했어요.')}><Copy size={17} /> 결과 요약 복사</button>
          <button className="button ghost" disabled={busy} onClick={() => run(() => downloadReport(result), 'PDF 리포트를 저장했어요.')}><FileDown size={17} /> 전체 리포트 PDF</button>
        </div>
        <section className="friend-box" aria-labelledby="friend-title">
          <h3 id="friend-title"><Users size={18} aria-hidden="true" /> 친구 비교 링크</h3>
          <p>친구가 이 링크로 들어와 검사하면 두 캐릭터를 나란히 비교할 수 있어요. 링크 # 뒤에 <b>7개 영역 평균</b>({encodeMeans(means).slice(2).replaceAll('-', ' ')}처럼 100배 값)만 담기고, 문항 답변은 담기지 않아요.</p>
          <div className="friend-actions">
            <button ref={linkButton} className="button primary" disabled={busy} onClick={() => run(() => copy(friendLink()), '비교 링크를 복사했어요. 친구에게 보내 보세요!')}><Link size={17} /> 비교 링크 복사</button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && <button className="button ghost" disabled={busy} onClick={() => run(() => navigator.share({ title: '나랑 기질 캐릭터 비교해 볼래?', text: `나는 ‘${persona.name}’ 나왔어. 너도 해 보고 비교해 보자!`, url: friendLink() }), '공유 메뉴를 열었어요.')}><Share2 size={17} /> 링크 공유</button>}
          </div>
        </section>
        <p className="fine">이미지·PDF는 이 기기 안에서 만들어져요. X나 공유 메뉴를 누르면 캐릭터 이름과 문구, 링크가 그 서비스로 전달돼요. 캐릭터 링크({personaLink.replace('https://', '')})에는 점수가 없어요. PDF는 이미지형이라 텍스트 검색이 되지 않아요.</p>
      </div>
    </div>
    <div role="status" className="export-status">{busy ? '만들고 있어요. 잠시만요…' : message}</div>
    {fallback && <textarea className="copy-fallback" readOnly value={fallback} aria-label="직접 복사할 내용" onFocus={e => e.target.select()} />}
  </dialog>;
}
