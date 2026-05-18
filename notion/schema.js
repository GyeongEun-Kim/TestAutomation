// tc-generate가 생성하는 Notion TC 데이터베이스 스키마
// 실제 DB 생성은 notion-create-database MCP 도구로 처리 (이 파일은 참고용)
const DB_SCHEMA = {
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
};

module.exports = { DB_SCHEMA };
