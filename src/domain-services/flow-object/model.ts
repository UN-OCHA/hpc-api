import { type Database } from '@unocha/hpc-api-core/src/db';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import * as t from 'io-ts';

export type FlowObject = InstanceOfModel<Database['flowObject']>;

// Define the FlowObjectType as a runtime type
export const FlowObjectType = t.union([
  t.literal('governingEntity'),
  t.literal('plan'),
  t.literal('planEntity'),
  t.literal('project'),
  t.literal('globalCluster'),
  t.literal('organization'),
  t.literal('emergency'),
  t.literal('flow'),
  t.literal('location'),
  t.literal('anonymizedOrganization'),
  t.literal('cluster'),
  t.literal('corePlanEntityActivity'),
  t.literal('corePlanEntityObjective'),
  t.literal('usageYear'),
]);

export type FlowObjectType = t.TypeOf<typeof FlowObjectType>;
