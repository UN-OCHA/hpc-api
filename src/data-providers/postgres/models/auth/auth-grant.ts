import { ModelBase, TableBase } from '../common/base';

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
  create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
  update: async (db, id, authGrant) => {
    await db(authGrantModel.tableName).update(authGrant).where({ id });
    return authGrantModel.getOne(db, id);
  },
  deleteOne: async (db, id) => {
    await db(authGrantModel.tableName)
      .update({ deletedAt: new Date() })
      .where({ id });
  },
};
