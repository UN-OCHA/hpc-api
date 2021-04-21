import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface AuthGranteeTable extends TableBaseWithTimeStamps {
  granteeId: number;
  type: 'user' | 'bot';
}

export const authGranteeModel = createModel<AuthGranteeTable>('authGrantee');
