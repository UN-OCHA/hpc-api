import { Knex } from 'knex';

export interface TableBase {
  id: number;
}
export interface TableBaseWithTimeStamps extends TableBase {
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelBase<T> {
  tableName: string;
  table: (db: Knex) => Knex.QueryBuilder<any, T>;
  getOne: (db: Knex, id: number) => Promise<T>;
  getAll: (db: Knex) => Promise<T[]>;
  create?: (db: Knex, type: T) => Promise<T>;
  update?: (db: Knex, id: number, type: Partial<T>) => Promise<T>;
  deleteOne?: (db: Knex, id: number) => Promise<void>;
}
