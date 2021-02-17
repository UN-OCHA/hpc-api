import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import Base from './common/Base';
import Participant from './Participant';
import ParticipantCountry from './ParticipantCountry';
import { Brand } from './utils/branding';

@Entity()
@ObjectType()
export default class Location extends Base {

    @PrimaryGeneratedColumn("increment")
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Location ID'
    >;

    @Field({ description: "external ID" })
    @Column({ length: 255, unique: true })
    externalId: string;

    @Field({ description: "The name of the location" })
    @Column({ length: 255 })
    name: string;

    @Field({ description: "The admin level of the location" })
    @Column()
    adminLevel: number;

    @Field({ description: "latitude of the location" })
    @Column({type: 'float'})
    latitude: number;

    @Field({ description: "longitude of the location" })
    @Column({type: 'float'})
    longitude: number;

    @Field({ description: "ISO3" })
    @Column({ length: 3 })
    iso3: string;

    @Field({ description: "PCODE" })
    @Column({ length:255, unique: true })
    pcode: string;

    @Field({ description: "validon" })
    @Column({ type: 'bigint' })
    validOn: number;

    @Field({ description: "status" })
    @Column({ length: 255 })
    status: string;

    @Field({ description: "itosSync" })
    @Column({ default: true })
    itosSync: boolean;

    @OneToMany(() => ParticipantCountry, participantCountry => participantCountry.location)
    locationParticipants!: ParticipantCountry[];

    @Field(_type => Participant, { description: "Participants in the location" })
    participants: Participant;
}
