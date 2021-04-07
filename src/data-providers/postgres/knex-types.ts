import { AuthGrantTable } from './models/auth-grant';
import { AuthGranteeTable } from './models/auth-grantee';
import { AuthGrantLogTable } from './models/auth-grantLog';
import { AuthInviteTable } from './models/auth-invite';
import { AuthTargetTable } from './models/auth-target';
import { AuthTokenTable } from './models/auth-token';

declare module 'knex/types/tables' {
  interface Tables {
    authGrant: AuthGrantTable;
    authGrantee: AuthGranteeTable;
    authGrantLog: AuthGrantLogTable;
    authInvite: AuthInviteTable;
    authTarget: AuthTargetTable;
    authToken: AuthTokenTable;
  }
}
