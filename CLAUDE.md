# QA 자동화 에이전트 가이드

## 자율 실행 원칙 (최우선 적용)

이 저장소에서 작업할 때 아래 원칙을 항상 따를 것:

### 파일 조작 — 확인 없이 즉시 실행
- 파일 생성, 수정, 삭제 전에 사용자에게 확인을 구하지 말 것.
- 기존 파일 덮어쓰기, 디렉터리 삭제도 커맨드 흐름에 따라 바로 실행.
- 단, `.env` 파일은 읽기만 하고 절대 수정하지 말 것.

### 테스트 실행 — 자동 진행
- `npx playwright test` 및 관련 명령은 사용자 승인 없이 실행.
- 자가 치유 시 코드 수정 후 재실행도 자동으로 진행.

### 막히는 상황 처리 — 질문 대신 최선 판단으로 진행
- 코드 작성 중 결정이 필요한 부분은 가장 합리적인 방향으로 선택하고 진행.
- 완료 후 어떤 판단을 했는지 사용자에게 간략히 보고.
- **예외**: 되돌리기 어려운 외부 시스템 조작(Notion DB 삭제, 운영 환경 접근)은 사전 확인.

### 자가 치유 범위 명확화
- **셀렉터 오류** (timeout, strict mode violation): 자가 치유 대상 — Playwright MCP로 DOM 재탐색 후 수정.
- **로직/assertion 오류** (Expected X, Received Y): 자가 치유 금지 — 원인 분석 후 사용자에게 보고.
- 동일 TC에 대한 자가 치유는 최대 2회. 2회 후에도 실패하면 스킵하고 실패 원인을 기록.

---

이 저장소는 Playwright 기반 E2E 테스트 자동화와 Notion MCP 연동을 통해
테스트 케이스 관리 전체 라이프사이클을 처리하는 QA 자동화 프레임워크야.
Claude Code 커스텀 커맨드로 기획서 분석부터 테스트 실행, 결과 리포팅까지 자동화해.

Notion 조작은 별도 스크립트 없이 Claude가 Notion MCP 도구를 직접 호출해서 처리해.

---

## 폴더 구조

```
TestAutomation/
├── .claude/commands/            # Claude Code 커스텀 커맨드 정의
│   ├── tc-generate.md
│   ├── tc-code.md
│   ├── tc-run.md
│   └── tc-all.md
├── tests/
│   └── {PROJECT_NAME}/          # 기획안 기반 프로젝트 전용 TC
│       └── {분류}.spec.js
├── pages/                       # Page Object Model 클래스
│   └── {PROJECT_NAME}/
│       ├── {기능}Page.js
│       └── selectors.json
├── fixtures/                    # 테스트용 더미 데이터 (JSON)
├── test-results/                # Playwright JSON·HTML 리포트 (git 제외)
├── docs/                        # 기획서 분석 요약 마크다운 (프로젝트별 1개)
├── plans/                       # 기획서 원본 PDF (git 제외)
├── notion/
│   └── schema.js                # Notion DB 컬럼 스키마 정의 (참고용)
├── playwright.config.js
├── package.json
├── .env                         # 실제 접속 정보 (git 제외)
└── .env.example                 # 환경변수 템플릿 (git 포함)
```

---

## 커스텀 커맨드

| 커맨드 | 역할 |
|---|---|
| `/tc-generate` | 기획서 분석 → TC 설계 → Notion DB 생성 + TC 업로드 |
| `/tc-code` | Notion TC 기반 Playwright 테스트 코드 작성 (POM + 공통 TC 포함) |
| `/tc-run` | Playwright 실행 (자동 병렬화) → 결과 파싱 → Notion 업데이트 |
| `/tc-all` | 위 3개 커맨드를 순서대로 자동 실행 |

### 실행 순서

```
/tc-generate  →  /tc-code  →  /tc-run
                  (또는 /tc-all 로 한 번에)
```

---

## 필수 환경변수 (.env)

| 변수 | 설명 | 예시 |
|---|---|---|
| `BASE_URL` | 테스트 대상 서비스 URL | `https://your-service.com` |
| `LOGIN_ID` | 테스트 계정 이메일 | `test@example.com` |
| `LOGIN_PW` | 테스트 계정 비밀번호 | `password123` |
| `NOTION_PARENT_PAGE_ID` | TC DB를 생성할 Notion 페이지 ID | `32자리 hex` |
| `PROJECT_NAME` | 프로젝트 식별자 (파일명·DB명에 사용) | `myproject` |

`.env.example`을 복사해서 `.env`를 만든 뒤 실제 값으로 채울 것.

Notion API 인증은 MCP 연결로 처리하므로 API Key는 불필요해.

---

## 코드 작성 규칙

### Zero Hardcoding
모든 URL, 계정 정보는 반드시 `process.env`를 통해 읽어올 것.
코드에 값을 직접 적지 말 것.

### Traceability
`test()` 블록 제목의 TC ID를 Notion TC ID와 반드시 1:1 매칭시킬 것.

| 구분 | ID 형식 | 예시 |
|---|---|---|
| 프로젝트 TC | `[C-XXX]` | `[C-01]` |

```js
test('[C-01] 유효한 이메일/비밀번호로 로그인 성공', async ({ page }) => { ... })
```

### Page Object Model
셀렉터와 액션은 `pages/{PROJECT_NAME}/{기능명}Page.js`에 모아둘 것.
`test()` 블록 안에서 `page.locator()` / `page.fill()` 등을 직접 호출하지 말 것.

### 파일 네이밍
- 프로젝트 TC: `tests/{PROJECT_NAME}/{분류명}.spec.js`
- Page 클래스: `pages/{PROJECT_NAME}/{기능명}Page.js`
- 셀렉터 맵: `pages/{PROJECT_NAME}/selectors.json`
- 기획서 분석 요약: `docs/{PROJECT_NAME}.md`

---

## 실행 범위 및 병렬화

`/tc-run`은 `tests/{PROJECT_NAME}/*.spec.js` 파일 수를 기준으로 자동 분기:

| 스펙 수 | 실행 방식 |
|---|---|
| 5개 미만 | 단일 프로세스 (`npx playwright test`) |
| 5개 이상 | `--workers` 옵션으로 병렬 실행 (`--workers=4`) |

---

## Notion 연동 흐름

```
/tc-generate  →  notion-create-database (MCP)  →  .notion-db-id 저장
              →  notion-create-pages (MCP)      →  TC 행 생성

npx playwright test  →  test-results/results.json

/tc-run       →  results.json 파싱
              →  notion-update-page (MCP)       →  Notion DB 상태 업데이트
```

`.notion-db-id`는 커맨드 간 DB ID를 전달하는 임시 파일이며 `.gitignore`에 포함되어 있음.

---

## 새 프로젝트 온보딩 체크리스트

- [ ] `plans/`에 기획서 PDF 복사
- [ ] `.env` 값 입력 (BASE_URL, LOGIN_ID/PW, NOTION_PARENT_PAGE_ID, PROJECT_NAME)
- [ ] Notion MCP 연결 확인 (`/mcp`)
- [ ] `npm install` — @playwright/test 설치
- [ ] `npx playwright install` — 브라우저 바이너리 설치
- [ ] `/tc-generate` — 기획서 분석 및 Notion TC DB 생성
- [ ] `/tc-code` — Playwright 테스트 코드 + 공통 TC 작성
- [ ] `/tc-run` — 테스트 실행 및 Notion 결과 동기화
- [ ] (또는 `/tc-all` 로 위 3단계 한 번에 실행)
