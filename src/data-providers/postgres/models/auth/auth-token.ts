import { ModelBase, TableBase } from '../common/base';

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
  create: (db, authToken) => db(authTokenModel.tableName).insert(authToken),
  update: async (db, id, changes) => {
    await db(authTokenModel.tableName).update(changes).where({ id });
    return authTokenModel.getOne(db, id);
  },
  deleteOne: async (db, id) => {
    await db(authTokenModel.tableName)
      .update({ deletedAt: new Date() })
      .where({ id });
  },
};
