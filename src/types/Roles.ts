import { registerEnumType } from "type-graphql";

export enum GLOBAL_ROLES {
    HPC_ADMIN = 'hpc_admin',
    RPM_ADMIN = 'rpmAdmin',
    FTS_ADMIN = 'ftsAdmin',
    PROJECTS_ADMIN = 'projectsAdmin',
    OMNISCIENT = 'omniscient',
    SWAPS = 'swaps'
}

export enum OPERATION_ROLES {
    OPERATION_LEAD = 'operationLead',
    READ_ONLY = 'readonly',
}

export enum OPERATION_CLUSTER_ROLES  {
    CLUSTER_LEAD = 'clusterLead'
}

export enum PLAN_ROLES {
    PLAN_LEAD = 'planLead',
    READ_ONLY = 'readonly',
}

export enum GOVERNING_ENTITY_ROLES {
    CLUSTER_LEAD = 'clusterLead',
}

registerEnumType(GLOBAL_ROLES, {
  name: 'GLOBAL_ROLES',
  description: 'Global Roles',
});

registerEnumType(OPERATION_ROLES, {
  name: 'OPERATION_ROLES',
  description: 'Operation Roles',
});

registerEnumType(OPERATION_CLUSTER_ROLES, {
  name: 'OPERATION_CLUSTER_ROLES',
  description: 'Operation Cluster Roles',
});

registerEnumType(PLAN_ROLES, {
  name: 'PLAN_ROLES',
  description: 'Plan Roles',
});

registerEnumType(GOVERNING_ENTITY_ROLES, {
  name: 'GOVERNING_ENTITY_ROLES',
  description: 'Governing Entity Roles',
});

/**
 * A breakdown of the different types of roles are available
 * for different target types.
 */
export const AUTH_ROLES = {
    global: GLOBAL_ROLES,
    operation: OPERATION_ROLES,
    operationCluster: OPERATION_CLUSTER_ROLES,
    plan: PLAN_ROLES,
    governingEntity: GOVERNING_ENTITY_ROLES,
} as const;

export type RoleAuthTargetString = keyof typeof AUTH_ROLES;

type AUTH_ROLES_TYPE = typeof AUTH_ROLES;

/**
 * Get the union type of string permissions allowed for a particular target type
 */
export type RolesStrings<K extends RoleAuthTargetString> =
  (AUTH_ROLES_TYPE)[K][keyof (AUTH_ROLES_TYPE)[K]] & string;

/**
* A type that represents granted roles for a particular target
*/
export type RolesGrant =
  | {
    type: 'global';
    roles: GLOBAL_ROLES[];
  }
  | {
    type: 'operation';
    roles: OPERATION_ROLES[];
    id: number;
  }
  | {
    type: 'operationCluster';
    roles: OPERATION_CLUSTER_ROLES[];
    id: number;
  }
  | {
    type: 'plan';
    roles: PLAN_ROLES[];
    id: number;
  }
  | {
    type: 'governingEntity';
    roles: GOVERNING_ENTITY_ROLES[];
    id: number;
  };

export default AUTH_ROLES_TYPE;