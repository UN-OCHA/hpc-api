import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import { type FlowWhere } from '../../model';
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
    const { models, flowFilters, orderBy, limit, offset, statusFilter } = args;
    // Map flowConditions to where clause
    let flowConditions: FlowWhere = prepareFlowConditions(flowFilters);

    // Add status filter conditions if provided
    flowConditions = prepareFlowStatusConditions(flowConditions, statusFilter);

    // Build conditions object
    // We need to add the condition to filter the deletedAt field
    const whereClause: FlowWhere = {
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
      await models.flow.count({
        where: whereClause,
      }),
    ]);

    // Map count result query to count object
    const countObject = countRes;

    // on certain conditions, this conversion from 'bigint' to 'number' can cause a loss of precision
    // But in order to reach that point, the number of flows would have to be in the billions
    // that is not a realistic scenario for this application
    // Nonetheless, we can validate that using Number.MAX_SAFE_INTEGER as a threshold
    return { flows, count: Number(countObject) };
  }
}
