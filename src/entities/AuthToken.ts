import Participant from "./Participant";

export default class AuthToken {
    tokenHash: string;
    participantObj: Participant;
    participant: Participant['id'];
    expires: Date;
    createdAt: Date;
    updatedAt: Date;
}
