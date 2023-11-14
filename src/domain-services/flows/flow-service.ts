import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Service } from 'typedi';

@Service()
export class FlowService {
  constructor() {}

  async getFlows(
    models: Database,
    conditions: any,
    orderBy: any,
    limit: number
  ) {
    return await models.flow.find({
      orderBy,
      limit,
      where: conditions,
    });
  }

  async getFlowsCount(models: Database, conditions: any) {
    return await models.flow.count({ where: conditions });
  }
}
