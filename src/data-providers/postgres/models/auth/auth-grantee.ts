import { ModelBase, TableBase } from '../common/base';

export interface AuthGranteeTable extends TableBase {
  granteeId: number;
  type: 'user' | 'bot';
}

type AuthGranteeModel = ModelBase<AuthGranteeTable>;

export const authGranteeModel: AuthGranteeModel = {
  tableName: 'authGrantee',
  table: (db) => db(authGranteeModel.tableName),
  getOne: (db, id) => db(authGranteeModel.tableName).select({ where: { id } }),
  getAll: (db) => db(authGranteeModel.tableName).select('*'),
  // create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
  // update: (db, id, authGrant) => db(AuthGrantModel.tableName).update(authGrant).where({ id }),
  // delete: (db, id) =>  db(AuthGrantModel.tableName).update({ deletedAt: new Date()}).where({ id }),
};
