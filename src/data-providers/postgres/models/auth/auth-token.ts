import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface AuthTokenTable extends TableBaseWithTimeStamps {
  participant: number;
  expires: Date;
  tokenHash: string;
}

export const authTokenModel = createModel<AuthTokenTable>('authToken');
