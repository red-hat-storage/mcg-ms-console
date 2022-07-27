import * as React from 'react';
import {
  useK8sWatchResource,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import {
  Form,
  FormGroup,
  TextInput,
  SelectVariant,
  Radio,
} from '@patternfly/react-core';
import { BucketClassType, DATA_FEDERATION_NAMESPACE } from '../../constants';
import {
  NooBaaNamespaceStoreModel,
  ProjectModel,
  NooBaaObjectBucketClaimModel,
} from '../../models';
import { NamespaceStoreKind, K8sResourceKind } from '../../types';
import { referenceForModel } from '../../utils';
import { GenericDropdown } from '../../utils/dropdown/GenericDropdown';
import ResourceDropdown from '../../utils/dropdown/ResourceDropdown';
import { StatusBox } from '../../utils/generics/status-box';
import { useDeepCompareMemoize } from '../../utils/hooks/deep-compare-memoize';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { LaunchModal } from '../../utils/modals/modalLauncher';
import { getNamespace } from '../../utils/selectors/k8s';
import {
  SingleDataResource,
  MultiDataResource,
} from './data-resource-dropdowns';
import {
  ReplicationOBC,
  BucketPolicyState,
  BucketPolicyAction,
  BucketPolicyActionType,
} from './state';

const projectResource = {
  isList: true,
  kind: ProjectModel.kind,
};
const bucketClaimResource = {
  kind: referenceForModel(NooBaaObjectBucketClaimModel),
  isList: true,
};

export const BucketPolicyBody: React.FC<BucketPolicyBodyProps> = ({
  ns,
  state,
  dispatch,
  launchModal,
}) => {
  const { t } = useCustomTranslation();

  const replicationObj = useDeepCompareMemoize(state.replicationOBC, true);
  const replicationOBCs = React.useMemo(
    () => replicationObj.map((obj) => obj.obcName),
    [replicationObj]
  );

  const onChangeReplication: onChangeReplicationSelectProps = React.useCallback(
    (resource) => {
      const alreadyIncluded = replicationObj.some(
        (obj) => obj.obcName === resource?.metadata?.name
      );
      const payload: ReplicationOBC[] = alreadyIncluded
        ? replicationObj.filter(
            (obj) => obj.obcName !== resource?.metadata?.name
          )
        : [
            ...replicationObj,
            {
              obcName: resource?.metadata?.name,
              targetBucket: resource?.spec?.bucketName,
            },
          ];
      dispatch({
        type: BucketPolicyActionType.SET_REPLICATION_OBC,
        payload,
      });
    },
    [replicationObj, dispatch]
  );

  const nameSpaceStoreResource = React.useMemo(() => {
    const nssResource = {
      kind: referenceForModel(NooBaaNamespaceStoreModel),
      namespace: ns,
      isList: true,
    };
    return nssResource;
  }, [ns]);

  const [dataResources, dataResourcesLoaded, dataResourcesError] =
    useK8sWatchResource<NamespaceStoreKind[]>(nameSpaceStoreResource);

  const isSingleDataReource = state.dataResourceType === BucketClassType.SINGLE;
  const showDataResource = dataResourcesLoaded && !dataResourcesError;

  const getInitialSelection = React.useCallback(
    (resources: K8sResourceCommon[]) =>
      resources.find(
        (resource) => resource.metadata.name === DATA_FEDERATION_NAMESPACE
      ),
    []
  );

  const onSelect = React.useCallback(
    (resource: K8sResourceCommon) =>
      dispatch({
        type: BucketPolicyActionType.SET_OBC_NAMESPACE,
        payload: resource.metadata.name,
      }),
    [dispatch]
  );

  return (
    <Form>
      <FormGroup fieldId="bucket-name" label={t('Bucket name')} isRequired>
        <TextInput
          value={state?.bucketName}
          onChange={(name) =>
            dispatch({
              type: BucketPolicyActionType.SET_BUCKET_NAME,
              payload: name,
            })
          }
          type="text"
          placeholder="my-bucket-policy"
          id="bucket-name"
          name="bucket-name"
          data-test="bucket-name-text"
        />
      </FormGroup>
      <FormGroup
        fieldId="data-source-type"
        label={t('Data source type')}
        className="create-bucket-policy__source-type--margin-bottom"
        isRequired
      >
        <div className="create-bucket-policy__form--margin-bottom">
          <Radio
            label={t('Single data source')}
            name="data-source-type"
            id="single-data-source"
            description={t(
              'The bucket reads and writes data to a single data source.'
            )}
            onClick={() =>
              dispatch({
                type: BucketPolicyActionType.SET_RESOURCE_TYPE,
                payload: BucketClassType.SINGLE,
              })
            }
            checked={isSingleDataReource}
          />
          {isSingleDataReource &&
            (showDataResource ? (
              <SingleDataResource
                data={dataResources}
                state={state}
                launchModal={launchModal}
                dispatch={dispatch}
              />
            ) : (
              <StatusBox
                loadError={dataResourcesError}
                loaded={dataResourcesLoaded}
              />
            ))}
        </div>
        <Radio
          label={t('Multi data source')}
          name="data-source-type"
          id="multi-data-source"
          description={t(
            'The bucket reads from several selected data sources, creating a virtual namespace on top of them, and writes into one of those.'
          )}
          onClick={() =>
            dispatch({
              type: BucketPolicyActionType.SET_RESOURCE_TYPE,
              payload: BucketClassType.MULTI,
            })
          }
          checked={!isSingleDataReource}
        />
        {!isSingleDataReource &&
          (showDataResource ? (
            <MultiDataResource
              data={dataResources}
              state={state}
              launchModal={launchModal}
              dispatch={dispatch}
            />
          ) : (
            <StatusBox
              loadError={dataResourcesError}
              loaded={dataResourcesLoaded}
            />
          ))}
      </FormGroup>
      <FormGroup fieldId="namespace-name" label={t('Namespace')} isRequired>
        <p className="pf-c-form__helper-text">
          {t('Creates object bucket claim in the specified namespace.')}
        </p>
        <ResourceDropdown
          id="namespace-name"
          onSelect={onSelect}
          className="buckets__namespace-dropdown--width"
          resource={projectResource}
          resourceModel={ProjectModel}
          initialSelection={getInitialSelection}
          showBadge={false}
          data-test="namespace-dropdown"
        />
      </FormGroup>
      <FormGroup fieldId="replication" label={t('Replication')}>
        <p className="pf-c-form__helper-text">
          {t('Optionally, select the bucket you want to replicate data to.')}
        </p>
        <GenericDropdown
          id="replication"
          variant={SelectVariant.checkbox}
          onChangeSelectOps={onChangeReplication}
          resource={bucketClaimResource}
          selections={replicationOBCs}
          secondaryTextGenerator={getNamespace}
        />
      </FormGroup>
    </Form>
  );
};

type onChangeReplicationSelectProps = (resource: K8sResourceKind) => void;

type BucketPolicyBodyProps = {
  ns: string;
  state: BucketPolicyState;
  dispatch: React.Dispatch<BucketPolicyAction>;
  launchModal?: LaunchModal;
};
