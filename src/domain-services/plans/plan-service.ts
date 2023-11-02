import { type PlanId } from '@unocha/hpc-api-core/src/db/models/plan';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { NotFoundError } from '@unocha/hpc-api-core/src/util/error';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowPlan } from '../flows/graphql/types';

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

  async getPlansForFlows(
    plansFO: any[],
    models: Database
  ): Promise<Map<number, FlowPlan[]>> {
    const plans = await models.plan.find({
      where: {
        id: {
          [Op.IN]: plansFO.map((planFO) => planFO.objectID),
        },
      },
    });

    const plansMap = new Map<number, FlowPlan[]>();

    for (const plan of plans) {
      const planVersion = await models.planVersion.find({
        where: {
          planId: plan.id,
          currentVersion: true,
        },
      });

      const planMapped = {
        id: plan.id.valueOf(),
        name: planVersion[0].name,
      };

      const flowId = plansFO.find(
        (planFO) => planFO.objectID === plan.id
      ).flowID;

      if (!plansMap.has(flowId)) {
        plansMap.set(flowId, []);
      }

      plansMap.get(flowId)!.push(planMapped);
    }

    return plansMap;
  }
}
