import AuthGrantee from "./AuthGrantee";
import AuthTarget from "./AuthTarget";
import Base from './common/Base';
import Participant from "./Participant";
import { Brand } from "../utils/branding";

export default class AuthGrantLog extends Base {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthGrantLog ID'
    >;
    target: AuthTarget;
    grantee: AuthGrantee;
    newRoles: string[];
    actor: Participant;
}
