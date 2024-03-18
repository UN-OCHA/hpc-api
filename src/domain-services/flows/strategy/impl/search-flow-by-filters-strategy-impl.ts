import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import { type SearchFlowsFilters } from '../../graphql/args';
import { type FlowEntity, type UniqueFlowEntity } from '../../model';
import {
  type FlowSearchArgs,
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import { type FlowIdSearchStrategyResponse } from '../flowID-search-strategy';
import { GetFlowIdsFromCategoryConditionsStrategyImpl } from './get-flowIds-flow-category-conditions-strategy-impl';
import { GetFlowIdsFromNestedFlowFiltersStrategyImpl } from './get-flowIds-flow-from-nested-flow-filters-strategy-impl';
import { GetFlowIdsFromObjectConditionsStrategyImpl } from './get-flowIds-flow-object-conditions-strategy-impl';
import {
  intersectUniqueFlowEntities,
  mapFlowOrderBy,
  prepareFlowConditions,
  sortEntitiesByReferenceList,
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
          limit,
          offset
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
      // We can also filter by flowFilters
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
        const uniqueFlowEntity: UniqueFlowEntity = {
          id: flow.id,
          versionID: flow.versionID,
        };
        sortByFlowIDs.push(uniqueFlowEntity);
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

      //If after this filter we have no flows, we can return an empty array
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

      //If after this filter we have no flows, we can return an empty array
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

      //If after this filter we have no flows, we can return an empty array
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

    const flowsFromFlowFilters: UniqueFlowEntity[] = [];
    if (isSortByEntity && isFilterByFlow) {
      const flowConditions = prepareFlowConditions(flowFilters);
      const flows: FlowEntity[] = await this.flowService.getFlows({
        models,
        conditions: flowConditions,
        orderBy: { column: orderBy.column, order: orderBy.order },
      });

      //If after this filter we have no flows, we can return an empty array
      if (flows.length === 0) {
        return { flows: [], count: 0 };
      }

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
      flowIDsFromNestedFlowFilters
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
    let reducedFlows: UniqueFlowEntity[];
    if (offset !== undefined && limit !== undefined) {
      reducedFlows = sortedFlows.slice(offset, offset + limit);
    } else {
      reducedFlows = sortedFlows;
    }

    const orderByForFlow = { column: 'updatedAt', order: 'DESC' };

    let flows: FlowEntity[] = [];
    const chunkSize = 5000;
    if (reducedFlows.length > chunkSize) {
      // We need to paginate over the searchConditions
      // Then collect the flows

      // 1. Generate an array of arrays with the chunkSize
      const chunkedFlows = [];
      for (let i = 0; i < reducedFlows.length; i += chunkSize) {
        chunkedFlows.push(reducedFlows.slice(i, i + chunkSize));
      }

      // 2. Iterate over the array of arrays to generate the searchConditions
      // And collect the flows
      for (const chunk of chunkedFlows) {
        const chunkSearchConditions = this.buildConditions(chunk, flowFilters);
        const flowsChunk = await this.flowService.getFlows({
          models,
          conditions: chunkSearchConditions,
          orderBy: orderByForFlow,
        });
        flows = [...flows, ...flowsChunk];
      }
    } else {
      // Once the list of elements is reduced, we need to build the conditions
      const searchConditions = this.buildConditions(reducedFlows, flowFilters);

      flows = await this.flowService.getFlows({
        models,
        conditions: searchConditions,
        orderBy: orderByForFlow,
      });
    }
    return { flows, count };
  }

  buildConditions(
    uniqueFlowEntities: UniqueFlowEntity[],
    flowFilters: SearchFlowsFilters
  ): any {
    const whereClauses = uniqueFlowEntities.map((flow) => ({
      [Cond.AND]: [{ id: flow.id }, { versionID: flow.versionID }],
    }));

    if (flowFilters) {
      const flowConditions = prepareFlowConditions(flowFilters);
      return {
        [Cond.AND]: [flowConditions, { [Cond.OR]: whereClauses }],
      };
    }

    return {
      [Cond.OR]: whereClauses,
    };
  }
}
