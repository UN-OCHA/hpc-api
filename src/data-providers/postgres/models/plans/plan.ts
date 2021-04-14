import { ModelBase, TableBaseWithTimeStamps } from '../common/base';

export interface PlanTable extends TableBaseWithTimeStamps {
  restricted: boolean;
  revisionState: string;
}

type PlanModel = ModelBase<PlanTable>;

export const planModel: PlanModel = {
  tableName: 'plan',
  table: (db) => db(planModel.tableName),
  getOne: (db, id) => db(planModel.tableName).select({ where: { id } }),
  getAll: (db) => db(planModel.tableName).select('*'),
};

export interface PlanVersionTable extends TableBaseWithTimeStamps {
  planId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  comments: string;
  isForHPCProjects: boolean;
  code: string;
  customLocationCode: string;
  currentReportingPeriodId: number;
  currentVersion: boolean;
  latestVersion: boolean;
  latestTaggedVersion: boolean;
  versionTags: string[];
  lastPublishedReportingPeriod: number;
  clusterSelectionType: string;
}

type PlanVersionModel = ModelBase<PlanVersionTable>;

export const planVersionModel: PlanVersionModel = {
  tableName: 'planVersion',
  table: (db) => db(planVersionModel.tableName),
  getOne: (db, id) => db(planVersionModel.tableName).select({ where: { id } }),
  getAll: (db) => db(planVersionModel.tableName).select('*'),
};
