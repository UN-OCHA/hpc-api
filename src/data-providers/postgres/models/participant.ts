import { Knex } from 'knex';
import { ModelBase, TableBaseWithTimeStamps } from './common/Base';

export interface ParticipantTable extends TableBaseWithTimeStamps {
    id: number;
    hidId: string;
    email: string;
    given_name: string;
    family_name: string;
}

interface ParticipantModel extends ModelBase<ParticipantTable> {
}

export const participantModel: ParticipantModel = {
    tableName: 'participant',
    table: (db) => db(participantModel.tableName),
    getOne: (db, id) => db(participantModel.tableName).select({ where: { id }}),
    getAll: (db) => db(participantModel.tableName).select('*'),
    // create: (db, authGrant) => db(authGrantModel.tableName).insert(authGrant),
    // update: (db, id, authGrant) => db(AuthGrantModel.tableName).update(authGrant).where({ id }),
    // delete: (db, id) =>  db(AuthGrantModel.tableName).update({ deletedAt: new Date()}).where({ id }),
};
