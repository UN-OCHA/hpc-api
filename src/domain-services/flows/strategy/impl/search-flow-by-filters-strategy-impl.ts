import type Knex from 'knex';
import { Service } from 'typedi';
import { type OrderBy } from '../../../../utils/database-types';
import { FlowService } from '../../flow-service';
import type { FlowEntity, UniqueFlowEntity } from '../../model';
import type {
  FlowSearchArgs,
  FlowSearchStrategy,
  FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import { type FlowIdSearchStrategyResponse } from '../flowID-search-strategy';
import { GetFlowIdsFromCategoryConditionsStrategyImpl } from './get-flowIds-flow-category-conditions-strategy-impl';
import { GetFlowIdsFromNestedFlowFiltersStrategyImpl } from './get-flowIds-flow-from-nested-flow-filters-strategy-impl';
import { GetFlowIdsFromObjectConditionsStrategyImpl } from './get-flowIds-flow-object-conditions-strategy-impl';
import {
  buildOrderByReference,
  buildSearchFlowsConditions,
  defaultFlowOrderBy,
  intersectUniqueFlowEntities,
  mapFlowOrderBy,
  mergeUniqueEntities,
  prepareFlowConditions,
  prepareFlowStatusConditions,
} from './utils';

@Service()
export class SearchFlowByFiltersStrategy implements FlowSearchStrategy {
  constructor(
    private readonly flowService: FlowService,
    private readonly getFlowIdsFromCategoryConditions: GetFlowIdsFromCategoryConditionsStrategyImpl,
    private readonly getFlowIdsFromObjectConditions: GetFlowIdsFromObjectConditionsStrategyImpl,
    private readonly getFlowIdsFromNestedFlowFilters: GetFlowIdsFromNestedFlowFiltersStrategyImpl
  ) {}

  async search(args: FlowSearchArgs): Promise<FlowSearchStrategyResponse> {
    const {
      models,
      databaseConnection,
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      nestedFlowFilters,
      limit,
      offset,
      shortcutFilter,
      statusFilter,
      orderBy,
    } = args;

    // First, we need to check if we need to sort by a certain entity
    // and if so, we need to map the orderBy to be from that entity
    // obtain the entities relation to the flow
    // to be able to sort the flows using the entity
    const isSortByEntity = orderBy && orderBy.entity !== 'flow';

    const sortByFlowIDs: UniqueFlowEntity[] = [];
    if (isSortByEntity) {
      // Get the flowIDs using the orderBy entity
      const flowIDsFromSortingEntity: UniqueFlowEntity[] =
        await this.flowService.getFlowIDsFromEntity(
          databaseConnection,
          orderBy
        );
      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      // also, we need to map the FlowEntity to UniqueFlowEntity
      for (const uniqueFlow of flowIDsFromSortingEntity) {
        sortByFlowIDs.push(uniqueFlow);
      }
    } else {
      // In this case we fetch the list of flows from the database
      // using the orderBy
      const orderByForFlow = mapFlowOrderBy(orderBy);

      const flowsToSort: UniqueFlowEntity[] =
        await this.flowService.getFlowsAsUniqueFlowEntity({
          databaseConnection,
          conditions: flowFilters,
          orderBy: orderByForFlow,
          offset,
          limit,
        });

      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      // also, we need to map the FlowEntity to UniqueFlowEntity
      for (const flow of flowsToSort) {
        sortByFlowIDs.push(flow);
      }
    }

    // We need to fetch the flowIDs by the nestedFlowFilters
    // if there are any
    const isFilterByNestedFilters = nestedFlowFilters !== undefined;
    const flowIDsFromNestedFlowFilters: UniqueFlowEntity[] = [];

    if (isFilterByNestedFilters) {
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromNestedFlowFilters.search({
          databaseConnection,
          models,
          nestedFlowFilters,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }
      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      for (const flow of flows) {
        flowIDsFromNestedFlowFilters.push(flow);
      }
    }

    // Now we need to check if we need to filter by category
    // if it's using any of the shorcuts
    // or if there are any flowCategoryFilters
    const isSearchByCategoryShotcut =
      shortcutFilter !== null && shortcutFilter.length > 0;

    const isFilterByCategory =
      isSearchByCategoryShotcut || flowCategoryFilters?.length > 0;

    const flowsFromCategoryFilters: UniqueFlowEntity[] = [];

    if (isFilterByCategory) {
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromCategoryConditions.search({
          databaseConnection,
          models,
          flowCategoryConditions: flowCategoryFilters ?? [],
          shortcutFilter,
          flowObjectsConditions: undefined,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      for (const flow of flows) {
        flowsFromCategoryFilters.push(flow);
      }
    }

    // After that, if we need to filter by flowObjects
    // Obtain the flowIDs from the flowObjects
    const isFilterByFlowObjects = flowObjectFilters?.length > 0;

    const flowsFromObjectFilters: UniqueFlowEntity[] = [];
    if (isFilterByFlowObjects) {
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromObjectConditions.search({
          databaseConnection,
          models,
          flowObjectsConditions: flowObjectFilters,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      for (const flow of flows) {
        flowsFromObjectFilters.push(flow);
      }
    }

    // Lastly, we need to check if we need to filter by flow
    // And if we didn't did it before when sorting by entity
    // if so, we need to obtain the flowIDs from the flowFilters
    const isFilterByFlow = flowFilters !== undefined;
    const isFilterByFlowStatus = statusFilter !== undefined;

    const flowsFromFlowFilters: UniqueFlowEntity[] = [];
    if (isFilterByFlow || isFilterByFlowStatus) {
      let flowConditions = prepareFlowConditions(flowFilters);
      // Add status filter conditions if provided
      flowConditions = prepareFlowStatusConditions(
        flowConditions,
        statusFilter
      );

      const orderByForFlow = isSortByEntity ? defaultFlowOrderBy() : orderBy;
      const flows: UniqueFlowEntity[] =
        await this.flowService.getFlowsAsUniqueFlowEntity({
          databaseConnection,
          conditions: flowConditions,
          orderBy: orderByForFlow,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      // also, we need to map the FlowEntity to UniqueFlowEntity
      for (const flow of flows) {
        flowsFromFlowFilters.push(flow);
      }
    }

    // We need to intersect the flowIDs from the flowObjects, flowCategoryFilters and flowFilters
    // to obtain the flowIDs that match all the filters
    const deduplicatedFlows: UniqueFlowEntity[] = intersectUniqueFlowEntities(
      flowsFromCategoryFilters,
      flowsFromObjectFilters,
      flowsFromFlowFilters,
      flowIDsFromNestedFlowFilters
    );

    if (deduplicatedFlows.length === 0) {
      return { flows: [], count: 0 };
    }

    // We are going to sort the deduplicated flows
    // using the sortByFlowIDs if there are any
    let sortedFlows: UniqueFlowEntity[] = [];
    // There are 3 scenarios:
    // 1. While sorting we have more flows 'sorted' than deduplicatedFlows
    // That means we can apply the filterSorting pattern to gain a bit of performance
    // 2. While sorting we have the same amount or less flows 'sorted' than deduplicatedFlows
    // That means we need to keep the sortedFilters and then keep the rest of deduplicatedFlows thar are not in sortedFlows
    // If we don't do this it may cause that just changing the orderBy we get different results
    // Because we get rid of those flows that are not present in the sortedFlows list
    // 3. There are no sortByFlowIDs
    // That means we need to keep all the deduplicatedFlows as they come
    if (sortByFlowIDs.length > deduplicatedFlows.length) {
      sortedFlows = intersectUniqueFlowEntities(
        sortByFlowIDs,
        deduplicatedFlows
      );
    } else if (sortByFlowIDs.length <= deduplicatedFlows.length) {
      sortedFlows = intersectUniqueFlowEntities(
        sortByFlowIDs,
        deduplicatedFlows
      );

      sortedFlows = mergeUniqueEntities(sortedFlows, deduplicatedFlows);
    } else {
      sortedFlows = deduplicatedFlows;
    }

    const count = sortedFlows.length;

    const flowEntityOrderBy = isSortByEntity
      ? buildOrderByReference(sortedFlows)
      : defaultFlowOrderBy();
    // Store the flows promise
    const flows = await this.progresiveSearch(
      databaseConnection,
      sortedFlows,
      limit,
      offset ?? 0,
      flowEntityOrderBy,
      []
    );

    return { flows, count };
  }

  /**
   * This method progressively search the flows
   * accumulating the results in the flowResponse
   * until the limit is reached or there are no more flows
   * in the sortedFlows
   *
   * Since this is a recursive, the exit condition is when
   * the flowResponse length is equal to the limit
   * or the reducedFlows length is less than the limit after doing the search
   *
   * @param models
   * @param sortedFlows
   * @param limit
   * @param offset
   * @param orderBy
   * @param flowResponse
   * @returns list of flows
   */
  async progresiveSearch(
    databaseConnection: Knex,
    sortedFlows: UniqueFlowEntity[],
    limit: number,
    offset: number,
    orderBy: OrderBy | null,
    flowResponse: FlowEntity[]
  ): Promise<FlowEntity[]> {
    const reducedFlows = sortedFlows.slice(offset, offset + limit);

    const whereConditions = buildSearchFlowsConditions(reducedFlows);

    const flows = await this.flowService.getFlowsRaw({
      databaseConnection,
      whereClauses: whereConditions,
      orderBy: orderBy,
    });

    flowResponse.push(...flows);

    if (flowResponse.length === limit || reducedFlows.length < limit) {
      return flowResponse;
    }

    // Recursive call
    offset += limit;
    return await this.progresiveSearch(
      databaseConnection,
      sortedFlows,
      limit,
      offset,
      orderBy,
      flowResponse
    );
  }
}
