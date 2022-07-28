import * as React from 'react';
import { HealthBody } from '@openshift-console/dynamic-plugin-sdk-internal';
import * as _ from 'lodash';
import {
  Gallery,
  GalleryItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';
import {
  DATA_FEDERATION,
  MCG_MS_PROMETHEUS_URL,
  PrometheusEndpoint,
} from '../../../constants';
import HealthItem from '../../../utils/dashboard/status-card/HealthItem';
import { useCustomPrometheusPoll } from '../../../utils/hooks/custom-prometheus-poll';
import { useCustomTranslation } from '../../../utils/hooks/useCustomTranslationHook';
import { getOperatorHealthState } from '../utils';

export const StatusCard: React.FC = () => {
  const { t } = useCustomTranslation();

  const [healthStatusResult, healthStatusError, healthStatusLoading] =
    useCustomPrometheusPoll({
      query: 'NooBaa_health_status',
      endpoint: PrometheusEndpoint.QUERY as any,
      basePath: MCG_MS_PROMETHEUS_URL,
    });

  const operatorHealthStatus = getOperatorHealthState(
    healthStatusResult?.status,
    healthStatusLoading,
    healthStatusError
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Status')}</CardTitle>
      </CardHeader>
      <CardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            <GalleryItem>
              <HealthItem
                title={t(`{{operatorName}} service`, {
                  operatorName: DATA_FEDERATION,
                })}
                state={operatorHealthStatus.state}
              />
            </GalleryItem>
          </Gallery>
        </HealthBody>
      </CardBody>
    </Card>
  );
};
