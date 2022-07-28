import { DATA_FEDERATION_NAMESPACE, SECOND, MINUTE } from '../constants/common';
import {
  SINGLE_BUCKET_POLICY,
  PVC_NAME,
  DATA_SOURCE_NAME_NSFS,
} from '../constants/tests';
import { dataSourceNSFS } from '../mocks/data-source';
import { projectNameSpace } from '../views/common';
import { MCGMSCommon } from '../views/mcg-ms-common';
import { pvc } from '../views/pvc';

describe('Bucket policy page', () => {
  before(() => {
    cy.login();
    cy.clickNavLink(['Storage', 'PersistentVolumeClaims']);
    projectNameSpace.selectOrCreateProject(DATA_FEDERATION_NAMESPACE);
    pvc.createPVC(PVC_NAME, '1', 'gp2', false);
  });

  beforeEach(() => {
    MCGMSCommon.visitBucketPolicyList();
  });

  after(() => {
    /**
     * Need some time for BucketClass to get cleaned-up properly before deleting NamespaceStore,
     * else we get an error from server: admission webhook "admissionwebhook.noobaa.io" denied the request:
     * cannot complete because nsr "e2e-nsfs-data-source" in "IN_USE" state.
     * Even though BucketClass is actually deleted, there is some deplay for it to get reflected for NamespaceStore.
     */
    cy.wait(30 * SECOND);
    cy.exec(
      `oc delete namespacestores ${DATA_SOURCE_NAME_NSFS} -n ${DATA_FEDERATION_NAMESPACE}`,
      { failOnNonZeroExit: false }
    ).then(() => {
      cy.exec(`oc delete pvc ${PVC_NAME} -n ${DATA_FEDERATION_NAMESPACE}`, {
        timeout: 3 * MINUTE,
        failOnNonZeroExit: false,
      });
    });

    cy.logout();
  });

  // ToDo(Sanjal): Need to refactor and add more test blocks for "Multi" and "Cache" types as well.
  // right now we are only creating "nsfs" (FileSystem) type NamespaceStore which is only allowed with BucketClass of type "Single".
  it('creates Bucket policy with single data source', () => {
    cy.exec(
      `echo '${JSON.stringify(
        dataSourceNSFS(DATA_SOURCE_NAME_NSFS, PVC_NAME, 'e2e-subPath')
      )}' | oc create -f -`
    ).then(() => {
      cy.byTestID('item-create').click();
      cy.byTestID('bucket-name-text').type(SINGLE_BUCKET_POLICY);
      cy.byTestID('read-write-dropdown')
        .should('be.visible')
        .find('button')
        .first()
        .click();
      cy.contains(DATA_SOURCE_NAME_NSFS).click();
      cy.byTestID('namespace-dropdown')
        .should('be.visible')
        .contains(DATA_FEDERATION_NAMESPACE);
      cy.log('Create bucket policy');
      cy.byTestID('confirm-action-bucket').click();
      cy.log('Verify bucket policy created');
      cy.byTestSelector('details-item-value__Name').should(
        'contain',
        SINGLE_BUCKET_POLICY
      );
      cy.log('Verify bucket policy is Ready');
      cy.byTestID('status-text').should('contain', 'Ready');
      cy.log('Verify only 1 data source is connected');
      cy.byTestID('mcg-resource-popover')
        .should('be.visible')
        .should('contain', '1 resources');
      cy.log('Verify name of the connected data source');
      cy.byTestID('mcg-resource-popover').should('be.visible').click();
      cy.contains(DATA_SOURCE_NAME_NSFS);
      cy.log('Verify if OBC is created or not');
      cy.byTestID('obc-resource-popover')
        .should('be.visible')
        .should('contain', '1 Object bucket claims');
    });
  });

  it('deletes created Bucket policy', () => {
    cy.byTestID(SINGLE_BUCKET_POLICY).first().click();
    cy.byTestID('details-actions').find('button').click();
    cy.byTestID('details-actions').find('li').last().click();
    cy.byTestID('delete-action').click();
    cy.byTestID(SINGLE_BUCKET_POLICY).should('not.exist');
  });
});
