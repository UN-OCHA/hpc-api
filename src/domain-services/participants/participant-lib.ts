import { Knex } from 'knex';

import { participantModel } from '../../data-providers/postgres/models/participant';

const ParticipantLib = {
  async getAll(db: Knex) {
    return participantModel(db).getAll();
  },

  async findByEmail() {},
};

export default ParticipantLib;
