import { BUCKET_CLAIM_NAME } from '../constants/tests';
import { app } from '../views/common';

describe('Object Bucket Claims page', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.clickNavLink(['Storage', 'Object Bucket Claims']);
    app.waitForLoad();
  });

  after(() => {
    cy.logout();
  });
  it('creates an Object Bucket Claim', () => {
    cy.intercept('/api/kubernetes/apis/storage.k8s.io/v1/storageclasses*').as(
      'listStorageClasses'
    );
    cy.byTestID('item-create').click();
    cy.wait('@listStorageClasses');
    cy.byTestID('obc-name').type(BUCKET_CLAIM_NAME);
    cy.byTestID('sc-dropdown-toggle').click();
    cy.byTestID('sc-dropdown').find('li').first().click();
    cy.byTestID('obc-create').click();
    cy.byTestSelector('details-item-value__Name').should(
      'contain',
      BUCKET_CLAIM_NAME
    );
    cy.byTestID('status-text').should('contain', 'Bound');
  });

  it('deletes an Object Bucket Claim', () => {
    cy.byLegacyTestID(BUCKET_CLAIM_NAME).first().click();
    cy.byTestID('details-actions').find('button').click();
    cy.byTestID('details-actions').find('li').last().click();
    cy.byTestID('delete-action').click();
    cy.byLegacyTestID(BUCKET_CLAIM_NAME).should('not.exist');
  });
});
