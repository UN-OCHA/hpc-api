import { AuthGrantTable } from './models/auth/auth-grant';
import { AuthGranteeTable } from './models/auth/auth-grantee';
import { AuthGrantLogTable } from './models/auth/auth-grantLog';
import { AuthInviteTable } from './models/auth/auth-invite';
import { AuthTargetTable } from './models/auth/auth-target';
import { AuthTokenTable } from './models/auth/auth-token';

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
