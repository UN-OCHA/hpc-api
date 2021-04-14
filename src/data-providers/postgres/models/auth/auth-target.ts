import { ModelBase, TableBase } from '../common/base';

export interface AuthTargetTable extends TableBase {
  targetId: number;
  type: string;
}

type AuthTargetModel = ModelBase<AuthTargetTable>;

export const authTargetModel: AuthTargetModel = {
  tableName: 'authTarget',
  table: (db) => db(authTargetModel.tableName),
  getOne: (db, id) => db(authTargetModel.tableName).select({ where: { id } }),
  getAll: (db) => db(authTargetModel.tableName).select('*'),
  create: (db, authTarget) => db(authTargetModel.tableName).insert(authTarget),
  update: async (db, id, changes) => {
    await db(authTargetModel.tableName).update(changes).where({ id });
    return authTargetModel.getOne(db, id);
  },
  deleteOne: async (db, id) => {
    await db(authTargetModel.tableName)
      .update({ deletedAt: new Date() })
      .where({ id });
  },
};
