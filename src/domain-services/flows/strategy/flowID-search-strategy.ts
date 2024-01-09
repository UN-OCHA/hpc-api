import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import Knex from 'knex';
import { type FlowCategory } from '../graphql/args';
import { type UniqueFlowEntity } from '../model';

export interface FlowIdSearchStrategyResponse {
  flows: UniqueFlowEntity[];
}

export interface FlowIdSearchStrategyArgs {
  databaseConnection: Knex;
  models: Database;
  flowObjectsConditions?: Map<string, Map<string, number[]>>;
  flowCategoryConditions?: FlowCategory[];
  shortcutFilter?: any[] | null;
}

export interface FlowIDSearchStrategy {
  search(args: FlowIdSearchStrategyArgs): Promise<FlowIdSearchStrategyResponse>;

  generateWhereClause(
    flowIds: FlowId[],
    conditions: any,
    filterByPendingFlows?: boolean
  ): any;
}
