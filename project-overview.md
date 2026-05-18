# 프로젝트 아키텍처 개요

> 기술 사양 및 코드 패턴 상세는 → [spec.md](spec.md)

---

## 프로젝트 목적

Playwright 기반 E2E 테스트 자동화와 Notion MCP 연동을 통해
**테스트 케이스 관리 전체 라이프사이클**을 Claude Code 에이전트로 자동화한다.

기획서 PDF 하나를 입력으로 받아 TC 설계 → 코드 생성 → 실행 → 결과 리포팅까지
사람의 개입 없이 처리하는 것이 목표다.

---

## 전체 파이프라인

```
기획서 PDF (plans/)
       │
       ▼
┌──────────────────────────────────────────────┐
│  /tc-generate                                │
│  1. plans/ PDF 분석                          │
│  2. TC 설계 (Given-When-Then 구조)           │
│  3. 사용자에게 TC 표 확인 요청               │
│  4. Notion DB 생성 + TC 업로드 (배치 10개씩) │
│  5. .notion-db-id 저장                       │
└─────────────────────┬────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────┐
│  /tc-code                                    │
│  1. .notion-db-id에서 DB ID 읽기             │
│  2. Notion에서 TC 목록 조회                  │
│  3. Playwright MCP로 실제 DOM 탐색           │
│  4. selectors.json 작성                      │
│  5. Page Object 클래스 생성                  │
│  6. .spec.js 테스트 파일 생성                │
└─────────────────────┬────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────┐
│  /tc-run                                     │
│  1. 이전 test-results/ 정리                  │
│  2. npx playwright test 실행 (자동 병렬화)   │
│  3. 실패 시 자가 치유 (최대 2회)             │
│  4. results.json 파싱                        │
│  5. Notion 결과 업데이트                     │
│  6. 최종 보고                                │
└──────────────────────────────────────────────┘
```

또는 `/tc-all`로 위 3단계를 순서대로 한 번에 실행.

---

## 커스텀 커맨드 요약

| 커맨드 | 입력 | 출력 |
|---|---|---|
| `/tc-generate` | `plans/` PDF | Notion DB + `.notion-db-id` |
| `/tc-code` | Notion TC 목록 + 실제 DOM | `.spec.js` + `Page.js` + `selectors.json` |
| `/tc-run` | `.spec.js` 파일들 | `results.json` + Notion 업데이트 |
| `/tc-all` | — | 위 3단계 자동 실행 |

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
│   └── {PROJECT_NAME}/        # 자동 생성 (tc-code)
│       └── {분류}.spec.js
├── pages/                     # Page Object Model (자동 생성, tc-code)
│   └── {PROJECT_NAME}/
│       ├── {기능명}Page.js
│       └── selectors.json
├── fixtures/                  # 테스트용 더미 데이터 (JSON)
├── test-results/              # Playwright 리포트 (git 제외)
│   ├── results.json
│   └── index.html
├── docs/                      # 기획서 분석 요약 마크다운 (자동 생성, tc-generate)
│   └── {PROJECT_NAME}.md
├── plans/                     # 기획서 원본 PDF (git 제외)
├── notion/
│   └── schema.js              # Notion DB 스키마 참고용 (수동 관리)
├── spec.md                    # 기술 사양 및 패턴 레퍼런스
├── project-overview.md        # 이 파일 — 아키텍처 및 설계 개요
├── CLAUDE.md                  # Claude 에이전트 마스터 가이드
├── playwright.config.js
├── package.json
├── .env                       # 실제 접속 정보 (git 제외)
├── .env.example               # 환경변수 템플릿
└── .notion-db-id              # 커맨드 간 DB ID 전달용 임시 파일 (git 제외)
```

---

## 커맨드 간 데이터 흐름

| 파일 | 생성 주체 | 소비 주체 | 내용 |
|---|---|---|---|
| `.notion-db-id` | tc-generate | tc-code, tc-run | Notion DB ID |
| `docs/{PROJECT_NAME}.md` | tc-generate | tc-code (참고) | 기획서 분석 요약 |
| `pages/{PROJECT_NAME}/selectors.json` | tc-code | tc-code (Page 클래스) | 화면별 셀렉터 맵 |
| `test-results/results.json` | Playwright | tc-run | 테스트 실행 결과 |

---

## Notion 연동 흐름

```
/tc-generate ──► notion-create-database ──► .notion-db-id 저장
             └─► notion-create-pages    ──► TC 행 생성 (배치 10개씩)

/tc-code     ──► notion-fetch           ──► TC 목록 (케이스ID, 기능, Given, When, Then) 조회

             npx playwright test ──► test-results/results.json

/tc-run      ──► notion-fetch           ──► TC 페이지 목록 조회
             └─► notion-update-page     ──► 통과여부 / 마지막 실행 / 실패 원인 갱신
```

Notion 인증은 MCP 연결로 처리. API Key 불필요.

---

## 설계 원칙

| 원칙 | 내용 |
|---|---|
| No Scripts | Notion 조작은 MCP 도구 직접 호출. 별도 Node/Python 스크립트 작성 금지. |
| Zero Hardcoding | URL·계정 정보는 모두 `process.env` 사용. 코드에 값 직접 기입 금지. |
| POM 패턴 | 셀렉터와 액션은 Page Object에만. spec 파일은 시나리오 흐름만 담당. |
| Traceability | TC ID가 Notion ↔ Playwright 코드 사이의 유일한 연결 고리. |
| Self-Healing | 셀렉터 오류만 자가 치유. 로직·어서션 오류는 사람에게 보고. |
| DOM 기반 셀렉터 | 추측 금지. 반드시 Playwright MCP snapshot으로 직접 확인한 값만 사용. |

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
