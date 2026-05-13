너는 QA 자동화 엔지니어야. Playwright 테스트를 실행하고, 실패 시 자가 치유를 시도한 뒤 결과를 Notion DB에 업데이트하는 게 목표야.

---

## 1단계 — 사전 확인
- `.env`에서 PROJECT_NAME이 올바른지 확인해. 비어있으면 중단하고 알려줘.
- `.notion-db-id` 파일이 없으면 "/tc-generate를 먼저 실행해주세요"라고 안내하고 중단해.
- `tests/{PROJECT_NAME}/` 폴더에 테스트 파일이 존재하는지 확인해. 없으면 "/tc-code를 먼저 실행해주세요"라고 안내하고 중단해.

---

## 2단계 — 실행 범위 결정 및 테스트 실행
`tests/{PROJECT_NAME}/*.spec.js` 파일 수를 기준으로 자동 분기:

- **5개 미만**: 단일 실행
  ```
  npx playwright test tests/{PROJECT_NAME}
  ```
- **5개 이상**: `--workers` 옵션으로 병렬 실행
  ```
  npx playwright test tests/{PROJECT_NAME} --workers=4
  ```

---

## 3단계 — 자가 치유 프로세스
실패한 케이스가 있다면 아래 절차를 **최대 2회** 시도해:
1. Playwright MCP로 해당 페이지를 직접 열어서 실제 DOM 구조를 다시 확인해.
2. 실패 원인이 셀렉터 문제라면, [2단계 셀렉터 규칙]에 맞춰 `pages/{PROJECT_NAME}/selectors.json` 및 관련 Page Object 코드를 수정해.
3. 수정 후 해당 실패한 테스트 파일만 단독 재실행하여 검증해:
   ```
   npx playwright test {파일명}
   ```

---

## 4단계 — 결과 파싱
`test-results/results.json`을 읽어 다음 정보를 추출해:
- 테스트 제목에서 `[C-XXX]` 패턴으로 TC ID 추출
- 성공(passed) / 실패(failed) / 스킵(skipped) 판별
- 실패 케이스는 에러 메시지 첫 줄을 원인으로 기록 (200자 이내)

---

## 5단계 — Notion 업데이트
`.notion-db-id` 파일에서 DB ID를 읽어와 Notion MCP 도구로 DB 내 TC 페이지 목록을 조회해.
케이스 ID가 일치하는 노션 페이지에 아래 속성을 업데이트해:

- `통과여부`: 성공 시 `true`, 실패 시 `false`
- `마지막 실행`: 현재 시각 (KST)
- `실패 원인`: 성공 시 비워두고, 실패 시 `"❌ FAIL: [에러 메시지 첫 줄]"` 기록

---

## 6단계 — 최종 보고
- 실행 범위: 전체 테스트 케이스 수
- 통과 / 실패 / 스킵 수
- **자가 치유 요약**: AI가 스스로 수정한 파일 목록과 수정된 셀렉터 내용
- 여전히 실패한 TC 목록과 최종 원인 요약
