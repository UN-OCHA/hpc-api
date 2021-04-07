import { participantModel } from "../../data-providers/postgres/models/participant";

const ParticipantLib = {
    async getAll(db){
        return participantModel.getAll(db);
    },

    async findByEmail(){
        
    }
}

export default ParticipantLib;
