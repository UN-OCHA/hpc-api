import * as Knex from 'knex';
import db from '../../index';

export interface IBase {
    createdAt?: Date;
    updatedAt?: Date;
}

export default abstract class Base implements IBase {
    createdAt: IBase['createdAt'];
    updatedAt: IBase['updatedAt'];

    public abstract save(): Promise<boolean>;
    public abstract getTableName(): string;

    static parseWhere<T, U>(ref: Knex.QueryBuilder<T, U>) {
        return ref;
    }

    static findOneGeneric<T, U>(ref: Knex.QueryBuilder<T, U>, whereObj: IBase) {
        return ref.first('*').where(whereObj);
    }

    static findGeneric<T, U>(ref: Knex.QueryBuilder<T, U>, whereObj: IBase) {
        return ref.select('*').where(whereObj);
    }
}