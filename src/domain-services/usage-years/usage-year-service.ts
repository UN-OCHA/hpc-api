import { Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowUsageYear } from '../flows/graphql/types';

@Service()
export class UsageYearService {
  async getUsageYearsForFlows(
    usageYearsFO: any[],
    models: Database
  ): Promise<Map<number, FlowUsageYear[]>> {
    const usageYears = await models.usageYear.find({
      where: {
        id: {
          [Op.IN]: usageYearsFO.map((usageYearFO) => usageYearFO.objectID),
        },
      },
    });

    const usageYearsMap = new Map<number, FlowUsageYear[]>();

    usageYearsFO.forEach((usageYearFO) => {
      const flowId = usageYearFO.flowID;
      if (!usageYearsMap.has(flowId)) {
        usageYearsMap.set(flowId, []);
      }
      const usageYear = usageYears.find(
        (usageYear) => usageYear.id === usageYearFO.objectID
      );

      if (!usageYear) {
        throw new Error(
          `Usage year with ID ${usageYearFO.objectID} does not exist`
        );
      }
      const usageYearMapped = this.mapUsageYearsToFlowUsageYears(
        usageYear,
        usageYearFO.refDirection
      );
      usageYearsMap.get(flowId)!.push(usageYearMapped);
    });

    return usageYearsMap;
  }

  private mapUsageYearsToFlowUsageYears(usageYear: any, refDirection: any) {
    return {
      year: usageYear.year,
      direction: refDirection,
    };
  }
}
