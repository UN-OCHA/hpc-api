import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type FlowCategoryFilters } from '../graphql/args';

export interface FlowIdSearchStrategyResponse {
  flowIDs: FlowId[];
}

export interface FlowIDSearchStrategy {
  search(
    models: Database,
    flowObjectsConditions: Map<string, Map<string, number[]>>,
    flowCategoryConditions: FlowCategoryFilters
  ): Promise<FlowIdSearchStrategyResponse>;

  generateWhereClause(flowIds: FlowId[], conditions: any): any;
}
