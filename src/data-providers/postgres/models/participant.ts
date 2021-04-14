import { Knex } from 'knex';
import { ModelBase, TableBaseWithTimeStamps } from './common/base';

export interface ParticipantTable extends TableBaseWithTimeStamps {
  id: number;
  hidId: string;
  email: string;
  given_name: string;
  family_name: string;
}

type ParticipantModel = ModelBase<ParticipantTable>;

export const participantModel: ParticipantModel = {
  tableName: 'participant',
  table: (db) => db(participantModel.tableName),
  getOne: (db, id) => db(participantModel.tableName).select({ where: { id } }),
  getAll: (db) => db(participantModel.tableName).select('*'),
  create: (db, participant) =>
    db(participantModel.tableName).insert(participant),
  update: async (db, id, changes) => {
    await db(participantModel.tableName).update(changes).where({ id });
    return participantModel.getOne(db, id);
  },
  deleteOne: async (db, id) => {
    await db(participantModel.tableName)
      .update({ deletedAt: new Date() })
      .where({ id });
  },
};
