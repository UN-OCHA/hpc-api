import { type Database } from '@unocha/hpc-api-core/src/db';
import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
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
import {
  mapCountResultToCountObject,
  mapFlowOrderBy,
  prepareFlowConditions,
} from './utils';

@Service()
export class OnlyFlowFiltersStrategy implements FlowSearchStrategy {
  constructor(private readonly flowService: FlowService) {}

  async search(
    flowConditions: any,
    models: Database,
    orderBy?: any,
    limit?: number,
    cursorCondition?: any
  ): Promise<FlowSearchStrategyResponse> {
    // Build conditions object
    const searchConditions = {
      [Cond.AND]: [flowConditions ?? {}, cursorCondition ?? {}],
    };

    // check and map orderBy to be from entity 'flow'
    const orderByFlow = mapFlowOrderBy(orderBy);

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(models, searchConditions, orderByFlow, limit),
      this.flowService.getFlowsCount(models, flowConditions),
    ]);

    // Map count result query to count object
    const countObject = countRes[0] as { count: number };

    return { flows, count: countObject.count };
  }

  async searchV2(
    models: Database,
    _databaseConnection: Knex,
    limit: number,
    orderBy: FlowOrderBy,
    cursorCondition: any | undefined,
    flowFilters: SearchFlowsFilters,
    _flowObjectFilters: FlowObjectFilters[],
    _flowCategoryFilters: FlowCategory[],
    _searchPendingFlows: boolean | undefined
  ): Promise<FlowSearchStrategyResponse> {
    // Map flowConditions to where clause
    const flowConditions = prepareFlowConditions(flowFilters);

    // Build conditions object
    const searchConditions = {
      [Cond.AND]: [flowConditions ?? {}, cursorCondition ?? {}],
    };

    const orderByFlow = mapFlowOrderBy(orderBy);

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(models, searchConditions, orderByFlow, limit),
      this.flowService.getFlowsCount(models, flowConditions),
    ]);

    // Map count result query to count object
    const countObject = mapCountResultToCountObject(countRes);

    return { flows, count: countObject.count };
  }
}
