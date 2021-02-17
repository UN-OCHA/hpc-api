import { Request } from 'express';
import { LogContext } from '../lib/loggerWithContext';
import { GLOBAL_PERMISSIONS, OPERATION_PERMISSIONS, OPERATION_CLUSTER_PERMISSIONS, PLAN_PERMISSIONS, GOVERNING_ENTITY_PERMISSIONS } from './Permissions';

/**
 * A type that represents a requirement for a permission to be granted for a
 * particular action to take place.
 */
export type RequiredPermission =
  | {
    type: 'global';
    /**
     * TODO: move all global roles / permissions to new authentication system
     */
    permission: GLOBAL_PERMISSIONS;
  }
  | {
    type: 'operation';
    permission: OPERATION_PERMISSIONS;
    id: number;
  }
  | {
    type: 'operationCluster';
    permission: OPERATION_CLUSTER_PERMISSIONS
    id: number;
  }
  | {
    type: 'plan';
    permission: PLAN_PERMISSIONS
    id: number;
  }
  | {
    type: 'governingEntity';
    permission: GOVERNING_ENTITY_PERMISSIONS
    id: number;
  };

/**
 * A list of permissions that must all be granted for an access to be permitted
 */
export type RequiredPermissionsConjunctionAnd = { and: RequiredPermissionsCondition[] };

type RequiredPermissionsConjunction =
  | RequiredPermissionsConjunctionAnd
  | RequiredPermission;

/**
 * A condition expressing the permissions required for an action in
 * Disjunctive Normal Form (https://en.wikipedia.org/wiki/Disjunctive_normal_form)
 */
export type RequiredPermissionsConditionOr = { or: RequiredPermissionsCondition[] };

export type RequiredPermissionsCondition =
  | RequiredPermissionsConditionOr
  | RequiredPermissionsConjunction
  | 'anyone'
  | 'noone';

export type RequiredPermissionConditionWithData = {
  data: Record<string, any>;
  condition: RequiredPermissionsCondition
}

export type AuthRequirementsGenerator = (args: {
    log: LogContext;
    /**
     * It is recommended that you don't access the request directly
     */
    req: Request;
    args: Record<string, any>;
}) => Promise<RequiredPermissionConditionWithData[]>

type COMBINED_AUTH_CONDITIONS = RequiredPermissionConditionWithData | AuthRequirementsGenerator;

export default COMBINED_AUTH_CONDITIONS;