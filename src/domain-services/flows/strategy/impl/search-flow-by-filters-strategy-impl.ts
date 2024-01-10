import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import { FlowEntity, UniqueFlowEntity } from '../../model';
import {
  type FlowSearchArgs,
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import { type FlowIdSearchStrategyResponse } from '../flowID-search-strategy';
import { GetFlowIdsFromCategoryConditionsStrategyImpl } from './get-flowIds-flow-category-conditions-strategy-impl';
import { GetFlowIdsFromObjectConditionsStrategyImpl } from './get-flowIds-flow-object-conditions-strategy-impl';
import {
  intersectUniqueFlowEntities,
  mapFlowObjectConditions,
  mapFlowOrderBy,
  prepareFlowConditions,
  sortEntitiesByReferenceList,
} from './utils';

@Service()
export class SearchFlowByFiltersStrategy implements FlowSearchStrategy {
  constructor(
    private readonly flowService: FlowService,
    private readonly getFlowIdsFromCategoryConditions: GetFlowIdsFromCategoryConditionsStrategyImpl,
    private readonly getFlowIdsFromObjectConditions: GetFlowIdsFromObjectConditionsStrategyImpl
  ) {}

  async search(args: FlowSearchArgs): Promise<FlowSearchStrategyResponse> {
    const {
      models,
      databaseConnection,
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      orderBy,
      limit,
      offset,
      shortcutFilter,
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
          models,
          databaseConnection,
          orderBy,
          limit
        );
      sortByFlowIDs.push(...flowIDsFromSortingEntity);
    } else {
      // In this case we fetch the list of flows from the database
      // using the orderBy
      // We can also filter by flowFilters
      const orderByForFlow = mapFlowOrderBy(orderBy);

      const flowsToSort: UniqueFlowEntity[] = await this.flowService.getFlowsAsUniqueFlowEntity({
        databaseConnection,
        conditions: flowFilters,
        orderBy: orderByForFlow,
      });

      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      // also, we need to map the FlowEntity to UniqueFlowEntity
      for (const flow of flowsToSort) {
        const uniqueFlowEntity: UniqueFlowEntity = {
          id: flow.id,
          versionID: flow.versionID,
        };
        sortByFlowIDs.push(uniqueFlowEntity);
      }
    }

    // Now we need to check if we need to filter by category
    // if it's using any of the shorcuts
    // or if there are any flowCategoryFilters
    const isSearchByCategoryShotcut = shortcutFilter !== null && shortcutFilter.length > 0;
    
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
      const flowObjectConditionsMap =
        mapFlowObjectConditions(flowObjectFilters);
      const { flows }: FlowIdSearchStrategyResponse =
        await this.getFlowIdsFromObjectConditions.search({
          databaseConnection,
          models,
          flowObjectsConditions: flowObjectConditionsMap,
        });

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

    const flowsFromFlowFilters: UniqueFlowEntity[] = [];
    if (isSortByEntity && isFilterByFlow) {
      const flowConditions = prepareFlowConditions(flowFilters);
      const flows: FlowEntity[] = await this.flowService.getFlows({
        models,
        conditions: flowConditions,
        orderBy: { column: orderBy.column, order: orderBy.order },
      });

      // Since there can be many flowIDs returned
      // This can cause 'Maximum call stack size exceeded' error
      // When using the spread operator - a workaround is to use push fot each element
      // also, we need to map the FlowEntity to UniqueFlowEntity
      for (const flow of flows) {
        const uniqueFlowEntity: UniqueFlowEntity = {
          id: flow.id,
          versionID: flow.versionID,
        };
        sortByFlowIDs.push(uniqueFlowEntity);
      }
    }

    // We need to intersect the flowIDs from the flowObjects, flowCategoryFilters and flowFilters
    // to obtain the flowIDs that match all the filters
    const deduplicatedFlows: UniqueFlowEntity[] = intersectUniqueFlowEntities(
      flowsFromCategoryFilters,
      flowsFromObjectFilters,
      flowsFromFlowFilters,
      sortByFlowIDs
    );

    // Obtain the count of the flows that match the filters
    const count = deduplicatedFlows.length;

    // After obtaining the count, we need to obtain the flows
    // that match the filters
    // First we are going to sort the deduplicated flows
    // using the sortByFlowIDs if there are any
    const sortedFlows: UniqueFlowEntity[] = sortEntitiesByReferenceList(
      deduplicatedFlows,
      sortByFlowIDs
    );


    // Then we are going to slice the flows using the limit and offset
    const reducedFlows: UniqueFlowEntity[] = sortedFlows.slice(
      offset,
      offset! + limit!
    );

    // Once the list of elements is reduced, we need to build the conditions
    const searchConditions = this.buildConditions(reducedFlows);

    const orderByForFlow = mapFlowOrderBy(orderBy);

    const flows = await this.flowService.getFlows({
      models,
      conditions: searchConditions,
      orderBy: orderByForFlow,
    });

    return { flows, count };
  }

  buildConditions(uniqueFlowEntities: UniqueFlowEntity[]): any {
    const whereClauses = uniqueFlowEntities.map((flow) => ({
      [Cond.AND]: [{ id: flow.id }, { versionID: flow.versionID }],
    }));

    return {
      [Cond.OR]: whereClauses,
    };
  }
}
