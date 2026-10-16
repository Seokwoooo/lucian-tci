# IPIP 데이터 출처와 대조 감사

기준일: 2026-10-16(사용자 클라이언트 날짜, Asia/Seoul). 데이터 버전: `2026-10-16.1`.

## 공식 자료를 기준으로 한 추출

실제 문항은 [공식 key](https://ipip.ori.org/newTCIKey.htm)에서 추출했고, 하위척도별 양·음 방향 개수는 [공식 비교표](https://ipip.ori.org/newTCITable.htm)를 별도로 파싱해 대조했다. 두 페이지의 30개 척도 순서도 일치한다. 데이터는 289개 응답 문항, 30개 하위척도, 7개 영역이며 양의 키 162개와 음의 키 127개다. 영역별 개수는 NS 34, HA 39, RD 40, P 39, SD 48, C 52, ST 37이다. S1–S5의 원래 코드와 순서를 유지하고 영역만 SD로 매핑했다. 공식 표는 ST3에 해당하는 IPIP 척도가 없다고 명시하므로 ST3를 만들지 않았다.

문항 표 안의 공백 행과 C2의 `(No negative items.)` 안내 문구는 문항이 아니다. C2는 정확히 8개의 양의 문항과 0개의 음의 문항을 포함한다. 이 안내를 세면 290개가 되므로 비교표와의 불일치로 검증이 실패한다. 각 항목의 ID는 하위척도 내 공식 위치(예: `NS1-01`)이며 문장을 식별자로 쓰거나 전역 중복 제거를 하지 않는다. 현재 원문에는 동일한 영어 문자열이 없어 289개 위치와 289개 고유 문자열이 일치하지만, 반복 문장을 보존하는 별도 자체 테스트도 통과한다.

HTML 원본 바이트는 `provenance/`에 동결했다. 영어의 공백만 하나의 공백으로 정규화한다. 구두점·대소문자·축약형·표현과 인쇄된 방향 키를 변경하지 않는다. 출처 URL은 모든 Item에 공식 key 주소로 기록했다. 번역은 `translations.ko.json`의 ID뿐 아니라 원래 영어 문자열까지 정확히 일치해야 합칠 수 있다.

| 하위척도 | 영역 | + | − | 합계 |
| --- | --- | ---: | ---: | ---: |
| NS1 | NS | 7 | 3 | 10 |
| NS2 | NS | 4 | 6 | 10 |
| NS3 | NS | 2 | 2 | 4 |
| NS4 | NS | 6 | 4 | 10 |
| HA1 | HA | 5 | 5 | 10 |
| HA2 | HA | 3 | 7 | 10 |
| HA3 | HA | 5 | 5 | 10 |
| HA4 | HA | 5 | 4 | 9 |
| RD1 | RD | 7 | 3 | 10 |
| RD2 | RD | 5 | 5 | 10 |
| RD3 | RD | 5 | 5 | 10 |
| RD4 | RD | 5 | 5 | 10 |
| P1 | P | 6 | 4 | 10 |
| P2 | P | 6 | 3 | 9 |
| P3 | P | 9 | 1 | 10 |
| P4 | P | 8 | 2 | 10 |
| S1 | SD | 1 | 9 | 10 |
| S2 | SD | 5 | 5 | 10 |
| S3 | SD | 5 | 5 | 10 |
| S4 | SD | 2 | 6 | 8 |
| S5 | SD | 5 | 5 | 10 |
| C1 | C | 6 | 6 | 12 |
| C2 | C | 8 | 0 | 8 |
| C3 | C | 6 | 6 | 12 |
| C4 | C | 3 | 7 | 10 |
| C5 | C | 6 | 4 | 10 |
| ST1 | ST | 8 | 3 | 11 |
| ST2 | ST | 7 | 2 | 9 |
| ST4 | ST | 6 | 3 | 9 |
| ST5 | ST | 6 | 2 | 8 |

## 재현과 검증

네트워크 없이 다음 명령을 실행할 수 있다. 첫 명령만 items.json과 expected-counts.json을 재생성한다. 다음 두 명령은 파일을 변경하지 않는다.

```sh
node scripts/extract-ipip.mjs
node scripts/extract-ipip.mjs --check
node scripts/validate-data.mjs --self-test
```

검증은 원문을 새로 파싱한 결과와 모든 문항의 위치·ID·영어·방향·영역·하위척도·출처·버전·번역·메모를 대조한다. 공식 비교표의 하위척도별 양·음 개수 및 영역 총합도 다시 계산한다. ID 중복, 누락·추가 문항, ST3 추가, 빈 번역·자리표시자, 번역쌍 드리프트, 출처 파일 SHA-256와 바이트 변경을 거부한다. 26개 데이터/해시 손상 사례가 모두 거부되었고 반복 문장을 별도 ID로 보존하는 검사가 통과했다. 2026-10-16 자체 실행 결과는 289/30/7, 양 162/음 127, 원문 289개이며 오프라인 재추출도 동일했다.

이 결과는 데이터 재현성과 내부 일관성을 확인한다. 별도 에이전트의 독립 기계 검토가 289문항 전체의 원문·방향 키·순서 일치를 확인했고, ST5-08·S5-05·S2-02의 번역 대상을 구체화하거나 의미와 강도를 보존하도록 수정했다. 사람의 사용성 검사, 독립 번역자의 감수나 한국어 검사도구의 심리측정 타당성 검증은 시행하지 않았다. [번역 자체 검토와 전체 대조표](TRANSLATION_REVIEW.md)에 모든 문장과 집중 검토 메모를 공개했다.

## 공식 채점·이용 조건·규준 안내

[IPIP 채점 안내](https://ipip.ori.org/newScoringInstructions.htm)는 양의 문항에 1–5, 음의 문항에 5–1을 부여하고 척도 문항값을 합산하도록 안내한다. 이 서비스의 하위척도 합계·평균과 영역의 동일 가중 하위척도 평균은 프로젝트의 기술적 집계 규칙이다. 이를 공식 TCI 규준 점수로 표시하지 않는다.

[공식 이용 허가 안내](https://ipip.ori.org/newPermission.htm)는 IPIP 자료를 퍼블릭 도메인으로 두고 상업·비상업 사용을 허용한다고 설명한다. 이것을 공식 TCI 저작물이나 특정 한국어 TCI판의 이용 허가로 확대 해석하지 않는다. [IPIP 규준 안내](https://ipip.ori.org/newNorms.htm)는 웹사이트에서 규준을 제공하지 않으며 무비판적인 일반 규준 사용을 경계한다. 이 서비스는 규준·백분위·임상 진단을 제공하지 않는다.

## OpenScales는 비교 참고 자료

[OpenScales 공식 저장소](https://github.com/stmueller/OpenScales)의 고정 커밋 `d555b04a1961181a63f91b534bc1096bcbd1dcdc`에서 [원시 IPIP-TCI 메타 OSD](https://raw.githubusercontent.com/stmueller/OpenScales/d555b04a1961181a63f91b534bc1096bcbd1dcdc/scales/ipip/IPIP-TCI/IPIP-TCI.osd)를 직접 읽어 비교했다. 프로젝트의 문항 추출·번역·채점 구현은 공식 IPIP HTML과 이 프로젝트의 독립 코드에서 작성했으며 OpenScales 코드·채점 표현식·번역·렌더러를 복사하지 않았다. 원시 참고 파일은 실행 데이터에 포함하지 않았다. 비교 사실과 파일 해시만 [참고 감사 JSON](../provenance/openscales-comparison.json)에 기록했다.

참고 파일의 definition.items 길이 258은 응답 문항 수가 아니다. 이는 30개 section 행과 228개 likert 행을 합한 수다. 공식 289개보다 응답 문항이 순수하게 61개 적다. 완전 일치하는 영어 문자열은 227개이고 그 문장들의 키 방향 불일치는 0건이다. 정확한 문자열 대조에서는 공식 문장 62개가 빠져 있고 참고 파일에만 있는 문자열 1개가 있다. 62개 중 61개는 생략이고, 나머지 S1-03은 문장 끝 `me.`가 잘린 표현으로 들어 있다. 따라서 258을 공식 전체 문항 수로 사용하거나 참고 파일로 공식 원문을 대체하면 안 된다.

| 하위척도 | 공식 응답 문항 | 참고 likert 문항 | 정확한 원문 미일치 |
| --- | ---: | ---: | ---: |
| NS1 | 10 | 7 | 3 |
| NS2 | 10 | 10 | 0 |
| NS3 | 4 | 4 | 0 |
| NS4 | 10 | 10 | 0 |
| HA1 | 10 | 1 | 9 |
| HA2 | 10 | 10 | 0 |
| HA3 | 10 | 10 | 0 |
| HA4 | 9 | 8 | 1 |
| RD1 | 10 | 4 | 6 |
| RD2 | 10 | 2 | 8 |
| RD3 | 10 | 8 | 2 |
| RD4 | 10 | 8 | 2 |
| P1 | 10 | 10 | 0 |
| P2 | 9 | 7 | 2 |
| P3 | 10 | 7 | 3 |
| P4 | 10 | 7 | 3 |
| S1 | 10 | 10 | 1 |
| S2 | 10 | 9 | 1 |
| S3 | 10 | 9 | 1 |
| S4 | 8 | 8 | 0 |
| S5 | 10 | 10 | 0 |
| C1 | 12 | 10 | 2 |
| C2 | 8 | 4 | 4 |
| C3 | 12 | 9 | 3 |
| C4 | 10 | 10 | 0 |
| C5 | 10 | 9 | 1 |
| ST1 | 11 | 4 | 7 |
| ST2 | 9 | 9 | 0 |
| ST4 | 9 | 6 | 3 |
| ST5 | 8 | 8 | 0 |

참고 자료에서 정확히 일치하지 않는 공식 위치는 다음과 같다. S1-03만 절단이며 나머지는 생략이다.

- NS1: NS1-01, NS1-05, NS1-08
- HA1: HA1-01, HA1-02, HA1-03, HA1-05, HA1-06, HA1-07, HA1-08, HA1-09, HA1-10
- HA4: HA4-09
- RD1: RD1-02, RD1-03, RD1-04, RD1-06, RD1-07, RD1-10
- RD2: RD2-01, RD2-02, RD2-04, RD2-05, RD2-06, RD2-08, RD2-09, RD2-10
- RD3: RD3-02, RD3-03
- RD4: RD4-06, RD4-09
- P2: P2-05, P2-06
- P3: P3-03, P3-04, P3-10
- P4: P4-01, P4-03, P4-10
- S1: S1-03
- S2: S2-06
- S3: S3-03
- C1: C1-03, C1-10
- C2: C2-01, C2-02, C2-04, C2-05
- C3: C3-01, C3-02, C3-09
- C5: C5-03
- ST1: ST1-02, ST1-03, ST1-04, ST1-06, ST1-07, ST1-09, ST1-10
- ST4: ST4-01, ST4-03, ST4-08

S1-03의 공식 전체 문장은 “Feel that people have a hard time understanding me.”이고 참고 문자열은 “Feel that people have a hard time understanding”이다. 공식 문장은 이 프로젝트에서 온전히 유지했다.

### 참고 저장소의 서로 다른 라이선스 범위

[참고 저장소 루트 LICENSE](https://raw.githubusercontent.com/stmueller/OpenScales/d555b04a1961181a63f91b534bc1096bcbd1dcdc/LICENSE)는 구조·도구·사양에 CC BY-NC-SA 4.0을 명시한다. 개별 척도는 별도 조건을 확인하라고 구분한다. 참고 OSD는 scale_info.license에 Public Domain, implementation.license에 CC BY 4.0을 따로 명시한다. 루트 라이선스를 퍼블릭 도메인으로 간주하지 않으며, 개별 IPIP 문항의 퍼블릭 도메인 지위로 OpenScales 구현 전체가 무제한 재사용된다고 주장하지 않는다. 이 구현은 해당 코드를 사용하지 않는다.

## 동결 원본의 SHA-256

원본별 날짜·URL·바이트·SHA-256의 기계 판독 원본은 [sources.json](../provenance/sources.json)이다. 날짜는 클라이언트 기준일이며 호스트 시각으로 추측하지 않았다.

| 파일 | 바이트 | SHA-256 |
| --- | ---: | --- |
| [newTCIKey.htm](../provenance/newTCIKey.htm) | 52912 | `092d0cffbb62d1b1945af36704400bba2d6c1b3190b0720410012ba376226aa6` |
| [newTCITable.htm](../provenance/newTCITable.htm) | 131522 | `af580bcdb735e496014e5e61dd7ba9aea9553e5270d866078e057db7a17a422b` |
| [newScoringInstructions.htm](../provenance/newScoringInstructions.htm) | 2172 | `9429ac6d94589173a704c1079afe62833f8fcc5d0fe48e6df595b9022373af87` |
| [newPermission.htm](../provenance/newPermission.htm) | 1046 | `15e3d162504ce920c1da2476941b2a538f2d06075b514324de8cbeab874cc198` |
| [newNorms.htm](../provenance/newNorms.htm) | 4859 | `6edf1dcf29d8bd93cd25634caae3bb4b06b285eb0f368a4c9483b74ab70bf670` |
