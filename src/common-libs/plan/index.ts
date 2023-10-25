import { type Database } from '@unocha/hpc-api-core/src/db';
import { type PlanReportingPeriodId } from '@unocha/hpc-api-core/src/db/models/planReportingPeriod';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { type AddPlanTagInput } from '../../domain-services/plan-tag/graphql/types';

export const getNextTag = async (
  models: Database,
  planTag: AddPlanTagInput
): Promise<string> => {
  const latestPlanTag = await models.planTag.find({
    where: {
      planId: createBrandedValue(planTag.planId),
    },
    orderBy: { column: 'createdAt', order: 'desc' },
  });

  const latestTagName =
    (latestPlanTag.length && latestPlanTag[0].name) || '0.0';

  let [majorVersion, minorVersion] = latestTagName
    .split('.')
    .map((v) => parseInt(v, 10) || 0);

  if (planTag.major) {
    majorVersion++;
    minorVersion = 0;
  } else {
    minorVersion++;
  }

  return `${majorVersion}.${minorVersion}`;
};

export const setPlanReportingPeriod = async (
  models: Database,
  planTag: AddPlanTagInput
) => {
  const reportingPeriods = await models.planReportingPeriod.find({
    where: {
      planId: createBrandedValue(planTag.planId),
    },
    orderBy: { column: 'periodNumber', order: 'asc' },
  });

  if (!reportingPeriods.length) {
    throw new Error(
      'Cannot activate planTag if associated plan has no reporting period'
    );
  }

  const latestPlanVersion = await models.planVersion.findOne({
    where: {
      planId: createBrandedValue(planTag.planId),
      latestVersion: true,
    },
  });

  if (latestPlanVersion && !latestPlanVersion.currentReportingPeriodId) {
    await models.planVersion.update({
      values: {
        currentReportingPeriodId: reportingPeriods[0].id,
      },
      where: {
        id: latestPlanVersion.id,
      },
    });
  }
};

const getAssociatedPlanVersion = async (
  models: Database,
  planTag: InstanceDataOfModel<Database['planTag']>
) => {
  const associatedPlanVersion = await models.planVersion.findOne({
    where: {
      planId: planTag.planId,
      createdAt: {
        [models.Op.LTE]: planTag.createdAt,
      },
      latestVersion: true,
    },
  });

  if (!associatedPlanVersion) {
    throw new Error('Cannot activate planTag if no associated version exist');
  }

  return associatedPlanVersion;
};

/**
 * Finds if any of the newly published reporting periods are higher
 * (by looking at period number) then what's already stored as
 * `lastPublishedReportingPeriodId`. Then, updates
 * `planVersion.lastPublishedReportingPeriodId` if needed.
 *
 * Before actually updating the said field, this method checks
 * whether measurements are already published for determined
 * highest monitoring period.
 */
export const updateLastPublishedReportingPeriodId = async (
  models: Database,
  planTag: InstanceDataOfModel<Database['planTag']>,
  newlyPublishedReportingPeriodIds: PlanReportingPeriodId[]
) => {
  const associatedPlanVersion = await getAssociatedPlanVersion(models, planTag);
  const currentPublishedReportingPeriodId =
    associatedPlanVersion.lastPublishedReportingPeriodId;
  const reportingPeriods = await models.planReportingPeriod.find({
    where: {
      id: {
        [models.Op.IN]: [
          ...newlyPublishedReportingPeriodIds,
          ...(currentPublishedReportingPeriodId
            ? [createBrandedValue(currentPublishedReportingPeriodId)]
            : []),
        ],
      },
      planId: planTag.planId,
      measurementsGenerated: true,
    },
  });

  if (!reportingPeriods.length) {
    return;
  }

  const latestPublishedReportingPeriod = reportingPeriods.reduce((acc, curr) =>
    (curr.periodNumber ?? -1) > (acc.periodNumber ?? -1) ? curr : acc
  );

  if (latestPublishedReportingPeriod.id === currentPublishedReportingPeriodId) {
    return;
  }

  const publishedMeasurements = await models.measurement.find({
    where: {
      planReportingPeriodId: latestPublishedReportingPeriod.id,
      versionTags: { [models.Op.NOT_IN]: [['{}']] },
    },
  });

  if (publishedMeasurements.length) {
    await models.planVersion.update({
      values: {
        lastPublishedReportingPeriodId: latestPublishedReportingPeriod.id,
      },
      where: {
        id: associatedPlanVersion.id,
      },
    });
  }
};
