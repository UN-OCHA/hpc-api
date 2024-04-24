import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Condition } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import type Knex from 'knex';
import { type OrderByCond } from '../../utils/database-types';
import { type SortOrder } from '../../utils/graphql/pagination';
import { type EntityDirection } from '../base-types';

export type FlowModel = Database['flow'];
export type FlowInstance = InstanceOfModel<FlowModel>;
export type FlowWhere = Condition<FlowInstance>;
export type FlowOrderByCond = OrderByCond<FlowInstance>;

export type UniqueFlowEntity = {
  id: FlowId;
  versionID: number;
};

export type FlowOrderBy = {
  column: keyof FlowInstance | string;
  order: SortOrder;
  entity: string;
  subEntity?: string;
  direction?: EntityDirection;
};

export interface IGetFlowsArgs {
  models: Database;
  limit: number;
  offset?: number;
  conditions?: FlowWhere;
  orderBy?: FlowOrderByCond;
}

export interface IGetUniqueFlowsArgs {
  databaseConnection: Knex;
  conditions?: FlowWhere;
  whereClauses?: FlowWhere;
  orderBy: FlowOrderByCond;
}
