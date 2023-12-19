import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import type Knex from 'knex';
import { Service } from 'typedi';
import { type FlowService } from '../../flow-service';
import {
  type FlowCategory,
  type FlowObjectFilters,
  type SearchFlowsFilters,
} from '../../graphql/args';
import { type FlowOrderBy } from '../../model';
import {
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import { type FlowIdSearchStrategyResponse } from '../flowID-search-strategy';
import { GetFlowIdsFromCategoryConditionsStrategyImpl } from './get-flowIds-flow-category-conditions-strategy-impl';
import { GetFlowIdsFromObjectConditionsStrategyImpl } from './get-flowIds-flow-object-conditions-strategy-impl';
import {
  mapCountResultToCountObject,
  mapFlowObjectConditions,
  mapFlowOrderBy,
  prepareFlowConditions,
} from './utils';

@Service()
export class SearchFlowByFiltersStrategy implements FlowSearchStrategy {
  constructor(
    private readonly flowService: FlowService,
    private readonly getFlowIdsFromCategoryConditions: GetFlowIdsFromCategoryConditionsStrategyImpl,
    private readonly getFlowIdsFromObjectConditions: GetFlowIdsFromObjectConditionsStrategyImpl
  ) {}

  search(
    _flowConditions: any,
    _models: Database,
    _orderBy?: any,
    _limit?: number,
    _cursorCondition?: any,
    _filterByPendingFlows?: boolean
  ): Promise<FlowSearchStrategyResponse> {
    throw new Error('Method not implemented.');
  }

  async searchV2(
    models: Database,
    databaseConnection: Knex,
    limit: number,
    orderBy: FlowOrderBy,
    cursorCondition: any | undefined,
    flowFilters: SearchFlowsFilters,
    flowObjectFilters: FlowObjectFilters[],
    flowCategoryFilters: FlowCategory[],
    searchPendingFlows: boolean | undefined
  ): Promise<FlowSearchStrategyResponse> {
    // First, we need to check if we need to sort by a certain entity
    // and if so, we need to map the orderBy to be from that entity
    // obtain the entities relation to the flow
    // to be able to sort the flows using the entity
    const isSortByEntity = orderBy && orderBy.entity !== 'flow';

    const sortByFlowIDs: FlowId[] = [];
    if (isSortByEntity) {
      // Get the flowIDs using the orderBy entity
      const flowIDsFromSortingEntity: FlowId[] =
        await this.flowService.getFlowIDsFromEntity(
          models,
          databaseConnection,
          orderBy,
          limit
        );
      sortByFlowIDs.push(...flowIDsFromSortingEntity);
    }

    // Now we need to check if we need to filter by category
    // if it's using the shorcut 'pending'
    // or if there are any flowCategoryFilters
    const isSearchByPendingDefined = searchPendingFlows !== undefined;

    const isFilterByCategory =
      isSearchByPendingDefined || flowCategoryFilters?.length > 0;

    const flowIDsFromCategoryFilters: FlowId[] = [];

    if (isFilterByCategory) {
      const flowIDsFromCategoryStrategy: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromCategoryConditions.search(
          models,
          new Map(),
          flowCategoryFilters ?? [],
          searchPendingFlows
        );
      flowIDsFromCategoryFilters.push(...flowIDsFromCategoryStrategy.flowIDs);
    }

    // After that, we need to check if we need to filter by flowObjects
    // if so, we need to obtain the flowIDs from the flowObjects
    const isFilterByFlowObjects = flowObjectFilters?.length > 0;

    const flowIDsFromObjectFilters: FlowId[] = [];
    if (isFilterByFlowObjects) {
      const flowObjectConditionsMap =
        mapFlowObjectConditions(flowObjectFilters);
      const flowIDsFromObjectStrategy: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromObjectConditions.search(
          models,
          flowObjectConditionsMap
        );
      flowIDsFromObjectFilters.push(...flowIDsFromObjectStrategy.flowIDs);
    }

    // Apply only filter conditions but not cursor conditions
    let countConditions = {};

    // Combine cursor condition with flow conditions
    let searchConditions = { ...cursorCondition };

    // Check if we have flowIDs from flowObjects and flowCategoryFilters
    // if so, we need to filter by those flowIDs
    if (isFilterByFlowObjects && isFilterByCategory) {
      if (searchPendingFlows === true) {
        // We need to combine the flowIDs from flowObjects and flowCategoryFilters
        // to have the least amount of flowIDs to filter
        const setOfFlowIDs = new Set([
          ...flowIDsFromCategoryFilters,
          ...flowIDsFromObjectFilters,
        ]);
        const flowIDsFromFilteredFlowObjects = [...setOfFlowIDs];
        searchConditions = {
          ...searchConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.IN]: flowIDsFromFilteredFlowObjects,
              },
            },
          ],
        };
        countConditions = {
          ...countConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.IN]: flowIDsFromFilteredFlowObjects,
              },
            },
          ],
        };
      } else {
        searchConditions = {
          ...searchConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.NOT_IN]: flowIDsFromCategoryFilters,
                [Op.IN]: flowIDsFromObjectFilters,
              },
            },
          ],
        };
        countConditions = {
          ...countConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.NOT_IN]: flowIDsFromCategoryFilters,
                [Op.IN]: flowIDsFromObjectFilters,
              },
            },
          ],
        };
      }
    } else if (isFilterByCategory && isSearchByPendingDefined) {
      if (searchPendingFlows === true) {
        searchConditions = {
          ...searchConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.IN]: flowIDsFromCategoryFilters,
              },
            },
          ],
        };
        countConditions = {
          ...countConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.IN]: flowIDsFromCategoryFilters,
              },
            },
          ],
        };
      } else {
        searchConditions = {
          ...searchConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.NOT_IN]: flowIDsFromCategoryFilters,
              },
            },
          ],
        };
        countConditions = {
          ...countConditions,
          [Cond.AND]: [
            {
              id: {
                [Op.NOT_IN]: flowIDsFromCategoryFilters,
              },
            },
          ],
        };
      }
    } else if (isFilterByCategory && !isSearchByPendingDefined) {
      searchConditions = {
        ...searchConditions,
        [Cond.AND]: [
          {
            id: {
              [Op.IN]: flowIDsFromCategoryFilters,
            },
          },
        ],
      };
      countConditions = {
        ...countConditions,
        [Cond.AND]: [
          {
            id: {
              [Op.IN]: flowIDsFromCategoryFilters,
            },
          },
        ],
      };
    } else if (isFilterByFlowObjects) {
      searchConditions = {
        ...searchConditions,
        [Cond.AND]: [
          {
            id: {
              [Op.IN]: flowIDsFromObjectFilters,
            },
          },
        ],
      };
      countConditions = {
        ...countConditions,
        [Cond.AND]: [
          {
            id: {
              [Op.IN]: flowIDsFromObjectFilters,
            },
          },
        ],
      };
    }

    // After adding the where clauses form the filters
    // we need to add the conditions from the flow entity filters
    // if there are any
    if (flowFilters) {
      // Map flowConditions to where clause
      const flowConditions = prepareFlowConditions(flowFilters);

      // Combine conditions from flowObjects FlowIDs and flow conditions
      countConditions = {
        ...countConditions,
        [Cond.AND]: [flowConditions ?? {}],
      };

      // Combine cursor condition with flow conditions
      searchConditions = {
        ...searchConditions,
        [Cond.AND]: [flowConditions ?? {}],
      };
    }

    let rawOrderBy = undefined;
    let orderByFlow = undefined;
    if (isSortByEntity) {
      rawOrderBy = `array_position(ARRAY[${sortByFlowIDs.join(',')}], "id")`;
    } else {
      orderByFlow = mapFlowOrderBy(orderBy);
    }

    // Temporal
    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(
        models,
        searchConditions,
        orderByFlow,
        limit,
        rawOrderBy
      ),
      this.flowService.getFlowsCount(models, countConditions),
    ]);

    // Map count result query to count object
    const countObject = mapCountResultToCountObject(countRes);

    return { flows, count: countObject.count };
  }
}
