// 로그인 커맨드 — .env의 LOGIN_ID / LOGIN_PW 사용
Cypress.Commands.add('login', (email, password) => {
  const id = email || Cypress.env('LOGIN_ID');
  const pw = password || Cypress.env('LOGIN_PW');
  cy.visit('/login');
  cy.get('[data-cy="email"]').type(id);
  cy.get('[data-cy="password"]').type(pw);
  cy.get('[data-cy="submit"]').click();
});
