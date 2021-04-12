import { Knex } from 'knex';
import { ModelBase, TableBase } from './common/Base';

export interface AuthGrantTable extends TableBase {
  target: number;
  grantee: number;
}

type AuthGrantModel = ModelBase<AuthGrantTable>;

export const authGrantModel: AuthGrantModel = {
  tableName: 'authGrant',
  table: (db) => db(authGrantModel.tableName),
  getOne: (db, id) => db(authGrantModel.tableName).select({ where: { id } }),
  getAll: (db) => db(authGrantModel.tableName).select('*'),
  // create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
  // update: (db, id, authGrant) => db(AuthGrantModel.tableName).update(authGrant).where({ id }),
  // delete: (db, id) =>  db(AuthGrantModel.tableName).update({ deletedAt: new Date()}).where({ id }),
};
