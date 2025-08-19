import { Service } from 'typedi';
import { FlowObjectFilterGrouped } from '../../../flow-object/model';
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
  stringifyFlowIdVersionArray,
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
    let sortByFlowIDsPromise: Promise<UniqueFlowEntity[]> = Promise.resolve([]);
    const orderByForFlow = mapFlowOrderBy(orderBy);

    // Fetch sorted flow IDs only for the filtered subset instead of the whole table
    if (isSortByEntity) {
      // Get entity-sorted IDs then intersect with filtered subset
      sortByFlowIDsPromise = this.flowService.getFlowIDsFromEntity(
        models,
        orderBy
      );
    } else {
      // Let the DB sort only the filtered IDs
      sortByFlowIDsPromise = this.flowService.getFlows({
        models,
        orderBy: orderByForFlow,
      });
    }
    // We need to fetch the flowIDs by the nestedFlowFilters
    // if there are any
    const isFilterByNestedFilters = nestedFlowFilters !== undefined;
    let flowIDsFromNestedFlowFiltersSet = new Set<string>();
    let flowsFromNestedFiltersPromise: Promise<FlowIdSearchStrategyResponse> =
      Promise.resolve({ flows: [] });
    let didFlowsFromNestedFiltersPromiseCreated = false;
    if (isFilterByNestedFilters) {
      flowsFromNestedFiltersPromise =
        this.getFlowIdsFromNestedFlowFilters.search({
          models,
          nestedFlowFilters,
        });
      didFlowsFromNestedFiltersPromiseCreated = true;
    }

    // Now we need to check if we need to filter by category
    // if it's using any of the shortcuts
    // or if there are any flowCategoryFilters
    const isSearchByCategoryShotcut =
      shortcutFilters !== null && shortcutFilters.length > 0;

    const isFilterByCategory =
      isSearchByCategoryShotcut || flowCategoryFilters?.length > 0;

    let flowIDsFromCategoryFiltersSet = new Set<string>();
    let flowsFromCategoryFiltersPromise: Promise<FlowIdSearchStrategyResponse> =
      Promise.resolve({ flows: [] });
    let didFlowsFromCategoryFiltersPromiseCreated = false;

    if (isFilterByCategory) {
      flowsFromCategoryFiltersPromise =
        this.getFlowIdsFromCategoryConditions.search({
          models,
          flowCategoryConditions: flowCategoryFilters ?? [],
          shortcutFilters,
        });
      didFlowsFromCategoryFiltersPromiseCreated = true;
    }

    // After that, if we need to filter by flowObjects
    // Obtain the flowIDs from the flowObjects
    const isFilterByFlowObjects = flowObjectFilters?.length > 0;

    let flowIDsFromObjectFiltersSet = new Set<string>();
    let flowsFromObjectFiltersPromise: Promise<FlowIdSearchStrategyResponse> =
      Promise.resolve({ flows: [] });
    let didFlowsFromObjectFiltersPromiseCreated = false;
    let flowObjectFiltersGrouped: FlowObjectFilterGrouped | null = null;

    if (isFilterByFlowObjects) {
      // First step is to map the filters to the FlowObjectFiltersGrouped
      // To allow doing inclusive filtering between filters of the same type+direction
      // But exclusive filtering between filters of different type+direction
      flowObjectFiltersGrouped =
        mapFlowFiltersToFlowObjectFiltersGrouped(flowObjectFilters);

      flowsFromObjectFiltersPromise =
        this.getFlowIdsFromObjectConditions.search({
          models,
          flowObjectFilterGrouped: flowObjectFiltersGrouped,
        });
      didFlowsFromObjectFiltersPromiseCreated = true;
    }

    // Lastly, we need to check if we need to filter by flow
    // And if we didn't did it before when sorting by entity
    // if so, we need to obtain the flowIDs from the flowFilters
    const isFilterByFlow = flowFilters !== undefined;
    const isFilterByFlowStatus = statusFilter !== undefined;

    let flowIDsFromFlowFiltersSet = new Set<string>();
    let flowsFromFlowFiltersPromise: Promise<UniqueFlowEntity[]> =
      Promise.resolve([]);
    let didFlowsFromFlowFiltersPromiseCreated = false;

    if (isFilterByFlow || isFilterByFlowStatus) {
      let flowConditions: FlowWhere = prepareFlowConditions(flowFilters);
      // Add status filter conditions if provided
      flowConditions = prepareFlowStatusConditions(
        flowConditions,
        statusFilter
      );

      flowsFromFlowFiltersPromise = this.flowService.getFlows({
        models,
        conditions: flowConditions,
      });
      didFlowsFromFlowFiltersPromiseCreated = true;
    }

    // Now we need to wait for all the promises to be resolved
    const [
      flowsFromCategoryFilters,
      flowsFromNestedFilters,
      flowsFromObjectFilters,
      flowsFromFlowFilters,
      sortByFlowIDs,
    ] = await Promise.all([
      flowsFromCategoryFiltersPromise,
      flowsFromNestedFiltersPromise,
      flowsFromObjectFiltersPromise,
      flowsFromFlowFiltersPromise,
      sortByFlowIDsPromise,
    ]);

    // First check if we have created the promises
    // and if so, check if the flows are empty
    // If they are empty, we can return an empty array
    // and a count of 0
    if (
      didFlowsFromNestedFiltersPromiseCreated &&
      flowsFromNestedFilters.flows.length === 0
    ) {
      return { flows: [], count: 0 };
    }

    if (
      didFlowsFromCategoryFiltersPromiseCreated &&
      flowsFromCategoryFilters.flows.length === 0
    ) {
      return { flows: [], count: 0 };
    }
    if (
      didFlowsFromObjectFiltersPromiseCreated &&
      flowsFromObjectFilters.flows.length === 0
    ) {
      return { flows: [], count: 0 };
    }

    if (
      didFlowsFromFlowFiltersPromiseCreated &&
      flowsFromFlowFilters.length === 0
    ) {
      return { flows: [], count: 0 };
    }

    // Now we need to obtain the flowIDs from the flows filtering promises
    flowIDsFromNestedFlowFiltersSet = stringifyFlowIdVersionArray(
      flowsFromNestedFilters.flows
    );
    flowIDsFromCategoryFiltersSet = stringifyFlowIdVersionArray(
      flowsFromCategoryFilters.flows
    );

    // If 'includeChildrenOfParkedFlows' is defined and true
    // we need to obtain the flowIDs from the children whose parent flows are parked
    // if (shouldIncludeChildrenOfParkedFlows) {
    // We need to obtain the flowIDs from the children whose parent flows are parked
    if (shouldIncludeChildrenOfParkedFlows && flowObjectFiltersGrouped) {
      const childs =
        await this.flowService.getParkedParentFlowsByFlowObjectFilter(
          models,
          flowObjectFiltersGrouped
        );

      for (const child of childs) {
        flowsFromObjectFilters.flows.push(child);
      }
    }
    flowIDsFromObjectFiltersSet = stringifyFlowIdVersionArray(
      flowsFromObjectFilters.flows
    );
    flowIDsFromFlowFiltersSet =
      stringifyFlowIdVersionArray(flowsFromFlowFilters);
    // Lastly, we need to obtain the flowIDs from the sortByFlowIDs
    const sortByFlowIDsSet = stringifyFlowIdVersionArray(sortByFlowIDs);

    // We need to intersect the flowIDs from the flowObjects, flowCategoryFilters and flowFilters
    // to obtain the flowIDs that match all the filters
    const intersectedFlows = intersectSets(
      flowIDsFromCategoryFiltersSet,
      flowIDsFromFlowFiltersSet,
      flowIDsFromNestedFlowFiltersSet,
      flowIDsFromObjectFiltersSet
    );

    if (intersectedFlows.size === 0) {
      return { flows: [], count: 0 };
    }

    // The method `Set.prototype.intersection()` compares the bigger set with
    // the smaller one and returns the smaller one, but we cannot guarantee
    // which one is bigger and which is smaller. Thus, we need to manually
    // make sure that sorting order from `sortByFlowIDsSet` is applied
    // to the final result of the intersection.
    const intersected = intersectSets(intersectedFlows, sortByFlowIDsSet);
    let sortedFlows = intersected;
    if (sortByFlowIDsSet.size > 0) {
      sortedFlows = new Set(
        [...sortByFlowIDsSet].filter((flowID) => intersected.has(flowID))
      );
    }
    const parsedSortedFlows = parseFlowIdVersionSet(sortedFlows);

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
