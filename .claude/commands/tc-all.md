tc-generate → tc-code → tc-run 을 순서대로 실행해.

각 단계를 아래 순서로 진행하되, 단계별로 완료 확인 후 다음 단계로 넘어가.
중간에 실패하면 즉시 멈추고 어느 단계에서 실패했는지 사용자에게 알려줘.

## 1단계 — tc-generate
`.claude/commands/tc-generate.md`의 지침을 그대로 따라 실행해.
완료되면 "✅ 1/3 tc-generate 완료"를 출력하고 다음 단계로 진행해.

## 2단계 — tc-code
`.claude/commands/tc-code.md`의 지침을 그대로 따라 실행해.
완료되면 "✅ 2/3 tc-code 완료"를 출력하고 다음 단계로 진행해.

## 3단계 — tc-run
`.claude/commands/tc-run.md`의 지침을 그대로 따라 실행해.
완료되면 "✅ 3/3 tc-run 완료"를 출력해.

## 최종 보고
세 단계 모두 완료 후 전체 결과를 요약해:
- 설계된 TC 수
- 작성된 테스트 파일 목록
- 테스트 실행 결과 (성공/실패/스킵)
- Notion 업데이트 완료 여부
