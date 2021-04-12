import { Knex } from 'knex';
import { ModelBase, TableBase } from './common/Base';

export interface AuthTokenTable extends TableBase {
  participant: number;
  expires: Date;
  tokenHash: string;
}

type AuthTokenModel = ModelBase<AuthTokenTable>;

export const authTokenModel: AuthTokenModel = {
  tableName: 'authToken',
  table: (db) => db(authTokenModel.tableName),
  getOne: (db, id) => db(authTokenModel.tableName).select({ where: { id } }),
  getAll: (db) => db(authTokenModel.tableName).select('*'),
  // create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
  // update: (db, id, authGrant) => db(AuthGrantModel.tableName).update(authGrant).where({ id }),
  // delete: (db, id) =>  db(AuthGrantModel.tableName).update({ deletedAt: new Date()}).where({ id }),
};
