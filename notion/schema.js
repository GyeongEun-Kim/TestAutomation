// 노션 TC 데이터베이스 스키마 정의
const DB_SCHEMA = {
  'TC ID':      { type: 'title' },
  '제목':        { type: 'rich_text' },
  '분류':        { type: 'select', options: ['로그인', '회원가입', '결제', '마이페이지', '기타'] },
  '우선순위':    { type: 'select', options: ['High', 'Medium', 'Low'] },
  '상태':        { type: 'select', options: ['미실행', '성공', '실패', '스킵'] },
  '실패 원인':   { type: 'rich_text' },
  '마지막 실행': { type: 'date' },
};

module.exports = { DB_SCHEMA };
