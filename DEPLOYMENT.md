# 독립 배포 절차와 운영 기록

- 공개 서비스: [https://lucianlabs.dev/tci/](https://lucianlabs.dev/tci/)
- 독립 origin: [https://lucian-tci.vercel.app/tci/](https://lucian-tci.vercel.app/tci/)
- MIT 공개 저장소: [Seokwoooo/lucian-tci](https://github.com/Seokwoooo/lucian-tci)
- 기록 기준: 2026-10-17, Asia/Seoul.

GitHub 공개 여부, Vercel READY 상태, 실제 사용자 도메인의 HTTP 응답과 브라우저 동작을 각각 확인했습니다. 로컬 빌드만으로 운영 완료를 판단하지 않습니다.

## 배포 구조와 보존 경계

이 프로젝트는 상위 `lucianLabs/` 작업공간 아래의 독립 Git 저장소입니다. 상위 폴더는 Git 저장소가 아닙니다. `redesign/`의 파일·미커밋 변경·빌드·배포와 DNS를 변경하지 않았습니다.

Vercel의 독립 프로젝트 `lucian-tci`에서 정적 파일을 제공합니다. 기존 `lucianlabs.dev` 프로젝트에는 다음 두 경로만 추가했습니다. `/icons/` 라우팅 2개와 기존 사이트 deployment는 유지했습니다.

| 매칭 경로 | 처리 |
| --- | --- |
| `^/tci$` | `/tci/`로 308 리다이렉트 |
| `^/tci/(.*)$` | `https://lucian-tci.vercel.app/tci/$1`로 프록시 |

독립 프로젝트의 `vercel.json`이 `/tci/`를 `index.html`, `/tci/:path*`를 `/:path*`로 매핑합니다. Vite의 `base: '/tci/'`만으로 `dist/tci/` 디렉터리가 생성되는 것은 아닙니다. `/tci/assets/`, `/tci/fonts/`, favicon과 OG 이미지도 이 매핑을 사용합니다.

## 첫 공개 배포의 확인 기록

| 항목 | 확인값 |
| --- | --- |
| GitHub 공개 상태 | `Seokwoooo/lucian-tci`, `private: false` |
| 최초 공개 커밋 | `8f93d1f8b08abdda16897cd743cd21f7d73d5868` |
| 독립 Vercel 프로젝트 | `prj_ClEr3lrTryxObNpnVzqWmAzsMx8w` |
| 최초 production deployment | `dpl_BgPMRvKUaDdwAjmFJ6PqRZSw9KtP`, READY |
| 최초 deployment URL | `https://lucian-njgmp91dg-lucian-main.vercel.app` |
| 기존 사이트 deployment | `dpl_EnG1jgPvT1rraAWBKLnggp8rdDzy`, 변경 없음 |
| `/tci/` 추가 routing version | `04faf342-7abe-4669-a444-e8315291d753` |
| `/tci` 리다이렉트 rule | `aaa145c8-b7f1-4abd-8030-5262ad23fe46` |
| `/tci/` 프록시 rule | `c8d86fdf-638e-4f42-bd59-d9f88eec80d5` |
| GitHub Actions | [최초 공개 검증 성공](https://github.com/Seokwoooo/lucian-tci/actions/runs/38920339420) |
| 사용자 도메인 | `/tci/` HTTP 200, 최초 버전의 데스크톱·모바일 E2E 10개 통과 |

아래 기존 페이지는 경로 추가 전후 HTML SHA-256이 동일했습니다. 새 서비스만 404에서 200으로 바뀌었습니다.

| 기존 경로 | 변경 전후 동일 SHA-256 |
| --- | --- |
| `/` | `d3a5a805ce71b612e607ddf0086670a9524c419fd4d3f7e757781cf868e8f7d5` |
| `/uxui-prompt/` | `ace02d66b180b01dece652fe7bbef9669a53a1bf1d4c58b52991fe4ba503897e` |
| `/icons/` | `8ad697ce6217939924799d759e1daab6c8448d8729e595521e3dbc1c5a9e0772` |

배포 확인용 응답·비교 파일과 브라우저 결과는 로컬 `output/deployment/`, `output/playwright/`에 보관하며 Git에 포함하지 않습니다. 후속 릴리스의 커밋과 검사 기록은 GitHub Actions와 Vercel 배포 이력에서 확인합니다.

## 로컬 실행과 빌드

- 프레임워크: React·Vite 정적 사이트, Node.js 24.
- 설치: `npm ci`, 빌드: `npm run build`, 출력: `dist/`.
- 답변 수집 서버·데이터베이스·분석 키·외부 AI 키: 사용하지 않음.
- hash 경로: `#home`, `#guide`, `#test`, `#review`, `#result`, `#about`, `#scoring`, `#privacy`.

```sh
npm ci
npm run extract:data -- --check
npm run validate:data -- --self-test
npm test
npm run build
npm run dev
```

`http://127.0.0.1:4173/tci/`에서 실행합니다. 빌드 결과는 `npm run preview`로 확인합니다. 같은 포트의 프로세스가 있으면 설정의 `strictPort`로 실패하므로 무관한 서버를 종료하지 않습니다.

일반 설치·빌드에는 Python이 필요하지 않습니다. 글꼴 재생성만 선택적으로 `fonttools`·`brotli`가 설치된 Python에서 `scripts/subset-fonts.py`를 실행합니다. 생성 글꼴, `public/fonts/coverage.json`과 `public/fonts/OFL.txt`를 함께 보존합니다.

## 변경 배포와 검증

1. 독립 저장소의 `git status`를 확인하고 본 프로젝트 파일만 커밋합니다. 비밀 키, 개인 답변·결과와 검사 산출물은 포함하지 않습니다.
2. 데이터·단위·브라우저 검사와 빌드를 통과시킵니다. `.github/workflows/ci.yml`은 push·PR에서 이를 다시 실행합니다.
3. GitHub `main`의 확인한 커밋을 독립 `lucian-tci` 프로젝트에 배포합니다. Vercel이 Git 자동 배포를 생성하지 않으면 동일 Git SHA를 명시해 production 배포를 요청합니다.
4. READY 상태와 연결된 커밋, `/tci/`·자산·글꼴·CSP를 확인합니다. `/tci/` 프록시는 독립 프로젝트의 production alias를 따르므로 새 UI 배포마다 기존 사이트 라우팅을 다시 수정하지 않습니다.
5. 실제 도메인에서도 전체 흐름을 검증합니다.

```sh
npx playwright install chromium
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://lucianlabs.dev/tci/ npm run test:e2e
```

6. 루트 사이트, `/uxui-prompt/`, `/icons/`를 다시 확인합니다. CI 성공, 배포 READY, 실도메인 동작 확인을 구분해서 기록합니다.

CSP는 script·font·connect를 같은 origin으로 제한하고 이미지의 `data:`·`blob:`만 허용합니다. 사용자 선택으로 여는 외부 공유 창과 사이트 링크는 별도 동작입니다. 답변·점수를 경로나 쿼리로 전송하지 않습니다. Vercel의 일반 접속 로그는 [개인정보 안내](PRIVACY.md)에서 별도로 구분합니다.

## 되돌리기와 남은 확인

앱 오류는 독립 `lucian-tci` 프로젝트의 이전 READY deployment로 되돌립니다. 서비스를 연결 해제해야 할 때는 위 두 `/tci` rule만 제거하고 변경 내용을 비교한 뒤 승격합니다. 기존 `/icons/` rule, 기존 deployment, DNS를 일괄 교체하지 않습니다.

카카오 전용 SDK 공유는 앱 키·허용 도메인이 없어 활성화하지 않았습니다. 현재 배포의 필수 환경변수는 없습니다. 국내 명칭·상표 검토, 번역 전문가 감수, 한국 표본 타당화와 실제 사람 대상 사용성·소요시간 검증은 [VALIDATION.md](VALIDATION.md)의 남은 항목입니다.

## v2 바이럴 개편 배포 준비 (2026-10-17)

- 빌드가 `dist/t/<slug>/index.html` 16개를 만듭니다(`vite.config.ts`의 `lucian-character-pages` 플러그인). 각 페이지는 같은 앱을 불러오되 제목·설명·`og:image`(`/tci/og/<slug>.png`)·canonical만 그 캐릭터 것으로 바꿉니다. 점수는 들어가지 않습니다.
- `vercel.json`에 `/tci/t/:slug/` → `/t/:slug/index.html` rewrite를 추가했습니다. 기존 `lucianlabs.dev` 프로젝트의 `/tci/(.*)` 프록시 규칙은 그대로 이 경로를 전달하므로 변경이 필요 없습니다.
- 링크 미리보기 이미지 17개(`public/og.png`, `public/og/*.png`)는 커밋하는 정적 자산입니다. 캐릭터 문구나 디자인을 바꾸면 `npm run dev` 후 `node scripts/generate-og.mjs`로 다시 만듭니다.
- 로컬 프로덕션 빌드(`vite preview`)에서 `/tci/t/curious-cat/` 200·캐릭터 제목과 `og:image`, `/tci/og/curious-cat.png` 200, `/tci/fonts/noto-kr-800.woff2` 200을 확인했습니다.
- 운영 반영(push → Vercel 배포)과 운영 주소 검증은 사용자 확인 후 진행하며, 이 문서에 결과를 추가합니다.
