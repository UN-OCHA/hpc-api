import Participant from "../Participant";
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import VersionedModel from "./VersionedModel";
import { validateOrReject } from "class-validator";

export default abstract class VersionModel<Data> extends BaseEntity {

    @PrimaryColumn({ name: 'root', nullable: false })
    root: number;

    abstract rootModel: VersionedModel<Data>;

    @Column()
    modifiedBy: number;

    @ManyToOne(() => Participant, { nullable: true })
    @JoinColumn({ name: 'modifiedBy'})
    modifiedByParticipant: Participant;

    @Column()
    version: number;

    @Column({ nullable: false })
    isLatest: boolean;

    @Column({ type: 'jsonb', nullable: false })
    data: Data;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    private validateOnSave() {
        return validateOrReject(this);
    }
}