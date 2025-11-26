import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type ShortcutCategoryFilter } from '../../categories/model';
import { type FlowObjectFilterGrouped } from '../../flow-object/model';
import { type FlowCategory, type NestedFlowFilters } from '../graphql/args';
import { type UniqueFlowEntity } from '../model';

export interface FlowIdSearchStrategyResponse {
  flows: UniqueFlowEntity[];
}

export interface FlowIdSearchStrategyArgs {
  models: Database;
  flowObjectFilterGrouped?: FlowObjectFilterGrouped;
  flowCategoryConditions?: FlowCategory[];
  nestedFlowFilters?: NestedFlowFilters;
  shortcutFilters?: ShortcutCategoryFilter[] | null;
  candidates?: Set<FlowId>;
}

export interface FlowIDSearchStrategy {
  search(args: FlowIdSearchStrategyArgs): Promise<FlowIdSearchStrategyResponse>;
}
