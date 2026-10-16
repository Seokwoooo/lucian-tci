import { ArrowRight, Check, LockKeyhole, BookOpen, ArrowUpRight, Pause } from 'lucide-react';
import { Flower } from '../components/Flower';
import { Accordion } from '../components/Accordion';
import { domains } from '../data/scales';
import { DISCLAIMER, REPO_URL } from '../config';

export function Home({ answered, complete, onStart, onResume, onPreview }: { answered: number; complete: boolean; onStart: () => void; onResume: () => void; onPreview: () => void }) {
  return <>
    <section className="hero page-width">
      <div className="hero-copy">
        <span className="eyebrow"><span className="tiny-leaf" /> 나를 꺼내보는 289개의 질문</span>
        <p className="hero-question">나의 타고난 기질과 성격,<br className="mobile-break" /> 얼마나 알고 계신가요?</p>
        <h1>무료 TCI<br />기질검사<span className="title-dot">.</span></h1>
        <p className="hero-description"><strong>아는 듯 몰랐던, 내 마음의 결.</strong><span>새로움에 끌리는 마음부터 관계를 맺는 방식까지.<br />답변이 모이면, 나를 이해하는 한 장이 됩니다.</span></p>
        <div className="hero-actions"><button className="button primary large" onClick={answered ? onResume : onStart}>{answered ? (complete ? '내 결과 다시 보기' : '이어서 검사하기') : '검사 시작하기'}<ArrowRight size={20} /></button>
          {answered > 0 ? <span className="small muted">이 브라우저에 {answered}개 답변이 있어요.</span> : <button className="hero-preview-link" onClick={onPreview}>결과 카드 미리보기 <ArrowUpRight size={14}/></button>}</div>
        <div className="free-promise"><Check size={16} /><span>100% 무료. 회원가입 없이 검사하고 결과까지 확인하세요.</span></div>
        <p className="hero-disclosure">IPIP 공개 문항 기반의 비공식 검사입니다.<br />정식 TCI-RS 검사·임상 진단과 다릅니다. <a href="#about">자세히 알아보기 ↗</a></p>
      </div>
      <div className="hero-art"><div className="note-back" aria-hidden="true"/><div className="hero-note"><div className="art-label"><span>나의 마음 기록</span><span>일곱 가지 시선</span></div><Flower /><div className="art-caption">나는 어떤 결을 가진 사람일까?</div><div className="hero-topics"><span>새로움 앞의 나</span><span>관계 속의 나</span><span>꾸준한 나</span></div><button className="note-preview" onClick={onPreview}>내 응답을 담을 한 장 <ArrowUpRight size={15}/></button></div></div>
    </section>
    <section className="trust-strip page-width" aria-label="검사 안내 요약">
      <div><BookOpen size={22} /><p><strong>전체 289문항</strong><span>30가지 세부 경향을 살펴봐요</span></p></div>
      <div><Pause size={22} /><p><strong>내 속도에 맞춰서</strong><span>10문항 뒤 예상 남은 시간 안내</span></p></div>
      <div><LockKeyhole size={22} /><p><strong>답변은 내 브라우저에</strong><span>자동 저장 · 언제든 삭제 가능</span></p></div>
    </section>
    <div className="page-width"><aside className="disclaimer"><span className="notice-mark">알려드려요</span><p>{DISCLAIMER}</p><a href="#about">검사 출처와 한계 <ArrowUpRight size={14} /></a></aside></div>
    <section className="explore-section page-width" id="explore">
      <div className="section-intro"><span className="eyebrow">숫자보다, 나를 이해하는 단서</span><h2>어떤 나를<br />만나게 될까요?</h2><p>좋고 나쁜 성격을 나누지 않아요.<br />내 응답에서 드러난 방향을 읽어봅니다.</p></div>
      <div className="domain-list">{domains.map((domain,i) => <div className="domain-preview" key={domain.code}><span className="domain-index" style={{backgroundColor: `color-mix(in srgb, ${domain.color} 30%, var(--paper))`}}>{String(i+1).padStart(2,'0')}</span><div><h3>{domain.name}</h3><p>{domain.everyday}</p></div><span className="domain-code">{domain.code}</span></div>)}</div>
    </section>
    <section className="how-section page-width"><div className="section-heading"><span className="eyebrow">복잡한 준비는 필요 없어요</span><h2>오롯이 나에게 집중하는 세 단계</h2></div><div className="how-grid">
      <article><span>01</span><h3>평소의 나를 떠올리기</h3><p>이상적인 모습보다, 평소에 어떻게 느끼고 행동하는지 생각해 주세요.</p></article>
      <article><span>02</span><h3>하나씩, 편안하게 답하기</h3><p>한 번에 한 문항. 중간에 쉬어도 같은 브라우저에서 이어갈 수 있어요.</p></article>
      <article><span>03</span><h3>내 마음의 결 읽어보기</h3><p>일곱 영역과 30개 세부 경향을 확인하고, 원하는 내용만 저장하거나 공유하세요.</p></article>
    </div></section>
    <section className="faq-section page-width"><div className="section-intro"><span className="eyebrow">시작하기 전에</span><h2>궁금할 수 있어요</h2><p>검사에 대해 투명하게 알려드릴게요.</p></div><Accordion items={[
      { title: '정식 TCI 검사와 같은 검사인가요?', content: <p>{DISCLAIMER} 공식 개발기관이나 국내 검사 제공기관과 제휴·인증 관계가 없습니다. 한국어 번역의 심리측정학적 타당도도 검증되지 않았습니다.</p> },
      { title: '결과까지 정말 무료인가요?', content: <p>네. 289문항 전체 검사, 모든 결과, PNG·PDF 저장까지 무료입니다. 회원가입, 결제, 광고, 유료 AI 호출이 없습니다.</p> },
      { title: '얼마나 걸리나요? 나중에 이어서 할 수 있나요?', content: <p>총 289문항이므로 여유 있는 시간에 시작해 주세요. 읽고 생각하는 속도에 따라 소요시간이 달라집니다. 첫 10개의 유효한 응답 시간부터 예상 남은 시간을 계산해 안내합니다. 같은 기기·브라우저에서 이어갈 수 있지만, 시크릿 모드 종료나 브라우저 데이터 삭제 시 답변이 사라질 수 있어요.</p> },
      { title: '내 답변이 다른 곳으로 전송되나요?', content: <p>검사 답변을 서버에 저장하거나 전송하지 않습니다. 채점도 브라우저에서 합니다. 외부 공유는 사용자가 내용을 고른 뒤 공유 버튼을 눌렀을 때만 실행됩니다. 호스팅 서비스의 일반 접속 로그는 별개입니다. <a href="#privacy">개인정보 처리 안내 →</a></p> },
      { title: '높은 점수가 더 좋은 건가요?', content: <p>아닙니다. 1~5의 점수는 역채점 후 문항 응답 평균을 나타냅니다. 한국인 평균, 백분위, 임상 기준이 아닙니다. 일곱 영역은 이해를 돕기 위한 묶음이며 정식 TCI 점수와 직접 비교할 수 없습니다.</p> },
      { title: '원본 문항과 코드를 볼 수 있나요?', content: <p>공식 IPIP 공개 문항 289개를 독립적으로 번역했습니다. 반복되는 문장과 문화적 배경이 드러나는 문항도 원본대로 유지했습니다. <a href="https://ipip.ori.org/newTCIKey.htm" target="_blank" rel="noreferrer">공식 IPIP 문항 ↗</a> · <a href={REPO_URL} target="_blank" rel="noreferrer">오픈소스 GitHub ↗</a></p> },
    ]} /></section>
    <section className="closing page-width"><Flower small /><div><h2>나를 이해하는 작은 시작.</h2><p>정답은 없어요. 지금의 나로 답해 주세요.</p></div><button className="button primary" onClick={answered ? onResume : onStart}>{answered ? '이어서 보기' : '검사 시작하기'}<ArrowRight size={18}/></button></section>
  </>;
}
