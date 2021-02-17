import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import AuthTarget from "./AuthTarget";
import Participant from "./Participant";

@Entity({ name: "authInvite" })
@Index(['target', 'email'], {unique: true})
export default class AuthInvite extends BaseEntity {

    @PrimaryColumn({type: 'int' })
    @ManyToOne(() => AuthTarget, authTarget => authTarget.invites)
    @JoinColumn({ name: "target" })
    target: AuthTarget;

    @PrimaryColumn({length: 255})
    email: string;

    @Column("varchar", { array: true })
    roles: string[];

    @ManyToOne(() => Participant, participant => participant.authInvites)
    @JoinColumn({ name: 'actor' })
    actor: Participant;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
