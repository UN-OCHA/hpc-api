import { ModelBase, TableBase } from '../common/Base';

export interface AuthGrantLogTable extends TableBase {
  actor: number;
  date: Date;
  grantee: number;
  newRoles: string[];
  target: number;
}

type AuthGrantLogModel = ModelBase<AuthGrantLogTable>;

export const authGrantLogModel: AuthGrantLogModel = {
  tableName: 'authGrantLog',
  table: (db) => db(authGrantLogModel.tableName),
  getOne: (db, id) => db(authGrantLogModel.tableName).select({ where: { id } }),
  getAll: (db) => db(authGrantLogModel.tableName).select('*'),
  // create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
  // update: (db, id, authGrant) => db(AuthGrantModel.tableName).update(authGrant).where({ id }),
  // delete: (db, id) =>  db(AuthGrantModel.tableName).update({ deletedAt: new Date()}).where({ id }),
};
