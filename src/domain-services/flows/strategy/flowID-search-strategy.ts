import { type Database } from '@unocha/hpc-api-core/src/db';
import type Knex from 'knex';
import { type FlowCategory, type NestedFlowFilters } from '../graphql/args';
import { type UniqueFlowEntity } from '../model';

export interface FlowIdSearchStrategyResponse {
  flows: UniqueFlowEntity[];
}

export interface FlowIdSearchStrategyArgs {
  databaseConnection: Knex;
  models: Database;
  flowObjectsConditions?: any; // TODO: use proper type
  flowCategoryConditions?: FlowCategory[];
  nestedFlowFilters?: NestedFlowFilters;
  shortcutFilter?: any[] | null;
}

export interface FlowIDSearchStrategy {
  search(args: FlowIdSearchStrategyArgs): Promise<FlowIdSearchStrategyResponse>;
}
