import { DISCLAIMER, REPO_URL } from '../config';
export function Info({type}:{type:'about'|'privacy'|'scoring'}) {
  return <article className="narrow-page prose"><span className="eyebrow">투명하게 알려드려요</span><h1>{type==='privacy'?'개인정보 처리 안내':type==='scoring'?'점수는 이렇게 계산해요':'검사 출처와 한계'}</h1>
    {type==='privacy'?<>
      <p className="lede">검사 답변을 서버에 저장하거나 전송하지 않습니다.</p>
      <h2>브라우저 안에서 처리하는 정보</h2><p>289개 문항의 응답, 현재 위치, 완료 여부, 데이터 버전, 저장 시각과 응답 소요시간을 이 브라우저의 localStorage에 저장합니다. 채점과 설명, 이미지·PDF 생성도 브라우저에서 처리합니다. 다른 기기로 동기화되지 않습니다.</p>
      <h2>수집 입력과 추적</h2><p>이름, 이메일, 생년월일, 전화번호 입력이 없으며 회원가입·결제·행동 추적 분석 SDK·광고 SDK·외부 AI API가 없습니다. 글꼴과 검사 자산은 같은 사이트에서 불러옵니다.</p>
      <h2>보관과 삭제</h2><p>저장된 답변은 사용자가 삭제하거나 브라우저 데이터를 지울 때까지 남습니다. 화면의 ‘저장된 답변 삭제’ 버튼으로 답변·결과·응답 시간을 함께 삭제할 수 있습니다. 이 기능은 이 서비스의 저장 항목만 지웁니다. 시크릿 모드, 저장소 차단, 브라우저 정리 기능으로 데이터가 사라질 수 있습니다. 공용 기기에서는 사용 후 삭제해 주세요.</p>
      <h2>공유는 사용자가 선택할 때만</h2><p>PNG·PDF 저장은 기기 안에서 이뤄집니다. 결과 요약 복사는 운영체제 클립보드로 선택한 정보만 복사합니다. X·기기 공유는 선택한 영역과 요약을 미리 확인하고 해당 버튼을 눌렀을 때 실행됩니다. 일반 링크에는 답변·점수를 넣지 않습니다. 다운로드 파일과 이미 공유한 내용은 브라우저 답변을 삭제해도 자동 삭제되지 않습니다.</p>
      <h2>호스팅과 외부 링크</h2><p>웹사이트 제공 과정에서 호스팅 사업자가 IP 주소, 요청 시각, 사용자 에이전트 등 일반 접속 로그를 처리할 수 있습니다. 이 서비스는 그 정보가 전혀 수집되지 않는다고 주장하지 않습니다. GitHub, IPIP, X 등 외부 링크를 열면 해당 서비스의 정책이 적용됩니다.</p>
      <h2>정책 정보</h2><p>작성일: 2026년 10월 16일 · 운영: Lucian Labs. 관련 문의는 <a href="https://x.com/lucian__03" target="_blank" rel="noreferrer">제작자 X 계정</a> 또는 <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">공개 저장소 이슈</a>에서 가능합니다. 문의에 검사 답변이나 민감한 결과를 공개하지 않아도 됩니다.</p>
    </>:type==='scoring'?<>
      <p className="lede">비교나 진단을 위한 규준점수 대신,<br />내 응답을 정리한 값을 보여드립니다.</p>
      <h2>1. 각 문항: 1~5점</h2><p>정방향 문항은 선택한 응답을 그대로 사용합니다. 역방향 문항은 <code>6 − 응답값</code>으로 계산합니다. 예를 들어 역방향 문항의 응답 1은 5점, 응답 5는 1점입니다. 방향은 공식 IPIP 채점 키를 따릅니다.</p>
      <h2>2. 하위척도: 합계와 평균</h2><p>각 하위척도의 원점수는 채점된 문항 점수의 합입니다. 문항 평균은 <code>원점수 ÷ 해당 문항 수</code>이며 범위는 1~5입니다. 30개 하위척도는 문항 수가 서로 다르므로 합계의 크기만으로 비교하지 않습니다.</p>
      <h2>3. 일곱 영역: 하위척도를 동일 가중</h2><p>영역 참고값은 <code>해당 하위척도 평균의 합 ÷ 하위척도 수</code>입니다. 예를 들어 자극추구는 NS1, NS2, NS3, NS4 평균을 더한 뒤 4로 나눕니다. 4문항인 NS3와 10문항인 NS1에 같은 비중을 줍니다. 이는 이 서비스가 정의한 기술적 요약으로, 공식 TCI 점수가 아닙니다.</p>
      <h2>4. 설명 선택 기준</h2><p>하위척도 평균이 2.5 이하면 낮은 방향, 3.5 이상이면 높은 방향, 그 사이는 중간 부근의 응답으로 기술합니다. 이 경계는 응답 척도 중간값 3을 기준으로 문장을 고르는 서비스 규칙일 뿐, 검증된 기준이나 사람들의 평균이 아닙니다. 소수점 반올림은 화면 표시에서만 합니다.</p>
      <h2>사용하지 않는 것</h2><p>한국인 백분위, T점수, 임의 평균·표준편차, 정식 TCI 규준, 질환 진단, 직업 적성·관계 성공 예측을 제공하지 않습니다. 응답 누락이나 잘못된 값은 계산에서 조용히 제외하지 않고 결과 생성을 막습니다.</p>
      <p><a href="https://ipip.ori.org/newScoringInstructions.htm" target="_blank" rel="noreferrer">공식 IPIP 채점 설명 ↗</a> · <a href={`${REPO_URL}/blob/main/SCORING.md`} target="_blank" rel="noreferrer">구현 공식과 테스트 ↗</a></p>
    </>:<>
      <p className="lede">공개된 원본으로 만들고,<br />검증한 범위까지 이야기합니다.</p><p>{DISCLAIMER}</p>
      <h2>문항의 원본</h2><p><a href="https://ipip.ori.org/newTCIKey.htm" target="_blank" rel="noreferrer">공식 IPIP의 30개 예비 척도</a>에 있는 289문항을 독립적으로 한국어로 번역했습니다. <a href="https://ipip.ori.org/newTCITable.htm" target="_blank" rel="noreferrer">공식 비교표</a>의 하위척도별 정·역방향 문항 수와 대조했습니다. 공식 IPIP에는 ST3가 없어 본 서비스에도 없습니다.</p>
      <h2>정식 TCI와의 관계</h2><p>IPIP 척도는 TCI와 유사한 구성을 탐색하기 위한 별도 공개 척도입니다. 정식 TCI-RS 문항·매뉴얼·한국판 규준을 사용하지 않습니다. 영역명은 이해를 돕는 표시이며, 한국판 TCI의 정의와 일치한다고 전제하지 않습니다. 마음사랑, 한국심리학회, Anthropedia 또는 공식 TCI 개발기관과 제휴·인증 관계가 없습니다.</p>
      <h2>검증된 것과 아직 검증되지 않은 것</h2><p>데이터 구조, 원문 대응, 채점 방향과 계산은 자동화 테스트로 검사합니다. 이것이 번역의 심리측정학적 타당성을 보장하지는 않습니다. 한국인 표본 연구, 번역 전문가의 검토·역번역, 신뢰도·타당도 검증, 사람을 대상으로 한 소요시간 측정은 아직 수행하지 않았습니다.</p>
      <h2>문화와 시대의 한계</h2><p>일부 문항에는 정치·종교·성 역할에 관한 시대적 배경이 담겨 있습니다. ST4의 원명은 Conservatism, ST5의 원명은 Femininity입니다. 점수로 성별 정체성, 특정 신념의 우열, 영성의 수준을 판단할 수 없습니다. 일부 문항의 묶음은 일상적인 영역명과 직관적으로 맞지 않을 수 있으므로 세부 설명을 함께 읽어 주세요.</p>
      <h2>공개 라이선스와 출처</h2><p>IPIP 문항은 <a href="https://ipip.ori.org/newPermission.htm" target="_blank" rel="noreferrer">퍼블릭 도메인</a>입니다. 직접 제작한 코드와 한국어 번역은 MIT 라이선스로 공개합니다. Lucian UX/UI Prompt의 #044 FAQ와 #083 진행 막대를 적용했고 MIT 표시를 보존했습니다. OpenScales는 구성 비교에만 참고했으며 해당 구현 코드를 복제하지 않았습니다.</p>
      <p><a href={REPO_URL} target="_blank" rel="noreferrer">전체 소스코드 ↗</a> · <a href={`${REPO_URL}/blob/main/DATA_PROVENANCE.md`} target="_blank" rel="noreferrer">데이터 출처 ↗</a> · <a href={`${REPO_URL}/blob/main/docs/TRANSLATION_REVIEW.md`} target="_blank" rel="noreferrer">289문항 번역 대조표 ↗</a></p>
    </>}
    <a href="#home" className="button secondary">처음 화면으로 돌아가기</a>
  </article>;
}
