import { ArrowRight, ArrowDown, Check, X as XIcon, Minus } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Accordion } from '../components/Accordion';
import { Mascot, MiniCard, StaticCard } from '../components/PersonaCard';
import { personas, personaBySlug } from '../data/personas';
import { domains } from '../data/scales';
import { exampleSignals } from '../lib/persona';
import { DISCLAIMER, NICKNAME_NOTE, REPO_URL, TIME_ESTIMATE } from '../config';

const sample = { NS: 4.1, HA: 2.3, RD: 3.9, P: 3.4, SD: 3.8, C: 4.0, ST: 3.1 } as const;
const heroCards = ['curious-cat', 'sunny-captain', 'careful-guardian'].map(slug => personaBySlug.get(slug)!);

export function Home({ answered, complete, onStart, onResume, onOpenPersona }: { answered: number; complete: boolean; onStart: () => void; onResume: () => void; onOpenPersona: (slug: string) => void }) {
  const primary = answered ? onResume : onStart;
  const primaryLabel = answered ? (complete ? '내 결과 다시 보기' : `이어서 검사하기 (${answered}/289)`) : '검사 시작하기';
  return <>
    <section className="hero page-width">
      <div className="hero-copy">
        <p className="hero-eyebrow">나의 타고난 기질과 성격, 얼마나 알고 계신가요?</p>
        <h1 className="hero-title"><span className="hl">무료</span> TCI<br />기질검사</h1>
        <p className="hero-price"><span className="price-was">보통은 <b>유료</b> 검사</span><ArrowRight size={18} aria-hidden="true" /><span className="price-now">여기선 <b>₩0</b></span></p>
        <p className="hero-sub">TCI의 7가지 기질·성격 차원을 IPIP 공개 문항 <b>289개</b>로 깊게 살펴보고, <b>16가지 캐릭터</b> 중 나를 찾아보세요.</p>
        <div className="hero-actions">
          <button className="button primary xl" onClick={primary}>{primaryLabel}<ArrowRight size={20} /></button>
          <a className="button ghost xl" href="#characters">16가지 캐릭터 보기 <ArrowDown size={18} /></a>
        </div>
        <p className="free-promise"><Check size={16} aria-hidden="true" />100% 무료. 회원가입 없이 검사하고 결과까지 확인하세요.</p>
        <ul className="hero-facts" aria-label="검사 정보">
          <li><b>289</b>문항</li><li><b>30</b>개 세부 척도</li><li><b>16</b>가지 캐릭터</li><li><b>{TIME_ESTIMATE.replace('약 ', '')}</b>소요</li>
        </ul>
        <p className="hero-disclosure">IPIP 공개 문항 기반 비공식 검사예요. 정식 TCI-RS·임상 진단과 다릅니다. <a href="#about">자세히</a></p>
      </div>
      <div className="hero-stage" aria-hidden="true">
        {heroCards.map((persona, i) => <div className={`hero-card hero-card-${i}`} key={persona.slug}><StaticCard persona={persona} signals={exampleSignals(persona, 0.7)} /></div>)}
        <span className="hero-sticker">결과 예시</span>
      </div>
    </section>

    <section className="marquee" aria-hidden="true"><div className="marquee-track">{[...personas, ...personas].map((persona, i) => <span key={i} style={{ '--pc': persona.color } as CSSProperties}>{persona.emoji} {persona.name}</span>)}</div></section>

    <section className="value page-width" aria-labelledby="value-title">
      <div className="section-head"><span className="kicker">왜 무료인데 이렇게 길까요?</span><h2 id="value-title">돈 내고 받던 검사의 깊이를,<br />가입도 결제도 없이.</h2><p>정식 TCI-RS는 아니에요. 대신 TCI와 비슷한 구성을 재도록 만든 IPIP 공개 문항 289개를 모두 담았어요.</p></div>
      <div className="compare-table" role="table" aria-label="검사 비교">
        <div role="row" className="ct-row ct-head"><span role="columnheader"><span className="sr-only">항목</span></span><span role="columnheader">흔한 3분 테스트</span><span role="columnheader">정식 TCI 검사</span><span role="columnheader" className="ct-us">무료 TCI 기질검사</span></div>
        {[
          ['비용', ['무료', 'ok'], ['유료 · 기관별 상이', 'no'], ['₩0', 'ok']],
          ['문항', ['보통 10~20개', 'mid'], ['정식 문항', 'ok'], ['IPIP 공개 문항 289개', 'ok']],
          ['세부 척도', ['없음', 'no'], ['하위척도 제공', 'ok'], ['30개 하위척도', 'ok']],
          ['결과', ['유형 하나', 'mid'], ['전문가 해석', 'ok'], ['캐릭터 + 7영역 + 30척도 해설', 'ok']],
          ['가입·방문', ['대부분 없음', 'ok'], ['기관 방문·결제', 'no'], ['없음, 바로 시작', 'ok']],
          ['한국인 규준 비교', ['없음', 'no'], ['백분위 제공', 'ok'], ['없음 · 내 응답 평균만', 'no']],
        ].map(([label, ...cells]) => <div role="row" className="ct-row" key={label as string}><span role="rowheader">{label as string}</span>{(cells as [string, string][]).map(([text, mark], i) => <span role="cell" key={i} className={i === 2 ? 'ct-us' : ''}><i className={`ct-mark ${mark}`} aria-hidden="true">{mark === 'ok' ? <Check size={13} /> : mark === 'no' ? <XIcon size={13} /> : <Minus size={13} />}</i>{text}</span>)}</div>)}
      </div>
      <p className="fine">정식 TCI 검사의 구성은 기관과 버전마다 다를 수 있어요. 이 서비스는 공식 개발기관이나 국내 검사 기관과 제휴·인증 관계가 없습니다.</p>
    </section>

    <section className="deliver page-width" aria-labelledby="deliver-title">
      <div className="section-head"><span className="kicker">289문항 끝에 받는 것</span><h2 id="deliver-title">끝까지 하면, 이런 게 나와요</h2></div>
      <div className="bento">
        <article className="bento-tile tile-card"><div className="tile-copy"><span className="tile-no">01</span><h3>나만의 기질 캐릭터 카드</h3><p>16가지 중 하나. 내 점수에 따라 표정과 소품이 달라져요. 손으로 돌려 뒷면 스탯도 볼 수 있어요.</p></div><div className="tile-art"><StaticCard persona={personaBySlug.get('party-maker')!} signals={exampleSignals(personaBySlug.get('party-maker')!, 0.8)} /></div></article>
        <article className="bento-tile tile-bars"><span className="tile-no">02</span><h3>7가지 영역 그래프</h3><p>새로움, 걱정, 관계, 끈기부터 자율성, 연대감, 자기초월까지.</p>
          <div className="mini-bars" aria-hidden="true">{domains.map(d => <div key={d.code}><span>{d.name}</span><i><b style={{ width: `${(sample[d.code] - 1) / 4 * 100}%`, background: d.color }} /></i></div>)}</div></article>
        <article className="bento-tile tile-chips"><span className="tile-no">03</span><h3>30가지 세부 성향</h3><p>영역 하나로는 안 보이는 결까지 나눠서 보여 줘요.</p>
          <div className="chip-cloud" aria-hidden="true">{['새로움 선호', '씀씀이', '낯가림', '감성', '바로 시작', '성취욕', '충동 조절', '용서', '신뢰', '상상·몰입', '속마음 공유', '해낼 자신감'].map(c => <span key={c}>{c}</span>)}</div></article>
        <article className="bento-tile tile-twist"><span className="tile-no">04</span><h3>나도 몰랐던 반전 포인트</h3><p>영역 평균에 가려진, 반대쪽 세부 성향을 찾아 줘요.</p><blockquote>“새로움엔 끌리는데, <mark>돈은 감당할 만큼만</mark> 쓰는 알뜰파예요.”</blockquote></article>
        <article className="bento-tile tile-friends"><span className="tile-no">05</span><h3>친구와 비교하기</h3><p>링크 하나로 친구도 검사하면, 닮은 점과 다른 점이 한눈에.</p>
          <div className="duo" aria-hidden="true"><Mascot signals={exampleSignals(personaBySlug.get('straight-pioneer')!, 0.7)} color={personaBySlug.get('straight-pioneer')!.color} className="duo-a" /><span className="duo-vs">VS</span><Mascot signals={exampleSignals(personaBySlug.get('cozy-haven')!, 0.7)} color={personaBySlug.get('cozy-haven')!.color} className="duo-b" /></div></article>
        <article className="bento-tile tile-story"><span className="tile-no">06</span><h3>스토리 카드 & PDF 리포트</h3><p>인스타 스토리 9:16, 피드 4:5 이미지와 전체 리포트 PDF까지 저장해요.</p></article>
      </div>
      <div className="deliver-cta"><button className="button primary xl" onClick={primary}>{primaryLabel}<ArrowRight size={20} /></button></div>
    </section>

    <section className="characters page-width" id="characters" aria-labelledby="characters-title" tabIndex={-1}>
      <div className="section-head"><span className="kicker">16 CHARACTERS</span><h2 id="characters-title">16가지 캐릭터 중,<br />나는 누구일까?</h2><p>캐릭터를 눌러 성격을 미리 볼 수 있어요. 진짜 내 캐릭터는 289문항을 마쳐야 알 수 있어요.</p></div>
      <div className="character-grid">{personas.map(persona => <MiniCard key={persona.slug} persona={persona} signals={exampleSignals(persona)} onOpen={() => onOpenPersona(persona.slug)} />)}</div>
      <p className="fine">{NICKNAME_NOTE}</p>
    </section>

    <section className="steps page-width" aria-labelledby="steps-title">
      <div className="section-head"><span className="kicker">어떻게 진행되나요?</span><h2 id="steps-title">생각보다 금방이에요</h2></div>
      <ol className="step-list">
        <li><b>01</b><h3>누르면 바로 다음 문항</h3><p>평소의 나와 맞는 정도를 고르면 자동으로 넘어가요. 키보드 1~5도 돼요.</p></li>
        <li><b>02</b><h3>7개 파트, 중간 단서 공개</h3><p>파트를 마칠 때마다 지금까지의 응답에서 보이는 단서를 살짝 보여 드려요.</p></li>
        <li><b>03</b><h3>언제든 쉬었다 이어서</h3><p>답변은 이 브라우저에 자동 저장돼요. 창을 닫아도 같은 기기에서 이어서 할 수 있어요.</p></li>
      </ol>
    </section>

    <section className="faq page-width" aria-labelledby="faq-title">
      <div className="section-head"><span className="kicker">시작하기 전에</span><h2 id="faq-title">자주 묻는 질문</h2></div>
      <Accordion items={[
        { title: '정식 TCI 검사와 같은 검사인가요?', content: <p>{DISCLAIMER} 공식 개발기관이나 국내 검사 제공기관과 제휴·인증 관계가 없습니다. 한국어 번역의 심리측정학적 타당도도 검증되지 않았습니다.</p> },
        { title: '정말 결과까지 전부 무료인가요?', content: <p>네. 289문항 전체 검사, 캐릭터 카드, 30개 세부 결과, 이미지·PDF 저장, 친구 비교까지 모두 무료입니다. 회원가입, 결제, 광고, 유료 AI 호출이 없습니다.</p> },
        { title: '16가지 캐릭터는 어떻게 정해지나요?', content: <p>{NICKNAME_NOTE} 자극추구·위험회피·사회적 민감성·인내력 평균이 각각 3보다 높으면 높은 쪽, 3 이하면 낮은 쪽으로 봅니다. <a href="#scoring">계산 방법 보기</a></p> },
        { title: '얼마나 걸리나요? 나중에 이어서 할 수 있나요?', content: <p>한 문항에 5~7초씩이면 {TIME_ESTIMATE}가 걸린다고 계산했어요. 사람을 대상으로 잰 시간은 아니에요. 같은 기기·브라우저에서 이어서 할 수 있지만, 시크릿 모드를 닫거나 브라우저 데이터를 지우면 답변이 사라질 수 있어요.</p> },
        { title: '내 답변이 다른 곳으로 전송되나요?', content: <p>검사 답변을 서버에 저장하거나 전송하지 않습니다. 채점도 브라우저에서 합니다. 친구 비교 링크는 직접 만들기를 눌렀을 때만 7개 영역 평균을 링크 주소의 # 뒤에 담습니다. <a href="#privacy">개인정보 처리 안내</a></p> },
        { title: '점수가 높으면 더 좋은 건가요?', content: <p>아닙니다. 1~5의 점수는 역채점 후 문항 응답 평균이에요. 한국인 평균, 백분위, 임상 기준이 아닙니다. 높고 낮음은 좋고 나쁨이 아니라 방향이에요.</p> },
        { title: '원본 문항과 코드를 볼 수 있나요?', content: <p>공식 IPIP 공개 문항 289개를 독립적으로 번역했어요. <a href="https://ipip.ori.org/newTCIKey.htm" target="_blank" rel="noreferrer">공식 IPIP 문항</a> · <a href={REPO_URL} target="_blank" rel="noreferrer">오픈소스 GitHub</a></p> },
      ]} />
    </section>

    <section className="closing page-width"><div className="closing-mascots" aria-hidden="true">{['free-wanderer', 'steady-pillar', 'fluttering-dreamer'].map(slug => { const p = personaBySlug.get(slug)!; return <Mascot key={slug} signals={exampleSignals(p, 0.7)} color={p.color} className="closing-mascot" />; })}</div><div><h2>289개의 질문, 16명의 캐릭터.<br />당신은 누구일까요?</h2><p>정답은 없어요. 지금의 나로 답해 주세요.</p></div><button className="button primary xl on-dark" onClick={primary}>{primaryLabel}<ArrowRight size={20} /></button></section>
  </>;
}
