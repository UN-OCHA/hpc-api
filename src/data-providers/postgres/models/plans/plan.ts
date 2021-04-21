import { Knex } from 'knex';
import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface PlanTable extends TableBaseWithTimeStamps {
  restricted: boolean;
  revisionState: string;
}

export const planModel = createModel<PlanTable>('plan');

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

export const planVersionModel = createModel<PlanVersionTable>('planVersion');
