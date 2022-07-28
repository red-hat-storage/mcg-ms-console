import * as React from 'react';
import {
  K8sResourceCommon,
  RowProps,
  TableColumn,
  TableData,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  DASH,
  BucketClassType,
  SINGLE_WITH_CACHE,
  DATA_RESOURCE_DETAILS_PATH,
  OBJECT_BUCKET_CLAIMS,
} from '../../constants';
import { NooBaaBucketClassModel } from '../../models';
import { K8sResourceKind, BucketClassKind } from '../../types';
import { getDataResources, referenceForModel } from '../../utils';
import { OperandStatus } from '../../utils/generics/operand-status';
import ResourceLink from '../../utils/generics/resource-link';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { CustomKebabItemsType, Kebab } from '../../utils/kebab/kebab';
import { GenericListPage } from '../../utils/list-page/list-page';
import { LaunchModal } from '../../utils/modals/modalLauncher';
import { getName } from '../../utils/selectors/k8s';
import { bucketClaimResource } from '../resources';
import { MCGResourcePopOver, OBCPopOver } from './ResourcePopOver';

const tableColumnInfo = [
  { className: '', id: 'name' },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
    id: 'status',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
    id: 'type',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-md'),
    id: 'data-source',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-md'),
    id: 'obc',
  },
  { className: 'dropdown-kebab-pf pf-c-table__action', id: '' },
];

export const RowRenderer: React.FC<RowProps<BucketClassKind, CustomData>> = ({
  obj,
  activeColumnIDs,
  rowData,
}) => {
  const { t } = useCustomTranslation();
  const { launchModal, kebabActions, resourceMap } = rowData;
  const bucketPolicyName = getName(obj);
  const namespacePolicyType: string = obj?.spec?.namespacePolicy?.type;
  const bucketPolicyType =
    namespacePolicyType === BucketClassType.CACHE
      ? SINGLE_WITH_CACHE
      : namespacePolicyType;
  const obcCount = resourceMap[bucketPolicyName]?.length || 0;
  const dataResources = getDataResources(obj);
  const dataResourceCount = dataResources?.length || 0;
  const dataResourceLabel = t('{{dataResourceCount}} data source', {
    dataResourceCount: dataResourceCount,
  });
  const obcLabel = t('{{obcCount}} OBC', { obcCount });
  const path = `/mcgms/resource/${referenceForModel(
    NooBaaBucketClassModel
  )}/${bucketPolicyName}`;

  return (
    <>
      <TableData {...tableColumnInfo[0]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          resourceModel={NooBaaBucketClassModel}
          resourceName={bucketPolicyName}
          link={path}
          data-test={bucketPolicyName}
        />
      </TableData>
      <TableData {...tableColumnInfo[1]} activeColumnIDs={activeColumnIDs}>
        <OperandStatus operand={obj} />
      </TableData>
      <TableData {...tableColumnInfo[2]} activeColumnIDs={activeColumnIDs}>
        {bucketPolicyType
          ? t('{{bucketPolicyType}} data source', { bucketPolicyType })
          : DASH}
      </TableData>
      <TableData {...tableColumnInfo[3]} activeColumnIDs={activeColumnIDs}>
        {!!dataResourceCount ? (
          <MCGResourcePopOver
            label={dataResourceLabel}
            resourceList={dataResources}
            headerContent={t('Connected data sources')}
            resourceDetailsURL={DATA_RESOURCE_DETAILS_PATH}
          />
        ) : (
          dataResourceLabel
        )}
      </TableData>
      <TableData {...tableColumnInfo[4]} activeColumnIDs={activeColumnIDs}>
        {!!obcCount ? (
          <OBCPopOver
            label={obcLabel}
            obcDetails={resourceMap[bucketPolicyName]}
          />
        ) : (
          obcLabel
        )}
      </TableData>
      <TableData {...tableColumnInfo[5]} activeColumnIDs={activeColumnIDs}>
        <Kebab
          launchModal={launchModal}
          extraProps={{
            resource: obj,
            resourceModel: NooBaaBucketClassModel,
          }}
          customKebabItems={kebabActions}
        />
      </TableData>
    </>
  );
};

export const useBucketPolicyList = () => {
  const { t } = useCustomTranslation();

  const [obcData, obcLoaded, obcError] =
    useK8sWatchResource<K8sResourceKind[]>(bucketClaimResource);

  const tableColumns = React.useMemo<TableColumn<K8sResourceCommon>[]>(
    () => [
      {
        title: t('Name'),
        sort: 'metadata.name',
        transforms: [sortable],
        props: {
          className: tableColumnInfo[0].className,
        },
        id: tableColumnInfo[0].id,
      },
      {
        title: t('Status'),
        props: {
          className: tableColumnInfo[1].className,
        },
        id: tableColumnInfo[1].id,
      },
      {
        title: t('Data source type'),
        props: {
          className: tableColumnInfo[2].className,
        },
        id: tableColumnInfo[2].id,
      },
      {
        title: t('Connected data sources'),
        props: {
          className: tableColumnInfo[3].className,
        },
        id: tableColumnInfo[3].id,
      },
      {
        title: t('{{obcDisplayText}}', {
          obcDisplayText: OBJECT_BUCKET_CLAIMS,
        }),
        props: {
          className: tableColumnInfo[4].className,
        },
        id: tableColumnInfo[4].id,
      },
      {
        title: '',
        props: {
          className: tableColumnInfo[5].className,
        },
        id: tableColumnInfo[5].id,
      },
    ],
    [t]
  );

  const objectBucketClaimMap = React.useMemo(
    () =>
      obcLoaded && !obcError
        ? obcData?.reduce((obcMap, obc) => {
            const bucketClass: string =
              obc?.spec?.additionalConfig?.bucketclass;
            const obcDetails: OBCDetails = {
              name: obc?.metadata?.name,
              ns: obc?.metadata?.namespace,
            };
            obcMap[bucketClass] = obcMap.hasOwnProperty(bucketClass)
              ? [...obcMap[bucketClass], obcDetails]
              : [obcDetails];
            return obcMap;
          }, {} as ObjectBucketClaimMap)
        : ({} as ObjectBucketClaimMap),
    [obcData, obcLoaded, obcError]
  );

  return [tableColumns, objectBucketClaimMap];
};

export const BucketPolicyListView: React.FC = () => {
  const { t } = useCustomTranslation();
  const [tableColumns, objectBucketClaimMap] = useBucketPolicyList();

  return (
    <GenericListPage
      resourceModel={NooBaaBucketClassModel}
      resourceMap={objectBucketClaimMap}
      tableColumns={tableColumns as TableColumn<K8sResourceCommon>[]}
      createButtonTitle={t('Create new')}
      kebabActions={(t) => ({
        Delete: {
          value: t('Delete bucket policy'),
        },
      })}
    >
      {RowRenderer}
    </GenericListPage>
  );
};

type ObjectBucketClaimMap = {
  [key: string]: OBCDetails[];
};

type OBCDetails = {
  name: string;
  ns: string;
};

type CustomData = {
  launchModal: LaunchModal;
  kebabActions?: CustomKebabItemsType;
  resourceMap: ObjectBucketClaimMap;
};
