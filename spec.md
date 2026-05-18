# 기술 사양 및 패턴 레퍼런스

> Claude 에이전트는 코드 작성·자가 치유·TC 설계 시 이 문서를 최우선 참조 자료로 활용할 것.

---

## 기술 스택

| 역할 | 도구 | 버전 |
|---|---|---|
| E2E 테스트 | Playwright | ^1.44.0 |
| TC 관리 | Notion (MCP 연동) | — |
| AI 자동화 | Claude Code | — |
| 런타임 | Node.js | 18+ |
| 테스트 언어 | JavaScript (CommonJS) | — |

---

## Playwright 설정 (`playwright.config.js`)

| 항목 | 값 |
|---|---|
| testDir | `./tests` |
| outputDir | `./test-results` |
| reporter | JSON (`./test-results/results.json`) + HTML |
| viewport | 2560 × 1271 |
| screenshot | only-on-failure |
| video | always (2560 × 1271) |
| slowMo | 600ms |
| browser | Chromium only |
| env loader | dotenv (playwright.config.js에서 전역 로드) |

---

## TC ID 명명 체계

```
test('[C-01] 유효한 이메일로 로그인 성공', async ({ page }) => { ... })
         └── 형식: C-숫자(2자리 이상) — 전체 프로젝트 통합 일련번호
```

- Notion `케이스ID` 컬럼 값과 Playwright `test()` 블록 제목이 **반드시 1:1 매칭**
- 한 번 부여된 ID는 변경 금지 (Notion 추적 연결 끊김 방지)

---

## 셀렉터 우선순위 (반드시 이 순서대로 적용)

| 순위 | 방법 | 예시 |
|---|---|---|
| 1 | data-testid / data-cy / data-qa | `[data-testid='login-btn']` |
| 2 | ARIA role + 접근성 이름 | `getByRole('button', { name: '로그인' })` |
| 3 | 고정 id 속성 | `#submitBtn` — 동적 생성 id 사용 금지 |
| 4 | name 속성 | `input[name='email']` |
| 5 | 텍스트/레이블 기반 | `getByText('회원가입')` |
| 6 | 의미 있는 class | `.btn-primary` — 유틸리티·hash class 금지 |
| 7 | 구조 기반 (최후 수단) | `form > div:nth-child(2) input` |

**주의사항**:
- Playwright MCP `browser_snapshot`으로 직접 확인한 값만 사용. **추측 절대 금지**.
- ASP.NET WebForms의 자동 생성 id(`ctl00_ContentPlaceHolder1_...`)는 3번 해당 불가 → 4번 이하 사용.
- 동적 클래스(`active`, `selected`)는 기본 상태 기준 셀렉터를 저장하고, 상태 확인은 `toHaveAttribute('class', /active/)` 사용.

---

## ASP.NET WebForms / UpdatePanel 대응 패턴

이 서비스는 ASP.NET WebForms + UpdatePanel AJAX 방식으로, SPA와 다르게 동작한다.
**코드 작성 및 자가 치유 시 반드시 준수할 것.**

### 핵심 특성

| 특성 | 내용 |
|---|---|
| 페이지 전환 방식 | `__doPostBack(...)` 호출 → URL 불변, DOM 일부만 교체 |
| 갱신 완료 신호 | DOM 내 특정 요소의 텍스트/속성/건수 변화로만 감지 가능 |
| `networkidle` 신뢰성 | XHR 완료는 감지하나, 동기 DOM 콜백까지 보장 안 됨 |

### 금지 패턴

```js
// ❌ UpdatePanel 트리거 후 networkidle → 즉시 읽기
await btn.click();
await page.waitForLoadState('networkidle');
const text = await locator.innerText(); // DOM 미갱신 상태일 수 있음

// ❌ PostBack 후 URL 확인 (URL이 변경되지 않음)
expect(page.url()).toContain('/result');

// ❌ 임의 대기 (flaky 원인)
await page.waitForTimeout(2000);
```

### 올바른 패턴

```js
// ✅ 텍스트 변화 대기
await btn.click();
await expect(locator).toHaveText('기대값', { timeout: 8000 });

// ✅ 클래스 변화 대기 (active, selected 등)
await btn.click();
await expect(locator).toHaveAttribute('class', /active/, { timeout: 8000 });

// ✅ 건수 변화 대기 (필터/검색 결과)
await filterBtn.click();
await expect(rows).toHaveCount(5, { timeout: 8000 });

// ✅ 요소 표시 여부 대기
await btn.click();
await expect(modal).toBeVisible({ timeout: 8000 });
```

### `waitForLoadState` 허용 케이스 (아래만 허용)

- 로그인 후 전체 페이지 리다이렉트
- `<a href="...">` 링크 클릭 후 새 페이지 로딩

---

## TC 설계 규칙

### TC 필드 구조

| 필드 | Notion 타입 | 설명 |
|---|---|---|
| 케이스ID | title | `C-01` 형식 고유 ID |
| 기능 | rich_text | 테스트 대상 기능명 |
| 구분 | select | 정상 / 예외 |
| Given | rich_text | 전제 조건 (구체적으로) |
| When | rich_text | 사용자 동작 및 입력값 |
| Then | rich_text | 기대 결과 (모호한 표현 금지) |
| 우선순위 | select | High / Medium / Low |
| 통과여부 | checkbox | tc-run이 업데이트 |
| 마지막 실행 | date | tc-run이 업데이트 |
| 실패 원인 | rich_text | tc-run이 업데이트 |

### TC 다양성 필수 요건

**1. 진입점 다양성** — 동일 기능이 복수의 화면·컴포넌트에서 동작하면 각 진입점마다 TC 분리

**2. 필터/검색 조합** — 아래 시나리오를 모두 포함

- 단일 조건 선택 (카테고리/옵션별)
- 동일 카테고리 내 다중 선택 (복수 선택 지원 시)
- 서로 다른 카테고리 2개 이상 동시 적용
- 필터 + 키워드 검색 동시 적용
- 필터 + 정렬 조합
- 조건 초기화 후 전체 결과 복원 확인
- 결과 0건 처리 (빈 상태 UI)

**3. 인증/권한 다양성** — 로그인 방식 또는 역할(Role)별 TC 분리

**4. 상태 전환 쌍(Pair)** — ON→OFF, OFF→ON 양방향 + 새로고침 후 영속성 검증

**5. 경계값 및 예외 입력**
- 빈 값 제출 (필수 필드 미입력)
- 최대 길이 초과
- 특수문자/SQL 인젝션 패턴
- 경계값 (최솟값, 최댓값, 직전/직후)

### 기능 유형별 최소 TC 수

| 기능 유형 | 최소 TC 수 | 비고 |
|---|---|---|
| 단순 화면 진입/표출 | 2개 | 정상 1 + 권한 없는 접근 1 |
| 검색/필터 | 8개 이상 | 단일×3, 복합×2, 초기화×1, 빈결과×1, 조합×1 |
| 인증 (방식 N가지) | N+4개 | 방식별 성공×N, 틀린ID×1, 틀린PW×1, 빈값×1, 중복×1 |
| 토글/즐겨찾기/좋아요 | 5개 이상 | 진입점별 등록, 해제, 새로고침 유지, 비로그인, 한도 초과 |
| 정렬/뷰 전환 | 옵션 수 × 2개 | 각 옵션 선택 후 결과 변화 + 선택 상태 UI 반영 |
| 폼 입력/제출 | 4개 이상 | 정상 제출, 필수값 누락, 형식 오류, 중복 제출 |
| 페이지네이션/무한스크롤 | 3개 이상 | 다음 페이지, 마지막 페이지, 이전 페이지 복귀 |

---

## 어서션 품질 기준

### 금지 패턴

```js
❌ expect(count).toBeGreaterThanOrEqual(0)   // 항상 참 — 검증 의미 없음
❌ expect(true).toBe(true)                   // 아무것도 검증 안 함
❌ expect(url).toContain('http')             // 너무 광범위
❌ test.skip(true, '추후 구현')              // 미구현 기능은 TC 자체를 만들지 말 것
```

### 올바른 패턴

```js
✅ expect(filteredCount).toBeLessThan(totalBefore)   // 필터 적용 후 건수 감소
✅ await expect(page).toHaveURL(/\/detail\/\d+/)      // 상세 페이지 이동 확인
✅ await expect(btn).toHaveClass(/active/)            // 선택 상태 클래스 확인
✅ await expect(toast).toHaveText('저장되었습니다')   // 피드백 메시지 확인
```

---

## 자가 치유 규칙

| 오류 유형 | 처리 |
|---|---|
| 셀렉터 오류 (timeout, strict mode violation) | 자가 치유 대상 — Playwright MCP로 DOM 재탐색 후 수정 |
| 로직/어서션 오류 (Expected X, Received Y) | 자가 치유 금지 — 원인 분석 후 사용자에게 보고 |

- 동일 TC에 대한 자가 치유 최대 **2회**
- 2회 후 실패 시 TC 스킵 + 실패 원인 기록
- 자가 치유 성공 후 해당 파일만 단독 재실행하여 검증

---

## Playwright MCP 도구 참조

DOM 탐색 시 Python 스크립트 작성·실행 절대 금지. 반드시 Playwright MCP 도구 사용.

| 도구 | 용도 |
|---|---|
| `browser_navigate` | URL 이동 |
| `browser_snapshot` | DOM·접근성 트리 확인 (셀렉터 추출 핵심) |
| `browser_click` | 요소 클릭 |
| `browser_fill` / `browser_type` | 입력 필드 채우기 |
| `browser_take_screenshot` | 현재 화면 캡처 |

> MCP 도구 사용 전 `ToolSearch("playwright browser navigate snapshot")`으로 현재 연결된 도구 목록 확인.

---

## 실행 병렬화 기준

| 조건 | 실행 명령 |
|---|---|
| spec 파일 5개 미만 | `npx playwright test tests/{PROJECT_NAME}` |
| spec 파일 5개 이상 | `npx playwright test tests/{PROJECT_NAME} --workers=4` |

---

## Notion DB 스키마 (tc-generate 생성 기준)

```js
properties: {
  '케이스ID':    { type: 'title' },
  '기능':        { type: 'rich_text' },
  '구분':        { type: 'select', options: ['정상', '예외'] },
  'Given':       { type: 'rich_text' },
  'When':        { type: 'rich_text' },
  'Then':        { type: 'rich_text' },
  '우선순위':    { type: 'select', options: ['High', 'Medium', 'Low'] },
  '통과여부':    { type: 'checkbox' },
  '마지막 실행': { type: 'date' },
  '실패 원인':   { type: 'rich_text' },
}
```
