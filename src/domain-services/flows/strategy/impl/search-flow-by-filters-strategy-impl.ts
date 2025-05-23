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
  intersectSets,
  mapFlowFiltersToFlowObjectFiltersGrouped,
  mapFlowOrderBy,
  parseFlowIdVersionSet,
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
    let sortByFlowIDsSet = new Set<string>();
    const orderByForFlow = mapFlowOrderBy(orderBy);

    // Fetch sorted flow IDs only for the filtered subset instead of the whole table
    if (isSortByEntity) {
      // Get entity-sorted IDs then intersect with filtered subset
      const sortByFlowIDs = await this.flowService.getFlowIDsFromEntity(
        models,
        orderBy
      );
      sortByFlowIDsSet = new Set(
        [...sortByFlowIDs].map((o) => `${o.id}:${o.versionID}`)
      );
    } else {
      // Let the DB sort only the filtered IDs
      const sortByFlowIDs = await this.flowService.getFlows({
        models,
        orderBy: orderByForFlow,
      });
      sortByFlowIDsSet = new Set(
        [...sortByFlowIDs].map((o) => `${o.id}:${o.versionID}`)
      );
    }
    // We need to fetch the flowIDs by the nestedFlowFilters
    // if there are any
    const isFilterByNestedFilters = nestedFlowFilters !== undefined;
    let flowIDsFromNestedFlowFiltersSet = new Set<string>();

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
      flowIDsFromNestedFlowFiltersSet = new Set(
        [...flows].map((o) => `${o.id}:${o.versionID}`)
      );
    }

    // Now we need to check if we need to filter by category
    // if it's using any of the shorcuts
    // or if there are any flowCategoryFilters
    const isSearchByCategoryShotcut =
      shortcutFilters !== null && shortcutFilters.length > 0;

    const isFilterByCategory =
      isSearchByCategoryShotcut || flowCategoryFilters?.length > 0;

    let flowIDsFromCategoryFiltersSet = new Set<string>();

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

      flowIDsFromCategoryFiltersSet = new Set(
        [...flows].map((o) => `${o.id}:${o.versionID}`)
      );
    }

    // After that, if we need to filter by flowObjects
    // Obtain the flowIDs from the flowObjects
    const isFilterByFlowObjects = flowObjectFilters?.length > 0;

    let flowIDsFromObjectFiltersSet = new Set<string>();

    if (isFilterByFlowObjects) {
      // Firts step is to map the filters to the FlowObjectFiltersGrouped
      // To allow doing inclusive filtering between filters of the same type+direction
      // But exclusive filtering between filters of different type+direction
      const flowObjectFiltersGrouped =
        mapFlowFiltersToFlowObjectFiltersGrouped(flowObjectFilters);

      const { flows: flowsFromObjectFilters }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromObjectConditions.search({
          models,
          flowObjectFilterGrouped: flowObjectFiltersGrouped,
        });

      // If after this filter we have no flows, we can return an empty array
      if (flowsFromObjectFilters.length === 0) {
        return { flows: [], count: 0 };
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

      flowIDsFromObjectFiltersSet = new Set(
        [...flowsFromObjectFilters].map((o) => `${o.id}:${o.versionID}`)
      );
    }

    // Lastly, we need to check if we need to filter by flow
    // And if we didn't did it before when sorting by entity
    // if so, we need to obtain the flowIDs from the flowFilters
    const isFilterByFlow = flowFilters !== undefined;
    const isFilterByFlowStatus = statusFilter !== undefined;

    let flowIDsFromFlowFiltersSet = new Set<string>();

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

      flowIDsFromFlowFiltersSet = new Set(
        [...flows].map((o) => `${o.id}:${o.versionID}`)
      );
    }

    // We need to intersect the flowIDs from the flowObjects, flowCategoryFilters and flowFilters
    // to obtain the flowIDs that match all the filters
    const intersectedFlows: Set<string> = intersectSets(
      flowIDsFromCategoryFiltersSet,
      flowIDsFromFlowFiltersSet,
      flowIDsFromNestedFlowFiltersSet,
      flowIDsFromObjectFiltersSet
    );

    if (intersectedFlows.size === 0) {
      return { flows: [], count: 0 };
    }
    
    // The method Set.prototype.intersection(...) compares the bigger set with the smaller one
    // and returns the smaller one, so we need to do the opposite
    // More likely the `sortedFlows` will be smaller than the `intersectedFlows`,
    // since `intersectedFlows` is the intersection of all the filters
    // so we need to reverse the list of `sortedFlows`
    const sortedFlows: Set<string> = intersectSets(intersectedFlows, sortByFlowIDsSet);
    const parsedSortedFlows = parseFlowIdVersionSet(sortedFlows).reverse();

    const count = sortedFlows.size;
    const flows = await this.flowService.progresiveSearch(
      models,
      parsedSortedFlows,
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
        const aIndex = parsedSortedFlows.findIndex((flow) => flow.id === a.id);
        const bIndex = parsedSortedFlows.findIndex((flow) => flow.id === b.id);
        return aIndex - bIndex;
      });
    }

    return { flows, count };
  }
}
