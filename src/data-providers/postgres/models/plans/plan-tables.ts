import { TableBaseWithTimeStamps, TableBase } from '../common/base';

interface VersionTags {
  currentVersion: boolean;
  latestVersion: boolean;
  latestTaggedVersion: boolean;
}

export interface PlanTable extends TableBaseWithTimeStamps {
  restricted: boolean;
  revisionState: string;
}

export interface PlanYearTable extends TableBaseWithTimeStamps, VersionTags {
  planId: number;
  useageYearId: number;
  deletedAt: Date;
}

export interface PlanTagTable extends TableBaseWithTimeStamps {
  planId: number;
  name: string;
  public: boolean;
  comment: string;
  revisionState: string;
}

export interface PlanLocationTable
  extends TableBaseWithTimeStamps,
    VersionTags {
  planId: number;
  locationId: number;
  deletedAt: Date;
}

export interface Plan_Table extends TableBaseWithTimeStamps {
  planId: number;
}
