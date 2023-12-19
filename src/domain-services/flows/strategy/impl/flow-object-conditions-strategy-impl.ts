import { type Database } from '@unocha/hpc-api-core/src/db';
import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import { type FlowCategory } from '../../graphql/args';
import {
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { GetFlowIdsFromCategoryConditionsStrategyImpl } from './get-flowIds-flow-category-conditions-strategy-impl';
import { GetFlowIdsFromMixedConditionsStrategyImpl } from './get-flowIds-flow-mixed-conditions-strategy-impl';
import { mapFlowOrderBy } from './utils';

@Service()
export class FlowObjectFiltersStrategy implements FlowSearchStrategy {
  constructor(
    private readonly flowService: FlowService,
    private readonly getFlowIdsFromObjectConditions: GetFlowIdsFromMixedConditionsStrategyImpl,
    private readonly getFlowIdsFromCategoryConditions: GetFlowIdsFromCategoryConditionsStrategyImpl,
    private readonly getFlowIdsFromMixedConditions: GetFlowIdsFromMixedConditionsStrategyImpl
  ) {}

  async search(
    flowConditions: {
      conditionsMap: Map<string, any>;
      flowCategoryFilters: FlowCategory[];
    },
    models: Database,
    orderBy?: any,
    limit?: number,
    cursorCondition?: any,
    filterByPendingFlows?: boolean
  ): Promise<FlowSearchStrategyResponse> {
    const flowConditionsMap = flowConditions.conditionsMap;
    // Obtain flowObjects conditions
    const flowObjectsConditions: Map<
      string,
      Map<string, number[]>
    > = flowConditionsMap.get('flowObjects') ?? new Map();

    // Obtain flow conditions
    const flowEntityConditions = flowConditionsMap.get('flow') ?? new Map();

    // Obtain flowCategory conditions
    const flowCategoryConditions = flowConditions.flowCategoryFilters ?? [];

    const searchFlowIdsStrategy: FlowIDSearchStrategy = this.determineStrategy(
      flowObjectsConditions,
      flowCategoryConditions,
      filterByPendingFlows
    );

    const { flowIDs: flowIdsToFilter }: FlowIdSearchStrategyResponse =
      await searchFlowIdsStrategy.search(
        models,
        flowObjectsConditions,
        flowCategoryConditions,
        filterByPendingFlows
      );

    const whereClauseFromStrategy = searchFlowIdsStrategy.generateWhereClause(
      flowIdsToFilter,
      flowCategoryConditions,
      filterByPendingFlows
    );

    // Combine conditions from flowObjects FlowIDs and flow conditions
    const countConditions = {
      [Cond.AND]: [flowEntityConditions ?? {}, whereClauseFromStrategy ?? {}],
    };

    // Combine cursor condition with flow conditions
    const searchConditions = {
      [Cond.AND]: [
        flowEntityConditions ?? {},
        cursorCondition ?? {},
        whereClauseFromStrategy ?? {},
      ],
    };

    // check and map orderBy to be from entity 'flow'
    const orderByFlow = mapFlowOrderBy(orderBy);

    // Obtain flows and flowCount based on flowIDs from filtered flowObjects
    // and flow conditions
    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(models, searchConditions, orderByFlow, limit),
      this.flowService.getFlowsCount(models, countConditions),
    ]);

    // Map count result query to count object
    const countObject = countRes[0] as { count: number };

    return { flows, count: countObject.count };
  }

  // Determine the strategy to use in order to obtain flowIDs
  // aiming to have the least amount of flowIDs to filter
  // in the next step
  // If there are flowObjects conditions
  // use flowObjects strategy
  // otherwise use flowCategories strategy
  // If there are both flowObjects and flowCategories conditions
  // use both and merge the results keeping only flowIDs
  // present in both arrays
  // otherwise keep all flowIDs from the one that is not empty
  determineStrategy(
    flowObjectsConditions: Map<string, Map<string, number[]>>,
    flowCategoryConditions: any,
    filterByPendingFlows?: boolean
  ): any {
    const isFlowObjectsConditionsIsDefined =
      flowObjectsConditions !== undefined;
    const isFlowCategoryConditionsIsDefined =
      flowCategoryConditions !== undefined;
    const isFilterByPendingFlowsIsDefined = filterByPendingFlows !== undefined;

    const flowObjectsConditionsIsNotEmpty =
      isFlowObjectsConditionsIsDefined && flowObjectsConditions.size;
    const isFlowCategoryConditionsIsNotEmpty =
      isFlowCategoryConditionsIsDefined && flowCategoryConditions.length !== 0;

    if (
      flowObjectsConditionsIsNotEmpty &&
      (isFlowCategoryConditionsIsNotEmpty || isFilterByPendingFlowsIsDefined)
    ) {
      return this.getFlowIdsFromMixedConditions;
    } else if (flowObjectsConditionsIsNotEmpty) {
      return this.getFlowIdsFromObjectConditions;
    } else if (
      isFlowCategoryConditionsIsNotEmpty ||
      isFilterByPendingFlowsIsDefined
    ) {
      return this.getFlowIdsFromCategoryConditions;
    }
    throw new Error(
      'No strategy found for flowObjectsConditions and flowCategoryConditions'
    );
  }

  searchV2(
    _models: Database,
    _databaseConnection: any,
    _limit: number,
    _orderBy: any,
    _cursorCondition: any,
    _flowFilters: any,
    _flowObjectFilters: any,
    _flowCategoryFilters: any,
    _filterByPendingFlows?: boolean
  ): Promise<FlowSearchStrategyResponse> {
    throw new Error('Method not implemented.');
  }
}
