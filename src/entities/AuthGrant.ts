import AuthGrantee from './AuthGrantee';
import AuthTarget from "./AuthTarget";

export default class AuthGrant {
    target: AuthTarget;
    grantee: AuthGrantee;
    roles: string[];
    createdAt: Date;
    updatedAt: Date;
}
