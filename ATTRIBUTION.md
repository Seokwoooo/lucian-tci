# 출처와 라이선스

확인 기준일: 2026-10-16, 캐릭터·카드 요소 추가 2026-10-17. 이 저장소의 직접 작성 코드·문서·독립 한국어 번역은 [MIT LICENSE](LICENSE)를 따른다. 아래 외부 자료와 글꼴·의존성의 라이선스는 별도 적용 범위를 유지한다.

## IPIP 원문

[공식 IPIP 사용 허가 안내](https://ipip.ori.org/newPermission.htm)는 IPIP 문항·척도·검사 자료를 Public Domain으로 공개하며 상업·비상업 목적 사용을 허용한다고 설명한다. 원문은 [공식 키](https://ipip.ori.org/newTCIKey.htm), [비교표](https://ipip.ori.org/newTCITable.htm), 로컬 `provenance/`와 [출처 기록](DATA_PROVENANCE.md)에서 확인한다. IPIP의 공개 지위가 공식 TCI 한국어 문항·매뉴얼·규준 또는 명칭·상표의 재사용 허가를 뜻하지는 않는다. 공식 TCI 자료는 이 저장소에 포함하지 않는다.

한국어 번역은 이 프로젝트에서 독립 작성했으며 MIT로 공개한다. 공식·검증된 한국판이라는 지위를 부여하지 않는다.

## Lucian UX/UI Prompt에서 적용한 코드

- #044 FAQ Accordion: `src/components/Accordion.tsx`, `src/components/lucian.css`에 React·접근성 동작과 프로젝트 디자인을 반영했다. [원본 HTML](https://github.com/Seokwoooo/lucian-uxui-prompt/blob/main/src/elements/044-faq-accordion.html) · [원본 보기](https://lucianlabs.dev/uxui-prompt/#044).
- #083 Indeterminate Bar: `src/components/Progress.tsx`, `src/components/lucian.css`에 응답 완료 수를 보여 주는 형태로 적용했다. [원본 HTML](https://github.com/Seokwoooo/lucian-uxui-prompt/blob/main/src/elements/083-indeterminate-bar.html) · [원본 보기](https://lucianlabs.dev/uxui-prompt/#083).
- #052 돌려 보는 멤버십 카드: `src/components/PersonaCard.tsx`, `src/components/lucian.css`의 캐릭터 카드에 적용했다. 끌어서 돌리기·눌러서 뒤집기·홀로그램 띠·기울기 모션 값을 유지하고, 카드 크기를 세로형 트레이딩 카드로 바꾸었으며 잠금 버튼은 쓰지 않는다. 홀로그램 띠는 안쪽 프레임 위에 보이도록 겹침 순서와 투명도를 조정했다. [원본 보기](https://lucianlabs.dev/uxui-prompt/#052).
- #039 미끄러지는 알약 탭: `src/components/PillTabs.tsx`, `src/components/lucian.css`의 공유 카드 크기 선택(피드 4:5·스토리 9:16)에 적용했다. 알약 이동·좌우 방향키 이동은 유지하고, 데모 목록 대신 카드 미리보기가 이동 방향에서 들어오도록 바꾸었다. [원본 보기](https://lucianlabs.dev/uxui-prompt/#039).

원본 저장소 LICENSE를 실제 확인했다. 정확한 원문 저작권은 `Copyright (c) 2026 Seokwoooo`, 라이선스는 MIT다. 원본 출처 주석을 해당 TSX·CSS에 유지하며 전체 허가·면책 문구는 동일 저작권의 [LICENSE](LICENSE)에 보존한다.

## OpenScales 참고 범위

[고정 커밋](https://github.com/stmueller/OpenScales/tree/d555b04a1961181a63f91b534bc1096bcbd1dcdc)의 IPIP-TCI 정의를 읽고 공식 원본과 비교했다. 해당 구현·채점식·렌더러·도구·번역은 복제하지 않았다. 참고 정의는 258항목(30제목·228응답 문항)으로, 공식 289개 중 61개 위치 생략과 S1-03 한 문장 절단이 있다. 완전 문자열 불일치 62개와 실제 생략 61개를 구분한다.

- [참고 저장소 루트 LICENSE](https://raw.githubusercontent.com/stmueller/OpenScales/d555b04a1961181a63f91b534bc1096bcbd1dcdc/LICENSE): CC BY-NC-SA 4.0.
- [참고 OSD](https://raw.githubusercontent.com/stmueller/OpenScales/d555b04a1961181a63f91b534bc1096bcbd1dcdc/scales/ipip/IPIP-TCI/IPIP-TCI.osd)의 implementation.license: CC BY 4.0.
- 같은 OSD의 definition.scale_info.license: Public Domain.

세 표시는 적용 범위가 다르다. 이 서비스는 공식 IPIP 원문을 독립 추출하고 코드를 직접 작성했으며 OpenScales 코드에 MIT를 다시 붙이지 않았다. 비교 사실·고정 해시는 [비교 기록](provenance/openscales-comparison.json)과 [상세 감사](docs/DATA_AUDIT.md)에 보존한다.

## 한국어 글꼴

`public/fonts/noto-kr-400.woff2`, `noto-kr-600.woff2`, `noto-kr-800.woff2`는 설치한 `@fontsource/noto-sans-kr@5.3.1`의 한국어 글꼴을 현재 소스·문항에 맞게 부분 집합으로 만든 자산이다. 실제 라이선스의 권리자 표기는 `Google Inc.`, 조건은 SIL Open Font License 1.1이다. 전체 원문은 [public/fonts/OFL.txt](public/fonts/OFL.txt)에 보존한다. 글꼴을 프로젝트 MIT로 재허가하지 않는다. 생성 출처와 코드포인트는 `public/fonts/coverage.json`, 재생성 절차는 `scripts/subset-fonts.py`에 있다.

## 설치 파일에서 확인한 직접 의존성

다음 값은 실제 `node_modules/<패키지>/package.json`의 버전·license와 해당 LICENSE 파일을 확인한 기록이다. `package-lock.json`에 해석된 버전을 고정하며, 버전 변경 시 이 목록과 원문 고지를 다시 확인한다. 런타임과 개발 도구를 구분하며 아래 목록이 전이 의존성 전체를 열거하는 것은 아니다. 전이 의존성은 각 설치 디렉터리의 라이선스와 번들에 보존된 고지도 따른다.

| 패키지 | 실제 설치 버전 | 라이선스 | 구분 |
| --- | --- | --- | --- |
| `@fontsource/noto-sans-kr` | 5.3.1 | OFL-1.1 | 직접 의존성 |
| `jspdf` | 4.2.1 | MIT | 직접 의존성 |
| `lucide-react` | 1.58.0 | ISC | 직접 의존성 |
| `react` | 19.3.1 | MIT | 직접 의존성 |
| `react-dom` | 19.3.1 | MIT | 직접 의존성 |
| `@axe-core/playwright` | 4.14.0 | MPL-2.0 | 개발·검증 도구 |
| `@playwright/test` | 1.64.1 | Apache-2.0 | 개발·검증 도구 |
| `@tailwindcss/vite` | 4.3.3 | MIT | 개발·검증 도구 |
| `@types/node` | 26.6.5 | MIT | 개발·검증 도구 |
| `@types/react` | 19.3.0 | MIT | 개발·검증 도구 |
| `@types/react-dom` | 19.3.0 | MIT | 개발·검증 도구 |
| `@vitejs/plugin-react` | 6.1.2 | MIT | 개발·검증 도구 |
| `cheerio` | 1.2.0 | MIT | 개발·검증 도구 |
| `tailwindcss` | 4.3.3 | MIT | 개발·검증 도구 |
| `typescript` | 7.0.2 | Apache-2.0 | 개발·검증 도구 |
| `vite` | 8.3.4 | MIT | 개발·검증 도구 |
| `vitest` | 5.0.5 | MIT | 개발·검증 도구 |

Lucide React의 패키지 표기는 ISC이며, LICENSE 안에는 Feather에서 유래한 일부 아이콘의 별도 MIT 고지도 포함된다. 두 고지를 모두 보존한다. 설치 의존성 또는 번들을 재배포할 때에는 해당 패키지의 LICENSE·NOTICE와 기존 번들 라이선스 주석을 삭제하지 않는다. 개발 도구의 라이선스가 직접 작성한 프로젝트 코드를 동일 라이선스로 바꾸는 것으로 해석하지 않는다.

## 포함한 런타임 패키지 고지 원문

아래는 현재 설치 파일의 원문이다. React와 React DOM의 동일한 MIT 고지는 함께 표시한다. 글꼴 OFL 전문은 위의 별도 파일에 있다.

### React / React DOM

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### jsPDF

```text
Copyright
(c) 2010-2025 James Hall, https://github.com/MrRio/jsPDF
(c) 2015-2025 yWorks GmbH, https://www.yworks.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Lucide React 및 Feather 유래 아이콘

```text
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Zod

```text
MIT License

Copyright (c) 2025 Colin McDonnell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 캐릭터와 링크 미리보기 이미지

16가지 캐릭터 이름·설명·그림(`src/data/personas.ts`, `src/lib/mascot.ts`)과 링크 미리보기 이미지(`public/og.png`, `public/og/*.png`)는 이 프로젝트에서 직접 만들었고 MIT로 공개한다. 그림은 외부 일러스트·아이콘 팩을 쓰지 않은 SVG 도형이다. 미리보기 이미지는 `scripts/generate-og.mjs`로 고정 예시 캐릭터를 캡처한 것이며 실제 사람의 결과가 아니다.
