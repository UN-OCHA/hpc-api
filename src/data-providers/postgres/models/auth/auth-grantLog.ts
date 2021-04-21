import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface AuthGrantLogTable extends TableBaseWithTimeStamps {
  actor: number;
  date: Date;
  grantee: number;
  newRoles: string[];
  target: number;
}

export const authGrantLogModel = createModel<AuthGrantLogTable>('authGrantLog');
