import * as React from 'react';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { DATA_FEDERATION_NAMESPACE, NS_PROGRESS } from '../../../constants';
import { NooBaaNamespaceStoreModel } from '../../../models';
import { NamespaceStoreKind, SecretKind } from '../../../types';
import { referenceForModel } from '../../../utils';
import { useCustomTranslation } from '../../../utils/hooks/useCustomTranslationHook';
import { CommonModalProps, ModalBody } from '../../../utils/modals/Modal';
import NamespaceStoreForm from '../../data-resource/data-resource-create-form';
import DataResourceStatus from './modal-status';

const NamespaceStoreModal: React.FC<NamespaceStoreModalProps> = (props) => {
  const { t } = useCustomTranslation();
  const { isOpen, closeModal } = props;
  const [name, setName] = React.useState('');
  const [isSubmit, setIsSubmit] = React.useState(false);
  const [timer, setTimer] = React.useState<NodeJS.Timer>(null);
  const [status, setStatus] = React.useState('');

  const redirectHandler = (resources: (NamespaceStoreKind | SecretKind)[]) => {
    // The modal will wait for 60 sec to get feedback from Noobaa
    const timeoutTimer = setTimeout(() => {
      setStatus(NS_PROGRESS.REJECTED);
      setIsSubmit(false);
    }, 60 * 1000);
    setName(resources[resources.length - 1]?.metadata?.name);
    setIsSubmit(true);
    setStatus(NS_PROGRESS.CREATING);
    setTimer(timeoutTimer);
  };

  const onClose = React.useCallback(() => {
    clearTimeout(timer);
    closeModal();
  }, [timer, closeModal]);

  const onTryAgain = React.useCallback(() => {
    setStatus('');
    setIsSubmit(false);
  }, [setStatus, setIsSubmit]);

  const nameSpaceStoreResource = React.useMemo(() => {
    return {
      kind: referenceForModel(NooBaaNamespaceStoreModel),
      namespaced: true,
      isList: false,
      namespace: DATA_FEDERATION_NAMESPACE,
      name,
    };
  }, [name]);

  const [dataResource, dataResourceLoaded, dataResourceError] =
    useK8sWatchResource<NamespaceStoreKind>(nameSpaceStoreResource);

  React.useEffect(() => {
    const validResponse = dataResourceLoaded && !dataResourceError;
    if (isSubmit) {
      if (validResponse && dataResource?.status?.phase === NS_PROGRESS.READY) {
        setStatus(NS_PROGRESS.READY);
        setIsSubmit(false);
        clearTimeout(timer);
      } else if (
        (validResponse &&
          dataResource?.status?.phase === NS_PROGRESS.REJECTED) ||
        (dataResourceLoaded && dataResourceError)
      ) {
        setStatus(NS_PROGRESS.REJECTED);
        setIsSubmit(false);
        clearTimeout(timer);
      }
    }
  }, [isSubmit, dataResource, dataResourceLoaded, dataResourceError, timer]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={ModalVariant.small}
      title={t('Add a new data source')}
      hasNoBodyWrapper={true}
    >
      <div className="data-resource__modal">
        <ModalBody>
          <p>
            {t(
              'Represents an underlying storage to be used as read or write target for the bucket policy.'
            )}
          </p>
          {!!status ? (
            <DataResourceStatus
              name={name}
              status={status}
              onCancel={onClose}
              onTryAgain={onTryAgain}
              data={dataResource}
              error={dataResourceError}
            />
          ) : (
            <NamespaceStoreForm
              namespace={DATA_FEDERATION_NAMESPACE}
              onCancel={onClose}
              redirectHandler={redirectHandler}
            />
          )}
        </ModalBody>
      </div>
    </Modal>
  );
};

type NamespaceStoreModalProps = CommonModalProps<{
  namespace: string;
}>;

export default NamespaceStoreModal;
