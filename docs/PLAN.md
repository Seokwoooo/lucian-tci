# Lucian TCI Implementation Plan

**Goal:** 289문항 전체를 한국어로 검사하고 로컬 채점·저장·공유하는 공개 가능한 정적 서비스를 만든다.
**Architecture:** React/Vite UI → ID 기반 상태 → 순수 채점/해석 함수. 추출·검증 스크립트는 런타임 밖에 둔다.
**Tech Stack:** React, TypeScript, Vite, Tailwind, lucide-react, Vitest, Playwright, jsPDF.
**Spec:** [DESIGN.md](DESIGN.md), 사용자의 상세 요구사항.

## Global Constraints
- 289문항, 30개 하위척도, 7개 영역, ST3 없음. 원본 방향 키와 문항 위치를 보존한다.
- 검사 답변을 서버에 저장하거나 전송하지 않는다. 비공식 IPIP 검사임을 첫 화면/안내/결과/FAQ에서 명시한다.
- 공식 TCI 규준, 백분위, 임상 진단 금지. 모든 영역은 하위척도 평균의 동일 가중 평균이다.
- 기존 저장소·미커밋 변경·운영 설정은 보존한다. 사용자 승인 범위에서 공개 저장소를 생성한다.
- 모든 서브에이전트는 gpt-6.1-sol / xhigh, 역할 설정과 런타임 근거 확인.

## Tasks
- [x] 1. 데이터: provenance HTML → scripts/extract-ipip.mjs → src/data/items.json (Item[]), expected-counts.json. 독립 한국어 번역, 문항별 검수 메모. validate-data.mjs로 count/key/text/version/duplicate 검증.
- [x] 2. 엔진: src/lib/scoring.ts의 scoreAnswers(answers, items?) → ScoreResult. 누락/범위/알 수 없는 ID 거부. src/lib/interpretation.ts → Insight[]. src/data/scales.ts → domains, subscales. 30개 척도와 방향 테스트.
- [x] 3. UX: 랜딩/안내/검사/검토/결과/정보. 저장 버전 검증, 손상·실패 처리, 공유 동의 및 export 기능. 같은 origin 자산만 로드.
- [x] 4. QA: 실제 289문항 클릭, 수정/새로고침/완료/공유/삭제, desktop/mobile, axe, PNG/PDF 실물 확인, 독립 코드·번역 검토.
- [x] 5. 출처/채점/한계/개인정보/배포/라이선스 문서, MIT 공개 저장소 및 안전한 독립 배포.

## Interfaces and review focus
데이터 JSON은 src/types.ts Item에 맞춘다. 엔진은 raw 입력을 검증하며 순서와 무관하다. UI 저장키는 버전과 함께 검증한다.
집중 검토: 저장소 차단/손상, 키보드 선택과 이동, 역채점과 영역 가중치, 공유 전 정보 노출, ST4/ST5 해석.
사용자가 중간 승인을 반복하지 말고 자율 실행하도록 명시했으므로 확정된 설계에 대한 추가 승인 단계는 생략한다.

## v2 바이럴 개편 (2026-10-17)
- [x] 16가지 캐릭터 데이터·규칙(`personas.ts`, `persona.ts`)과 점수 기반 SVG 캐릭터(`mascot.ts`).
- [x] 영역을 섞은 문항 순서(`order.ts`), 자동 넘김, 7개 파트·중간 단서, 저장 v2와 v1 이전.
- [x] 홈·결과·캐릭터 페이지·공유 창 전면 재작성, #052·#039 이식, 새 디자인 CSS.
- [x] 피드·스토리 카드와 PDF 리포트(`export.ts`), 친구 비교 링크(`compare.ts`), 캐릭터별 정적 페이지·미리보기 이미지.
- [x] 단위·E2E 테스트 갱신, 문서 갱신.
- [ ] 사용자 로컬 확인 후 push와 운영 반영·운영 검증.
