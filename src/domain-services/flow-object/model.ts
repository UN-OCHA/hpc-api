import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FLOW_OBJECT_TYPE_TYPE } from '@unocha/hpc-api-core/src/db/models/flowObjectType';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import type * as t from 'io-ts';
import { type EntityDirection } from '../base-types';

export type FlowObject = InstanceOfModel<Database['flowObject']>;

export type FlowObjectType = t.TypeOf<typeof FLOW_OBJECT_TYPE_TYPE>;

export type FlowObjectFilterGrouped = Map<
  FlowObjectType,
  Map<EntityDirection, number[]>
>;
