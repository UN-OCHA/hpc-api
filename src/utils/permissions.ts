import { GrantedPermissions, PermissionStrings, GLOBAL_PERMISSIONS, OPERATION_PERMISSIONS, OPERATION_CLUSTER_PERMISSIONS, PLAN_PERMISSIONS, GOVERNING_ENTITY_PERMISSIONS } from '../types/Permissions';

import AuthGrant from "../database/models/AuthGrant";
import AuthGrantee, { AuthGranteeType } from "../database/models/AuthGrantee";
import Context from "../types/Context";

import { calculateRolesGrantFromTargetAndRoleStrings } from './roles';
import { RolesGrant } from '../types/Roles';

/**
 * Calculate the effective permissions that are granted to a user based on a
 * list of grants for a particular target;
 * 
 * This is implemented as a function (rather than being based purely on data)
 * as there are sometimes intricate behaviours / cascading permissions we want
 * to implement (such as cluster leads having read access to their operations).
 */
export const calculatePermissionsFromRolesGrant = async (grant: RolesGrant) => {
    const granted: GrantedPermissions = {};
    if (grant.type === 'global') {
      const global = granted.global = granted.global || new Set();
      for (const role of grant.roles) {
        if (role === 'hpc_admin') {
          // All new Permissions
          for (const perm of Object.values(GLOBAL_PERMISSIONS)) {
            global.add(perm);  
          }
        } else if (role === 'swaps') {
          global.add(GLOBAL_PERMISSIONS.MODIFY_OPERATION_ACCESS_AND_PERMISSIONS);
          global.add(GLOBAL_PERMISSIONS.ADD_OPERATION);
          global.add(GLOBAL_PERMISSIONS.VIEW_OPERATION_DATA);
          global.add(GLOBAL_PERMISSIONS.VIEW_OPERATION_METADATA);
          global.add(GLOBAL_PERMISSIONS.EDIT_FORM_ASSIGNMENT_CLEAN_DATA);
          global.add(GLOBAL_PERMISSIONS.EDIT_FORM_ASSIGNMENT_RAW_DATA);
        }
      }
    } else if (grant.type === 'operation') {
      const global = granted.global = granted.global || new Set();
      if (!granted.operation) {
        granted.operation = new Map();
      }
      let operationSet = granted.operation.get(grant.id);
      if (!operationSet) {
        granted.operation.set(grant.id, operationSet = new Set());
      }
      for (const role of grant.roles) {
        if (role === 'operationLead') {
          global.add(GLOBAL_PERMISSIONS.VIEW_ASSIGNED_OPERATION_METADATA);
          global.add(GLOBAL_PERMISSIONS.CREATE_ORGANIZATIONS);
          operationSet.add(OPERATION_PERMISSIONS.CREATE_CLUSTER);
          operationSet.add(OPERATION_PERMISSIONS.EDIT_ASSIGNMENT_RAW_DATA);
          operationSet.add(OPERATION_PERMISSIONS.MODIFY_CLUSTER_ACCESS_AND_PERMISSIONS);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_ASSIGNMENT_DATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_CLUSTER_METADATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_DATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_METADATA);
        } else if (role === 'readonly') {
          global.add(GLOBAL_PERMISSIONS.VIEW_ASSIGNED_OPERATION_METADATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_ASSIGNMENT_DATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_CLUSTER_METADATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_DATA);
          operationSet.add(OPERATION_PERMISSIONS.VIEW_METADATA);
        }
      }
    } else if (grant.type === 'operationCluster') {
    //   const cluster =
    //     await models.v2.operationCluster.get(createBrandedValue(grant.id));
    const cluster = null;
      if (cluster) {
        const global = granted.global = granted.global || new Set();
        if (!granted.operation) {
          granted.operation = new Map();
        }
        let operationSet = granted.operation.get(cluster.data.operation);
        if (!operationSet) {
          granted.operation.set(cluster.data.operation, operationSet = new Set());
        }
        if (!granted.operationCluster) {
          granted.operationCluster = new Map();
        }
        let clusterSet = granted.operationCluster.get(cluster.id);
        if (!clusterSet) {
          granted.operationCluster.set(cluster.id, clusterSet = new Set());
        }
        for (const role of grant.roles) {
          if (role === 'clusterLead') {
            global.add(GLOBAL_PERMISSIONS.VIEW_ASSIGNED_OPERATION_METADATA);
            operationSet.add(OPERATION_PERMISSIONS.VIEW_CLUSTER_METADATA);
            operationSet.add(OPERATION_PERMISSIONS.VIEW_METADATA);
            clusterSet.add(OPERATION_CLUSTER_PERMISSIONS.VIEW_METADATA);
            clusterSet.add(OPERATION_CLUSTER_PERMISSIONS.VIEW_DATA);
            clusterSet.add(OPERATION_CLUSTER_PERMISSIONS.VIEW_ASSIGNMENT_DATA);
            clusterSet.add(OPERATION_CLUSTER_PERMISSIONS.EDIT_ASSIGNMENT_RAW_DATA);
          }
        }
      }
    } else if (grant.type === 'plan') {
      const global = granted.global = granted.global || new Set();
      if (!granted.plan) {
        granted.plan = new Map();
      }
      let planSet = granted.plan.get(grant.id);
      if (!planSet) {
        granted.plan.set(grant.id, planSet = new Set());
      }
      // TODO: we grant all plan leads access to move any project to any step
      // this is probably incorrect, we should fix this if so
      // See: https://humanitarian.atlassian.net/browse/HPC-7467
      for (const role of grant.roles) {
        if (role === 'planLead') {
            //WHAT?
          //global.add('moveToAnyStep');
          planSet.add(PLAN_PERMISSIONS.PROJECT_WORKFLOW_MOVE_TO_ANY_STEP);
          planSet.add(PLAN_PERMISSIONS.EDIT_DATA);
        }
      }
    } else if (grant.type === 'governingEntity') {
      if (!granted.plan) {
        granted.plan = new Map();
      }
      if (!granted.governingEntity) {
        granted.governingEntity = new Map();
      }
      let geSet = granted.governingEntity.get(grant.id);
      if (!geSet) {
        granted.governingEntity.set(grant.id, geSet = new Set());
      }
      // TODO: we grant all plan leads access to move any project to any step
      // this is probably incorrect, we should fix this if so
      // See: https://humanitarian.atlassian.net/browse/HPC-7467
      for (const role of grant.roles) {
        if (role === 'clusterLead') {
          geSet.add(GOVERNING_ENTITY_PERMISSIONS.EDIT_DATA);
        }
      }
    }
  
    return granted;
  }

/**
 * Calculate the complete set of permissions for the actor of the current req
 * 
 * TODO: cache this calculation, and also store it in the request object
 */
export const calculatePermissions = async (
    /**
     * Require only required parameters to allow for easier unit-testing
     */
    context: Context
  ) => {
    const allowed: GrantedPermissions = {};
  
    // Both legacy and new permissions require us to know the current participant
    // rather than require both simultaneously race to calculate this,
    // calculate it once here (as it's cached)
    const participant = context.participant
    if (!participant) {
      return allowed;
    }
  
    const mergeAllowedPermissions =
      <Type extends keyof Omit<GrantedPermissions, 'global'>>(
        type: Type,
        additions: Map<number, Set<PermissionStrings<Type>>>
      ) => {
        let existingMap =
          allowed[type] as unknown as Map<number, Set<PermissionStrings<Type>>> | undefined;
        if (!existingMap) {
          existingMap = allowed[type] = new Map();
        }
        for (const [key, permissions] of additions.entries()) {
          let set = existingMap.get(key);
          if (!set) {
            existingMap.set(key, set = new Set());
          }
          for (const p of permissions) {
            set.add(p);
          }
        }
      }
  
    const addGrantedPermissions = async () => {
      // Get the grantee
      const grantee = await AuthGrantee.findOne({
          type: AuthGranteeType.user,
          granteeId: participant.id
      });
      console.log("grantee obtained: ", grantee);
      if (!grantee) {
        return;
      }
      // Get all grants (along with their targets)
      const grants = await AuthGrant.findWithTarget({
          grantee: grantee.id
      });
      console.log("grants: ", grants);
      // Calculate the allowed permissions for each of these grants
      const allowedFromGrants = await Promise.all(grants.map(grant =>
        calculatePermissionsFromRolesGrant(
          calculateRolesGrantFromTargetAndRoleStrings(
            grant.targetInst,
            grant.roles
          )
        )
      ));
      console.log("allowedFromGrants: ", JSON.stringify(allowedFromGrants));
      // Merge these granted permissions
      for (const granted of allowedFromGrants) {
        if (!granted) {
          continue;
        }
        if (granted.global) {
          allowed.global = allowed.global || new Set();
          for (const p of granted.global) {
            allowed.global.add(p);
          }
        }
        for (const [key, obj] of Object.entries(granted) as [keyof typeof granted, any][]) {
          if (key !== 'global') {
            mergeAllowedPermissions(key, obj)
          }
        }
      }
    }
  
    await Promise.all([
      addGrantedPermissions(),
    ]);
  
    return allowed;
  }