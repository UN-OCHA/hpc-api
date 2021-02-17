import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { IsDate, IsHash, ValidateIf, ValidateNested, validateOrReject } from 'class-validator';

import Participant, { ParticipantId } from "./Participant";

@Entity({ name: "authToken" })
export default class AuthToken extends BaseEntity {

    @PrimaryColumn({length: 255})
    @IsHash('sha256')
    tokenHash: string;

    @ManyToOne(() => Participant, participant => participant.authTokens)
    @ValidateNested()
    @ValidateIf((o: AuthToken) => !o.participant)
    @JoinColumn({name: 'participant'})
    participantObj: Participant;

    @Column()
    @ValidateIf((o: AuthToken) => !o.participantObj)
    participant: ParticipantId;

    @Column({ nullable: false })
    @IsDate()
    expires: Date;

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
