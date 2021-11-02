import { PlanId } from '@unocha/hpc-api-core/src/db/models/plan';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class PlanService {
  async findById(
    models: Database,
    id: number
  ): Promise<{ id: PlanId; name?: string | null }> {
    const plan = await models.plan.get(createBrandedValue(id));

    if (!plan) {
      throw new Error(`Plan with ID ${id} does not exist`);
    }

    const planId = plan.id;

    const latestPlanVersion = await models.planVersion.findOne({
      where: {
        planId,
        latestVersion: true,
      },
    });

    return {
      id: planId,
      name: latestPlanVersion?.name,
    };
  }

  async findPlanYears(models: Database, planId: number): Promise<string[]> {
    const planYears = await models.planYear.find({
      where: {
        planId: createBrandedValue(planId),
      },
    });

    const years = await models.usageYear.find({
      where: (builder) =>
        builder.whereIn(
          'id',
          planYears.map((py) => py.usageYearId)
        ),
    });

    return years.map((y) => y.year);
  }
}
