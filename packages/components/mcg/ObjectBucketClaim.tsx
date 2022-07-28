import * as React from 'react';
import {
  ListPageBody,
  ListPageCreateLink,
  ListPageFilter,
  ListPageHeader,
  ResourceLink,
  RowProps,
  TableColumn,
  TableData,
  useActiveColumns,
  useK8sWatchResource,
  useListPageFilter,
  VirtualizedTable,
} from '@openshift-console/dynamic-plugin-sdk';
import classNames from 'classnames';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router';
import { sortable } from '@patternfly/react-table';
import { OBC_LIST_PATH, OBJECT_BUCKET_CLAIMS } from '../../constants';
import {
  NooBaaObjectBucketClaimModel,
  NooBaaObjectBucketModel,
} from '../../models';
import { K8sResourceKind, PageProps } from '../../types';
import {
  referenceForModel,
  resourcePathFromModel,
  getPhase,
  isBound,
  obcStatusFilter,
} from '../../utils';
import DetailsPage, {
  ResourceSummary,
} from '../../utils/details-page/DetailsPage';
import { LoadingBox } from '../../utils/generics/status-box';
import { SectionHeading } from '../../utils/heading/page-heading';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { Kebab } from '../../utils/kebab/kebab';
import { useModalLauncher } from '../../utils/modals/modalLauncher';
import { Status } from '../../utils/status/Status';
import { GetSecret } from './secret';

const tableColumnInfo = [
  {
    className: '',
    id: 'name',
  },
  { className: '', id: 'Namespace' },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
    id: 'status',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-md'),
    id: 'phase',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
    id: 'Secret',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'usedCapacity',
  },
  {
    className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'StorageClass',
  },
  { className: 'dropdown-kebab-pf pf-c-table__action', id: '' },
];

type ObjectBucketClaimsListProps = {
  data: K8sResourceKind[];
  unfilteredData: K8sResourceKind[];
  loaded: boolean;
  loadError: any;
  rowData: any;
};

type OBCStatusProps = {
  obc: K8sResourceKind;
};

export const OBCStatus: React.FC<OBCStatusProps> = ({ obc }) => (
  <Status status={getPhase(obc)} />
);

const ObjectBucketClaimsList: React.FC<ObjectBucketClaimsListProps> = ({
  ...props
}) => {
  const { t } = useCustomTranslation();
  const objectBucketClaimTableColumns = React.useMemo<
    TableColumn<K8sResourceKind>[]
  >(
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
        title: t('Namespace'),
        sort: 'metadata.namespace',
        transforms: [sortable],
        props: {
          className: tableColumnInfo[1].className,
        },
        id: tableColumnInfo[1].id,
      },
      {
        title: t('Status'),
        sort: 'metadata.namespace',
        transforms: [sortable],
        props: {
          className: tableColumnInfo[2].className,
        },
        id: tableColumnInfo[2].id,
      },
      {
        title: t('Secret'),
        sort: 'metadata.namespace',
        transforms: [sortable],
        props: {
          className: tableColumnInfo[3].className,
        },
        id: tableColumnInfo[3].id,
      },
      {
        title: t('Storage class'),
        transforms: [sortable],
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

  const [columns] = useActiveColumns({
    columns: objectBucketClaimTableColumns,
    showNamespaceOverride: false,
    columnManagementID: null,
  });

  return (
    <VirtualizedTable
      {...props}
      aria-label={t('ObjectBucketClaims')}
      columns={columns}
      Row={OBCRow}
    />
  );
};

type CustomData = {
  launchModal: any;
  namespace: string;
};

const kind = referenceForModel(NooBaaObjectBucketClaimModel);

const OBCRow: React.FC<RowProps<K8sResourceKind, CustomData>> = ({
  obj,
  activeColumnIDs,
  rowData: { launchModal, namespace },
}) => {
  const storageClassName = _.get(obj, 'spec.storageClassName');
  return (
    <>
      <TableData {...tableColumnInfo[0]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData {...tableColumnInfo[1]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData {...tableColumnInfo[2]} activeColumnIDs={activeColumnIDs}>
        <OBCStatus obc={obj} />
      </TableData>
      <TableData {...tableColumnInfo[3]} activeColumnIDs={activeColumnIDs}>
        {isBound(obj) ? (
          <ResourceLink
            kind="Secret"
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData {...tableColumnInfo[4]} activeColumnIDs={activeColumnIDs}>
        {storageClassName ? (
          <ResourceLink kind="StorageClass" name={storageClassName} />
        ) : (
          '-'
        )}
      </TableData>

      <TableData {...tableColumnInfo[5]} activeColumnIDs={activeColumnIDs}>
        <Kebab
          launchModal={launchModal}
          extraProps={{
            resource: obj,
            resourceModel: NooBaaObjectBucketClaimModel,
            namespace,
          }}
          customKebabItems={(t) => ({
            ATTACH_DEPLOYMENT: {
              value: t('plugin__mcg-ms-console~Attach to Deployment'),
            },
            Delete: {
              value: t('Delete object bucket claim'),
            },
          })}
        />
      </TableData>
    </>
  );
};

const extraMap = {
  ATTACH_DEPLOYMENT: React.lazy(
    () => import('../modals/attach-deployment/attach-deployment-obc-modal')
  ),
};

export const OBCListPage: React.FC<PageProps> = (props) => {
  const { t } = useCustomTranslation('plugin__mcg-ms-console');

  const namespace = props.match.params.ns;

  const [Modal, modalProps, launchModal] = useModalLauncher(extraMap);

  const [obc, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: referenceForModel(NooBaaObjectBucketClaimModel),
    isList: true,
    namespace,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(obc);

  const createLink = `${resourcePathFromModel(
    NooBaaObjectBucketClaimModel,
    null,
    namespace || 'default'
  )}/~new/form`;

  const rowFilters = [obcStatusFilter(t)];
  return (
    <>
      <Modal {...modalProps} />
      <ListPageHeader
        title={t('{{obcDisplayText}}', {
          obcDisplayText: OBJECT_BUCKET_CLAIMS,
        })}
      >
        <ListPageCreateLink to={createLink}>
          {t('Create new')}
        </ListPageCreateLink>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          onFilterChange={onFilterChange}
          hideColumnManagement={true}
          rowFilters={rowFilters}
        />
        <ObjectBucketClaimsList
          data={filteredData}
          unfilteredData={obc}
          loaded={loaded}
          loadError={loadError}
          rowData={{ launchModal, namespace }}
        />
      </ListPageBody>
    </>
  );
};

type OBCDetailsProps = {
  obj?: K8sResourceKind;
};

export const OBCDetails: React.FC<OBCDetailsProps & RouteComponentProps> = ({
  obj,
}) => {
  const { t } = useCustomTranslation('plugin__mcg-ms-console');
  const storageClassName = _.get(obj, 'spec.storageClassName');
  const [Modal, modalProps, launchModal] = useModalLauncher(extraMap);
  return (
    <>
      <Modal {...modalProps} />
      <div className="co-m-pane__body">
        <SectionHeading text={t('Object bucket claim details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary
              resource={obj}
              launchModal={launchModal}
              resourceModel={NooBaaObjectBucketClaimModel}
            />
            {isBound(obj) && (
              <>
                <dt>{t('Secret')}</dt>
                <dd>
                  <ResourceLink
                    kind="Secret"
                    name={obj.metadata.name}
                    namespace={obj.metadata.namespace}
                  />
                </dd>
              </>
            )}
          </div>
          <div className="col-sm-6">
            <dt>{t('Status')}</dt>
            <dd>
              <OBCStatus obc={obj} />
            </dd>
            <dt>{t('Storage class')}</dt>
            <dd>
              {storageClassName ? (
                <ResourceLink kind="StorageClass" name={storageClassName} />
              ) : (
                '-'
              )}
            </dd>
            {isBound(obj) && (
              <>
                <dt>{t('Object bucket')}</dt>
                <dd>
                  <ResourceLink
                    dataTest="ob-link"
                    kind={referenceForModel(NooBaaObjectBucketModel)}
                    name={obj.spec.objectBucketName}
                  />
                </dd>
              </>
            )}
          </div>
        </div>
      </div>
      <GetSecret obj={obj} />
    </>
  );
};

export const OBCDetailsPage: React.FC<PageProps> = (props) => {
  const { t } = useCustomTranslation();
  const { name, ns: namespace } = props.match.params;
  const [resource, loaded] = useK8sWatchResource<K8sResourceKind>({
    kind,
    name,
    namespace,
    isList: false,
  });

  const [Modal, modalProps, launchModal] = useModalLauncher(extraMap);

  const actions = React.useCallback(() => {
    return (
      <Kebab
        toggleType="Dropdown"
        launchModal={launchModal}
        extraProps={{
          resource,
          resourceModel: NooBaaObjectBucketClaimModel,
          namespace,
          redirectPath: OBC_LIST_PATH,
        }}
        customKebabItems={(t) => ({
          ATTACH_DEPLOYMENT: { value: t('Attach to deployment') },
          Delete: {
            value: t('Delete object bucket claim'),
          },
        })}
      />
    );
  }, [launchModal, resource, namespace]);

  const breadcrumbs = [
    {
      name: t('{{obcDisplayText}}', {
        obcDisplayText: OBJECT_BUCKET_CLAIMS,
      }),
      path: `/k8s/ns/${namespace}/${referenceForModel(
        NooBaaObjectBucketClaimModel
      )}/`,
    },
    {
      name: t('Object bucket claim details'),
      path: '',
    },
  ];

  return (
    <>
      <Modal {...modalProps} />
      {loaded ? (
        <DetailsPage
          breadcrumbs={breadcrumbs}
          actions={actions}
          resourceModel={NooBaaObjectBucketClaimModel}
          resource={resource}
          pages={[
            {
              href: '',
              name: 'Details',
              component: OBCDetails,
            },
          ]}
        />
      ) : (
        <LoadingBox />
      )}
    </>
  );
};
