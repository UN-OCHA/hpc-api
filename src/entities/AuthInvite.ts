import AuthTarget from "./AuthTarget";
import Participant from "./Participant";

export default class AuthInvite {
    target: AuthTarget;
    email: string;
    roles: string[];
    actor: Participant;
    createdAt: Date;
    updatedAt: Date;
}
