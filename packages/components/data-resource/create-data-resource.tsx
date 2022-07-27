import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { DATA_FEDERATION, DATA_FEDERATION_NAMESPACE } from '../../constants';
import { NooBaaNamespaceStoreModel } from '../../models';
import { referenceForModel } from '../../utils';
import PageHeading from '../../utils/heading/page-heading';
import { useCustomTranslation } from '../../utils/hooks/useCustomTranslationHook';
import { getName } from '../../utils/selectors/k8s';
import DataResourceCreateForm from './data-resource-create-form';
import './data-resource.scss';

type CreateDataResourceProps = RouteComponentProps<{
  ns: string;
  appName: string;
}>;

const CreateDataResource: React.FC<CreateDataResourceProps> = ({
  history,
  match,
}) => {
  const { t } = useCustomTranslation();
  const { ns = DATA_FEDERATION_NAMESPACE } = match.params;
  const onCancel = () => history.goBack();

  const breadcrumbs = [
    {
      name: DATA_FEDERATION,
      path: '/mcgms/cluster',
    },
    {
      name: t('Create data source'),
      path: '',
    },
  ];

  return (
    <>
      <PageHeading
        breadcrumbs={breadcrumbs}
        title={t('Create new data source')}
        className="mcgms-breadcrumbs-header"
      >
        <p>
          {t(
            'Represents an underlying storage to be used as read or write target for the data in buckets.'
          )}
        </p>
      </PageHeading>
      <DataResourceCreateForm
        onCancel={onCancel}
        redirectHandler={(resources) => {
          const lastIndex = resources.length - 1;
          const resourcePath = `${referenceForModel(
            NooBaaNamespaceStoreModel
          )}/${getName(resources[lastIndex])}`;
          history.push(`/mcgms/resource/${resourcePath}`);
        }}
        namespace={ns}
        className="nb-endpoints-page-form__short"
      />
    </>
  );
};

export default CreateDataResource;
