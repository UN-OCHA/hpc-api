import { type Database } from '@unocha/hpc-api-core/src/db';
import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import { type FlowCategoryFilters } from '../../graphql/args';
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
import { checkAndMapFlowOrderBy } from './utils';

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
      flowCategoryFilters: FlowCategoryFilters;
    },
    models: Database,
    orderBy?: any,
    limit?: number,
    cursorCondition?: any
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
    const flowCategoryConditions = flowConditions.flowCategoryFilters ?? {};

    const searchFlowIdsStrategy: FlowIDSearchStrategy = this.determineStrategy(
      flowObjectsConditions,
      flowCategoryConditions
    );

    const { flowIDs: flowIdsToFilter }: FlowIdSearchStrategyResponse =
      await searchFlowIdsStrategy.search(
        models,
        flowObjectsConditions,
        flowCategoryConditions
      );

    // Combine conditions from flowObjects FlowIDs and flow conditions
    const countConditions = {
      [Cond.AND]: [
        flowEntityConditions ?? {},

        searchFlowIdsStrategy.generateWhereClause(
          flowIdsToFilter,
          flowCategoryConditions
        ),
      ],
    };

    // Combine cursor condition with flow conditions
    const searchConditions = {
      [Cond.AND]: [
        flowEntityConditions ?? {},
        cursorCondition ?? {},
        searchFlowIdsStrategy.generateWhereClause(
          flowIdsToFilter,
          flowCategoryConditions
        ),
      ],
    };

    // check and map orderBy to be from entity 'flow'
    const orderByFlow = checkAndMapFlowOrderBy(orderBy);

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
    flowCategoryConditions: any
  ): any {
    const isFlowObjectsConditionsIsDefined =
      flowObjectsConditions !== undefined;
    const isFlowCategoryConditionsIsDefined =
      flowCategoryConditions !== undefined;

    const flowObjectsConditionsIsNotEmpty =
      isFlowObjectsConditionsIsDefined && flowObjectsConditions.size;
    const flowCategoryConditionsIsNotEmpty =
      isFlowCategoryConditionsIsDefined &&
      Object.keys(flowCategoryConditions).length;

    if (flowObjectsConditionsIsNotEmpty && flowCategoryConditionsIsNotEmpty) {
      return this.getFlowIdsFromMixedConditions;
    } else if (flowObjectsConditionsIsNotEmpty) {
      return this.getFlowIdsFromObjectConditions;
    } else if (flowCategoryConditionsIsNotEmpty) {
      return this.getFlowIdsFromCategoryConditions;
    }
    throw new Error(
      'No strategy found for flowObjectsConditions and flowCategoryConditions'
    );
  }
}
