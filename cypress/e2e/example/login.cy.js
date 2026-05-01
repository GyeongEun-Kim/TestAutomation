// TC-001 ~ TC-003: 로그인 기능 테스트
// 노션 TC ID와 it() 블록이 1:1 매칭됨

const LoginPage = require('../../pages/LoginPage');

describe('[로그인] 인증 플로우', () => {
  beforeEach(() => {
    LoginPage.visit();
  });

  // TC-001
  it('[TC-001] 유효한 이메일/비밀번호로 로그인 성공', () => {
    cy.fixture('testData').then(({ validUser }) => {
      LoginPage.fillEmail(validUser.email);
      LoginPage.fillPassword(validUser.password);
      LoginPage.submit();
      cy.url().should('include', '/dashboard');
    });
  });

  // TC-002
  it('[TC-002] 잘못된 비밀번호 입력 시 에러 메시지 표시', () => {
    cy.fixture('testData').then(({ invalidUser }) => {
      LoginPage.fillEmail(invalidUser.email);
      LoginPage.fillPassword(invalidUser.password);
      LoginPage.submit();
      LoginPage.errorMessage().should('be.visible');
    });
  });

  // TC-003
  it('[TC-003] 이메일 미입력 시 유효성 검사 실패', () => {
    LoginPage.fillEmail('');
    LoginPage.fillPassword('anypassword');
    LoginPage.submit();
    cy.get('[data-cy="email"]').then(($el) => {
      expect($el[0].validationMessage).to.not.be.empty;
    });
  });
});
