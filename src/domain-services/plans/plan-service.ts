import { PlanId } from '@unocha/hpc-api-core/src/db/models/plan';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { NotFoundError } from '@unocha/hpc-api-core/src/util/error';
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

    const currentPlanVersion = await models.planVersion.findOne({
      where: { planId, currentVersion: true },
    });

    if (!currentPlanVersion) {
      throw new NotFoundError(`Plan with ID ${planId} does not exist`);
    }

    return { id: planId, name: currentPlanVersion.name };
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<{ id: PlanId; name?: string | null }[]> {
    const plans = await models.plan.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });

    const currentPlanVersions = await models.planVersion.find({
      where: {
        planId: {
          [models.Op.IN]: plans.map((p) => p.id),
        },
        currentVersion: true,
      },
    });

    return currentPlanVersions.map((pv) => ({
      id: pv.planId,
      name: pv.name,
    }));
  }

  async findPlanYears(models: Database, planId: number): Promise<string[]> {
    const planYears = await models.planYear.find({
      where: {
        planId: createBrandedValue(planId),
      },
    });

    const years = await models.usageYear.find({
      where: {
        id: { [models.Op.IN]: planYears.map((py) => py.usageYearId) },
      },
    });

    return years.map((y) => y.year);
  }
}
