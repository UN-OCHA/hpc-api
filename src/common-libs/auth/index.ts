const AuthLib = {
  async getRolesForAParticipant(participantId: number) {
    return participantId; //TODO: add functionality
  },

  async getParticipantsForATarget(target: {
    targetId: number;
    target: string;
  }) {
    return target; //TODO: add functionality
  },
};

export default AuthLib;
