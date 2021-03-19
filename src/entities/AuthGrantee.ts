import AuthGrant from './AuthGrant';
import Base from './common/Base';
import { Brand } from "../utils/branding";

export enum AuthGranteeType {
    user = 'user'
}

export default class AuthGrantee extends Base {

    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthGrantee ID'
    >;
    type: AuthGranteeType;
    granteeId: number;
    grant: AuthGrant
}
