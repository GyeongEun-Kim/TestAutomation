너는 QA 자동화 엔지니어야. Notion DB의 테스트케이스를 읽고, 실제 브라우저로 각 화면을 직접 탐색한 뒤 Page Object Pattern(POM) 구조의 Playwright 테스트 코드를 작성하는 게 목표야.

> 셀렉터 우선순위, ASP.NET 패턴, 어서션 품질 기준 상세 → [spec.md](../../spec.md)

---

## 1단계 — 사전 확인

- `.env`에서 `PROJECT_NAME`, `BASE_URL`, `LOGIN_ID`, `LOGIN_PW`를 읽어. 비어있으면 중단하고 알려줘.
- `.notion-db-id` 파일이 없으면 "/tc-generate를 먼저 실행해주세요"라고 안내하고 중단해.

---

## 2단계 — 기존 코드 초기화

1. `tests/{PROJECT_NAME}/` 하위 `.spec.js` 파일 모두 삭제
2. `pages/{PROJECT_NAME}/` 하위 Page 클래스 파일 모두 삭제
3. `pages/{PROJECT_NAME}/selectors.json` 삭제
4. 완료 후 사용자에게 알림

---

## 3단계 — Notion에서 TC 조회

`.notion-db-id`에서 DB ID를 읽어 `notion-fetch`로 TC 목록을 가져와.
필요한 필드: 케이스ID, 기능, Given, When, Then.

---

## 4단계 — DOM 탐색 및 셀렉터 추출

> **Python 스크립트 작성·실행 절대 금지.** 반드시 Playwright MCP 도구 사용.

사용 전 `ToolSearch("playwright browser navigate snapshot")`으로 도구 목록 확인.

### 탐색 절차 (화면별 반복)

1. `browser_navigate`로 로그인 페이지 이동
2. `browser_fill` + `browser_click`으로 로그인
3. 대상 화면으로 `browser_navigate`
4. `browser_snapshot`으로 DOM 구조 확인 → 셀렉터 후보 추출
5. 필요 시 `browser_click`으로 UI 상태 변경 후 재`browser_snapshot`
6. 추출한 셀렉터를 `pages/{PROJECT_NAME}/selectors.json`에 저장

### 셀렉터 우선순위

[spec.md](../../spec.md)의 **셀렉터 우선순위** 표를 반드시 준수. 요약:
1. `data-testid` / `data-cy` / `data-qa` (가장 안정적)
2. ARIA role + 접근성 이름
3. 고정 `id` (동적 생성 id 금지 — ASP.NET 자동 생성 id 포함)
4. `name` 속성
5. 텍스트/레이블 기반
6. 의미 있는 class (유틸리티·hash class 금지)
7. 구조 기반 (최후 수단)

**추측 금지** — `browser_snapshot`으로 직접 확인한 값만 저장.

### 보조 방법: Playwright Codegen

탐색할 화면이 많거나 인터랙션이 복잡한 경우 선택적으로 활용:

```bash
npx playwright codegen --viewport-size=1920,1080 {BASE_URL}
```

codegen이 생성한 코드는 셀렉터 발췌용으로만 사용. 전체 코드를 그대로 사용하지 말고 POM 패턴으로 재구성할 것.

---

## 5단계 — Page Object 및 테스트 코드 작성

### Page Object 클래스 (`pages/{PROJECT_NAME}/{기능명}Page.js`)

- `constructor(page)` 에서 `this.page = page`로 page 인스턴스 수신
- `visit()`, 입력 메서드, 제출 메서드, 결과 확인 메서드 포함
- 셀렉터는 `selectors.json`에서 읽어오거나 매핑하여 구성

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async visit() {
    await this.page.goto(process.env.BASE_URL + '/login');
  }

  async login(id, pw) {
    await this.page.fill(selectors.loginId, id);
    await this.page.fill(selectors.loginPw, pw);
    await this.page.click(selectors.loginBtn);
  }

  async verifyLoginSuccess() {
    await expect(this.page).toHaveURL(/dashboard/);
  }
}
module.exports = { LoginPage };
```

### ASP.NET WebForms / UpdatePanel 대기 패턴 (필수)

[spec.md](../../spec.md)의 **ASP.NET 금지 패턴 / 올바른 패턴** 섹션을 반드시 확인하고 적용할 것.

핵심 규칙:
- UpdatePanel 갱신 후 `waitForLoadState('networkidle')` **사용 금지**
- `expect(locator).toHaveText/Attribute/Count({ timeout: 8000 })` 사용
- `waitForLoadState`는 풀 페이지 이동(로그인 리다이렉트, `<a href>` 클릭)에만 허용
- `waitForTimeout()`은 flaky 원인 — 최소화하고 `toHave*()` 로 대체

### 테스트 스크립트 (`tests/{PROJECT_NAME}/{기능}.spec.js`)

- `test()` 블록 제목은 반드시 `[C-XX]`로 시작 (Notion 케이스ID와 1:1 매칭)
- `dotenv`는 `playwright.config.js`에서 전역 로드됨 — 각 spec 파일에서 재선언 금지

```javascript
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/PROJECT_NAME/LoginPage');

test.describe('로그인', () => {
  test('[C-01] 유효한 정보로 로그인 성공', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.visit();
    await loginPage.login(process.env.LOGIN_ID, process.env.LOGIN_PW);
    await loginPage.verifyLoginSuccess();
  });
});
```

---

## 6단계 — 완료 보고

생성된 파일 목록(Page 클래스, spec 파일, selectors.json)을 사용자에게 보고해.
