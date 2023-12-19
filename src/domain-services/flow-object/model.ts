import { type Database } from '@unocha/hpc-api-core/src/db';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';

export type FlowObject = InstanceOfModel<Database['flowObject']>;
export type FlowObjectType =
  | 'governingEntity'
  | 'plan'
  | 'planEntity'
  | 'project'
  | 'globalCluster'
  | 'organization'
  | 'emergency'
  | 'flow'
  | 'location'
  | 'anonymizedOrganization'
  | 'cluster'
  | 'corePlanEntityActivity'
  | 'corePlanEntityObjective'
  | 'usageYear';
