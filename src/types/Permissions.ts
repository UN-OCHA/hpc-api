import { registerEnumType } from 'type-graphql';

export enum GLOBAL_PERMISSIONS {
  RUN_ADMIN_COMMANDS = 'canRunAdminCommands',
  MODIFY_ACCESS_AND_PERMISSIONS = 'canModifyAccessAndPermissions',
    /**
     * Can modify the access and permissions of operations,
     * or any object nested underneath an operation
     * (like an operation cluster).
     */
    MODIFY_OPERATION_ACCESS_AND_PERMISSIONS = 'canModifyOperationAccessAndPermissions',
    ADD_OPERATION = 'canAddOperation',
    /**
     * Can view ALL the data for operations or any nested information
     *
     * (equivalent to operation.VIEW_DATA for every operation)
     */
    VIEW_OPERATION_DATA = 'viewOperationData',
    /**
     * Can list operations and view the metadata for any operation
     * 
     * (equivalent to operation.VIEW_METADATA for every operation)
     */
    VIEW_OPERATION_METADATA = 'viewOperationMetadata',
    /**
     * Can list operations and view the metadata for assigned operations
     * 
     * This permission is expected to be present whenever a user has the
     * `VIEW_METADATA` permission for an operation
     */
    VIEW_ASSIGNED_OPERATION_METADATA = 'viewPermittedOperationMetadata',
    CREATE_ORGANIZATIONS = 'canCreateOrganizations',
    /**
     * Can edit the raw data of any assignment that is a form
     */
    EDIT_FORM_ASSIGNMENT_RAW_DATA = 'editFormAssignmentRawData',
    /**
     * Can edit the clean data of any assignment that is a form
     */
    EDIT_FORM_ASSIGNMENT_CLEAN_DATA = 'editFormAssignmentCleanData',
    /**
     * Can edit the data associated with any plan (when that plan is editable)
     */
    EDIT_ANY_PLAN_DATA = 'editAnyPlanData',
}

export enum OPERATION_PERMISSIONS {
  /**
     * Can view ALL the data for the operation and underlying clusters
     */
    VIEW_DATA = 'canViewData',
    /**
     * Can view the high-level metadata for the operation (e.g. name),
     * but no underlying objects (e.g. clusters)
     */
    VIEW_METADATA = 'canViewMetadata',
    /**
     * Can view the high-level metadata for any of the clusters under this op
     */
    VIEW_CLUSTER_METADATA = 'canViewClusterMetadata',
    /**
     * Can modify the access and permissions of any of its clusters
     */
    MODIFY_CLUSTER_ACCESS_AND_PERMISSIONS = 'canModifyClusterAccessAndPermissions',
    CREATE_CLUSTER = 'createCluster',
    /**
     * This also applies to any assignment for any object nested under this
     * operation
     */
    VIEW_ASSIGNMENT_DATA = 'viewAssignmentData',
    /**
     * This also applies to any assignment for any object nested under this
     * operation
     */
    EDIT_ASSIGNMENT_RAW_DATA = 'editAssignmentRawData',
    /**
     * This also applies to any assignment for any object nested under this
     * operation
     */
    EDIT_ASSIGNMENT_CLEAN_DATA = 'editAssignmentCleanData',
}

export enum OPERATION_CLUSTER_PERMISSIONS {
  /**
     * Can view ALL the data for this cluster and nested objects
     */
    VIEW_DATA = 'canViewData',
    /**
     * Can view the high-level metadata for the operation cluster (e.g. name),
     * but no underlying objects
     */
    VIEW_METADATA = 'canViewMetadata',
    VIEW_ASSIGNMENT_DATA = 'viewAssignmentData',
    EDIT_ASSIGNMENT_RAW_DATA = 'editAssignmentRawData',
    EDIT_ASSIGNMENT_CLEAN_DATA = 'editAssignmentCleanData',
}

export enum PLAN_PERMISSIONS {
  /**
     * Can move projects associated with this plan to any step of the workflow.
     */
    PROJECT_WORKFLOW_MOVE_TO_ANY_STEP = 'projectWorkflowMoveToAnyStep',
    /**
     * Can edit the data associated with the plan (when that plan is editable)
     */
    EDIT_DATA = 'editPlanData',
}

export enum GOVERNING_ENTITY_PERMISSIONS {
  /**
     * Can edit the data associated with the governing Entity
     * (when it's associated plan is editable)
     */
    EDIT_DATA = 'editGoverningEntityData',
}

registerEnumType(GLOBAL_PERMISSIONS, {
  name: 'GLOBAL_PERMISSIONS',
  description: 'App Global Auth Permissions',
});

registerEnumType(OPERATION_PERMISSIONS, {
  name: 'OPERATION_PERMISSIONS',
  description: 'App Operation Auth Permissions',
});

registerEnumType(OPERATION_CLUSTER_PERMISSIONS, {
  name: 'OPERATION_CLUSTER_PERMISSIONS',
  description: 'App Operation Cluster Auth Permissions',
});

registerEnumType(PLAN_PERMISSIONS, {
  name: 'PLAN_PERMISSIONS',
  description: 'App Plan Auth Permissions',
});

registerEnumType(GOVERNING_ENTITY_PERMISSIONS, {
  name: 'GOVERNING_ENTITY_PERMISSIONS',
  description: 'App Governing Entity Auth Permissions',
});

/**
 * A mapping from target types to permissions that can apply to those targets 
 */
export const AUTH_PERMISSIONS = {
  global: GLOBAL_PERMISSIONS,
  operation: OPERATION_PERMISSIONS,
  operationCluster: OPERATION_CLUSTER_PERMISSIONS,
  plan: PLAN_PERMISSIONS,
  governingEntity: GOVERNING_ENTITY_PERMISSIONS
} as const;

type AUTH_PERMISSIONS_TYPE = typeof AUTH_PERMISSIONS;

/**
 * Get the union type of string permissions allowed for a particular target type
 */
export type PermissionStrings<K extends keyof AUTH_PERMISSIONS_TYPE> =
  (AUTH_PERMISSIONS_TYPE)[K][keyof (AUTH_PERMISSIONS_TYPE)[K]];

/**
 * Type that represents an object containing the complete computed permissions
 * for a particular user or actor.
 */
export type GrantedPermissions = {
  -readonly [key in keyof Partial<Omit<AUTH_PERMISSIONS_TYPE, 'global'>>]:
    Map<number, Set<PermissionStrings<key>>>
} & {
  global?: Set<GLOBAL_PERMISSIONS>;
}

export default AUTH_PERMISSIONS_TYPE;