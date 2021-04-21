import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface AuthInviteTable extends TableBaseWithTimeStamps {
  email: string;
  target: number;
  actor: number;
  roles: string[];
}

export const authInviteModel = createModel<AuthInviteTable>('authInvite');
