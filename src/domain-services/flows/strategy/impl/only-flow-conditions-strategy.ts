import { Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { FlowService } from '../../flow-service';
import {
  FlowSearchStrategy,
  FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

@Service()
export class OnlyFlowFiltersStrategy implements FlowSearchStrategy {
  constructor(private readonly flowService: FlowService) {}

  async search(
    flowConditions: any,
    orderBy: any,
    limit: number,
    cursorCondition: any,
    models: Database
  ): Promise<FlowSearchStrategyResponse> {
    // Build conditions object
    const conditions: any = { ...cursorCondition, ...flowConditions };

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(models, conditions, orderBy, limit),
      this.flowService.getFlowsCount(models, conditions),
    ]);

    // Map count result query to count object
    const countObject = countRes[0] as { count: number };

    return { flows, count: countObject.count };
  }
}
