import { Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import {
  FlowObjectFilters,
  SearchFlowsArgs,
  SearchFlowsFilters,
} from './graphql/args';
import {
  FlowSearchResult
} from './graphql/types';
import { FlowSearchStrategy } from './strategy/flow-search-strategy';
import { OnlyFlowFiltersStrategy } from './strategy/impl/only-flow-conditions-strategy';

@Service()
export class FlowSearchService {
  constructor(
    private readonly onlyFlowFiltersStrategy: OnlyFlowFiltersStrategy
  ) { }

  async search(
    models: Database,
    filters: SearchFlowsArgs
  ): Promise<FlowSearchResult> {
    const { limit, afterCursor, beforeCursor, sortField, sortOrder } = filters;

    if (beforeCursor && afterCursor) {
      throw new Error('Cannot use before and after cursor at the same time');
    }

    let cursorCondition;
    if (afterCursor) {
      cursorCondition = {
        id: {
          [Op.GT]: createBrandedValue(afterCursor),
        },
      };
    } else if (beforeCursor) {
      cursorCondition = {
        id: {
          [Op.LT]: createBrandedValue(beforeCursor),
        },
      };
    }

    const orderBy = {
      column: sortField??'updatedAt',
      order: sortOrder ?? 'desc',
    };

    const { flowFilters, flowObjectFilters } = filters;

    let onlyFlowFilters = false;
    let onlyFlowObjectFilters = false;
    let bothFlowFilters = false;

    if (
      (!flowFilters && !flowObjectFilters) ||
      (flowFilters && !flowObjectFilters)
    ) {
      onlyFlowFilters = true;
    } else if (!flowFilters && flowObjectFilters) {
      onlyFlowObjectFilters = true;
    } else if (flowFilters && flowObjectFilters) {
      bothFlowFilters = true;
    }

    let conditions: any = { ...cursorCondition };
    const strategy = this.determineStrategy(flowFilters, flowObjectFilters, conditions);

    return await strategy.search(conditions, orderBy, limit, cursorCondition, models);

  }

  

  

  private prepareFlowObjectConditions(
    flowObjectFilters: FlowObjectFilters[]
  ): Map<string, Map<string, number[]>> {
    const flowObjectConditions = new Map<string, Map<string, number[]>>();

    for (const flowObjectFilter of flowObjectFilters || []) {
      const objectType = flowObjectFilter.objectType;
      const direction = flowObjectFilter.direction;
      const objectID = flowObjectFilter.objectID;

      // Ensure the map for the objectType is initialized
      if (!flowObjectConditions.has(objectType)) {
        flowObjectConditions.set(objectType, new Map<string, number[]>());
      }

      const flowObjectCondition = flowObjectConditions.get(objectType);

      // Ensure the map for the direction is initialized
      if (!flowObjectCondition!.has(direction)) {
        flowObjectCondition!.set(direction, []);
      }

      const flowObjectDirectionCondition = flowObjectCondition!.get(direction);

      // Add the objectID to the array
      flowObjectDirectionCondition!.push(objectID);
    }

    return flowObjectConditions;
  }

  private prepareFlowConditions(flowFilters: SearchFlowsFilters): Map<string, any> {
    const flowConditions = new Map<string, any>();

    if (flowFilters) {
      Object.entries(flowFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          flowConditions.set(key, value);
        }
      });
    }

    return flowConditions;
  }

  private determineStrategy(flowFilters: SearchFlowsFilters, flowObjectFilters: FlowObjectFilters[], conditions: any): FlowSearchStrategy {
    if ((!flowFilters && (!flowObjectFilters || flowObjectFilters.length === 0)) || (flowFilters && (!flowObjectFilters || flowObjectFilters.length === 0))) {
      const flowConditions = this.prepareFlowConditions(flowFilters);
      conditions = { ...conditions, ...flowConditions }
      return this.onlyFlowFiltersStrategy;
    }
    // else if (!flowFilters && flowObjectFilters.length !== 0) {
    // const flowObjectConditions = this.prepareFlowObjectConditions(flowObjectFilters);
    // conditions = {...conditions, ...flowObjectConditions}
    //   return new OnlyFlowObjectFiltersStrategy(this);
    // } else if (flowFilters && flowObjectFilters.length !== 0) {
    // const flowConditions = this.prepareFlowConditions(flowFilters);
    // const flowObjectConditions = this.prepareFlowObjectConditions(flowObjectFilters);
    // conditions = {...conditions, ...flowConditions, ...flowObjectConditions}
    //   return new BothFlowFiltersStrategy(this);
    // }

    throw new Error('Invalid combination of flowFilters and flowObjectFilters - temp: only provide flowFilters');
  }

}
