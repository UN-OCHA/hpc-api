import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import AuthGrantee from './AuthGrantee';
import AuthTarget from "./AuthTarget";

@Entity({name: "authGrant"})
@Index(['target', 'grantee'], {unique: true})
export default class AuthGrant extends BaseEntity {

    @PrimaryColumn("int")
    @OneToOne(() => AuthTarget, authTarget => authTarget.grant)
    @JoinColumn({ name: "target" })
    target: AuthTarget;

    @PrimaryColumn("int")
    @OneToOne(() => AuthGrantee, authGrantee => authGrantee.grant)
    @JoinColumn({ name: "grantee" })
    grantee: AuthGrantee;

    @Column("varchar", { array: true })
    roles: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
