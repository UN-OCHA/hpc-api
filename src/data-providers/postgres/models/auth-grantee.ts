import { Knex } from 'knex';
import { ModelBase, TableBase } from './common/Base';

export interface AuthGranteeTable extends TableBase {
    granteeId: number;
    type: 'user' | 'bot';
}

interface AuthGranteeModel extends ModelBase<AuthGranteeTable> {
}

export const authGranteeModel: AuthGranteeModel = {
    tableName: 'authGrantee',
    table: (db) => db(authGranteeModel.tableName),
    getOne: (db, id) => db(authGranteeModel.tableName).select({ where: { id }}),
    getAll: (db) => db(authGranteeModel.tableName).select('*'),
    // create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
    // update: (db, id, authGrant) => db(AuthGrantModel.tableName).update(authGrant).where({ id }),
    // delete: (db, id) =>  db(AuthGrantModel.tableName).update({ deletedAt: new Date()}).where({ id }),
}
