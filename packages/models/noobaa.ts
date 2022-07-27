import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const NooBaaSystemModel: K8sModel = {
  label: 'NooBaa System',
  labelPlural: 'NooBaa Systems',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'noobaas',
  abbr: 'NB',
  namespaced: true,
  kind: 'NooBaa',
  id: 'noobaasystem',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaNamespaceStoreModel: K8sModel = {
  label: 'Namespace Store',
  labelPlural: 'Namespace Stores',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'namespacestores',
  abbr: 'DS',
  namespaced: true,
  kind: 'NamespaceStore',
  id: 'noobaanamespacestore',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaBucketClassModel: K8sModel = {
  label: 'Bucket Class',
  labelPlural: 'Bucket Classes',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'bucketclasses',
  abbr: 'BP',
  namespaced: true,
  kind: 'BucketClass',
  id: 'noobaabucketclasses',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaObjectBucketClaimModel: K8sModel = {
  label: 'Object Bucket Claim',
  labelPlural: 'Object Bucket Claims',
  apiVersion: 'v1alpha1',
  apiGroup: 'objectbucket.io',
  plural: 'objectbucketclaims',
  abbr: 'OBC',
  namespaced: true,
  kind: 'ObjectBucketClaim',
  id: 'objectbucketclaims',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaObjectBucketModel: K8sModel = {
  label: 'Object Bucket',
  labelPlural: 'Object Buckets',
  apiVersion: 'v1alpha1',
  apiGroup: 'objectbucket.io',
  plural: 'objectbuckets',
  abbr: 'OB',
  namespaced: false,
  kind: 'ObjectBucket',
  id: 'objectbucket',
  crd: true,
  legacyPluralURL: true,
};
