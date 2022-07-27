import * as React from 'react';
import {
  getAPIVersionForModel,
  k8sCreate,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match, useHistory } from 'react-router';
import { ActionGroup, Button } from '@patternfly/react-core';
import { DATA_FEDERATION_NAMESPACE } from '../../constants';
import {
  StorageClassModel,
  NooBaaObjectBucketClaimModel,
  NooBaaBucketClassModel,
} from '../../models';
import { K8sResourceKind, StorageClassResourceKind } from '../../types';
import { referenceForModel, resourcePathFromModel } from '../../utils';
import ResourceDropdown from '../../utils/dropdown/ResourceDropdown';
import { ButtonBar } from '../../utils/generics/ButtonBar';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { getName } from '../../utils/selectors/k8s';
import { Action, commonReducer, defaultState, State } from './state';
import './create-obc.scss';

type CreateOBCFormProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  namespace?: string;
};

export const NB_PROVISIONER = 'noobaa.io/obc';

const objectStorageProvisioners = [
  `${DATA_FEDERATION_NAMESPACE}.noobaa.io/obc`,
];

export const isObjectSC = (sc: StorageClassResourceKind) =>
  objectStorageProvisioners.includes(_.get(sc, 'provisioner'));

export const CreateOBCForm: React.FC<CreateOBCFormProps> = (props) => {
  const { t } = useCustomTranslation('plugin__mcg-ms-console');
  const { state, dispatch, namespace } = props;
  const isNoobaa = state.scProvisioner?.includes(NB_PROVISIONER);

  const onScChange = (sc) => {
    dispatch({ type: 'setStorage', name: getName(sc) });
    dispatch({ type: 'setProvisioner', name: sc?.provisioner });
  };

  React.useEffect(() => {
    const obj: K8sResourceKind = {
      apiVersion: getAPIVersionForModel(NooBaaObjectBucketClaimModel),
      kind: NooBaaObjectBucketClaimModel.kind,
      metadata: {
        namespace,
      },
      spec: {
        ssl: false,
      },
    };
    if (state.scName) {
      obj.spec.storageClassName = state.scName;
    }
    if (state.name) {
      obj.metadata.name = state.name;
      obj.spec.generateBucketName = state.name;
    } else {
      obj.metadata.generateName = 'bucketclaim-';
      obj.spec.generateBucketName = 'bucket-';
    }
    if (state.bucketClass && isNoobaa) {
      obj.spec.additionalConfig = { bucketclass: state.bucketClass };
    }
    dispatch({ type: 'setPayload', payload: obj });
  }, [
    namespace,
    state.name,
    state.scName,
    state.bucketClass,
    isNoobaa,
    dispatch,
  ]);

  const storageClassResource = {
    kind: StorageClassModel.kind,
    namespaced: false,
    isList: true,
  };

  const bucketClassResource = {
    kind: referenceForModel(NooBaaBucketClassModel),
    namespaced: true,
    isList: true,
    namespace: DATA_FEDERATION_NAMESPACE,
  };

  const getInitialSelection = React.useCallback(
    (resources) =>
      resources.find(
        (res) => res.metadata.name === 'noobaa-default-bucket-class'
      ),
    []
  );

  return (
    <div>
      <div className="form-group">
        <label className="control-label" htmlFor="obc-name">
          {t('Object bucket claim name')}
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={(e) =>
              dispatch({ type: 'setName', name: e.currentTarget.value.trim() })
            }
            value={state.name}
            placeholder={t('my-object-bucket-claim')}
            aria-describedby="obc-name-help"
            id="obc-name"
            data-test="obc-name"
            name="obcName"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
          />
          <p className="help-block" id="obc-name-help">
            {t('If not provided a generic name will be generated.')}
          </p>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="sc-dropdown">
            {t('Storage class')}
          </label>
          <div className="form-group">
            <ResourceDropdown<StorageClassResourceKind>
              resourceModel={StorageClassModel}
              onSelect={(res) => onScChange(res)}
              filterResource={isObjectSC}
              className="odf-mcg__resource-dropdown"
              id="sc-dropdown"
              data-test="sc-dropdown"
              resource={storageClassResource}
            />
            <p className="help-block">
              {t(
                'Defines the object-store service and the bucket provisioner.'
              )}
            </p>
          </div>
        </div>
        {isNoobaa && (
          <div className="form-group">
            <label className="control-label co-required" htmlFor="obc-name">
              {t('Bucket policy')}
            </label>
            <div className="form-group">
              <ResourceDropdown<K8sResourceKind>
                onSelect={(sc) =>
                  dispatch({ type: 'setBucketClass', name: sc.metadata?.name })
                }
                className="odf-mcg__resource-dropdown"
                initialSelection={getInitialSelection}
                id="bc-dropdown"
                data-test="bc-dropdown"
                resource={bucketClassResource}
                resourceModel={NooBaaBucketClassModel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CreateOBCPage: React.FC<CreateOBCPageProps> = (props) => {
  const { t } = useCustomTranslation('plugin__mcg-ms-console');
  const [state, dispatch] = React.useReducer(commonReducer, defaultState);
  const namespace = props.match.params.ns || 'default';

  const history = useHistory();

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    dispatch({ type: 'setProgress' });
    k8sCreate<K8sResourceKind>({
      model: NooBaaObjectBucketClaimModel,
      data: state.payload,
    })
      .then((resource) => {
        dispatch({ type: 'unsetProgress' });

        history.push(
          `${resourcePathFromModel(
            NooBaaObjectBucketClaimModel,
            resource.metadata.name,
            resource.metadata.namespace
          )}`
        );
      })
      .catch((err) => {
        dispatch({ type: 'setError', message: err.message });
        dispatch({ type: 'unsetProgress' });
      });
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{t('Create new object bucket claim')}</title>
      </Helmet>
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{t('Create object bucket claim')}</div>
      </h1>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <CreateOBCForm
          state={state}
          dispatch={dispatch}
          namespace={namespace}
        />
        <ButtonBar errorMessage={state.error} inProgress={state.progress}>
          <ActionGroup className="pf-c-form">
            <Button data-test="obc-create" type="submit" variant="primary">
              {t('Create')}
            </Button>
            <Button onClick={history.goBack} type="button" variant="secondary">
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

type CreateOBCPageProps = {
  match: match<{ ns?: string }>;
};
