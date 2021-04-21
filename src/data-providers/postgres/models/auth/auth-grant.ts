import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface AuthGrantTable extends TableBaseWithTimeStamps {
  target: number;
  grantee: number;
}

export const authGrantModel = createModel<AuthGrantTable>('authGrant');
