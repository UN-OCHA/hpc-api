import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import type Knex from 'knex';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
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

    // After that, if we need to filter by flowObjects
    // Obtain the flowIDs from the flowObjects
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

    // We need to have two conditions, one for the search and one for the count
    // 'countConditions' => Apply only filter conditions but not cursor conditions
    // 'searchConditions' => Apply both filter and cursor conditions
    const { countConditions, searchConditions } = this.buildConditions(
      {
        isFilterByFlowObjects,
        isFilterByCategory,
        willSearchPendingFlows: searchPendingFlows,
        isSearchByPendingDefined,
      },
      {
        flowIDsFromCategoryFilters,
        flowIDsFromObjectFilters,
        flowFilters,
      }
    );

    let rawOrderBy: string = '';
    let orderByFlow:
      | {
          column: any;
          order: any;
        }
      | undefined = { column: 'updatedAt', order: 'DESC' };
    if (isSortByEntity) {
      rawOrderBy = `array_position(ARRAY[${sortByFlowIDs.join(',')}], "id")`;
      orderByFlow = undefined;
    } else {
      orderByFlow = mapFlowOrderBy(orderBy);
    }

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
  buildConditions(
    decisionArgs: {
      isFilterByFlowObjects: boolean;
      isFilterByCategory: boolean;
      willSearchPendingFlows: boolean | undefined;
      isSearchByPendingDefined: boolean;
    },
    filterArgs: {
      flowIDsFromCategoryFilters: FlowId[];
      flowIDsFromObjectFilters: FlowId[];
      flowFilters: any | undefined;
    }
  ): { countConditions: any; searchConditions: any } {
    const {
      isFilterByFlowObjects,
      isFilterByCategory,
      willSearchPendingFlows,
      isSearchByPendingDefined,
    } = decisionArgs;
    const {
      flowIDsFromCategoryFilters,
      flowIDsFromObjectFilters,
      flowFilters,
    } = filterArgs;
    let countConditions: any = {};
    let searchConditions: any = {};

    // Check if we have flowIDs from flowObjects and flowCategoryFilters
    // if so, we need to filter by those flowIDs
    if (
      (isFilterByFlowObjects || isFilterByCategory) &&
      isSearchByPendingDefined
    ) {
      const deduplicatedFlowIDs = [...new Set(flowIDsFromCategoryFilters)];

      searchConditions = {
        ...searchConditions,
        [Cond.AND]: [
          {
            id: {
              [Op.IN]: deduplicatedFlowIDs,
            },
          },
        ],
      };
      countConditions = {
        ...countConditions,
        [Cond.AND]: [
          {
            id: {
              [Op.IN]: deduplicatedFlowIDs,
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
    } else if (isFilterByCategory || isSearchByPendingDefined) {
      const idCondition = isSearchByPendingDefined
        ? willSearchPendingFlows
          ? Op.IN
          : Op.NOT_IN
        : Op.IN;

      searchConditions = {
        ...searchConditions,
        [Cond.AND]: [
          {
            id: {
              [idCondition]: flowIDsFromCategoryFilters,
            },
          },
        ],
      };

      countConditions = {
        ...countConditions,
        [Cond.AND]: [
          {
            id: {
              idCondition: flowIDsFromCategoryFilters,
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
    return { countConditions, searchConditions };
  }
}
