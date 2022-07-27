import * as React from 'react';
import { TFunction } from 'i18next';
import {
  Alert,
  ActionGroup,
  Button,
  ButtonVariant,
  ButtonType,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import { NS_PROGRESS } from '../../../constants';
import { NamespaceStoreKind } from '../../../types';
import { LoadingComponent } from '../../../utils/generics/Loading';
import { useCustomTranslation } from '../../../utils/hooks/useCustomTranslationHook';

const STATUS_BODY = (t: TFunction) => ({
  [NS_PROGRESS.CREATING]: {
    icon: LoadingComponent,
    desc: t('plugin__mcg-ms-console~Connecting to the bucket'),
    className: '',
  },
  [NS_PROGRESS.READY]: {
    icon: CheckCircleIcon,
    desc: t(
      'plugin__mcg-ms-console~The data source has been successfully added.'
    ),
    className: 'data-resource-modal__check-icon',
  },
  [NS_PROGRESS.REJECTED]: {
    icon: ExclamationCircleIcon,
    desc: t(
      'plugin__mcg-ms-console~Could not connect to the bucket. Verify the data source configuration, and try again.'
    ),
    className: 'data-resource-modal__error-icon',
  },
});

const STATUS_CONDITIONS = {
  [NS_PROGRESS.CREATING]: 'warning',
  [NS_PROGRESS.READY]: 'success',
  [NS_PROGRESS.REJECTED]: 'danger',
};

const STATUS_FOOTER: STATUSFOOTER = (t, onCancel, onTryAgain) => ({
  [NS_PROGRESS.CREATING]: [
    {
      id: 'creating-action-add',
      label: t('plugin__mcg-ms-console~Add'),
      type: ButtonType.submit,
      variant: ButtonVariant.primary,
      disable: true,
      loading: true,
    },
    {
      id: 'creating-action-cancel',
      label: t('plugin__mcg-ms-console~Cancel'),
      type: ButtonType.submit,
      variant: ButtonVariant.secondary,
      onClick: onCancel,
    },
  ],
  [NS_PROGRESS.READY]: [
    {
      id: 'ready-action-finish',
      label: t('plugin__mcg-ms-console~Finish'),
      type: ButtonType.submit,
      variant: ButtonVariant.primary,
      onClick: onCancel,
    },
  ],
  [NS_PROGRESS.REJECTED]: [
    {
      id: 'rejected-action-finish',
      label: t('plugin__mcg-ms-console~Finish'),
      type: ButtonType.submit,
      variant: ButtonVariant.primary,
      onClick: onCancel,
    },
    {
      id: 'rejected-action-try-again',
      label: t('plugin__mcg-ms-console~Try again'),
      type: ButtonType.submit,
      variant: ButtonVariant.secondary,
      onClick: onTryAgain,
    },
  ],
});

const DataResourceStatus: React.FC<DataResourceStatusProps> = React.memo(
  ({ name, status, onCancel, onTryAgain, data, error }) => {
    const { t } = useCustomTranslation();
    const statusObj = STATUS_BODY(t)[status];
    const errorMessage =
      data?.status?.conditions?.[0]?.message || error?.message;
    return (
      <>
        <EmptyState>
          <EmptyStateIcon
            icon={statusObj.icon}
            className={statusObj.className}
          />
          <EmptyStateBody data-test="empty-state-body">
            {statusObj.desc}
          </EmptyStateBody>
          {errorMessage && status !== NS_PROGRESS.READY && (
            <Alert
              variant={STATUS_CONDITIONS[status]}
              title=""
              customIcon={<></>}
              isInline
            >
              {errorMessage}
            </Alert>
          )}
        </EmptyState>
        <ActionGroup className="pf-c-form pf-c-form__actions--left">
          {STATUS_FOOTER(t, onCancel, onTryAgain)[status].map((buttonProp) => {
            return (
              <Button
                type={buttonProp.type}
                variant={buttonProp.variant}
                isDisabled={buttonProp?.disable}
                key={buttonProp.id}
                data-test={buttonProp.id}
                onClick={buttonProp?.onClick}
                isLoading={buttonProp?.loading}
              >
                {buttonProp.label}
              </Button>
            );
          })}
        </ActionGroup>
      </>
    );
  }
);

DataResourceStatus.displayName = 'DataResourceStatus';

type FuncType = () => void;

type STATUSFOOTER = (
  t: TFunction,
  onCancel: FuncType,
  onTryAgain: FuncType
) => {
  [key: string]: {
    id: string;
    label: string;
    type: ButtonType;
    variant: ButtonVariant;
    onClick?: FuncType;
    disable?: boolean;
    loading?: boolean;
  }[];
};

type DataResourceStatusProps = {
  name: string;
  status: string;
  onCancel: FuncType;
  onTryAgain: FuncType;
  data: NamespaceStoreKind;
  error: any;
};

export default DataResourceStatus;
