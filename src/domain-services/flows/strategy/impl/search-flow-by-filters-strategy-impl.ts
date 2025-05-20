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

    // We need to check if we need to sort by a certain entity
    // and if so, we need to map the orderBy to be from that entity
    // obtain the entities relation to the flow
    // to be able to sort the flows using the entity
    const isSortByEntity = orderBy && orderBy.entity !== 'flow';
    let sortByFlowIDs: UniqueFlowEntity[] = [];
    const orderByForFlow = mapFlowOrderBy(orderBy);

    // We need to fetch the flowIDs by the nestedFlowFilters
    // if there are any
    const isFilterByNestedFilters = nestedFlowFilters !== undefined;
    let flowIDsFromNestedFlowFilters: UniqueFlowEntity[] = [];

    if (isFilterByNestedFilters) {
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromNestedFlowFilters.search({
          models,
          nestedFlowFilters,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }
      flowIDsFromNestedFlowFilters = flows;
    }

    // Now we need to check if we need to filter by category
    // if it's using any of the shorcuts
    // or if there are any flowCategoryFilters
    const isSearchByCategoryShotcut =
      shortcutFilters !== null && shortcutFilters.length > 0;

    const isFilterByCategory =
      isSearchByCategoryShotcut || flowCategoryFilters?.length > 0;

    let flowsFromCategoryFilters: UniqueFlowEntity[] = [];

    if (isFilterByCategory) {
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromCategoryConditions.search({
          models,
          flowCategoryConditions: flowCategoryFilters ?? [],
          shortcutFilters,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

      flowsFromCategoryFilters = flows;
    }

    // After that, if we need to filter by flowObjects
    // Obtain the flowIDs from the flowObjects
    const isFilterByFlowObjects = flowObjectFilters?.length > 0;

    let flowsFromObjectFilters: UniqueFlowEntity[] = [];
    if (isFilterByFlowObjects) {
      // Firts step is to map the filters to the FlowObjectFiltersGrouped
      // To allow doing inclusive filtering between filters of the same type+direction
      // But exclusive filtering between filters of different type+direction
      const flowObjectFiltersGrouped =
        mapFlowFiltersToFlowObjectFiltersGrouped(flowObjectFilters);

      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromObjectConditions.search({
          models,
          flowObjectFilterGrouped: flowObjectFiltersGrouped,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

      flowsFromObjectFilters = flows;

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

    let flowsFromFlowFilters: UniqueFlowEntity[] = [];
    if (isFilterByFlow || isFilterByFlowStatus) {
      let flowConditions: FlowWhere = prepareFlowConditions(flowFilters);
      // Add status filter conditions if provided
      flowConditions = prepareFlowStatusConditions(
        flowConditions,
        statusFilter
      );

      const flows: UniqueFlowEntity[] = await this.flowService.getFlows({
        models,
        conditions: flowConditions,
      });

      // If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

      flowsFromFlowFilters = flows;
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

    // Fetch sorted flow IDs only for the filtered subset instead of the whole table
    if (isSortByEntity) {
      // Get entity-sorted IDs then intersect with filtered subset
      const allEntitySorted = await this.flowService.getFlowIDsFromEntity(
        models,
        orderBy
      );
      sortByFlowIDs = intersectUniqueFlowEntities(
        allEntitySorted,
        deduplicatedFlows
      );
    } else {
      // Let the DB sort only the filtered IDs
      sortByFlowIDs = await this.flowService.getFlows({
        models,
        conditions: {
          [models.Cond.OR]: deduplicatedFlows.map((f) => ({
            [models.Cond.AND]: [{ id: f.id }, { versionID: f.versionID ?? 1 }],
          })),
        },
        orderBy: orderByForFlow,
      });
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
