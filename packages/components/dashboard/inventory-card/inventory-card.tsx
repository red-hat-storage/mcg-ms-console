import * as React from 'react';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { HealthBody } from '@openshift-console/dynamic-plugin-sdk-internal';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import {
  Gallery,
  GalleryItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@patternfly/react-core';
import {
  BucketClassPhaseMap,
  BUCKET_CLASS_DETAILS_PATH,
  BUCKET_CLASS_LIST_PATH,
  DATA_RESOURCE_DETAILS_PATH,
  DATA_RESOURCE_LIST_PATH,
  NamespaceStorePhaseMap,
  OBC_LIST_PATH,
  ObjectBucketClaimPhaseMap,
  OBJECT_BUCKET_CLAIMS,
  PhaseType,
} from '../../../constants';
import {
  BucketClassKind,
  K8sResourceKind,
  NamespaceStoreKind,
} from '../../../types';
import { useCustomTranslation } from '../../../utils/hooks/useCustomTranslationHook';
import {
  RedExclamationCircleIcon,
  BlueInProgressIcon,
} from '../../../utils/status/icons';
import {
  MCGResourcePopOver,
  OBCPopOver,
} from '../../resource-pages/ResourcePopOver';
import {
  bucketClassResource,
  nameSpaceStoreResource,
  bucketClaimResource,
} from '../../resources';
import './inventory-card.scss';

type obcType = { name: string; ns: string };
type statusMap = { [key: string]: string[] | obcType[] };
type CustomGalleryItemProps = {
  totalCount: number;
  listLoaded: boolean;
  listError;
  redirectPath: string;
  resourceType: string;
  statusMap: statusMap;
};

const getHeaderHTMLElement = (
  popUpType: PhaseType,
  headerText: string
): React.ReactNode => {
  if (popUpType === PhaseType.ERROR) {
    return (
      <>
        <RedExclamationCircleIcon className="popup-header-icon" />
        {headerText}
      </>
    );
  }
  if (popUpType === PhaseType.PROCESSING) {
    return (
      <>
        <BlueInProgressIcon className="popup-header-icon" />
        {headerText}
      </>
    );
  }
  return <></>;
};

const CustomGalleryItem: React.FC<CustomGalleryItemProps> = ({
  totalCount,
  listLoaded,
  listError,
  redirectPath,
  resourceType,
  statusMap,
  children,
}) => {
  const { t } = useCustomTranslation();
  return (
    <GalleryItem className="inventory-card-item">
      {listLoaded && !listError ? (
        <>
          <div className="inventory-card-sub-item">
            <Link to={redirectPath}>
              {t('{{count}} {{resourceType}}', {
                count: totalCount,
                resourceType,
              })}
            </Link>
          </div>
          {statusMap?.[PhaseType.ERROR] && (
            <div className="icons-container">
              <RedExclamationCircleIcon
                title={PhaseType.ERROR}
                className="icons"
              />
              {children?.[0]}
            </div>
          )}
          {statusMap?.[PhaseType.PROCESSING] && (
            <div>
              <BlueInProgressIcon
                title={PhaseType.PROCESSING}
                className="icons"
              />
              {children?.[1]}
            </div>
          )}
        </>
      ) : (
        <Skeleton
          screenreaderText={t('Loading {{resourceType}}', {
            resourceType,
          })}
        />
      )}
    </GalleryItem>
  );
};

export const InventoryCard: React.FC = () => {
  const { t } = useCustomTranslation();
  const [buckets, bucketsLoaded, bucketsError] =
    useK8sWatchResource<BucketClassKind[]>(bucketClassResource);
  const [dataResources, dataResourcesLoaded, dataResourcesError] =
    useK8sWatchResource<NamespaceStoreKind[]>(nameSpaceStoreResource);
  const [obc, obcLoaded, obcError] =
    useK8sWatchResource<K8sResourceKind[]>(bucketClaimResource);

  const bucketStatusMap = React.useMemo((): statusMap => {
    return bucketsLoaded && !bucketsError
      ? buckets?.reduce((bucketMap, bc) => {
          const bucketStatus = BucketClassPhaseMap[bc?.status?.phase];
          if (bucketStatus === PhaseType.READY) return bucketMap;
          const bucketClassName = bc?.metadata?.name;
          bucketMap[bucketStatus] = bucketMap[bucketStatus]
            ? [...bucketMap[bucketStatus], bucketClassName]
            : [bucketClassName];
          return bucketMap;
        }, {})
      : {};
  }, [buckets, bucketsLoaded, bucketsError]);

  const dataResourceStatusMap = React.useMemo((): statusMap => {
    return dataResourcesLoaded && !dataResourcesError
      ? dataResources?.reduce((drMap: { [key: string]: string[] }, dr) => {
          const dataResourceStatus = NamespaceStorePhaseMap[dr?.status?.phase];
          if (dataResourceStatus === PhaseType.READY) return drMap;
          const dataResourceName = dr?.metadata?.name;
          drMap[dataResourceStatus] = drMap[dataResourceStatus]
            ? [...drMap[dataResourceStatus], dataResourceName]
            : [dataResourceName];
          return drMap;
        }, {})
      : {};
  }, [dataResources, dataResourcesLoaded, dataResourcesError]);

  const obcStatusMap = React.useMemo((): statusMap => {
    return obcLoaded && !obcError
      ? obc?.reduce((obcMap, obc) => {
          const obcStatus = ObjectBucketClaimPhaseMap[obc?.status?.phase];
          if (obcStatus === PhaseType.READY) return obcMap;
          const obcResource: obcType = {
            name: obc?.metadata?.name,
            ns: obc?.metadata?.namespace,
          };
          obcMap[obcStatus] = obcMap[obcStatus]
            ? [...(obcMap[obcStatus] as obcType[]), obcResource]
            : [obcResource];
          return obcMap;
        }, {} as statusMap)
      : {};
  }, [obc, obcLoaded, obcError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <HealthBody>
          <Gallery
            className="co-overview-status__health inventory-card-body"
            hasGutter
          >
            <CustomGalleryItem
              totalCount={buckets?.length}
              listLoaded={bucketsLoaded}
              listError={bucketsError}
              redirectPath={BUCKET_CLASS_LIST_PATH}
              resourceType={t('Buckets')}
              statusMap={bucketStatusMap}
            >
              <MCGResourcePopOver
                label={String(bucketStatusMap[PhaseType.ERROR]?.length)}
                resourceList={bucketStatusMap[PhaseType.ERROR] as string[]}
                headerContent={getHeaderHTMLElement(
                  PhaseType.ERROR,
                  t('Buckets: Error')
                )}
                trimContent
                resourceListURL={BUCKET_CLASS_LIST_PATH}
                resourceDetailsURL={BUCKET_CLASS_DETAILS_PATH}
              />
              <MCGResourcePopOver
                label={String(bucketStatusMap[PhaseType.PROCESSING]?.length)}
                resourceList={bucketStatusMap[PhaseType.PROCESSING] as string[]}
                headerContent={getHeaderHTMLElement(
                  PhaseType.PROCESSING,
                  t('Buckets: Processing')
                )}
                trimContent
                resourceListURL={BUCKET_CLASS_LIST_PATH}
                resourceDetailsURL={BUCKET_CLASS_DETAILS_PATH}
              />
            </CustomGalleryItem>
            <CustomGalleryItem
              totalCount={dataResources?.length}
              listLoaded={dataResourcesLoaded}
              listError={dataResourcesError}
              redirectPath={DATA_RESOURCE_LIST_PATH}
              resourceType={t('Data sources')}
              statusMap={dataResourceStatusMap}
            >
              <MCGResourcePopOver
                label={String(dataResourceStatusMap[PhaseType.ERROR]?.length)}
                resourceList={
                  dataResourceStatusMap[PhaseType.ERROR] as string[]
                }
                headerContent={getHeaderHTMLElement(
                  PhaseType.ERROR,
                  t('Data sources: Error')
                )}
                trimContent
                resourceListURL={DATA_RESOURCE_LIST_PATH}
                resourceDetailsURL={DATA_RESOURCE_DETAILS_PATH}
              />
              <MCGResourcePopOver
                label={String(
                  dataResourceStatusMap[PhaseType.PROCESSING]?.length
                )}
                resourceList={
                  dataResourceStatusMap[PhaseType.PROCESSING] as string[]
                }
                headerContent={getHeaderHTMLElement(
                  PhaseType.PROCESSING,
                  t('Data sources: Processing')
                )}
                trimContent
                resourceListURL={DATA_RESOURCE_LIST_PATH}
                resourceDetailsURL={DATA_RESOURCE_DETAILS_PATH}
              />
            </CustomGalleryItem>
            <CustomGalleryItem
              totalCount={obc?.length}
              listLoaded={obcLoaded}
              listError={obcError}
              redirectPath={OBC_LIST_PATH}
              resourceType={t(`{{obcDisplayText}}`, {
                obcDisplayText: OBJECT_BUCKET_CLAIMS,
              })}
              statusMap={obcStatusMap}
            >
              <OBCPopOver
                label={String(obcStatusMap[PhaseType.ERROR]?.length)}
                obcDetails={obcStatusMap[PhaseType.ERROR] as obcType[]}
                headerContent={getHeaderHTMLElement(
                  PhaseType.ERROR,
                  t(`{{obcDisplayText}}: Error`, {
                    obcDisplayText: OBJECT_BUCKET_CLAIMS,
                  })
                )}
                trimContent
              />
              <OBCPopOver
                label={String(obcStatusMap[PhaseType.PROCESSING]?.length)}
                obcDetails={obcStatusMap[PhaseType.PROCESSING] as obcType[]}
                headerContent={getHeaderHTMLElement(
                  PhaseType.PROCESSING,
                  t(`{{obcDisplayText}}: Processing`, {
                    obcDisplayText: OBJECT_BUCKET_CLAIMS,
                  })
                )}
                trimContent
              />
            </CustomGalleryItem>
          </Gallery>
        </HealthBody>
      </CardBody>
    </Card>
  );
};
