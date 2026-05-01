Cypress 테스트를 실행하고 결과를 Notion에 업데이트해.

## 1단계 — 사전 확인
- `.env`에서 PROJECT_NAME을 읽어. placeholder거나 비어있으면 중단하고 알려줘.
- `cypress/e2e/{PROJECT_NAME}/` 폴더에 테스트 파일이 존재하는지 확인해. 없으면 "/tc-code를 먼저 실행해주세요"라고 안내하고 중단해.
- `.notion-db-id` 파일이 없으면 "/tc-generate를 먼저 실행해주세요"라고 안내하고 중단해.
- `cypress/results/` 폴더가 없으면 생성해.

## 2단계 — 실행 대상 스펙 결정
아래 두 경로의 스펙 파일을 수집해:
- 프로젝트 전용: `cypress/e2e/{PROJECT_NAME}/*.cy.js`
- 프로젝트 공통: `cypress/e2e/common/{PROJECT_NAME}_*.cy.js`

## 3단계 — Cypress 실행

**스펙 파일이 5개 미만이면** — 단일 프로세스:
```bash
npx cypress run \
  --spec "cypress/e2e/{PROJECT_NAME}/*.cy.js,cypress/e2e/common/{PROJECT_NAME}_*.cy.js" \
  --reporter json \
  --reporter-options "output=cypress/results/results.json"
```

**스펙 파일이 5개 이상이면** — 병렬 실행:
CPU 코어 수 기준으로 스펙 파일을 그룹으로 나눠 각 그룹을 백그라운드로 동시 실행해:
```bash
npx cypress run --spec "{그룹1 파일목록}" --reporter json --reporter-options "output=cypress/results/results-0.json" &
npx cypress run --spec "{그룹2 파일목록}" --reporter json --reporter-options "output=cypress/results/results-1.json" &
wait
```
모든 그룹 완료 후 결과 JSON들을 읽어 `cypress/results/results.json` 하나로 병합해.

## 4단계 — 결과 파싱
`cypress/results/results.json`을 읽어 다음 정보를 추출해:
- 각 `it()` 블록 제목에서 `[TC-XXX]` 또는 `[TC-CXXX]` 패턴으로 TC ID 추출
- 성공 / 실패 / 스킵 판별
- 실패 케이스는 에러 메시지 첫 줄을 원인으로 기록 (200자 이내)

## 5단계 — Notion 업데이트
`.notion-db-id`에서 DB ID를 읽어. Notion MCP 도구로 DB 내 TC 페이지 목록을 조회해서 TC ID → 페이지 ID 매핑을 만들어.

각 TC 결과에 대해 `notion-update-page` 도구로 아래 속성을 업데이트해:
- `상태`: 성공 / 실패 / 스킵
- `마지막 실행`: 현재 시각
- `실패 원인`: 실패 시 에러 메시지 첫 줄 (성공·스킵이면 비워)

## 6단계 — 최종 보고
- 실행 범위: 프로젝트 전용 N개 + 공통 N개 스펙
- 전체 / 성공 / 실패 / 스킵 수 (병렬 실행 시 그룹별 소요 시간 포함)
- 실패한 TC 목록 + 원인 한 줄 요약
- 실패 스크린샷 경로 (cypress/screenshots/)
- Notion 업데이트 완료 여부
