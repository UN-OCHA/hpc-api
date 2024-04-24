import { type Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Service } from 'typedi';
import { type UsageYear } from './graphql/types';

@Service()
export class UsageYearService {
  async getUsageYearsForFlows(
    usageYearsFO: any[],
    models: Database
  ): Promise<Map<number, UsageYear[]>> {
    const usageYears: Array<InstanceDataOfModel<Database['usageYear']>> =
      await models.usageYear.find({
        where: {
          id: {
            [Op.IN]: usageYearsFO.map((usageYearFO) => usageYearFO.objectID),
          },
        },
      });

    const usageYearsMap = new Map<number, UsageYear[]>();

    for (const usageYearFO of usageYearsFO) {
      const flowId = usageYearFO.flowID;
      if (!usageYearsMap.has(flowId)) {
        usageYearsMap.set(flowId, []);
      }
      const usageYear = usageYears.find(
        (uYear) => uYear.id === usageYearFO.objectID
      );

      if (usageYear) {
        const usageYearsPerFlow = usageYearsMap.get(flowId)!;
        if (
          !usageYearsPerFlow.some(
            (uYear) =>
              uYear.year === usageYear.year &&
              uYear.direction === usageYearFO.refDirection
          )
        ) {
          const usageYearMapped = this.mapUsageYearsToFlowUsageYears(
            usageYear,
            usageYearFO.refDirection
          );
          usageYearsPerFlow.push(usageYearMapped);
        }
      }
    }

    return usageYearsMap;
  }

  private mapUsageYearsToFlowUsageYears(usageYear: any, refDirection: any) {
    return {
      year: usageYear.year,
      direction: refDirection,
      createdAt: usageYear.createdAt.toISOString(),
      updatedAt: usageYear.updatedAt.toISOString(),
    };
  }
}
