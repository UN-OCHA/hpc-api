import { type Database } from '@unocha/hpc-api-core/src/db';
import type Knex from 'knex';
import { type FlowCategory, type NestedFlowFilters } from '../graphql/args';
import { type FlowShortcutFilter } from '../graphql/types';
import { type UniqueFlowEntity } from '../model';

export interface FlowIdSearchStrategyResponse {
  flows: UniqueFlowEntity[];
}

export interface FlowIdSearchStrategyArgs {
  databaseConnection: Knex;
  models: Database;
  flowObjectsConditions?: any;
  flowCategoryConditions?: FlowCategory[];
  nestedFlowFilters?: NestedFlowFilters;
  shortcutFilter?: FlowShortcutFilter;
}

export interface FlowIDSearchStrategy {
  search(args: FlowIdSearchStrategyArgs): Promise<FlowIdSearchStrategyResponse>;
}
