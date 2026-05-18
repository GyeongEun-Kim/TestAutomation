# QA Test Automation

Playwright 기반 E2E 테스트 자동화 프레임워크.
Claude Code 커스텀 커맨드로 기획서 분석, 테스트 코드 작성, 실행, Notion 리포팅을 자동화합니다.

| 문서 | 내용 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Claude 에이전트 마스터 가이드 (운영 원칙, 커맨드, 규칙) |
| [spec.md](spec.md) | 기술 사양: 셀렉터 우선순위, ASP.NET 패턴, TC 설계 규칙 |
| [project-overview.md](project-overview.md) | 아키텍처, 파이프라인 흐름, 폴더 구조, Notion 연동 |

---

## 주요 기능

- **기획서 → TC 자동 설계** — PDF를 분석해 Given-When-Then 구조의 TC를 설계하고 Notion DB에 등록
- **코드 자동 생성** — Notion TC 기반으로 Playwright 스크립트를 Page Object Model 패턴으로 작성
- **자동 병렬 실행** — 스펙 파일 수에 따라 `--workers` 옵션으로 자동 병렬화
- **Notion 실시간 동기화** — 테스트 결과(성공/실패/원인)를 Notion TC DB에 자동 업데이트
- **자가 치유** — 셀렉터 오류 발생 시 Playwright MCP로 DOM을 재탐색해 자동 수정 (최대 2회)

---

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- [Claude Code](https://claude.ai/code)
- Notion MCP 연결 설정

### 설치

```bash
git clone <repo-url>
cd TestAutomation
npm install
npx playwright install
```

### 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 아래 값을 채웁니다.

| 변수 | 설명 |
|---|---|
| `BASE_URL` | 테스트할 서비스 URL |
| `LOGIN_ID` | 테스트 계정 ID |
| `LOGIN_PW` | 테스트 계정 비밀번호 |
| `NOTION_PARENT_PAGE_ID` | TC DB를 만들 Notion 페이지 ID |
| `PROJECT_NAME` | 프로젝트 식별자 (파일명·DB명에 사용) |

Notion API 인증은 MCP 연결로 처리하므로 별도 API Key는 불필요합니다.

---

## 사용법

기획서 PDF를 `plans/` 폴더에 넣고 Claude Code에서 커맨드를 실행합니다.

### 단계별 실행

```
/tc-generate   기획서 분석 → TC 설계 → Notion DB 생성
/tc-code       TC 기반 Playwright 코드 작성 (POM 패턴)
/tc-run        테스트 실행 → 결과 파싱 → Notion 업데이트
```

### 한 번에 실행

```
/tc-all        위 3단계를 순서대로 자동 실행
```

---

## 폴더 구조

```
TestAutomation/
├── .claude/commands/          # Claude Code 커스텀 커맨드
├── tests/{PROJECT_NAME}/      # 프로젝트 전용 TC (자동 생성)
├── pages/{PROJECT_NAME}/      # Page Object Model + selectors.json (자동 생성)
├── fixtures/                  # 테스트 더미 데이터
├── test-results/              # 테스트 리포트 (git 미포함)
├── docs/                      # 기획서 분석 요약 (자동 생성)
├── plans/                     # 기획서 원본 PDF (git 미포함)
├── notion/                    # Notion DB 스키마 참고용
├── spec.md                    # 기술 사양 레퍼런스
├── project-overview.md        # 아키텍처 개요
└── playwright.config.js
```

---

## TC ID 체계

| 형식 | 예시 | 사용 위치 |
|---|---|---|
| `C-01`, `C-02` ... | `[C-01] 로그인 성공` | Notion 케이스ID ↔ Playwright test() 블록 제목 |

TC ID는 Notion과 Playwright 코드를 연결하는 유일한 식별자입니다.

---

## 기술 스택

| 역할 | 도구 |
|---|---|
| E2E 테스트 | [Playwright](https://playwright.dev/) |
| TC 관리 | [Notion](https://www.notion.so/) (MCP 연동) |
| AI 자동화 | [Claude Code](https://claude.ai/code) |
