import { type Database } from '@unocha/hpc-api-core/src/db';
import { Cond } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import {
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import { checkAndMapFlowOrderBy } from './utils';

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
    const orderByFlow = checkAndMapFlowOrderBy(orderBy);

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(models, searchConditions, orderByFlow, limit),
      this.flowService.getFlowsCount(models, flowConditions),
    ]);

    // Map count result query to count object
    const countObject = countRes[0] as { count: number };

    return { flows, count: countObject.count };
  }
}
