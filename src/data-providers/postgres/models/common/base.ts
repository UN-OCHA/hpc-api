import { Knex } from 'knex';

export interface TableBase {
  id: number;
}
export interface TableBaseWithTimeStamps extends TableBase {
  createdAt: Date;
  updatedAt: Date;
}

export const createModel =
  <T extends TableBaseWithTimeStamps>(tableName: string) =>
  (db: Knex) => {
    const table: Knex.QueryBuilder<any, T> = db(tableName);
    const model = {
      tableName,
      table: () => table,
      getOne: (id: number) => table.select({ where: { id } }) as Promise<T>,
      getAll: () => table.select('*') as Promise<T[]>,
      create: (data: T) => table.insert(data),
      update: async (id: number, changes: Partial<T>) => {
        await table.update(changes).where({ id });
        return model.getOne(id);
      },
      deleteOne: async (id: number) => {
        await table.update({ deletedAt: new Date() }).where({ id });
      },
    };
    return model;
  };
