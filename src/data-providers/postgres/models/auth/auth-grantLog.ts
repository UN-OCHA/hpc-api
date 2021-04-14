import { ModelBase, TableBase } from '../common/base';

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
  create: (db, authGrantLog) =>
    db(authGrantLogModel.tableName).insert(authGrantLog),
  update: async (db, id, changes) => {
    await db(authGrantLogModel.tableName).update(changes).where({ id });
    return authGrantLogModel.getOne(db, id);
  },
  deleteOne: async (db, id) => {
    await db(authGrantLogModel.tableName)
      .update({ deletedAt: new Date() })
      .where({ id });
  },
};
