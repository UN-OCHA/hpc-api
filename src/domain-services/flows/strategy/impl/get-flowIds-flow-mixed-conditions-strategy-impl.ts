import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { type FlowCategory } from '../../graphql/args';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { GetFlowIdsFromCategoryConditionsStrategyImpl } from './get-flowIds-flow-category-conditions-strategy-impl';
import { GetFlowIdsFromObjectConditionsStrategyImpl } from './get-flowIds-flow-object-conditions-strategy-impl';
import { mergeFlowIDsFromFilteredFlowObjectsAndFlowCategories } from './utils';

@Service()
export class GetFlowIdsFromMixedConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(
    private readonly getFlowIdsFromObjectConditionsStrategy: GetFlowIdsFromObjectConditionsStrategyImpl,
    private readonly getFlowIdsFromCategoryConditionsStrategy: GetFlowIdsFromCategoryConditionsStrategyImpl
  ) {}

  async search(
    models: Database,
    flowObjectsConditions: Map<string, Map<string, number[]>>,
    flowCategoryConditions: FlowCategory[],
    filterByPendingFlows: boolean
  ): Promise<FlowIdSearchStrategyResponse> {
    const { flowIDs: flowIdsFromFlowObjects }: FlowIdSearchStrategyResponse =
      await this.getFlowIdsFromObjectConditionsStrategy.search(
        models,
        flowObjectsConditions
      );

    const { flowIDs: flowIdsFromFlowCategories }: FlowIdSearchStrategyResponse =
      await this.getFlowIdsFromCategoryConditionsStrategy.search(
        models,
        flowObjectsConditions,
        flowCategoryConditions,
        filterByPendingFlows
      );

    const mergeFlowIDs: FlowId[] =
      mergeFlowIDsFromFilteredFlowObjectsAndFlowCategories(
        flowIdsFromFlowObjects,
        flowIdsFromFlowCategories
      );

    return { flowIDs: mergeFlowIDs };
  }

  generateWhereClause(flowIds: FlowId[]) {
    return {
      id: {
        [Op.IN]: flowIds,
      },
    };
  }
}
