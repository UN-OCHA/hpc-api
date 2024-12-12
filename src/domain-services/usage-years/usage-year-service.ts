import { type Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type EntityDirection } from '../base-types';
import { type FlowObject } from '../flow-object/model';
import { type UsageYear } from './graphql/types';

type UsageYearModel = Database['usageYear'];
type UsageYearInstance = InstanceDataOfModel<UsageYearModel>;
@Service()
export class UsageYearService {
  async getUsageYearsForFlows(
    usageYearsFO: FlowObject[],
    models: Database
  ): Promise<Map<number, UsageYear[]>> {
    const usageYears: UsageYearInstance[] = await models.usageYear.find({
      where: {
        id: {
          [Op.IN]: usageYearsFO.map((usageYearFO) =>
            createBrandedValue(usageYearFO.objectID)
          ),
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
        const usageYearsPerFlow = getOrCreate(usageYearsMap, flowId, () => []);
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

  private mapUsageYearsToFlowUsageYears(
    usageYear: UsageYearInstance,
    refDirection: EntityDirection
  ) {
    return {
      year: usageYear.year,
      direction: refDirection,
      createdAt: usageYear.createdAt.toISOString(),
      updatedAt: usageYear.updatedAt.toISOString(),
    };
  }
}
