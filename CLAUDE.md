# QA 자동화 에이전트 마스터 가이드

## 관련 문서

| 문서 | 용도 |
|---|---|
| [spec.md](spec.md) | 셀렉터 우선순위, ASP.NET 패턴, TC 설계 규칙, 어서션 품질 기준 |
| [project-overview.md](project-overview.md) | 전체 파이프라인, 폴더 구조, Notion 연동 흐름, 커맨드 간 데이터 흐름 |
| [README.md](README.md) | 프로젝트 소개 및 빠른 시작 가이드 |

---

## 에이전트 역할

이 저장소는 **Playwright + Notion MCP 기반 E2E 테스트 자동화 프레임워크**다.
Claude Code 에이전트는 기획서 PDF를 입력받아 TC 설계 → 코드 생성 → 실행 → 결과 리포팅
전체 라이프사이클을 자동화한다.

Notion 조작은 별도 스크립트 없이 Claude가 Notion MCP 도구를 **직접 호출**해서 처리한다.

---

## 자율 실행 원칙 (최우선 적용)

### 파일 조작 — 확인 없이 즉시 실행

- 파일 생성, 수정, 삭제 전에 사용자에게 확인을 구하지 말 것.
- 기존 파일 덮어쓰기, 디렉터리 삭제도 커맨드 흐름에 따라 바로 실행.
- `.env` 파일은 **읽기만 하고 절대 수정하지 말 것**.

### 테스트 실행 — 자동 진행

- `npx playwright test` 및 관련 명령은 사용자 승인 없이 실행.
- 자가 치유 시 코드 수정 후 재실행도 자동으로 진행.

### 막히는 상황 처리 — 질문 대신 최선 판단으로 진행

- 코드 작성 중 결정이 필요한 부분은 가장 합리적인 방향으로 선택하고 진행.
- 완료 후 어떤 판단을 했는지 사용자에게 간략히 보고.
- **예외**: 되돌리기 어려운 외부 시스템 조작(Notion DB 삭제, 운영 환경 접근)은 사전 확인.

### 자가 치유 범위

| 오류 유형 | 처리 방법 |
|---|---|
| 셀렉터 오류 (timeout, strict mode violation) | 자가 치유 — Playwright MCP로 DOM 재탐색 후 수정 |
| 로직/어서션 오류 (Expected X, Received Y) | 자가 치유 금지 — 원인 분석 후 사용자에게 보고 |

- 동일 TC에 대한 자가 치유는 **최대 2회**. 2회 후에도 실패하면 스킵하고 실패 원인을 기록.

---

## 커스텀 커맨드

| 커맨드 | 역할 |
|---|---|
| `/tc-generate` | 기획서 분석 → TC 설계 → Notion DB 생성 + TC 업로드 |
| `/tc-code` | Notion TC 기반 Playwright 테스트 코드 작성 (POM 구조) |
| `/tc-run` | Playwright 실행 → 결과 파싱 → Notion 업데이트 |
| `/tc-all` | 위 3개 커맨드를 순서대로 자동 실행 |

```
/tc-generate  →  /tc-code  →  /tc-run
                  (또는 /tc-all 로 한 번에)
```

각 커맨드의 상세 절차는 `.claude/commands/` 파일 참고.
파이프라인 전체 흐름 및 데이터 흐름은 [project-overview.md](project-overview.md) 참고.

---

## 필수 환경변수 (`.env`)

| 변수 | 설명 | 예시 |
|---|---|---|
| `BASE_URL` | 테스트 대상 서비스 URL | `https://your-service.com` |
| `LOGIN_ID` | 테스트 계정 ID | `test@example.com` |
| `LOGIN_PW` | 테스트 계정 비밀번호 | `password123` |
| `NOTION_PARENT_PAGE_ID` | TC DB를 생성할 Notion 페이지 ID | 32자리 hex |
| `PROJECT_NAME` | 프로젝트 식별자 (파일명·DB명에 사용) | `MYPROJECT` |

`.env.example`을 복사해서 `.env`를 만든 뒤 실제 값으로 채울 것.
Notion API 인증은 MCP 연결로 처리하므로 API Key는 불필요.

---

## 코드 작성 핵심 규칙

### Zero Hardcoding

모든 URL, 계정 정보는 반드시 `process.env`를 통해 읽어올 것.
코드에 값을 직접 기입하지 말 것.

### Traceability

`test()` 블록 제목의 TC ID를 Notion TC ID와 반드시 1:1 매칭.

```js
test('[C-01] 유효한 이메일/비밀번호로 로그인 성공', async ({ page }) => { ... })
```

### Page Object Model (POM)

- 셀렉터와 액션은 `pages/{PROJECT_NAME}/{기능명}Page.js`에 모아둘 것.
- `test()` 블록 안에서 `page.locator()` / `page.fill()` 등을 직접 호출하지 말 것.
- 셀렉터는 `pages/{PROJECT_NAME}/selectors.json`에 저장하고 Page 클래스에서 불러올 것.

### dotenv 중복 선언 금지

`dotenv`는 `playwright.config.js`에서 전역 로드됨. 각 spec 파일에서 재선언하지 말 것.

### DOM 기반 셀렉터

Playwright MCP `browser_snapshot`으로 직접 확인한 값만 사용. 추측 금지.
셀렉터 우선순위 및 ASP.NET WebForms 대응 패턴 → [spec.md](spec.md) 참고.

---

## 파일 네이밍 규칙

| 유형 | 경로 |
|---|---|
| 테스트 스펙 | `tests/{PROJECT_NAME}/{분류명}.spec.js` |
| Page 클래스 | `pages/{PROJECT_NAME}/{기능명}Page.js` |
| 셀렉터 맵 | `pages/{PROJECT_NAME}/selectors.json` |
| 기획서 분석 요약 | `docs/{PROJECT_NAME}.md` |

---

## Playwright MCP 도구 활용 규칙

DOM 탐색 시 **Python 스크립트 작성·실행 절대 금지**. 반드시 Playwright MCP 도구 사용.

| 도구 | 용도 |
|---|---|
| `browser_navigate` | URL 이동 |
| `browser_snapshot` | DOM·접근성 트리 확인 (셀렉터 추출 핵심) |
| `browser_click` | 요소 클릭 |
| `browser_fill` / `browser_type` | 입력 필드 채우기 |
| `browser_take_screenshot` | 현재 화면 캡처 |

MCP 도구 사용 전 `ToolSearch("playwright browser navigate snapshot")`으로 현재 연결된 도구 목록 확인.

---

## Notion MCP 도구 활용 규칙

| 도구 | 용도 |
|---|---|
| `notion-create-database` | TC DB 생성 (tc-generate) |
| `notion-create-pages` | TC 행 생성 (tc-generate, 배치 10개씩) |
| `notion-fetch` | DB/페이지 내용 조회 (tc-code, tc-run) |
| `notion-update-page` | TC 결과 갱신 (tc-run) |
| `notion-search` | DB/페이지 검색 |

---

## 실행 병렬화

`tests/{PROJECT_NAME}/*.spec.js` 파일 수 기준 자동 분기:

| 조건 | 실행 명령 |
|---|---|
| 5개 미만 | `npx playwright test tests/{PROJECT_NAME}` |
| 5개 이상 | `npx playwright test tests/{PROJECT_NAME} --workers=4` |

---

## Notion 연동 흐름

```
/tc-generate  →  notion-create-database  →  .notion-db-id 저장
              →  notion-create-pages      →  TC 행 생성

npx playwright test  →  test-results/results.json

/tc-run       →  results.json 파싱
              →  notion-update-page       →  통과여부 / 마지막 실행 / 실패 원인 갱신
```

`.notion-db-id` — 커맨드 간 DB ID를 전달하는 임시 파일 (git 제외).

---

## 결과 업데이트 규칙

Notion 업데이트 시 **이전 결과와 비교 없이 항상 덮어씀** (사람이 수동으로 변경했을 수 있음).

| 필드 | 성공 | 실패 | 스킵 |
|---|---|---|---|
| 통과여부 | `true` (checkbox on) | `false` (checkbox off) | 변경하지 않음 |
| 마지막 실행 | 현재 시각 (KST) | 현재 시각 (KST) | 변경하지 않음 |
| 실패 원인 | `null` (비우기) | 에러 메시지 첫 줄 (200자 이내) | 변경하지 않음 |

---

## 폴더 구조

```
TestAutomation/
├── .claude/
│   └── commands/              # Claude Code 커스텀 커맨드
│       ├── tc-generate.md
│       ├── tc-code.md
│       ├── tc-run.md
│       └── tc-all.md
├── tests/
│   └── {PROJECT_NAME}/        # 프로젝트 전용 TC (자동 생성)
│       └── {분류}.spec.js
├── pages/                     # Page Object Model (자동 생성)
│   └── {PROJECT_NAME}/
│       ├── {기능명}Page.js
│       └── selectors.json
├── fixtures/                  # 테스트용 더미 데이터 (JSON)
├── test-results/              # Playwright 리포트 (git 제외)
├── docs/                      # 기획서 분석 요약 (프로젝트별 1개, 자동 생성)
├── plans/                     # 기획서 원본 PDF (git 제외)
├── notion/
│   └── schema.js              # Notion DB 스키마 참고용
├── spec.md                    # 기술 사양 및 패턴 레퍼런스
├── project-overview.md        # 아키텍처 및 설계 개요
├── playwright.config.js
├── package.json
├── .env                       # 실제 접속 정보 (git 제외)
└── .env.example               # 환경변수 템플릿
```

---

## TC 설계 규칙 요약

TC 다양성 필수 요건, 기능 유형별 최소 TC 수, 어서션 품질 기준 → **[spec.md](spec.md)** 참고.

---

## ASP.NET WebForms 대응 요약

이 서비스는 UpdatePanel AJAX 방식이라 **버튼 클릭 후 URL이 변경되지 않고** DOM 일부만 교체된다.

- UpdatePanel 갱신 후 `waitForLoadState('networkidle')` 사용 **금지**
- 대신 `expect(locator).toHaveText/Attribute/Count({ timeout: 8000 })` 사용
- 상세 패턴 → **[spec.md](spec.md)** 참고

---

## 새 프로젝트 온보딩 체크리스트

- [ ] `plans/`에 기획서 PDF 복사
- [ ] `.env` 값 입력 (`BASE_URL`, `LOGIN_ID`, `LOGIN_PW`, `NOTION_PARENT_PAGE_ID`, `PROJECT_NAME`)
- [ ] Notion MCP 연결 확인 (`/mcp`)
- [ ] `npm install`
- [ ] `npx playwright install`
- [ ] `/tc-generate` — 기획서 분석 및 Notion TC DB 생성
- [ ] `/tc-code` — Playwright 테스트 코드 작성
- [ ] `/tc-run` — 테스트 실행 및 Notion 결과 동기화
- [ ] *(또는 `/tc-all`로 위 3단계 한 번에 실행)*
