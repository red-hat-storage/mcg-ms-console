import {
  KUBEADMIN_IDP,
  KUBEADMIN_USERNAME,
  BRIDGE_PASSWORD,
  SECOND,
} from '../constants/common';
import { submitButton, masthead } from './views';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      login(
        provider?: string,
        username?: string,
        password?: string
      ): Chainable<Element>;
      logout(): Chainable<Element>;
    }
  }
}

Cypress.Commands.add(
  'login',
  (provider: string, username: string, password: string) => {
    // Check if auth is disabled (for a local development environment).
    cy.visit(''); // visits baseUrl which is set in plugins.js
    cy.window().then((win: any) => {
      if (win.SERVER_FLAGS?.authDisabled) {
        cy.task(
          'log',
          '  skipping login, console is running with auth disabled'
        );
        return;
      }
      // Make sure we clear the cookie in case a previous test failed to logout.
      cy.clearCookie('openshift-session-token');

      const idp = provider || KUBEADMIN_IDP;
      cy.task('log', ` Logging in as ${username || KUBEADMIN_USERNAME}`);
      if (Cypress.env('ADDON_IDS')) {
        // There are no data-* attributes on the HTPasswd button.
        // eslint-disable-next-line cypress/require-data-selectors
        cy.get('a', { timeout: 30 * SECOND })
          .contains('HTPasswd')
          .click();
      }
      cy.byLegacyTestID('login').should('be.visible');
      /* eslint-disable cypress/require-data-selectors */
      cy.get('body').then(($body) => {
        /* eslint-enable cypress/require-data-selectors */
        if ($body.text().includes(idp)) {
          cy.contains(idp).should('be.visible').click();
        }
      });
      /* eslint-disable cypress/require-data-selectors */
      cy.get('#inputUsername').type(username || KUBEADMIN_USERNAME);
      cy.get('#inputPassword').type(password || Cypress.env(BRIDGE_PASSWORD));
      cy.get(submitButton).click();
      /* eslint-enable cypress/require-data-selectors */
      masthead.username.shouldBeVisible();
    });
  }
);

Cypress.Commands.add('logout', () => {
  // Check if auth is disabled (for a local development environment).
  cy.window().then((win: any) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      cy.task(
        'log',
        '  skipping logout, console is running with auth disabled'
      );
      return;
    }
    cy.task('log', '  Logging out');
    cy.byTestID('user-dropdown').click();
    cy.byTestID('log-out').should('be.visible');
    cy.byTestID('log-out').click({ force: true }); // eslint-disable-line cypress/no-force
    cy.byLegacyTestID('login').should('be.visible');
  });
});
