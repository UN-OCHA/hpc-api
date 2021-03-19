import { registerEnumType } from "type-graphql";

import AuthGrant from './AuthGrant';
import AuthInvite from './AuthInvite';
import Base from './common/Base';
import { Brand } from "../utils/branding";

enum AuthTargetType {
    global = 'global',
    operation = 'operation',
    operationCluster = 'operationCluster',
    plan = 'plan',
    governingEntity = 'governingEntity',
}

registerEnumType(AuthTargetType, {
    name: 'AuthTargetType',
    description: 'Authentication Target Types',
});

export default class AuthTarget extends Base {
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthTarget ID'
    >;
    type: AuthTargetType;
    targetId: number;
    grant: AuthGrant;
    invites: AuthInvite[];
}
