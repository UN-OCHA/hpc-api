import { Column, Entity, Index, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import AuthGrant from './AuthGrant';
import Base from './common/Base';
import { Brand } from "./utils/branding";

export enum AuthGranteeType {
    user = 'user'
}

@Entity({ name: "authGrantee" })
@Index(['type', 'granteeId'], {unique: true})
export default class AuthGrantee extends Base {

    @PrimaryGeneratedColumn("increment")
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthGrantee ID'
    >;

    @Column({
        enum: AuthGranteeType,
        type: "enum",
        default: AuthGranteeType.user,
        enumName: 'enum_authGrantee_type'
    })
    type: AuthGranteeType;

    @Column()
    granteeId: number;

    @OneToOne(() => AuthGrant, authGrant => authGrant.grantee)
    grant: AuthGrant
}
