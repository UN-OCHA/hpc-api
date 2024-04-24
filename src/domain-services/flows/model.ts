import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import type Knex from 'knex';
import { type SortOrder } from '../../utils/graphql/pagination';

export type FlowEntity = InstanceDataOfModel<Database['flow']>;

export type UniqueFlowEntity = {
  id: FlowId;
  versionID: number;
};

export type FlowOrderBy = {
  column: string;
  order: SortOrder;
  entity: string;
  subEntity?: string;
  direction: FlowNestedDirection | undefined;
};

export type FlowNestedDirection = 'source' | 'destination';

export type GetFlowsArgs = {
  models?: Database;
  databaseConnection?: Knex;
  conditions?: any;
  whereClauses?: any;
  offset?: number;
  orderBy?: any;
  limit?: number;
};
