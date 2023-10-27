import { Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowUsageYear } from '../flows/graphql/types';

@Service()
export class UsageYearService {
  async getFlowObjectUsageYears(
    usageYearsFO: any[],
    models: Database
  ): Promise<FlowUsageYear[]> {
    const usageYears = await models.usageYear.find({
      where: {
        id: {
          [Op.IN]: usageYearsFO.map((usageYearFO) => usageYearFO.objectID),
        },
      },
    });

    return usageYears.map((usageYear) => ({
      year: usageYear.year,
      direction: usageYearsFO.find(
        (usageYearFO) => usageYearFO.objectID === usageYear.id
      ).refDirection,
    }));
  }
}
