import { DATA_FEDERATION_NAMESPACE, MINUTE } from '../constants/common';
import {
  AWS_CREDS_EXIST,
  DATA_SOURCE_INPUTS,
  Providers,
  TEST_DATA_SOURCE,
} from '../constants/tests';
import { app } from '../views/common';
import {
  checkDataSourceCreation,
  createDataSource,
  createFormInputValidation,
  deleteDataSourceResources,
  deleteUsingDetailsPageKebabMenu,
  navigateToCreatePage,
  navigateToListPageViaBreadCrumbs,
} from '../views/data-resource';
import { MCGMSCommon } from '../views/mcg-ms-common';

describe('data source creation', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    MCGMSCommon.visitDataSourceListPage();
    navigateToCreatePage();
    app.waitForLoad();
  });

  afterEach(() => {
    deleteUsingDetailsPageKebabMenu(TEST_DATA_SOURCE);
    deleteDataSourceResources(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
  });

  after(() => {
    cy.logout();
  });

  it('creates a data source having AWS as the provider', () => {
    cy.onlyOn(AWS_CREDS_EXIST);
    createDataSource(Providers.AWS, TEST_DATA_SOURCE);
    checkDataSourceCreation(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
    cy.byTestID(`status-text`).should('contain', 'Ready');
  });

  it('creates a data source having S3 Compatible as the provider', () => {
    createDataSource(Providers.S3, TEST_DATA_SOURCE);
    checkDataSourceCreation(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
  });

  it('creates a data source having Azure Blob as the provider', () => {
    createDataSource(Providers.AZURE, TEST_DATA_SOURCE);
    checkDataSourceCreation(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
  });

  it('creates a data source having IBM COS as the provider', () => {
    createDataSource(Providers.IBM, TEST_DATA_SOURCE);
    checkDataSourceCreation(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
  });
});

describe('data source deletion', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    MCGMSCommon.visitDataSourceListPage();
    navigateToCreatePage();
    app.waitForLoad();
    createDataSource(Providers.AWS, TEST_DATA_SOURCE);
    checkDataSourceCreation(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE, false);
  });

  afterEach(() => {
    deleteDataSourceResources(TEST_DATA_SOURCE, DATA_FEDERATION_NAMESPACE);
  });

  after(() => {
    cy.logout();
  });

  it('checks the data source is successfully deleted from the details page', () => {
    deleteUsingDetailsPageKebabMenu(TEST_DATA_SOURCE);
  });

  it('checks the data source is successfully deleted from the list page', () => {
    navigateToListPageViaBreadCrumbs(TEST_DATA_SOURCE);
    cy.log(`deleting ${TEST_DATA_SOURCE} from the list page using kebab menu`);
    cy.byTestRows('resource-row')
      .should('contain', TEST_DATA_SOURCE)
      .byTestID(`${TEST_DATA_SOURCE}-kebab`)
      .click();
    cy.byTestDropDownMenu('delete-data-source').click();
    cy.byTestID('delete-action').click();
    cy.byTestRows('resource-row', { timeout: 2 * MINUTE }).should('not.exist'); // kept it 2 minute as sometimes the list page takes times to reflect the changes
  });
});

describe('data source creation input validation', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    MCGMSCommon.visitDataSourceListPage();
    navigateToCreatePage();
    app.waitForLoad();
  });

  after(() => {
    cy.logout();
  });

  it('should not create data source as name is missing', () => {
    const inputData = { ...DATA_SOURCE_INPUTS, name: undefined };
    createFormInputValidation(inputData);
  });

  it('should not create data source as name exceeds its length limit', () => {
    const inputData = {
      ...DATA_SOURCE_INPUTS,
      name: 'any-random-long-name-which-is-greater-than-',
    };
    createFormInputValidation(inputData);
    cy.byTestID('create-form-name-tooltip').should('be.visible');
  });

  it('should not create data source as access key is missing', () => {
    const inputData = { ...DATA_SOURCE_INPUTS, accessKey: undefined };
    createFormInputValidation(inputData);
  });

  it('should not create data source as secret key is missing', () => {
    const inputData = { ...DATA_SOURCE_INPUTS, secretKey: undefined };
    createFormInputValidation(inputData);
  });

  it('should not create data source as target bucket is missing', () => {
    const inputData = { ...DATA_SOURCE_INPUTS, targetBucket: undefined };
    createFormInputValidation(inputData);
  });

  it('should not create data source as endpoint is missing for S3 compatible', () => {
    const inputData = {
      ...DATA_SOURCE_INPUTS,
      enterEndpoint: false,
      provider: Providers.S3,
    };
    createFormInputValidation(inputData);
  });

  it('should not create data source as endpoint is missing for IBM COS', () => {
    const inputData = {
      ...DATA_SOURCE_INPUTS,
      enterEndpoint: false,
      provider: Providers.IBM,
    };
    createFormInputValidation(inputData);
  });
});
