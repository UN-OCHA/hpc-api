import { registerEnumType } from "type-graphql";
import { Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import AuthGrant from './AuthGrant';
import AuthInvite from './AuthInvite';
import Base from './common/Base';
import { Brand } from "./utils/branding";

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

@Entity({ name: "authTarget" })
@Index(['type', 'targetId'], {unique: true})
export default class AuthTarget extends Base {

    @PrimaryGeneratedColumn("increment")
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthTarget ID'
    >;

    @Column({
        enum: AuthTargetType,
        type: "enum",
        enumName: 'enum_authTarget_type' 
    })
    type: AuthTargetType;

    @Column({nullable: true})
    targetId: number;

    @OneToOne(() => AuthGrant, authGrant => authGrant.target)
    grant: AuthGrant

    @OneToMany(() => AuthInvite, authInvite => authInvite.target)
    invites: AuthInvite[];
}
