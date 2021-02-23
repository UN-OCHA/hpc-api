import AuthTarget from '../database/models/AuthTarget';
import { RoleAuthTargetString, RolesStrings, AUTH_ROLES, RolesGrant } from '../types/Roles';

/**
 * Ensure that the list of roles is valid for the given target type,
 * and throw an error if that's not the case.
 */
const validateRoleStrings = <K extends RoleAuthTargetString>(
  targetType: K,
  roles: string[],
): Array<RolesStrings<K>> => {

  if (roles.every(r => r in AUTH_ROLES[targetType])) {
    return roles as Array<RolesStrings<K>>;
  }
  throw new Error(`Invalid roles for target type ${targetType}: ${roles.join(',')}`);
}

/**
 * Validate the given target, and roles for the given target,
 * returning a RolesGrant instance if valid, and throwing an error if not.
 */
export const calculateRolesGrantFromTargetAndRoleStrings = (
    target: AuthTarget,
    roles: string[],
  ): RolesGrant => {
    if (target.type === 'global') {
      return {
        type: 'global',
        roles: validateRoleStrings('global', roles)
      }
    } else if (target.targetId) {
      if (target.type === 'operation') {
        return {
          type: 'operation',
          id: target.targetId,
          roles: validateRoleStrings('operation', roles)
        }
      } else if (target.type === 'operationCluster') {
        return {
          type: 'operationCluster',
          id: target.targetId,
          roles: validateRoleStrings('operationCluster', roles)
        }
      } else if (target.type === 'plan') {
        return {
          type: 'plan',
          id: target.targetId,
          roles: validateRoleStrings('plan', roles)
        }
      } else if (target.type === 'governingEntity') {
        return {
          type: 'governingEntity',
          id: target.targetId,
          roles: validateRoleStrings('governingEntity', roles)
        }
      }
    }
    throw new Error(`Invalid authTarget: ${target.type}:${target.targetId}`);
  }