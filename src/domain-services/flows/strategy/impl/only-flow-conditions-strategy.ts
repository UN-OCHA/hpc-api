import { type Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import {
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';

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
      this.flowService.getFlowsCount(models, flowConditions),
    ]);

    // Map count result query to count object
    const countObject = countRes[0] as { count: number };

    return { flows, count: countObject.count };
  }
}
