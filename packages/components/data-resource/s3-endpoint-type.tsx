import * as React from 'react';
import {
  K8sResourceCommon,
  K8sVerb,
} from '@openshift-console/dynamic-plugin-sdk';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import {
  Button,
  FormGroup,
  TextInput,
  InputGroup,
  SelectOption,
  Alert,
  Dropdown,
  DropdownToggle,
} from '@patternfly/react-core';
import {
  StoreType,
  BC_PROVIDERS,
  DATA_FEDERATION_NAMESPACE,
  DEDICATED_ADMIN,
  EXCLUDED_PREFIX,
  EXCLUDED_NS,
} from '../../constants';
import { ProjectModel, SecretModel } from '../../models';
import { SecretKind } from '../../types';
import { awsRegionItems, endpointsSupported } from '../../utils';
import ResourceDropdown from '../../utils/dropdown/ResourceDropdown';
import { StaticDropdown } from '../../utils/dropdown/StaticDropdown';
import { LoadingBox } from '../../utils/generics/status-box';
import { useAccessReview } from '../../utils/hooks/rbac';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { projectResource, secretResource } from '../resources';
import {
  createFormAction,
  CreateFormAction,
  CreateFormDataState,
  initialStateCreateForm,
} from './reducer';
import './data-resource.scss';

type S3EndpointTypeProps = {
  type: StoreType;
  state: CreateFormDataState;
  dispatch: React.Dispatch<CreateFormAction>;
  provider: BC_PROVIDERS;
  namespace: string;
};

const isValidNS = (resource: K8sResourceCommon) => {
  const projectName = resource?.metadata?.name;
  return (
    !EXCLUDED_PREFIX.some((prefix) => projectName?.startsWith(prefix)) &&
    !EXCLUDED_NS.includes(projectName)
  );
};

const getUpdatedSecretResource = (namespace: string) => ({
  ...secretResource,
  namespace,
});

const regionDropdownOptions: (t: TFunction) => JSX.Element[] = (t) =>
  _.map(awsRegionItems, (v, _) => (
    <SelectOption key={v} value={v} data-test-dropdown-menu={v} />
  ));

export const S3EndPointType: React.FC<S3EndpointTypeProps> = (props) => {
  const { t } = useCustomTranslation();
  const { provider, state, dispatch, type } = props;
  const { secretNamespace } = state;

  const [showSecret, setShowSecret] = React.useState(true);

  const [isClusterAdmin, isClusterAdminLoading] = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'create' as K8sVerb,
    namespace: DATA_FEDERATION_NAMESPACE,
  });

  React.useEffect(() => {
    if (!isClusterAdminLoading && secretNamespace === '') {
      dispatch({
        type: createFormAction.SET_SECRET_NAMESPACE,
        value: isClusterAdmin ? DATA_FEDERATION_NAMESPACE : DEDICATED_ADMIN,
      });
    }
  }, [dispatch, isClusterAdmin, isClusterAdminLoading, secretNamespace]);

  // access particular to the selected namespace whether dedicated admin is having read access
  const [hasReadAccess, hasReadAccessLoading] = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'get' as K8sVerb,
    namespace: secretNamespace,
  });

  // access particular to the selected namespace whether dedicated admin is having write access
  const [hasWriteAccess, hasWriteAccessLoading] = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'create' as K8sVerb,
    namespace: secretNamespace,
  });

  const targetLabel =
    provider === BC_PROVIDERS.AZURE
      ? t('Target blob container')
      : t('Target bucket');
  const credentialField1Label =
    provider === BC_PROVIDERS.AZURE ? t('Account name') : t('Access key');
  const credentialField2Label =
    provider === BC_PROVIDERS.AZURE ? t('Account key') : t('Secret key');

  const switchToSecret = () => {
    setShowSecret(true);
    dispatch({
      type: createFormAction.SET_ACCESS_KEY,
      value: initialStateCreateForm.accessKey,
    });
    dispatch({
      type: createFormAction.SET_SECRET_KEY,
      value: initialStateCreateForm.secretKey,
    });
  };

  const switchToCredentials = () => {
    setShowSecret(false);
    dispatch({
      type: createFormAction.SET_SECRET_NAME,
      value: initialStateCreateForm.secretName,
    });
  };

  const getInitialNSSelection = React.useCallback(
    (resources: K8sResourceCommon[]) =>
      resources.find((res) => res?.metadata?.name === secretNamespace),
    [secretNamespace]
  );

  const getSecrets = React.useCallback(
    (resource: SecretKind) =>
      dispatch({
        type: createFormAction.SET_SECRET_NAME,
        value: resource?.metadata?.name,
      }),
    [dispatch]
  );

  const getSecretsNamespace = React.useCallback(
    (resource: K8sResourceCommon) => {
      dispatch({
        type: createFormAction.SET_SECRET_NAMESPACE,
        value: resource?.metadata?.name,
      });
      dispatch({
        type: createFormAction.SET_SECRET_NAME,
        value: initialStateCreateForm.secretName,
      });
    },
    [dispatch]
  );

  return (
    <>
      {provider === BC_PROVIDERS.AWS && (
        <FormGroup
          label={t('Region')}
          fieldId="region"
          className="nb-endpoints-form-entry"
          isRequired
        >
          <StaticDropdown
            aria-label={t('Region Dropdown')}
            id="region"
            className="nb-endpoints-form-entry__dropdown"
            onChange={(e) => {
              dispatch({ type: createFormAction.SET_REGION, value: e });
            }}
            selectOptions={regionDropdownOptions(t)}
            selections={state.region}
            data-test="aws-region-dropdown"
          />
        </FormGroup>
      )}

      {endpointsSupported.includes(provider) && (
        <FormGroup
          label={t('Endpoint')}
          fieldId="endpoint"
          className="nb-endpoints-form-entry"
          isRequired
        >
          <TextInput
            data-test={`${type.toLowerCase()}-s3-endpoint`}
            onChange={(e) => {
              dispatch({ type: createFormAction.SET_END_POINT, value: e });
            }}
            id="endpoint"
            value={state.endpoint}
            aria-label={t('Endpoint Address')}
          />
        </FormGroup>
      )}
      {isClusterAdminLoading ||
      hasReadAccessLoading ||
      hasWriteAccessLoading ? (
        <LoadingBox className="loading-box loading-box__loading" />
      ) : (
        <>
          <FormGroup
            label={t('Secret namespace')}
            fieldId="secret-creation-ns"
            isRequired
          >
            <InputGroup>
              <ResourceDropdown
                className="nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width"
                resource={projectResource}
                resourceModel={ProjectModel}
                onSelect={getSecretsNamespace}
                initialSelection={getInitialNSSelection}
                filterResource={isClusterAdmin ? undefined : isValidNS}
              />
            </InputGroup>
          </FormGroup>
          {showSecret && !hasReadAccess && (
            <Alert isInline variant="danger" title={t('Restricted Access')}>
              {t(
                "You don't have access to read Secrets from {{namespace}} namespace. Please select a different namespace.",
                { namespace: state.secretNamespace }
              )}
            </Alert>
          )}
          {!showSecret && !hasWriteAccess && (
            <Alert isInline variant="danger" title={t('Restricted Access')}>
              {t(
                "You don't have access to write Secrets to {{namespace}} namespace. Please select a different namespace.",
                { namespace: state.secretNamespace }
              )}
            </Alert>
          )}
          {showSecret ? (
            <FormGroup
              label={t('Secret')}
              fieldId="secret-dropdown"
              className="nb-endpoints-form-entry nb-endpoints-form-entry--full-width"
              isRequired
            >
              <InputGroup>
                {hasReadAccess ? (
                  <ResourceDropdown
                    className="nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width"
                    resource={getUpdatedSecretResource(secretNamespace)}
                    resourceModel={SecretModel}
                    onSelect={getSecrets}
                  />
                ) : (
                  <Dropdown
                    className="nb-endpoints-form-entry__dropdown nb-endpoints-form-entry__dropdown--full-width mcgms-disabledDropdown__container"
                    toggle={<DropdownToggle id="toggle-disabled" isDisabled />}
                  />
                )}
                <Button
                  variant="plain"
                  data-test="switch-to-credentials"
                  onClick={switchToCredentials}
                >
                  {t('Switch to Credentials')}
                </Button>
              </InputGroup>
            </FormGroup>
          ) : (
            <>
              <FormGroup
                label={credentialField1Label}
                fieldId="access-key"
                isRequired
              >
                <InputGroup>
                  <TextInput
                    id="access-key"
                    data-test={`${type.toLowerCase()}-access-key`}
                    value={state.accessKey}
                    onChange={(e) => {
                      dispatch({
                        type: createFormAction.SET_ACCESS_KEY,
                        value: e,
                      });
                    }}
                    aria-label={t('Access Key Field')}
                    isDisabled={!hasWriteAccess}
                  />
                  <Button variant="plain" onClick={switchToSecret}>
                    {t('Switch to Secret')}
                  </Button>
                </InputGroup>
              </FormGroup>
              <FormGroup
                className="nb-endpoints-form-entry"
                label={credentialField2Label}
                fieldId="secret-key"
                isRequired
              >
                <TextInput
                  value={state.secretKey}
                  id="secret-key"
                  data-test={`${type.toLowerCase()}-secret-key`}
                  onChange={(e) => {
                    dispatch({
                      type: createFormAction.SET_SECRET_KEY,
                      value: e,
                    });
                  }}
                  aria-label={t('Secret Key Field')}
                  type="password"
                  isDisabled={!hasWriteAccess}
                />
              </FormGroup>
            </>
          )}
        </>
      )}

      <FormGroup
        label={targetLabel}
        fieldId="target-bucket"
        className="nb-endpoints-form-entry"
        isRequired
      >
        <TextInput
          id="target-bucket"
          value={state.target}
          data-test={`${type.toLowerCase()}-target-bucket`}
          placeholder="Name of the target bucket"
          onChange={(e) =>
            dispatch({ type: createFormAction.SET_TARGET, value: e })
          }
          aria-label={targetLabel}
        />
      </FormGroup>
    </>
  );
};
