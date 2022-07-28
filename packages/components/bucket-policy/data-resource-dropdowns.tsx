import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';
import {
  Checkbox,
  Divider,
  FormGroup,
  Select,
  SelectOption,
  SelectVariant,
  Button,
} from '@patternfly/react-core';
import { EDIT_DATA_RESOURCES } from '../../constants';
import { NamespaceStoreKind } from '../../types';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { LaunchModal } from '../../utils/modals/modalLauncher';
import { getName, getUID } from '../../utils/selectors/k8s';
import {
  BucketPolicyState,
  BucketPolicyAction,
  BucketPolicyActionType,
} from './state';

const onChangeMulti: onChangeMultiSelectProps =
  (data, dispatch) => (selection) => {
    const alreadyIncluded = data.includes(selection);
    const payload = alreadyIncluded
      ? data.filter((resource) => resource !== selection)
      : [...data, selection];
    dispatch({
      type: BucketPolicyActionType.SET_READ_MULTI,
      payload,
    });
  };

const DataResourceDropdown: React.FC<DataResourceDropdownProps> = ({
  data,
  onChange,
  launchModal,
  disableAllExcept,
  variant = SelectVariant.single,
  ...props
}) => {
  const { t } = useCustomTranslation();
  const [isOpen, setOpen] = React.useState(false);

  const dropdownOptions: JSX.Element[] = React.useMemo(
    () =>
      data.reduce(
        (acc: JSX.Element[], dataResource: NamespaceStoreKind) => {
          const name = getName(dataResource);
          const isDisabled =
            (!_.isEmpty(disableAllExcept) &&
              !disableAllExcept?.some((itemName) => itemName === name)) ||
            dataResource?.status?.phase !== 'Ready';
          acc.push(
            <SelectOption
              key={getUID(dataResource)}
              value={name}
              isDisabled={isDisabled}
              data-test={`${name}-dropdown-item`}
            />
          );
          return acc;
        },
        [
          <Button
            key="data-source-add-modal"
            className="create-data-source__modal-button"
            variant="plain"
            onClick={() => {
              setOpen(false);
              launchModal();
            }}
          >
            {t('Add a new data source')}
          </Button>,
          <Divider component="li" key={'data-source-divider'} />,
        ]
      ),
    [t, data, disableAllExcept, launchModal]
  );

  return (
    <Select
      {...props}
      className={classNames(props?.className)}
      variant={variant}
      aria-label={t('Select a data source')}
      onToggle={setOpen}
      onSelect={(e, selection) => {
        onChange(selection as string);
        variant !== SelectVariant.checkbox && setOpen(false);
      }}
      isOpen={isOpen}
      id="data-source-dropdown"
      placeholderText={t('Select options')}
      noResultsFoundText={t('No results found')}
    >
      {dropdownOptions}
    </Select>
  );
};

export const SingleDataResource: React.FC<DataResourceProps> = ({
  state,
  dispatch,
  launchModal,
  ...props
}) => {
  const { t } = useCustomTranslation();

  return (
    <FormGroup
      fieldId="read-write-data-source"
      className="data-source-type__form--margin"
      label={t('Select a read and write data source')}
      data-test="read-write-dropdown"
    >
      <DataResourceDropdown
        {...props}
        selections={state.readWriteSingle}
        className="create-bucket-policy__form--margin-bottom"
        launchModal={() => launchModal(EDIT_DATA_RESOURCES)}
        onChange={(selection) =>
          dispatch({
            type: BucketPolicyActionType.SET_READ_WRITE_SINGLE,
            payload: selection,
          })
        }
      />
      <Checkbox
        id="cache-checkbox"
        label={t('Enable cache')}
        onChange={(checked) =>
          dispatch({
            type: BucketPolicyActionType.SET_CACHE,
            payload: checked,
          })
        }
        isChecked={state.cacheEnabled}
        description={t(
          'A caching bucket serves data from the local storage tier to improve performance.'
        )}
      />
    </FormGroup>
  );
};

export const MultiDataResource: React.FC<DataResourceProps> = ({
  state,
  dispatch,
  launchModal,
  ...props
}) => {
  const { t } = useCustomTranslation();

  return (
    <div className="data-source-type__form--margin">
      <FormGroup
        fieldId="read-data-source"
        label={t('Read a data source')}
        data-test="read-dropdown"
      >
        <p className="pf-c-form__helper-text">
          {t(
            'Select the data sources that defines the read targets of the bucket policy'
          )}
        </p>
        <DataResourceDropdown
          {...props}
          variant={SelectVariant.checkbox}
          selections={state.readResourceMulti}
          className="create-bucket-policy__form--margin-bottom"
          launchModal={() => launchModal(EDIT_DATA_RESOURCES)}
          onChange={onChangeMulti(state.readResourceMulti, dispatch)}
        />
      </FormGroup>
      <FormGroup
        fieldId="write-data-source"
        label={t('Write data source')}
        data-test="write-dropdown"
      >
        <p className="pf-c-form__helper-text">
          {t(
            'Select a single data source that defines the write target of the bucket policy'
          )}
        </p>
        <DataResourceDropdown
          {...props}
          selections={state.writeResourceMulti}
          disableAllExcept={state.readResourceMulti}
          launchModal={() => launchModal(EDIT_DATA_RESOURCES)}
          onChange={(selection) =>
            dispatch({
              type: BucketPolicyActionType.SET_WRITE_MULTI,
              payload: selection,
            })
          }
        />
      </FormGroup>
    </div>
  );
};

type onChangeMultiSelectProps = (
  data: string[],
  dispatch: React.Dispatch<BucketPolicyAction>
) => (selection: string) => void;

type DataResourceProps = {
  data: NamespaceStoreKind[];
  state: BucketPolicyState;
  launchModal?: LaunchModal;
  dispatch: React.Dispatch<BucketPolicyAction>;
};

type DataResourceDropdownProps = Omit<
  DataResourceProps,
  'dispatch' | 'state' | 'launchModal'
> & {
  launchModal?: () => void;
  onChange: (selection: string) => void;
  selections: string | string[];
  disableAllExcept?: string[];
  className?: string;
  variant?: SelectVariant;
};
