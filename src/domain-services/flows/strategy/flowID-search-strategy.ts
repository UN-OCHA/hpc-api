import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type FlowCategory } from '../graphql/args';

export interface FlowIdSearchStrategyResponse {
  flowIDs: FlowId[];
}

export interface FlowIdSearchStrategyArgs {
  models: Database;
  flowObjectsConditions?: Map<string, Map<string, number[]>>;
  flowCategoryConditions?: FlowCategory[];
  shortcutFilter?: any | null;
}

export interface FlowIDSearchStrategy {
  search(args: FlowIdSearchStrategyArgs): Promise<FlowIdSearchStrategyResponse>;

  generateWhereClause(
    flowIds: FlowId[],
    conditions: any,
    filterByPendingFlows?: boolean
  ): any;
}
