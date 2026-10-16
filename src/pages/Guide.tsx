import { ArrowRight, LockKeyhole, Coffee, BookOpen } from 'lucide-react';
import { DISCLAIMER } from '../config';
export function Guide({ onStart }: { onStart: () => void }) {
  return <section className="narrow-page guide"><span className="eyebrow">시작하기 전에 잠깐</span><h1>있는 그대로의<br />나로 답해 주세요.</h1><p className="lede">잘 보이기 위한 답도, 정해진 정답도 없어요.</p>
    <div className="guide-lines">
      <article><BookOpen /><div><h2>평소의 나를 기준으로</h2><p>각 문장이 평소의 나와 얼마나 맞는지 1~5 중 하나를 고르세요. 이전 답변은 언제든 수정할 수 있습니다. 모든 289문항에 답한 뒤 결과를 볼 수 있어요.</p></div></article>
      <article><Coffee /><div><h2>긴 검사, 쉬어가도 괜찮아요</h2><p>처음 10개 이상의 응답 시간을 바탕으로 남은 시간을 추정합니다. 사람을 대상으로 한 평균 소요시간 연구는 아직 없어요. 시간 제한은 없습니다.</p></div></article>
      <article><LockKeyhole /><div><h2>답변은 이 브라우저에 자동 저장돼요</h2><p>서버로 답변을 보내지 않습니다. 공용 기기에서는 끝나고 꼭 삭제해 주세요. 다른 기기와 동기화되지 않으며, 브라우저 데이터 삭제·시크릿 모드 종료 시 복구할 수 없습니다.</p></div></article>
    </div>
    <aside className="soft-note"><strong>문항과 해석에 관해</strong><p>원문에는 정치·종교·전통·문화적 취향에 관한 문항도 있습니다. 원본을 보존했지만 이 항목으로 신념의 우열이나 성별 정체성을 판단하지 않습니다. 불편하면 언제든 검사를 중단하고 답변을 삭제할 수 있어요.</p></aside>
    <p className="disclosure-copy">{DISCLAIMER} 한국어 번역은 독립 번역이며 타당도가 검증된 한국판 TCI가 아닙니다.</p>
    <button className="button primary large full" onClick={onStart}>안내를 확인했어요. 시작하기 <ArrowRight size={20}/></button><a className="back-link" href="#home">처음 화면으로</a>
  </section>;
}
