import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Condition } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type OrderByCond } from '@unocha/hpc-api-core/src/db/util/raw-model';
import type { FieldsOfModel, InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { type SortOrder } from '../../utils/graphql/pagination';
import { type EntityDirection } from '../base-types';

export type FlowModel = Database['flow'];
export type FlowInstance = InstanceOfModel<FlowModel>;
export type FlowWhere = Condition<FlowInstance>;
export type FlowFieldsDefinition = FieldsOfModel<FlowModel>
export type FlowOrderByCond = OrderByCond<FlowFieldsDefinition>; // Can this be simplified somehow?
export type UniqueFlowEntity = {
  id: FlowId;
  versionID: number | null;
};

export type FlowOrderByWithSubEntity = {
  column: keyof FlowInstance | string;
  order: SortOrder;
  entity: string;
  subEntity?: string;
  direction?: EntityDirection;
};

export interface IGetFlowsArgs {
  models: Database;
  limit?: number;
  offset?: number;
  conditions?: FlowWhere;
  orderBy?: FlowOrderByCond;
}
