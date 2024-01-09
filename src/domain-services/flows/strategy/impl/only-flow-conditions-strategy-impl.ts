import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import {
  type FlowSearchArgs,
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

  async search(args: FlowSearchArgs): Promise<FlowSearchStrategyResponse> {
    const { models, flowFilters, orderBy, limit, offset } = args;
    // Map flowConditions to where clause
    const flowConditions = prepareFlowConditions(flowFilters);

    // Build conditions object
    const searchConditions = {
      [Cond.AND]: [flowConditions ?? {}],
    };

    const orderByFlow = mapFlowOrderBy(orderBy);

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows({
        models,
        conditions: searchConditions,
        offset,
        orderBy: orderByFlow,
        limit,
      }),
      this.flowService.getFlowsCount(models, flowConditions),
    ]);

    // Map count result query to count object
    const countObject = mapCountResultToCountObject(countRes);

    return { flows, count: countObject.count };
  }
}
