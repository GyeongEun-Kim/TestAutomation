# QA 자동화 에이전트 가이드

이 저장소는 Cypress 기반 E2E 테스트 자동화와 Notion MCP 연동을 통해
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
├── cypress/
│   ├── e2e/
│   │   ├── common/             # 프로젝트별 공통 TC
│   │   │   └── {PROJECT_NAME}_{분류}.cy.js
│   │   └── {PROJECT_NAME}/     # 기획안 기반 프로젝트 전용 TC
│   │       └── {분류}.cy.js
│   ├── pages/                  # Page Object Model 클래스
│   ├── fixtures/               # 테스트용 더미 데이터 (JSON)
│   ├── results/                # Cypress JSON 리포트 (git 제외)
│   └── support/
│       ├── commands.js         # 커스텀 Cypress 커맨드
│       └── e2e.js
├── docs/                       # 기획서 분석 요약 마크다운 (프로젝트별 1개)
├── plans/                      # 기획서 원본 PDF (git 제외)
├── notion/
│   └── schema.js               # Notion DB 컬럼 스키마 정의 (참고용)
├── cypress.config.js
├── package.json
├── .env                        # 실제 접속 정보 (git 제외)
└── .env.example                # 환경변수 템플릿 (git 포함)
```

---

## 커스텀 커맨드

| 커맨드 | 역할 |
|---|---|
| `/tc-generate` | 기획서 분석 → TC 설계 → Notion DB 생성 + TC 업로드 |
| `/tc-code` | Notion TC 기반 Cypress 테스트 코드 작성 (POM + 공통 TC 포함) |
| `/tc-run` | Cypress 실행 (자동 병렬화) → 결과 파싱 → Notion 업데이트 |
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
모든 URL, 계정 정보는 반드시 `process.env` 또는 `Cypress.env()`를 통해 읽어올 것.
코드에 값을 직접 적지 말 것.

### Traceability
`it()` 블록 제목의 TC ID를 Notion TC ID와 반드시 1:1 매칭시킬 것.

| 구분 | ID 형식 | 예시 |
|---|---|---|
| 프로젝트 전용 TC | `[TC-XXX]` | `[TC-001]` |
| 프로젝트 공통 TC | `[TC-CXXX]` | `[TC-C001]` |

```js
it('[TC-001] 유효한 이메일/비밀번호로 로그인 성공', () => { ... })
it('[TC-C001] 메인 페이지가 정상 로드된다', () => { ... })
```

### Page Object Model
셀렉터와 액션은 `cypress/pages/{기능명}Page.js`에 모아둘 것.
`it()` 블록 안에서 `cy.get()`을 직접 호출하지 말 것.

### 파일 네이밍
- 프로젝트 전용 TC: `cypress/e2e/{PROJECT_NAME}/{분류명}.cy.js`
- 프로젝트 공통 TC: `cypress/e2e/common/{PROJECT_NAME}_{분류명}.cy.js`
- Page 클래스: `cypress/pages/{기능명}Page.js`
- 기획서 분석 요약: `docs/{PROJECT_NAME}.md`

---

## 실행 범위 및 병렬화

`/tc-run`은 PROJECT_NAME 기준으로 아래 두 경로를 합산해 실행 대상을 결정해:

```
cypress/e2e/{PROJECT_NAME}/*.cy.js          ← 전용 TC
cypress/e2e/common/{PROJECT_NAME}_*.cy.js   ← 공통 TC
```

합산 파일 수에 따라 자동 분기:

| 스펙 수 | 실행 방식 |
|---|---|
| 5개 미만 | 단일 프로세스 (`cypress run`) |
| 5개 이상 | CPU 코어 수 기준 그룹 분할 → 백그라운드 병렬 실행 → 결과 병합 |

---

## Notion 연동 흐름

```
/tc-generate  →  notion-create-database (MCP)  →  .notion-db-id 저장
              →  notion-create-pages (MCP)      →  TC 행 생성

cypress run   →  cypress/results/results.json

/tc-run       →  results.json 파싱
              →  notion-update-page (MCP)       →  Notion DB 상태 업데이트
```

`.notion-db-id`는 커맨드 간 DB ID를 전달하는 임시 파일이며 `.gitignore`에 포함되어 있음.

---

## 새 프로젝트 온보딩 체크리스트

- [ ] `plans/`에 기획서 PDF 복사
- [ ] `.env` 값 입력 (BASE_URL, LOGIN_ID/PW, NOTION_PARENT_PAGE_ID, PROJECT_NAME)
- [ ] Notion MCP 연결 확인 (`/mcp`)
- [ ] `/tc-generate` — 기획서 분석 및 Notion TC DB 생성
- [ ] `/tc-code` — Cypress 테스트 코드 + 공통 TC 작성
- [ ] `/tc-run` — 테스트 실행 및 Notion 결과 동기화
- [ ] (또는 `/tc-all` 로 위 3단계 한 번에 실행)
