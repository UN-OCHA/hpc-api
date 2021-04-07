import { Field, ID, ObjectType } from 'type-graphql';
import { Brand } from '../../../common-utils/branding';
import participantCountry from './participant-country-type';
import Participant from './participant-type';

@ObjectType()
export default class Location {
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Location ID'
    >;

    @Field({ description: "external ID" })
    externalId: string;

    @Field({ description: "The name of the location" })
    name: string;

    @Field({ description: "The admin level of the location" })
    adminLevel: number;

    @Field({ description: "latitude of the location" })
    latitude: number;

    @Field({ description: "longitude of the location" })
    longitude: number;

    @Field({ description: "ISO3" })
    iso3: string;

    @Field({ description: "PCODE" })
    pcode: string;

    @Field({ description: "validon" })
    validOn: number;

    @Field({ description: "status" })
    status: string;

    @Field({ description: "itosSync" })
    itosSync: boolean;

    @Field(() => [participantCountry], { description: 'Relationship table between participants and locations' })
    locationParticipants!: participantCountry[];

    @Field(_type => Participant, { description: "Participants in the location" })
    participants: Participant;
}
