import { DbModels } from '../../data-providers/postgres/models';

const ParticipantLib = {
  async getAll(models: DbModels) {
    return models.participant.getAll();
  },

  async findByEmail() {
    return;
  },
};

export default ParticipantLib;
