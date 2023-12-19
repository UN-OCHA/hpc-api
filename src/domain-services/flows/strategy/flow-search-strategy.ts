import { type Database } from '@unocha/hpc-api-core/src/db';
import type Knex from 'knex';
import {
  type FlowCategory,
  type FlowObjectFilters,
  type SearchFlowsFilters,
} from '../graphql/args';
import { type FlowEntity } from '../model';

export interface FlowSearchStrategyResponse {
  flows: FlowEntity[];
  count: number;
}

export interface FlowSearchStrategy {
  search(
    flowConditions:
      | Map<string, any>
      | { conditionsMap: Map<string, any>; flowCategoryFilters: any },
    models: Database,
    orderBy?: any,
    limit?: number,
    cursorCondition?: any,
    filterByPendingFlows?: boolean
  ): Promise<FlowSearchStrategyResponse>;

  searchV2(
    models: Database,
    databaseConnection: Knex,
    limit: number,
    orderBy: any,
    cursorCondition: any | undefined,
    flowFilters: SearchFlowsFilters,
    flowObjectFilters: FlowObjectFilters[],
    flowCategoryFilters: FlowCategory[],
    searchPendingFlows: boolean | undefined
  ): Promise<FlowSearchStrategyResponse>;
}
