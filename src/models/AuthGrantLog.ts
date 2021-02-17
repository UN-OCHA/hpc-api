import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import AuthGrantee from "./AuthGrantee";

import AuthTarget from "./AuthTarget";
import Base from './common/Base';
import Participant from "./Participant";
import { Brand } from "./utils/branding";

@Entity({ name: "authGrantLog" })
export default class AuthGrantLog extends Base {

    @PrimaryGeneratedColumn("increment")
    id: Brand<
        number,
        { readonly s: unique symbol },
        'AuthGrantLog ID'
    >;

    @ManyToOne(() => AuthTarget, authTarget => authTarget.invites)
    @JoinColumn({ name: "target" })
    target: AuthTarget;

    @OneToOne(() => AuthGrantee, authGrantee => authGrantee.grant)
    @JoinColumn({ name: "grantee" })
    grantee: AuthGrantee;

    @Column("varchar", { array: true })
    newRoles: string[];

    @ManyToOne(() => Participant, participant => participant.authGrantLog)
    @JoinColumn({name: 'actor'})
    actor: Participant;
}
