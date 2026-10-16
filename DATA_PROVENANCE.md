# 데이터 출처와 재현

기준일은 사용자가 제공한 2026-10-16(Asia/Seoul), 데이터 버전은 `2026-10-16.1`입니다. 호스트 시계로 자료의 수집일을 추정하지 않습니다.

## 공식 원자료

| 자료 | 사용 범위 | 보관 파일 |
| --- | --- | --- |
| [공식 30개 예비 척도 문항 키](https://ipip.ori.org/newTCIKey.htm) | 영문 문항, 위치·순서, 정·역방향 | `provenance/newTCIKey.htm` |
| [IPIP·TCI 비교표](https://ipip.ori.org/newTCITable.htm) | 별도로 추출한 하위척도별 정·역방향 문항 수 대조 | `provenance/newTCITable.htm` |
| [IPIP 채점 안내](https://ipip.ori.org/newScoringInstructions.htm) | 정방향 1–5, 역방향 5–1, 척도 합계 | `provenance/newScoringInstructions.htm` |
| [IPIP 사용 허가 안내](https://ipip.ori.org/newPermission.htm) | IPIP 자료의 Public Domain 지위 확인 | `provenance/newPermission.htm` |
| [IPIP 규준·자료 안내](https://ipip.ori.org/newNorms.htm) | 공개 사이트의 규준 부재와 규준 적용의 한계 확인 | `provenance/newNorms.htm` |

원본 바이트를 보존했습니다. 각 URL, SHA-256, 바이트 수, 문자 인코딩, 수집 주체와 날짜는 [provenance/sources.json](provenance/sources.json)에 기록되어 있습니다. `validate-data.mjs`는 실제 원본 파일의 해시·크기와 이 기록을 다시 대조합니다. 상세 해시 표는 [데이터 감사](docs/DATA_AUDIT.md)에 있습니다.

현재 공식 원본은 289개 응답 위치, 30개 하위척도, 7개 영역, 정방향 162개·역방향 127개입니다. 영역별 문항 수는 NS 34, HA 39, RD 40, P 39, SD 48, C 52, ST 37입니다. C2의 ‘역방향 문항 없음’ 안내를 응답 문항으로 세지 않습니다. 원문의 S1–S5 코드를 유지하고 영역만 SD로 연결합니다. ST3는 원자료에 없습니다.

영문은 HTML 공백만 정규화하고 구두점·대소문자·원문 표현·방향 키를 보존합니다. ID는 `NS1-01`처럼 하위척도 내 위치로 부여합니다. 현재 289개의 영문은 모두 서로 다르지만 같은 문장이 다시 등장하더라도 위치별로 보존하는 구조이며, 중복 문장 보존 자체 테스트가 있습니다.

## 독립 한국어 번역

직접 작성한 번역의 편집 원본은 [src/data/translations.ko.json](src/data/translations.ko.json)입니다. 공식 TCI 한국어 문항, 매뉴얼이나 OpenScales의 번역을 복사하지 않았습니다. 번역은 ID와 영문이 모두 일치해야 생성 데이터에 합쳐집니다.

[문항별 전체 대조표](docs/TRANSLATION_REVIEW.md)는 289개 영문·한국어, 방향과 관용구·부정·문화 관련 메모를 공개합니다. 자체 검토와 별도 에이전트의 독립 기계 검토를 구분합니다. 이는 한국어 화자 이해도 조사, 독립 번역자의 역번역, 전문가 감수 또는 한국 표본의 심리측정 타당화가 아닙니다.

## 생성과 검증

```sh
npm ci
npm run extract:data
npm run validate:data
node scripts/validate-data.mjs --self-test
npm test
```

추출은 동결한 로컬 HTML을 사용하므로 원격 사이트의 후속 변경으로 조용히 데이터가 바뀌지 않습니다.

1. `scripts/extract-ipip.mjs`가 공식 키와 비교표를 독립 파싱하고 번역 원본을 결합합니다.
2. `src/data/items.json`과 `src/data/expected-counts.json`을 생성합니다. 이 두 파일은 직접 편집하지 않습니다.
3. 검증기는 전체 수, 순서, ID, 영문 대응, 한국어 공백·누락·임시 문구, 정·역방향, 영역, 출처와 버전을 확인합니다.
4. `--self-test`는 고의 손상 26종을 거부하고 동일 문장이 별도 위치로 유지되는지도 확인합니다.

문항·번역·채점에 영향을 주는 변경에는 새 데이터 버전과 저장 호환성 판단이 필요합니다. `src/lib/storage.ts`의 버전 및 문서도 함께 검토합니다. 이전 응답을 의미가 달라진 문항에 자동으로 재사용하지 않습니다.

## OpenScales와의 차이

[OpenScales](https://github.com/stmueller/OpenScales)는 다음 고정 커밋의 참고 정의를 읽고 비교한 자료입니다.

- 커밋: `d555b04a1961181a63f91b534bc1096bcbd1dcdc`
- [고정 IPIP-TCI.osd](https://raw.githubusercontent.com/stmueller/OpenScales/d555b04a1961181a63f91b534bc1096bcbd1dcdc/scales/ipip/IPIP-TCI/IPIP-TCI.osd)
- 기록: [provenance/openscales-comparison.json](provenance/openscales-comparison.json), [상세 차이 감사](docs/DATA_AUDIT.md)

참고 정의의 258개 항목은 제목 30개와 실제 Likert 문항 228개입니다. 공식 289개와 비교하면 61개 응답 위치가 생략되었고, 남아 있는 S1-03의 문장 한 개는 끝이 잘려 있습니다. 따라서 완전 문자열 비교의 불일치 62개와 ‘61개 생략 + 1개 절단’을 구분합니다. 일치 문항의 방향 불일치는 0개였습니다. 이 서비스는 공식 289개 전체를 보존합니다.

OpenScales의 구현 코드, 채점식, 렌더러, 도구, 번역은 가져오지 않았습니다. 참고 저장소 루트의 CC BY-NC-SA 4.0, 해당 정의의 구현 CC BY 4.0, 척도 Public Domain 표시는 적용 범위가 서로 다릅니다. 참고 자료의 라이선스를 IPIP 원문이나 직접 작성한 코드 전체에 섞어 적용하지 않습니다. 상세 출처와 실제 사용 파일은 [ATTRIBUTION.md](ATTRIBUTION.md)에 명시합니다.
