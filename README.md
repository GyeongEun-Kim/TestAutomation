# QA Test Automation

Playwright 기반 E2E 테스트 자동화 프레임워크. Claude Code 커스텀 커맨드로 기획서 분석, 테스트 코드 작성, 실행, Notion 리포팅을 자동화합니다.

---

## 주요 기능

- **기획서 → TC 자동 설계** — PDF 기획서를 분석해 테스트 케이스를 설계하고 Notion DB에 등록
- **코드 자동 생성** — TC 목록 기반으로 Playwright 스크립트를 Page Object Model 패턴으로 작성
- **자동 병렬 실행** — 스펙 파일이 많을 경우 `--workers` 옵션으로 자동 병렬화
- **Notion 실시간 동기화** — 테스트 결과(성공/실패/원인)를 Notion TC DB에 자동 업데이트
- **공통 TC 관리** — 프로젝트별 공통 점검 항목을 분리 관리하고 해당 프로젝트 실행 시에만 포함

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

`.env` 파일을 열어 아래 값을 채웁니다.

| 변수 | 설명 |
|---|---|
| `BASE_URL` | 테스트할 서비스 URL |
| `LOGIN_ID` | 테스트 계정 이메일 |
| `LOGIN_PW` | 테스트 계정 비밀번호 |
| `NOTION_PARENT_PAGE_ID` | TC DB를 만들 Notion 페이지 ID |
| `PROJECT_NAME` | 프로젝트 식별자 (파일명·DB명에 사용, 영문 소문자 권장) |

Notion API 인증은 MCP 연결로 처리하므로 별도 API Key는 불필요합니다.

---

## 사용법

기획서 PDF를 `plans/` 폴더에 넣고 Claude Code에서 커맨드를 실행합니다.

### 단계별 실행

```
/tc-generate   기획서 분석 → TC 설계 → Notion DB 생성
/tc-code       TC 기반 Playwright 코드 + 공통 TC 작성
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
├── tests/
│   ├── common/                # 프로젝트별 공통 TC
│   └── {PROJECT_NAME}/        # 프로젝트 전용 TC
├── pages/
│   └── {PROJECT_NAME}/        # Page Object Model + selectors.json
├── fixtures/                  # 테스트 더미 데이터
├── test-results/              # 테스트 리포트 (git 미포함)
├── docs/                      # 기획서 분석 요약 (마크다운)
├── plans/                     # 기획서 원본 PDF (git 미포함)
├── notion/                    # Notion DB 스키마
├── playwright.config.js
├── .env.example               # 환경변수 템플릿
└── CLAUDE.md                  # Claude Code 에이전트 가이드
```

---

## TC ID 체계

| 구분 | 형식 | 예시 |
|---|---|---|
| 프로젝트 전용 TC | `[TC-XXX]` | `[TC-001] 로그인 성공` |
| 프로젝트 공통 TC | `[TC-CXXX]` | `[TC-C001] 메인 페이지 로딩 확인` |

Notion TC ID와 Playwright `test()` 블록이 1:1로 추적 가능하도록 관리합니다.

---

## 병렬 실행

`/tc-run` 실행 시 스펙 파일 수에 따라 자동 분기됩니다.

- **5개 미만** — 단일 프로세스 실행
- **5개 이상** — `--workers=4` 옵션으로 병렬 실행

---

## 기술 스택

| 역할 | 도구 |
|---|---|
| E2E 테스트 | [Playwright](https://playwright.dev/) |
| TC 관리 | [Notion MCP](https://www.notion.so/) |
| AI 자동화 | [Claude Code](https://claude.ai/code) |
