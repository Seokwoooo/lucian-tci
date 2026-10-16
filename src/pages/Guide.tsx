import { ArrowRight, MousePointerClick, Flag, LockKeyhole } from 'lucide-react';
import { DISCLAIMER, TIME_ESTIMATE } from '../config';

export function Guide({ onStart, friend }: { onStart: () => void; friend: boolean }) {
  return <section className="narrow-page guide">
    <p className="kicker">시작하기 전에 30초만</p>
    <h1>있는 그대로의<br />나로 답해 주세요</h1>
    <p className="lede">잘 보이기 위한 답도, 정해진 정답도 없어요. 평소의 나를 떠올려 주세요.</p>
    {friend && <p className="friend-note">친구 결과를 보관해 뒀어요. 검사를 마치면 바로 비교해 드릴게요.</p>}
    <ol className="guide-lines">
      <li><MousePointerClick aria-hidden="true" /><div><h2>고르면 바로 다음 문항</h2><p>289문항, {TIME_ESTIMATE}(한 문항 5~7초 기준 계산). 시간 제한은 없어요. 이전 답은 언제든 고칠 수 있어요.</p></div></li>
      <li><Flag aria-hidden="true" /><div><h2>7개 파트, 파트마다 중간 단서</h2><p>약 41문항마다 지금까지의 응답에서 보이는 단서를 살짝 보여 드려요.</p></div></li>
      <li><LockKeyhole aria-hidden="true" /><div><h2>답변은 이 브라우저에만</h2><p>서버로 보내지 않고 자동 저장돼요. 공용 기기라면 끝나고 꼭 삭제해 주세요.</p></div></li>
    </ol>
    <p className="soft-note">원문에는 정치·종교·전통·취향에 관한 문항도 있어요. 원본 그대로 두었지만 이 항목으로 신념의 우열이나 성별 정체성을 판단하지 않아요.</p>
    <p className="disclosure-copy">{DISCLAIMER} 한국어 번역은 독립 번역이며 타당도가 검증된 한국판 TCI가 아닙니다.</p>
    <button className="button primary xl full" onClick={onStart}>안내를 확인했어요. 시작하기 <ArrowRight size={20} /></button>
    <a className="back-link" href="#home">처음 화면으로</a>
  </section>;
}
