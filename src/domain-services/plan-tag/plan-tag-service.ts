import { PlanTagId } from '@unocha/hpc-api-core/src/db/models/planTag';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import {
  getNextTag,
  setPlanReportingPeriod,
  updateLastPublishedReportingPeriodId,
} from '../../common-libs/plan';
import { updateVersionStates } from '../../common-libs/plan/versioning';
import { AddPlanTagInput } from './graphql/types';

@Service()
export class PlanTagService {
  async findById(
    models: Database,
    id: number
  ): Promise<{ id: PlanTagId; name?: string | null }> {
    const planTag = await models.planTag.get(createBrandedValue(id));

    if (!planTag) {
      throw new Error(`Plan tag with ID ${id} does not exist`);
    }

    return { id: planTag.id, name: planTag.name };
  }

  async findByPlanId(
    models: Database,
    planId: number
  ): Promise<InstanceDataOfModel<Database['planTag']>[]> {
    return await models.planTag.find({
      where: {
        planId: createBrandedValue(planId),
      },
    });
  }

  async createPlanTag(
    models: Database,
    planTag: AddPlanTagInput
  ): Promise<InstanceDataOfModel<Database['planTag']>> {
    await setPlanReportingPeriod(models, planTag);
    await models.plan.update({
      values: {
        revisionState: 'none',
      },
      where: {
        id: createBrandedValue(planTag.planId),
      },
    });

    const createdPlanTag = await models.planTag.create({
      name: await getNextTag(models, planTag),
      public: true,
      planId: createBrandedValue(planTag.planId),
      revisionState: planTag.revisionState,
      comment: planTag.comments,
      type: planTag.type,
      reportingPeriods: planTag.reportingPeriodIds,
    });

    const reportingPeriodIds = Array.isArray(planTag.reportingPeriodIds)
      ? planTag.reportingPeriodIds.map(createBrandedValue)
      : [];
    await updateVersionStates(
      models,
      createdPlanTag,
      planTag.publishMeasurements,
      reportingPeriodIds
    );
    await updateLastPublishedReportingPeriodId(
      models,
      createdPlanTag,
      reportingPeriodIds
    );

    return createdPlanTag;
  }
}
