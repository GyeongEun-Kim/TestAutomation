Notion에 등록된 TC를 기반으로 Cypress 테스트 코드를 작성해.

## 1단계 — 사전 확인
- `.env`에서 PROJECT_NAME을 읽어. placeholder거나 비어있으면 중단하고 알려줘.
- `.notion-db-id` 파일이 없으면 "/tc-generate를 먼저 실행해주세요"라고 안내하고 중단해.

## 2단계 — TC 목록 조회
`.notion-db-id`에서 DB ID를 읽어. Notion MCP 도구 `notion-fetch`로 해당 DB를 조회해서 등록된 TC 목록(TC ID, 제목, 분류)을 파악해.

## 3단계 — 기존 코드 파악
- `cypress/e2e/{PROJECT_NAME}/` 와 `cypress/pages/` 아래 이미 존재하는 파일을 확인해.
- `cypress/e2e/common/{PROJECT_NAME}_*.cy.js` 파일도 확인해.
- 기존 파일이 있다면 중복 작성하지 말고 이어서 추가해.

## 4단계 — Page Object 작성
TC의 분류(기능)별로 `cypress/pages/{기능명}Page.js`를 생성해.
- 셀렉터는 `data-cy` 속성 기준으로 작성 (없으면 id → class 순서로 fallback)
- 각 Page 클래스에 visit(), 입력 메서드, 제출 메서드, 결과 확인 메서드를 포함할 것

## 5단계 — 프로젝트 전용 테스트 스크립트 작성
분류별로 `cypress/e2e/{PROJECT_NAME}/{분류명}.cy.js` 파일을 생성해.

**필수 규칙:**
- `it()` 블록 제목은 반드시 `[TC-XXX]`로 시작 (Notion TC ID와 1:1 매칭)
- 모든 접속 정보는 `Cypress.env()` 또는 `cy.fixture()`에서 읽을 것. 하드코딩 금지
- Page Object를 통해 셀렉터를 분리할 것

```js
it('[TC-001] 유효한 이메일/비밀번호로 로그인 성공', () => {
  LoginPage.visit();
  LoginPage.fillEmail(Cypress.env('LOGIN_ID'));
  ...
});
```

## 6단계 — 공통 테스트 스크립트 작성
이 프로젝트에 맞는 공통 TC를 `cypress/e2e/common/{PROJECT_NAME}_{분류}.cy.js` 형식으로 작성해.

- TC ID는 `[TC-CXXX]` 형식 사용
- 공통 TC 예시: 페이지 로딩, 404 처리, 필수 메타태그, 콘솔 에러 없음
- 이 프로젝트의 HTML 구조와 URL 패턴에 맞게 실제로 맞춰서 작성할 것

## 7단계 — 완료 보고
작성된 파일 목록과 각 파일에 포함된 TC ID를 표로 보여줘:

| 파일 경로 | TC ID 목록 | 구분 |
|---|---|---|
| cypress/e2e/{PROJECT_NAME}/login.cy.js | TC-001, TC-002 | 전용 |
| cypress/e2e/common/{PROJECT_NAME}_health.cy.js | TC-C001, TC-C002 | 공통 |

다음 단계로 `/tc-run` 실행을 안내해.
