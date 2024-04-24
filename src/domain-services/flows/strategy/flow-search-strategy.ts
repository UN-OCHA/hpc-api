import { type Database } from '@unocha/hpc-api-core/src/db';
import type Knex from 'knex';
import {
  type FlowCategory,
  type FlowObjectFilters,
  type NestedFlowFilters,
  type SearchFlowsFilters,
} from '../graphql/args';
import {
  type FlowShortcutFilter,
  type FlowStatusFilter,
} from '../graphql/types';
import { type FlowEntity } from '../model';

export interface FlowSearchStrategyResponse {
  flows: FlowEntity[];
  count: number;
}

export interface FlowSearchArgs {
  models: Database;
  databaseConnection: Knex;
  flowFilters: SearchFlowsFilters;
  flowObjectFilters: FlowObjectFilters[];
  flowCategoryFilters: FlowCategory[];
  nestedFlowFilters: NestedFlowFilters;
  shortcutFilter: FlowShortcutFilter;
  statusFilter: FlowStatusFilter | null;
  limit: number;
  offset: number;
  orderBy?: any;
}

export interface FlowSearchStrategy {
  search(args: FlowSearchArgs): Promise<FlowSearchStrategyResponse>;
}
