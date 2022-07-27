import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Divider,
  Popover,
  PopoverPosition,
} from '@patternfly/react-core';
import { OBC_LIST_PATH } from '../../constants';
import { NooBaaObjectBucketClaimModel } from '../../models';
import { referenceForModel } from '../../utils';
import ResourceLink from '../../utils/generics/resource-link';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import './resources.scss';

const MAX_NO_OF_RESOURCE_DISPLAY = 5;

const ResourcePopOver: React.FC<ResourcePopOverProps> = ({
  position,
  children,
  label,
  headerContent,
  'data-test': dataTest,
}) => {
  return (
    <Popover
      position={position || PopoverPosition.auto}
      headerContent={headerContent}
      bodyContent={children}
      aria-label={label}
    >
      <Button variant="link" isInline data-test={`${dataTest}-popover`}>
        {label}
      </Button>
    </Popover>
  );
};

export const MCGResourcePopOver: React.FC<MCGResourcePopOverProps> = ({
  label,
  resourceList,
  headerContent,
  trimContent = false,
  resourceListURL,
  resourceDetailsURL,
}) => {
  const { t } = useCustomTranslation();

  return (
    <ResourcePopOver
      label={label}
      headerContent={headerContent}
      data-test="mcg-resource"
    >
      <div className="resource-pop-over">
        {(trimContent && resourceList?.length > MAX_NO_OF_RESOURCE_DISPLAY
          ? resourceList.slice(0, MAX_NO_OF_RESOURCE_DISPLAY)
          : resourceList
        )?.map((resourceName) => (
          <ResourceLink
            link={`${resourceDetailsURL}/${resourceName}`}
            resourceName={resourceName}
            key={resourceName}
            hideIcon
            className="resource-items-link"
          />
        ))}
      </div>
      {trimContent && resourceList?.length > MAX_NO_OF_RESOURCE_DISPLAY && (
        <>
          <Divider />
          <div className="view-more-popup">
            <Link to={resourceListURL}>{t('View more')}</Link>
          </div>
        </>
      )}
    </ResourcePopOver>
  );
};

export const OBCPopOver: React.FC<OBCPopOverProps> = ({
  label,
  obcDetails,
  headerContent,
  trimContent = false,
}) => {
  const { t } = useCustomTranslation();

  return (
    <ResourcePopOver
      label={label}
      headerContent={headerContent || t('Connected object bucket claims')}
      data-test="obc-resource"
    >
      <div className="resource-pop-over">
        {(trimContent && obcDetails?.length > MAX_NO_OF_RESOURCE_DISPLAY
          ? obcDetails.slice(0, MAX_NO_OF_RESOURCE_DISPLAY)
          : obcDetails
        )?.map((obcObj) => (
          <ResourceLink
            link={`/k8s/ns/${obcObj.ns}/${referenceForModel(
              NooBaaObjectBucketClaimModel
            )}/${obcObj.name}`}
            resourceName={obcObj.name}
            key={obcObj.name}
            hideIcon
            className="resource-items-link"
          />
        ))}
      </div>
      {trimContent && obcDetails?.length > MAX_NO_OF_RESOURCE_DISPLAY && (
        <>
          <Divider />
          <div className="view-more-popup">
            <Link to={OBC_LIST_PATH}>{t('View more')}</Link>
          </div>
        </>
      )}
    </ResourcePopOver>
  );
};

type ResourcePopOverProps = {
  label: string;
  'data-test'?: string;
  position?: PopoverPosition;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
};

type MCGResourcePopOverProps = {
  label: string;
  resourceList: string[];
  headerContent?: React.ReactNode;
  trimContent?: boolean;
  resourceListURL?: string;
  resourceDetailsURL?: string;
};

type OBCPopOverProps = {
  label: string;
  obcDetails: {
    name: string;
    ns: string;
  }[];
  headerContent?: React.ReactNode;
  trimContent?: boolean;
};
