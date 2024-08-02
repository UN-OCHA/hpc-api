import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import type { FlowWhere, UniqueFlowEntity } from '../../model';
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
  defaultFlowOrderBy,
  defaultSearchFlowFilter,
  intersectUniqueFlowEntities,
  mapFlowFiltersToFlowObjectFiltersGrouped,
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
      shortcutFilters,
      statusFilter,
      orderBy,
      shouldIncludeChildrenOfParkedFlows,
    } = args;

    // First, we need to check if we need to sort by a certain entity
    // and if so, we need to map the orderBy to be from that entity
    // obtain the entities relation to the flow
    // to be able to sort the flows using the entity
    const isSortByEntity = orderBy && orderBy.entity !== 'flow';
    const sortByFlowIDs: UniqueFlowEntity[] = [];
    const orderByForFlow = mapFlowOrderBy(orderBy);

    if (isSortByEntity) {
      // Get the flowIDs using the orderBy entity
      const flowIDsFromSortingEntity: UniqueFlowEntity[] =
        await this.flowService.getFlowIDsFromEntity(models, orderBy);
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
      const flowsToSort: UniqueFlowEntity[] = await this.flowService.getFlows({
        models,
        orderBy: orderByForFlow,
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
      shortcutFilters !== null && shortcutFilters.length > 0;

    const isFilterByCategory =
      isSearchByCategoryShotcut || flowCategoryFilters?.length > 0;

    const flowsFromCategoryFilters: UniqueFlowEntity[] = [];

    if (isFilterByCategory) {
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromCategoryConditions.search({
          databaseConnection,
          models,
          flowCategoryConditions: flowCategoryFilters ?? [],
          shortcutFilters,
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
      // Firts step is to map the filters to the FlowObjectFiltersGrouped
      // To allow doing inclusive filtering between filters of the same type+direction
      // But exclusive filtering between filters of different type+direction
      const flowObjectFiltersGrouped =
        mapFlowFiltersToFlowObjectFiltersGrouped(flowObjectFilters);

      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromObjectConditions.search({
          databaseConnection,
          models,
          flowObjectFilterGrouped: flowObjectFiltersGrouped,
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

      // If 'includeChildrenOfParkedFlows' is defined and true
      // we need to obtain the flowIDs from the childs whose parent flows are parked
      if (shouldIncludeChildrenOfParkedFlows) {
        // We need to obtain the flowIDs from the childs whose parent flows are parked
        const childs =
          await this.flowService.getParkedParentFlowsByFlowObjectFilter(
            models,
            flowObjectFiltersGrouped
          );

        for (const child of childs) {
          flowsFromObjectFilters.push(child);
        }
      }
    }

    // Lastly, we need to check if we need to filter by flow
    // And if we didn't did it before when sorting by entity
    // if so, we need to obtain the flowIDs from the flowFilters
    const isFilterByFlow = flowFilters !== undefined;
    const isFilterByFlowStatus = statusFilter !== undefined;

    const flowsFromFlowFilters: UniqueFlowEntity[] = [];
    if (isFilterByFlow || isFilterByFlowStatus) {
      let flowConditions: FlowWhere = prepareFlowConditions(flowFilters);
      // Add status filter conditions if provided
      flowConditions = prepareFlowStatusConditions(
        flowConditions,
        statusFilter
      );

      const orderByForFlowFilter = isSortByEntity
        ? defaultFlowOrderBy()
        : orderByForFlow;

      const flows: UniqueFlowEntity[] = await this.flowService.getFlows({
        models,
        conditions: flowConditions,
        orderBy: orderByForFlowFilter,
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
    // While sorting we have the same amount or less flows 'sorted' than deduplicatedFlows
    // That means we need to keep the sortedFilters and then keep the rest of deduplicatedFlows thar are not in sortedFlows
    // If we don't do this it may cause that just changing the orderBy we get different results
    // Because we get rid of those flows that are not present in the sortedFlows list
    sortedFlows = intersectUniqueFlowEntities(sortByFlowIDs, deduplicatedFlows);

    sortedFlows = mergeUniqueEntities(sortedFlows, deduplicatedFlows);

    const count = sortedFlows.length;

    const flows = await this.flowService.progresiveSearch(
      models,
      sortedFlows,
      limit,
      offset ?? 0,
      true, // Stop when we have the limit
      [],
      defaultSearchFlowFilter,
      orderByForFlow
    );

    if (isSortByEntity) {
      // Sort the flows using the sortedFlows as referenceList
      flows.sort((a, b) => {
        const aIndex = sortedFlows.findIndex((flow) => flow.id === a.id);
        const bIndex = sortedFlows.findIndex((flow) => flow.id === b.id);
        return aIndex - bIndex;
      });
    }

    return { flows, count };
  }
}
