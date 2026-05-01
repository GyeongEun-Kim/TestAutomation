// 프로젝트: example
// 공통 TC — 페이지 기본 상태 점검 (프로젝트별 URL/셀렉터에 맞게 수정)

describe('[공통] 페이지 기본 상태', () => {

  // TC-C001
  it('[TC-C001] 메인 페이지가 200으로 정상 로드된다', () => {
    cy.visit('/');
    cy.title().should('not.be.empty');
  });

  // TC-C002
  it('[TC-C002] 존재하지 않는 경로 접근 시 404 페이지를 표시한다', () => {
    cy.request({ url: '/this-page-does-not-exist', failOnStatusCode: false })
      .its('status')
      .should('eq', 404);
  });

  // TC-C003
  it('[TC-C003] 필수 메타 태그(description)가 존재한다', () => {
    cy.visit('/');
    cy.get('meta[name="description"]').should('exist');
  });

});
