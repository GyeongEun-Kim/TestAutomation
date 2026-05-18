너는 QA 자동화 엔지니어야. Playwright 테스트를 실행하고, 실패 시 자가 치유를 시도한 뒤 결과를 Notion DB에 업데이트하는 게 목표야.

> 자가 치유 규칙, 병렬화 기준, Notion DB 스키마 → [spec.md](../../spec.md)
> 전체 파이프라인 흐름 → [project-overview.md](../../project-overview.md)

---

## 1단계 — 사전 확인

- `.env`에서 `PROJECT_NAME`이 올바른지 확인. 비어있으면 중단.
- `.notion-db-id` 파일이 없으면 "/tc-generate를 먼저 실행해주세요" 안내 후 중단.
- `tests/{PROJECT_NAME}/` 폴더에 테스트 파일이 없으면 "/tc-code를 먼저 실행해주세요" 안내 후 중단.

---

## 2단계 — 이전 결과 정리 및 테스트 실행

### 실행 전 정리

```bash
rm -rf test-results/
mkdir test-results
```

이전 스크린샷·영상·에러 폴더를 제거해야 이번 실행 결과만 남아 Notion 업데이트가 정확해짐.

### 실행 범위 결정

[spec.md](../../spec.md)의 **실행 병렬화 기준** 참고:

- **5개 미만**: `npx playwright test tests/{PROJECT_NAME}`
- **5개 이상**: `npx playwright test tests/{PROJECT_NAME} --workers=4`

---

## 3단계 — 자가 치유 프로세스

실패 케이스가 있다면 아래 절차를 **최대 2회** 시도해.
자가 치유 범위는 [spec.md](../../spec.md)의 **자가 치유 규칙** 참고.

1. Playwright MCP로 해당 페이지를 직접 열어서 실제 DOM 구조를 다시 확인
2. 실패 원인이 **셀렉터 문제**라면 `pages/{PROJECT_NAME}/selectors.json` 및 관련 Page Object 수정
3. **로직/어서션 오류**이면 자가 치유 금지 — 원인 분석 후 사용자에게 보고
4. 수정 후 해당 파일만 단독 재실행:
   ```bash
   npx playwright test {파일명}
   ```

---

## 4단계 — 결과 파싱

`test-results/results.json`에서 추출:

- 테스트 제목의 `[C-XXX]` 패턴으로 TC ID 추출
- passed / failed / skipped 판별
- 실패 케이스는 에러 메시지 첫 줄을 원인으로 기록 (200자 이내)

---

## 5단계 — Notion 업데이트

`.notion-db-id`에서 DB ID를 읽어 `notion-fetch`로 TC 페이지 목록을 조회한 뒤,
케이스 ID가 일치하는 페이지에 아래 속성을 업데이트해.

> **이전 결과와 동일하더라도 항상 덮어쓸 것.** 사람이 수동으로 변경했을 수 있으므로 비교 없이 매 실행마다 갱신.

| 필드 | 성공 | 실패 | 스킵 |
|---|---|---|---|
| 통과여부 | checkbox: `true` | checkbox: `false` | 변경하지 않음 |
| 마지막 실행 | 현재 시각 (KST) | 현재 시각 (KST) | 변경하지 않음 |
| 실패 원인 | `null` (비우기) | `"❌ FAIL: [에러 메시지 첫 줄]"` | 변경하지 않음 |

---

## 6단계 — 최종 보고

- 실행 범위: 전체 테스트 케이스 수
- 통과 / 실패 / 스킵 수
- **자가 치유 요약**: 수정한 파일 목록과 수정 내용
- 여전히 실패한 TC 목록과 최종 원인 요약
