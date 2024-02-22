import { type PlanId } from '@unocha/hpc-api-core/src/db/models/plan';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { NotFoundError } from '@unocha/hpc-api-core/src/util/error';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type BasePlan } from './graphql/types';

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
    plansFO: Array<InstanceDataOfModel<Database['flowObject']>>,
    models: Database
  ): Promise<Map<number, BasePlan[]>> {
    const planObjectsIDs: PlanId[] = plansFO.map((planFO) =>
      createBrandedValue(planFO.objectID)
    );
    const plans: Array<InstanceDataOfModel<Database['plan']>> =
      await models.plan.find({
        where: {
          id: {
            [Op.IN]: planObjectsIDs,
          },
        },
      });

    const plansMap = new Map<number, BasePlan[]>();

    for (const plan of plans) {
      const planVersion = await models.planVersion.find({
        where: {
          planId: plan.id,
          currentVersion: true,
        },
      });

      for (const planFO of plansFO) {
        if (planFO.objectID === plan.id) {
          const flowId = planFO.flowID;
          if (!plansMap.has(flowId)) {
            plansMap.set(flowId, []);
          }
          const plansPerFlow = plansMap.get(flowId)!;
          if (
            !plansPerFlow.some(
              (plan) =>
                plan.id === plan.id && plan.direction === planFO.refDirection
            )
          ) {
            const planMapped = this.mapPlansToFlowPlans(
              plan,
              planVersion[0],
              planFO?.refDirection ?? null
            );
            plansPerFlow.push(planMapped);
          }
        }
      }
    }

    return plansMap;
  }

  private mapPlansToFlowPlans(
    plan: InstanceDataOfModel<Database['plan']>,
    planVersion: InstanceDataOfModel<Database['planVersion']>,
    direction: string | null
  ): BasePlan {
    return {
      id: plan.id.valueOf(),
      name: planVersion.name,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      direction: direction ?? '',
      startDate: planVersion.startDate.toISOString(),
      endDate: planVersion.endDate.toISOString(),
      comments: planVersion.comments,
      isForHPCProjects: planVersion.isForHPCProjects,
      code: planVersion.code,
      customLocationCode: planVersion.customLocationCode,
      currentReportingPeriodId: planVersion.currentReportingPeriodId,
      currentVersion: planVersion.currentVersion,
      latestVersion: planVersion.latestVersion,
      latestTaggedVersion: planVersion.latestTaggedVersion,
      lastPublishedReportingPeriodId:
        planVersion.lastPublishedReportingPeriodId,
      clusterSelectionType: planVersion.clusterSelectionType,
    };
  }
}
