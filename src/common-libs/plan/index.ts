import { Database } from '@unocha/hpc-api-core/src/db';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { AddPlanTagInput } from '../../domain-services/plan-tag/graphql/types';

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

export const updateLastPublishedReportingPeriodId = async (
  models: Database,
  planTag: InstanceDataOfModel<Database['planTag']>
) => {
  const reportingPeriods = await models.planReportingPeriod.find({
    where: {
      planId: planTag.planId,
      measurementsGenerated: true,
    },
    orderBy: { column: 'periodNumber', order: 'desc' },
  });

  if (!reportingPeriods.length) {
    return;
  }

  const latestReportingPeriodId = reportingPeriods[0].id;
  const publishedMeasurements = await models.measurement.find({
    where: {
      planReportingPeriodId: latestReportingPeriodId,
      versionTags: { [models.Op.NOT_IN]: [['{}']] },
    },
  });

  if (publishedMeasurements.length) {
    const associatedPlanVersion = await getAssociatedPlanVersion(
      models,
      planTag
    );
    await models.planVersion.update({
      values: {
        lastPublishedReportingPeriodId: latestReportingPeriodId,
      },
      where: {
        id: associatedPlanVersion.id,
      },
    });
  }
};
