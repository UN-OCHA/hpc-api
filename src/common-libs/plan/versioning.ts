/**
 * This file contains the code that updates various tables
 * when a new plan version is published and plan gets tagged.
 *
 * It updates the following tables:
 * - attachment
 * - attachmentVersion
 * - governingEntity
 * - governingEntityVersion
 * - measurement
 * - measurementVersion
 * - planEntity
 * - planEntityVersion
 * - planLocation
 * - planVersion
 * - planYear
 *
 * This can basically be achieved with two types of methods,
 * one that updates base tables (like `attachment`) and the
 * other that updates version tables (like `attachmentVersion`).
 *
 * However, trying to optimize the code without duplication
 * leads to great TS slowdown and sometimes also triggering error:
 * "Expression produces a union type that is too complex to represent"
 *
 * In order to preserve type safety while working with models, at an
 * expense of some code duplication, three separate methods are used:
 * 1) Dealing with tables which require only base-level changes
 * 2) Dealing with tables which require only version-level changes. This
 * category only includes `planVersion` table.
 * 3) Dealing with tables which require both base-level and version-level changes
 */

import type { Database } from '@unocha/hpc-api-core/src/db';
import type { PlanReportingPeriodId } from '@unocha/hpc-api-core/src/db/models/planReportingPeriod';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { groupObjectsByProperty } from '@unocha/hpc-api-core/src/util';
import {
  createBrandedValue,
  type Brand,
} from '@unocha/hpc-api-core/src/util/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModelId = Brand<number, any, any>;

const baseOnlyModels = ['planLocation', 'planYear'] as const;
const baseAndVersionModels = [
  'attachment',
  'governingEntity',
  'planEntity',
] as const;

type BaseOnlyModels = (typeof baseOnlyModels)[number];
type BaseAndVersionModels =
  | (typeof baseAndVersionModels)[number]
  | 'measurement';

type IdType<T extends BaseAndVersionModels> = `${T}Id`;

const noLongerParanoidTables = new Set(['planYear']);

const skipAttachmentsAndMeasurementsValidation = (
  tableName: BaseAndVersionModels
) => {
  return tableName === 'attachment' || tableName === 'measurement';
};

const skipMeasurementsValidation = (tableName: BaseAndVersionModels) => {
  return tableName === 'measurement';
};

export const updateVersionStates = async (
  models: Database,
  planTag: InstanceDataOfModel<Database['planTag']>,
  publishMeasurements: boolean,
  planReportingPeriodIds: PlanReportingPeriodId[]
) => {
  for (const tableName of baseOnlyModels) {
    await updateBaseModelTags(models, tableName, planTag);
  }

  for (const tableName of baseAndVersionModels) {
    const baseRows = await models[tableName].find({
      where: {
        planId: planTag.planId,
        ...(tableName === 'attachment'
          ? { type: { [models.Op.NOT_IN]: ['cost'] } }
          : {}),
      },
    });

    await updateBaseAndVersionModelTags(models, tableName, baseRows, planTag);
  }

  await updatePlanVersionTags(models, planTag);

  if (publishMeasurements) {
    const attachments = await models.attachment.find({
      where: {
        planId: planTag.planId,
      },
    });
    const measurements = await models.measurement.find({
      where: {
        attachmentId: {
          [models.Op.IN]: attachments.map((a) => a.id),
        },
        planReportingPeriodId: {
          [models.Op.IN]: planReportingPeriodIds,
        },
      },
    });

    await updateBaseAndVersionModelTags(
      models,
      'measurement',
      measurements,
      planTag
    );
  }
};

const updateBaseAndVersionModelTags = async (
  models: Database,
  tableName: BaseAndVersionModels,
  baseRows: Array<InstanceDataOfModel<Database[BaseAndVersionModels]>>,
  tag: Pick<
    InstanceDataOfModel<Database['planTag']>,
    'createdAt' | 'planId' | 'public' | 'name'
  >
) => {
  const model = models[tableName];
  const versionModel = models[`${tableName}Version`];
  const idField = `${tableName}Id` as IdType<BaseAndVersionModels>;

  const activeRows = new Map<string, Set<AnyModelId>>();
  const inactiveRows: AnyModelId[] = [];

  for (const baseRow of baseRows) {
    const isActive =
      baseRow.deletedAt === null || baseRow.deletedAt > tag.createdAt;

    if (isActive) {
      const rowKey = baseRow.versionTags.join(',');
      let idSet = activeRows.get(rowKey);
      if (!idSet) {
        activeRows.set(rowKey, (idSet = new Set()));
      }
      idSet.add(baseRow.id);
    } else {
      inactiveRows.push(createBrandedValue(baseRow.id));
    }
  }

  for (const [versionTagsString, rowIds] of activeRows.entries()) {
    const versionTags =
      versionTagsString === '' ? [] : versionTagsString.split(',');

    if (!versionTags.includes(tag.name)) {
      versionTags.push(tag.name);
    }

    await model.update({
      values: {
        latestTaggedVersion: true,
        versionTags,
        ...(tag.public ? { currentVersion: true } : {}),
      },
      where: { id: { [models.Op.IN]: rowIds } },
    });
  }

  await model.update({
    values: {
      latestTaggedVersion: false,
      ...(tag.public ? { currentVersion: false } : {}),
    },
    where: {
      id: { [models.Op.IN]: inactiveRows.map(createBrandedValue) },
    },
  });

  const versionRows = await versionModel.find({
    where: {
      [idField]: {
        [models.Op.IN]: baseRows.map((a) => a.id),
      },
      createdAt: { [models.Op.LTE]: tag.createdAt },
    },
    skipValidation: skipAttachmentsAndMeasurementsValidation(tableName),
  });

  const versionRowsByBaseId = new Map<
    unknown,
    Set<InstanceDataOfModel<typeof versionModel>>
  >();
  for (const obj of versionRows) {
    const value = obj[idField as keyof typeof obj];
    let group = versionRowsByBaseId.get(value);
    if (!group) {
      versionRowsByBaseId.set(value, (group = new Set()));
    }
    group.add(obj);
  }

  const latestVersionIds = [...versionRowsByBaseId.values()].map((versions) =>
    // Get biggest version ID
    Math.max(...[...versions].map((av) => av.id))
  );

  const latestVersions = await versionModel.find({
    where: {
      id: {
        [models.Op.IN]: latestVersionIds.map(createBrandedValue),
      },
    },
    skipValidation: skipMeasurementsValidation(tableName),
  });

  const versionTagsMap = new Map<string, Set<AnyModelId>>();

  for (const latestVersion of latestVersions) {
    const rowKey = latestVersion.versionTags.join(',');
    let idSet = versionTagsMap.get(rowKey);
    if (!idSet) {
      versionTagsMap.set(rowKey, (idSet = new Set()));
    }
    idSet.add(latestVersion.id);
  }

  for (const [versionTagsString, rowIds] of versionTagsMap.entries()) {
    const versionTags =
      versionTagsString === '' ? [] : versionTagsString.split(',');

    if (!versionTags.includes(tag.name)) {
      versionTags.push(tag.name);
    }

    await versionModel.update({
      values: {
        latestTaggedVersion: true,
        versionTags,
        ...(tag.public ? { currentVersion: true } : {}),
      },
      where: { id: { [models.Op.IN]: rowIds } },
      skipValidation: skipMeasurementsValidation(tableName),
    });
  }

  const oldVersions = await versionModel.find({
    where: {
      id: {
        [models.Op.NOT_IN]: latestVersionIds.map(createBrandedValue),
      },
      [idField]: { [models.Op.IN]: baseRows.map((a) => a.id) },
    },
    skipValidation: skipAttachmentsAndMeasurementsValidation(tableName),
  });
  await versionModel.update({
    values: {
      latestTaggedVersion: false,
      ...(tag.public ? { currentVersion: false } : {}),
    },
    where: {
      id: {
        [models.Op.IN]: oldVersions.map((v) => v.id as AnyModelId),
      },
    },
    skipValidation: skipAttachmentsAndMeasurementsValidation(tableName),
  });
};

const updateBaseModelTags = async (
  models: Database,
  tableName: BaseOnlyModels,
  tag: Pick<
    InstanceDataOfModel<Database['planTag']>,
    'createdAt' | 'planId' | 'public' | 'name'
  >
) => {
  const model = models[tableName];

  const baseRows = await model.find({
    where: {
      planId: tag.planId,
    },
  });

  const inactiveRows: AnyModelId[] = [];
  for (const baseRow of baseRows) {
    const strictBaseRow = baseRow as InstanceOfModel<
      Database[Exclude<BaseOnlyModels, 'planYear'>]
    >;
    const isActive =
      /**
       * If table is no longer paranoid (i.e. `deletedAt` column is
       * dropped from DB schema), just simply treat all records as active.
       */
      noLongerParanoidTables.has(tableName) ||
      strictBaseRow.deletedAt === null ||
      strictBaseRow.deletedAt > tag.createdAt;

    if (isActive) {
      await model.update({
        values: {
          latestTaggedVersion: true,
          versionTags: [
            ...baseRow.versionTags,
            ...(baseRow.versionTags.includes(tag.name) ? [] : [tag.name]),
          ],
          ...(tag.public ? { currentVersion: true } : {}),
        },
        where: {
          [models.Cond.OR]: [{ id: createBrandedValue(baseRow.id) }],
        },
      });
    } else {
      inactiveRows.push(createBrandedValue(baseRow.id));
    }
  }

  await model.update({
    values: {
      latestTaggedVersion: false,
      ...(tag.public ? { currentVersion: false } : {}),
    },
    where: {
      id: { [models.Op.IN]: inactiveRows.map(createBrandedValue) },
    },
  });
};

const updatePlanVersionTags = async (
  models: Database,
  tag: Pick<
    InstanceDataOfModel<Database['planTag']>,
    'createdAt' | 'planId' | 'public' | 'name'
  >
) => {
  const planVersionsByPlanId = groupObjectsByProperty(
    await models.planVersion.find({
      where: {
        planId: tag.planId,
        createdAt: { [models.Op.LTE]: tag.createdAt },
      },
    }),
    'planId'
  );

  const latestPlanVersionIds = [...planVersionsByPlanId.values()].map(
    (planVersions) =>
      // Get biggest plan version ID
      Math.max(...[...planVersions].map((av) => av.id))
  );

  const latestVersions = await models.planVersion.find({
    where: {
      id: {
        [models.Op.IN]: latestPlanVersionIds.map(createBrandedValue),
      },
    },
  });

  for (const latestVersion of latestVersions) {
    await models.planVersion.update({
      values: {
        latestTaggedVersion: true,
        versionTags: [
          ...latestVersion.versionTags,
          ...(latestVersion.versionTags.includes(tag.name) ? [] : [tag.name]),
        ],
        ...(tag.public ? { currentVersion: true } : {}),
      },
      where: { id: latestVersion.id },
    });
  }

  const oldVersions = await models.planVersion.find({
    where: {
      id: {
        [models.Op.NOT_IN]: latestPlanVersionIds.map(createBrandedValue),
      },
      planId: { [models.Op.IN]: planVersionsByPlanId.keys() },
    },
  });
  await models.planVersion.update({
    values: {
      latestTaggedVersion: false,
      ...(tag.public ? { currentVersion: false } : {}),
    },
    where: {
      id: {
        [models.Op.IN]: oldVersions.map((v) => v.id as AnyModelId),
      },
    },
  });
};
