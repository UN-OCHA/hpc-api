import { Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { UsageYear } from './grpahql/types';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';

@Service()
export class UsageYearService {
  async getUsageYearsForFlows(
    usageYearsFO: any[],
    models: Database
  ): Promise<Map<number, UsageYear[]>> {
    const usageYears: InstanceDataOfModel<Database['usageYear']>[] =
      await models.usageYear.find({
        where: {
          id: {
            [Op.IN]: usageYearsFO.map((usageYearFO) => usageYearFO.objectID),
          },
        },
      });

    const usageYearsMap = new Map<number, UsageYear[]>();

    usageYearsFO.forEach((usageYearFO) => {
      const flowId = usageYearFO.flowID;
      if (!usageYearsMap.has(flowId)) {
        usageYearsMap.set(flowId, []);
      }
      const usageYear = usageYears.find(
        (uYear) => uYear.id === usageYearFO.objectID
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
      createdAt: usageYear.createdAt,
      updatedAt: usageYear.updatedAt,
    };
  }
}
