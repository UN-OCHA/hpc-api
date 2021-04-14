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
  create: (db, authGrantee) =>
    db(authGranteeModel.tableName).insert(authGrantee),
  update: async (db, id, changes) => {
    await db(authGranteeModel.tableName).update(changes).where({ id });
    return authGranteeModel.getOne(db, id);
  },
  deleteOne: async (db, id) => {
    await db(authGranteeModel.tableName)
      .update({ deletedAt: new Date() })
      .where({ id });
  },
};
