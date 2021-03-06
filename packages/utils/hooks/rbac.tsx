import * as React from 'react';
import {
  AccessReviewResourceAttributes,
  k8sCreate,
  K8sVerb,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import log from 'loglevel';
import { ProjectModel, SelfSubjectAccessReviewModel } from '../../models';
import { SelfSubjectAccessReviewKind } from '../../types';
import { useSafetyFirst } from './safety-first';

/**
 * Memoize the result so we only make the request once for each access review.
 * This does mean that the user will have to refresh the page to see updates.
 * This function takes in the destructured
 * resource attributes so that the cache keys are stable. (`JSON.stringify` is
 * not guaranteed to give the same result for equivalent objects.)
 */
const checkAccessInternal = _.memoize(
  (
    group: string,
    resource: string,
    subresource: string,
    verb: K8sVerb,
    name: string,
    namespace: string
  ): Promise<SelfSubjectAccessReviewKind> => {
    // Projects are a special case. `namespace` must be set to the project name
    // even though it's a cluster-scoped resource.
    const reviewNamespace =
      group === ProjectModel.apiGroup && resource === ProjectModel.plural
        ? name
        : namespace;
    const ssar: SelfSubjectAccessReviewKind = {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group,
          resource,
          subresource,
          verb,
          name,
          namespace: reviewNamespace,
        },
      },
    };
    return k8sCreate({ model: SelfSubjectAccessReviewModel, data: ssar });
  },
  (...args) => [...args].join('~')
);

export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes
): [boolean, boolean] => {
  const [loading, setLoading] = useSafetyFirst(true);
  const [isAllowed, setAllowed] = useSafetyFirst(false);
  // Destructure the attributes to pass them as dependencies to `useEffect`,
  // which doesn't do deep comparison of object dependencies.
  const {
    group = '',
    resource = '',
    subresource = '',
    verb = '' as K8sVerb,
    name = '',
    namespace = '',
  } = resourceAttributes;

  React.useEffect(() => {
    checkAccessInternal(group, resource, subresource, verb, name, namespace)
      .then((result: SelfSubjectAccessReviewKind) => {
        setAllowed(result.status.allowed);
        setLoading(false);
      })
      .catch((e) => {
        log.warn('SelfSubjectAccessReview failed', e);
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        setAllowed(true);
        setLoading(false);
      });
  }, [
    setLoading,
    setAllowed,
    group,
    resource,
    subresource,
    verb,
    name,
    namespace,
  ]);

  return [isAllowed, loading];
};
