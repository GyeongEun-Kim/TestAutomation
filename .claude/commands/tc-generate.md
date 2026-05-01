테스트 케이스를 설계하고 Notion 데이터베이스에 등록해.

## 1단계 — 사전 확인
`.env`를 읽어 `NOTION_PARENT_PAGE_ID`, `PROJECT_NAME`이 placeholder가 아닌지 확인해. 하나라도 미입력이면 중단하고 사용자에게 알려줘.

## 2단계 — 기획서 분석
- `plans/` 폴더에 PDF가 있으면 읽어서 기능 목록과 비즈니스 로직을 파악해.
- `docs/` 폴더에 마크다운이 있으면 함께 읽어 보완해.
- 두 곳 모두 비어있으면 사용자에게 기획서를 넣어달라고 요청하고 중단해.

## 3단계 — TC 설계
분석한 요구사항을 바탕으로 TC 목록을 설계해. 각 TC는 아래 필드를 포함해야 해:
- **TC ID**: TC-001 형식, 기능 그룹별로 번호 부여 (로그인: TC-001~, 회원가입: TC-010~ 등)
- **제목**: 한국어, "무엇을 했을 때 어떻게 되는가" 형식으로 작성
- **분류**: 로그인 / 회원가입 / 결제 / 마이페이지 / 기타 중 하나
- **우선순위**: High / Medium / Low

설계한 TC 목록을 표 형태로 사용자에게 보여주고 확인을 받아. 수정 요청이 있으면 반영해.

## 4단계 — Notion DB 생성
Notion MCP 도구 `notion-create-database`로 DB를 생성해:
- parent: `.env`의 NOTION_PARENT_PAGE_ID
- title: `[{PROJECT_NAME}] TC 관리`
- properties (컬럼):
  - `TC ID` — title 타입
  - `제목` — rich_text 타입
  - `분류` — select 타입 (옵션: 로그인, 회원가입, 결제, 마이페이지, 기타)
  - `우선순위` — select 타입 (옵션: High, Medium, Low)
  - `상태` — select 타입 (옵션: 미실행, 성공, 실패, 스킵)
  - `실패 원인` — rich_text 타입
  - `마지막 실행` — date 타입

생성된 DB ID를 `.notion-db-id` 파일에 저장해.

## 5단계 — TC 업로드
`notion-create-pages` 도구로 설계한 TC를 한 건씩 DB에 등록해.

## 6단계 — 완료 보고
업로드된 TC 수와 Notion DB 링크를 사용자에게 보고하고, 다음 단계로 `/tc-code` 실행을 안내해.
