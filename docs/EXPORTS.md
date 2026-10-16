# 로컬 결과 내보내기

`src/lib/export.ts`는 문항 답변을 받지 않고 채점 결과(`ScoreResult`)만 받습니다. 모든 파일은 현재 브라우저에서 만들며, 파일 생성이나 다운로드를 위해 점수·답변을 서버에 보내지 않습니다.

## 함수

| 함수 | 결과 |
| --- | --- |
| `renderCard(result, { format, includeScores })` | `feed` 1080×1350(4:5) 또는 `story` 1080×1920(9:16) canvas |
| `canvasBlob(canvas)`, `downloadBlob(blob, name)` | PNG Blob, 임시 blob 링크로 다운로드(30초 후 해제) |
| `summaryText(result, includeScores, link)` | 복사용 텍스트. 점수는 `includeScores`일 때만 |
| `shareText(result)` | X·공유 메뉴용 캐릭터 문구. 점수 없음 |
| `downloadReport(result)` | A4 여러 쪽 이미지형 PDF(jsPDF는 이때만 불러옴) |

## 카드 내용

- 공통: 캐릭터 그림(점수에서 그린 SVG), 캐릭터 이름·한 줄 소개, 네 기질 방향, 성격 무기, `lucianlabs.dev/tci`, ‘비공식 IPIP 기반 · 정식 TCI-RS 아님 · 규준·백분위 아님’.
- `includeScores: true`(기본): 7개 영역 참고값과 1–5 막대(가운데 선 = 3).
- `includeScores: false`: 숫자를 하나도 그리지 않고 해시태그·성격 무기 설명으로 채웁니다.
- 30개 하위척도, 문항 원문, 개별 응답은 카드에 넣지 않습니다.

## PDF 리포트

캐릭터 요약·익숙한 모습·강점·지칠 때, 4가지 기질 조합과 설명, 3가지 성격 영역, 반전 포인트·가장 뚜렷한 세부 성향, 30개 하위척도(별칭·원명·평균·문장)를 담습니다. 줄마다 남은 공간을 확인해 다음 쪽으로 넘기며, 쪽마다 비공식 고지와 쪽 번호를 넣습니다. 한국어 모양을 보존하려고 canvas를 이미지로 넣기 때문에 **텍스트 검색·선택·스크린리더 읽기가 지원되지 않습니다.** 웹 결과 화면과 ‘결과 요약 복사’가 텍스트 대안입니다.

## 글꼴

UI와 canvas는 `public/fonts/noto-kr-{400,600,800}.woff2`(같은 origin, OFL)를 씁니다. 내보내기는 세 굵기를 `document.fonts.load`로 모두 확인한 뒤에만 그리며, 15초 안에 준비되지 않으면 오류로 멈춥니다. 문구를 바꾸면 `scripts/subset-fonts.py`로 글꼴을 다시 만들고, `npm run build`의 `validate:fonts`가 누락 글자를 잡습니다.

## 확인

```sh
npm test -- tests/export.test.ts
```

카드 크기, 세 굵기 글꼴 선확인, 일곱 영역 이름·값, 점수 끄기 시 숫자 부재, 문구에 점수·문항이 없음, 글꼴 실패 시 중단, 한글 줄바꿈을 검사합니다. E2E는 실제 브라우저에서 피드·스토리 PNG 크기와 PDF 형식을 확인합니다.
