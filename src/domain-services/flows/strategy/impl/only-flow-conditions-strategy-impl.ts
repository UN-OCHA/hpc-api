import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import {
  type FlowSearchArgs,
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
} from '../flow-search-strategy';
import {
  mapFlowOrderBy,
  prepareFlowConditions,
  prepareFlowStatusConditions,
} from './utils';

@Service()
export class OnlyFlowFiltersStrategy implements FlowSearchStrategy {
  constructor(private readonly flowService: FlowService) {}

  async search(args: FlowSearchArgs): Promise<FlowSearchStrategyResponse> {
    const {
      databaseConnection,
      models,
      flowFilters,
      orderBy,
      limit,
      offset,
      statusFilter,
    } = args;
    // Map flowConditions to where clause
    let flowConditions = prepareFlowConditions(flowFilters);

    // Add status filter conditions if provided
    flowConditions = prepareFlowStatusConditions(flowConditions, statusFilter);

    // Build conditions object
    // We need to add the condition to filter the deletedAt field
    const whereClause = {
      [Cond.AND]: [
        {
          deletedAt: {
            [Op.IS_NULL]: true,
          },
        },
        flowConditions ?? {},
      ],
    };

    const orderByFlow = mapFlowOrderBy(orderBy);

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows({
        models,
        conditions: whereClause,
        offset,
        orderBy: orderByFlow,
        limit,
      }),
      this.flowService.getFlowsCount(databaseConnection, whereClause),
    ]);

    // Map count result query to count object
    const countObject = countRes;

    return { flows, count: countObject };
  }
}
