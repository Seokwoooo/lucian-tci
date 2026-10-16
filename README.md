# Lucian TCI · 무료 TCI 기질검사

공식 IPIP가 공개한 289개 예비 문항을 독립적으로 한국어로 번역한, 브라우저 안에서 사용하는 자기이해 도구입니다. 한 문항씩 응답하고 7개 영역과 30개 하위척도를 살펴볼 수 있습니다.

**정식 TCI-RS 검사가 아닙니다.** 공식 한국어 TCI 문항·매뉴얼·규준을 사용하지 않으며, 임상 진단이나 전문가의 심리평가를 대체하지 않습니다. 한국어 번역의 심리측정 타당성, 한국인 규준, 사람 대상 사용성·소요시간 검증은 아직 수행하지 않았습니다. 이름과 상표 사용의 국내 검토도 남아 있습니다.

- 공개 서비스: [lucianlabs.dev/tci/](https://lucianlabs.dev/tci/)
- MIT 공개 저장소: [Seokwoooo/lucian-tci](https://github.com/Seokwoooo/lucian-tci)
- 로컬 실행: `http://127.0.0.1:4173/tci/`

## 제공하는 기능

- 289문항, 5점 응답, 이전·다음, 키보드 1–5 선택과 Enter 이동, 답변 목록 및 최종 검토.
- ID 기반 자동 저장, 새로고침·다시 방문 시 이어 하기, 저장소 손상·차단 안내, 확인 후 삭제.
- 정·역채점, 30개 하위척도 합계·평균, 하위척도 평균을 동일 가중한 7개 영역 참고값.
- 실제 응답 평균과 문항 내용에 근거한 결정적 설명. 규준·백분위·성격 유형·질환 진단·직업 추천을 생성하지 않습니다.
- 사용자가 고른 영역과 선택적 요약의 PNG·PDF 저장, 텍스트 복사, X 공유와 지원 기기의 운영체제 공유 메뉴.
- 검사 전에는 명확히 표시한 중립 응답 예시, 검사 후에는 선택을 즉시 반영한 4:5 결과 카드 미리보기. 개인 답변을 예시로 쓰지 않습니다.
- 일반 링크는 검사 사이트 주소만 담습니다. 답변·점수를 URL에 담지 않습니다.
- 자체 호스팅한 한국어 글꼴, 모바일 화면, 키보드 탐색, 움직임 줄이기 설정 반영.

검사 시작 전 임의의 완료 시간을 약속하지 않습니다. 실제 첫 응답 시간이 유효하게 10개 이상 쌓인 뒤, 1.5초–120초 범위의 기록 중 최근 최대 20개의 중앙값으로 남은 시간을 추정합니다. 사람이 참여한 소요시간 연구의 결과는 아닙니다.

카카오 JavaScript SDK는 활성화하지 않았습니다. 등록된 앱 키와 허용 도메인이 준비되지 않았으며, 카카오 전용 공유가 구현되었다고 주장하지 않습니다. 기기 공유 메뉴가 지원하고 해당 기기에 대상 앱이 있을 때 카카오톡을 선택할 수 있는 경우만 있습니다.

## 실행과 검증

Node.js와 npm이 필요합니다. 설치 버전의 상세 조건은 `package-lock.json`과 각 패키지의 `engines`를 따릅니다.

```sh
npm ci
npm run dev
```

개발 서버와 미리보기의 포트는 4173이며 `/tci/`에서 실행합니다.

```sh
npm run validate:data
node scripts/validate-data.mjs --self-test
npm test
npm run build
npm run preview
```

브라우저 검증에는 Playwright의 Chromium이 필요합니다.

```sh
npx playwright install chromium
npm run test:e2e
```

`npm run build`는 데이터·한글 글꼴 검증 → TypeScript 검사 → Vite 빌드 순서로 `dist/`를 만듭니다. 일반 빌드에 Python은 필요하지 않습니다. 글꼴을 다시 생성할 때만 `fonttools`, `brotli`가 설치된 Python으로 `scripts/subset-fonts.py`를 실행합니다. 이미 생성한 글꼴과 OFL 원문은 `public/fonts/`에 보관합니다.

## 화면 주소

화면 전환은 hash 경로를 사용하며, 아래 주소 자체에는 개인 응답이 없습니다.

| 주소 | 화면 |
| --- | --- |
| `/tci/` 또는 `/tci/#home` | 시작·이어 하기 |
| `/tci/#guide` | 시작 전 안내 |
| `/tci/#test` | 한 문항씩 응답 |
| `/tci/#review` | 답변 확인과 문항 이동 |
| `/tci/#result` | 완료한 응답의 결과; 미완료이면 시작 화면 |
| `/tci/#about` | 출처와 한계 |
| `/tci/#scoring` | 채점 설명 |
| `/tci/#privacy` | 개인정보 처리 안내 |

알 수 없는 hash는 시작 화면으로 처리합니다.

## 데이터·채점·보관

원자료는 [공식 IPIP 문항 키](https://ipip.ori.org/newTCIKey.htm)와 [비교표](https://ipip.ori.org/newTCITable.htm)입니다. OpenScales는 차이를 확인하기 위한 참고 자료이며 문항·구현의 기준 원본으로 사용하지 않았습니다. 원문의 S1–S5를 보존하고 영역만 SD로 연결하며, 없는 ST3는 추가하지 않습니다.

정방향은 응답값, 역방향은 `6 − 응답값`입니다. 각 하위척도 평균을 구한 뒤 영역 안에서 같은 비중으로 평균합니다. 높은 값과 낮은 값에 우열을 부여하지 않습니다. S1은 책임감이 아닌 Satisfaction, HA4는 피로가 아닌 Low Self-Efficacy, ST4는 Conservatism, ST5는 시대적 한계가 있는 Femininity라는 원문 척도임을 설명합니다.

이름·이메일·생년월일을 받지 않습니다. 답변과 채점·설명·파일 생성은 현재 브라우저에서 처리하며, 분석·광고·외부 AI SDK가 없습니다. localStorage는 같은 브라우저·같은 origin 안의 저장소이며 계정 동기화가 아닙니다. 일반 접속 로그와 사용자가 누른 외부 공유는 별도로 구분합니다.

PDF는 canvas 이미지를 넣은 문서로 한국어 모양을 보존하지만 **텍스트 검색·선택과 스크린리더 읽기를 제공하지 않습니다.** 웹 결과 화면과 ‘결과 요약 복사’가 텍스트 대안입니다. 다운로드 파일과 외부에 보낸 내용은 브라우저 답변을 삭제해도 남습니다.

## 문서와 라이선스

- [채점 규칙](SCORING.md), [데이터 출처](DATA_PROVENANCE.md), [전체 번역 대조·검토](docs/TRANSLATION_REVIEW.md), [데이터 감사](docs/DATA_AUDIT.md)
- [검증 범위와 남은 검증](VALIDATION.md), [개인정보 처리](PRIVACY.md), [내보내기 상세](docs/EXPORTS.md), [배포 절차와 상태](DEPLOYMENT.md)
- [MIT LICENSE](LICENSE): 직접 작성한 코드·한국어 번역·문서. [ATTRIBUTION.md](ATTRIBUTION.md): IPIP Public Domain, Lucian UX/UI Prompt, 글꼴과 외부 의존성의 별도 조건.

단위 테스트 67개, Chromium 데스크톱·모바일 E2E 12개와 데이터 자체 검증이 통과했습니다. 한글 PNG·7쪽 PDF도 직접 열어 확인했습니다. 검증 범위와 실제 배포 기록은 [검증 문서](VALIDATION.md)와 [배포 문서](DEPLOYMENT.md)에 별도로 기록하며, 자동 검사 통과를 임상적 준비 완료나 사람 검증으로 표현하지 않습니다.
