import { type Database } from '@unocha/hpc-api-core/src/db';
import { type ShortcutCategoryFilter } from '../../categories/model';
import {
  type FlowCategory,
  type FlowObjectFilters,
  type NestedFlowFilters,
  type SearchFlowsFilters,
} from '../graphql/args';
import { type FlowStatusFilter } from '../graphql/types';
import type { FlowInstance, FlowOrderByWithSubEntity } from '../model';

export interface FlowSearchStrategyResponse {
  flows: FlowInstance[];
  count: number;
}

export interface FlowSearchArgs {
  models: Database;
  flowFilters: SearchFlowsFilters;
  flowObjectFilters: FlowObjectFilters[];
  flowCategoryFilters: FlowCategory[];
  nestedFlowFilters: NestedFlowFilters;
  shortcutFilters: ShortcutCategoryFilter[] | null;
  statusFilter: FlowStatusFilter | null;
  shouldIncludeChildrenOfParkedFlows?: boolean;
  limit: number;
  offset: number;
  orderBy?: FlowOrderByWithSubEntity;
}

export interface FlowSearchStrategy {
  search(args: FlowSearchArgs): Promise<FlowSearchStrategyResponse>;
}
