import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import Base from './common/Base';
import Participant from './Participant';
import participantOrganization from './participantsOrganizations';
import { Brand } from './utils/branding';

@Entity()
@ObjectType()
export default class Organization extends Base {

    @PrimaryGeneratedColumn("increment")
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Organization ID'
    >;

    @Field({ description: "Name of the organization" })
    @Column({ length:255, nullable: false, unique: true })
    name: string;

    @Field({ nullable: true, description: "The native name given to the organization" })
    @Column({ length: 255 })
    nativeName: string;

    @Field({ description: "The abbrevation given to the organization" })
    @Column({ length: 255 })
    abbreviation: string;

    @Field({ nullable: true, description: "The URL of the organization" })
    @Column({ type: 'text' })
    url: string;

    @Field({ nullable: true, description: "The comments made on the organization" })
    @Column({ type: 'text' })
    comments: string;

    @Field({ description: "Is the organization verified" })
    @Column({ default: false, nullable: false })
    verified: boolean;

    @Field({ nullable: true, description: "The notes on the organization" })
    @Column({ type: 'text' })
    notes: string;

    @Field({ description: "Is the organization active" })
    @Column({ default: true, nullable: false })
    active: boolean;

    @Field({ description: "The collectiveind?" })
    @Column({ default: false, nullable: false })
    collectiveInd: boolean;

    @Field(_type => Organization, { nullable: true, description: "New organization?" })
    @Column("int", { nullable: true, name: 'newOrganizationId' })
    newOrganization: Organization;

    @Field(_type => [Organization], { nullable: true, description: "The children of the organization" })
    @OneToMany(() => Organization, organization => organization.parent)
    children: Organization[];

    @Field(_type => Organization, { nullable: true, description: "The parent organization" })
    @ManyToOne(() => Organization, organization => organization.children)
    @JoinColumn({name: 'parentID'})
    parent: Organization;

    @OneToMany(() => participantOrganization, participantOrganization => participantOrganization.organization)
    organizationParticipants: participantOrganization[];

    @Field(_type => [Participant], {description: 'the participants associated with the organization'})
    participants: Participant[];

    public static categories() {
      // to be implemented
    }
}
