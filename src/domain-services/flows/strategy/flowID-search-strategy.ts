import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type FlowCategory } from '../graphql/args';

export interface FlowIdSearchStrategyResponse {
  flowIDs: FlowId[];
}

export interface FlowIDSearchStrategy {
  search(
    models: Database,
    flowObjectsConditions: Map<string, Map<string, number[]>>,
    flowCategoryConditions: FlowCategory[],
    filterByPendingFlows?: boolean
  ): Promise<FlowIdSearchStrategyResponse>;

  generateWhereClause(
    flowIds: FlowId[],
    conditions: any,
    filterByPendingFlows?: boolean
  ): any;
}
