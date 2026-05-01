class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email) {
    cy.get('[data-cy="email"]').clear().type(email);
  }

  fillPassword(pw) {
    cy.get('[data-cy="password"]').clear().type(pw);
  }

  submit() {
    cy.get('[data-cy="submit"]').click();
  }

  errorMessage() {
    return cy.get('[data-cy="error-message"]');
  }
}

module.exports = new LoginPage();
