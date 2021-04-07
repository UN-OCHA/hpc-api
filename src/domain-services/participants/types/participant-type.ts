import { Field, ObjectType, ID } from 'type-graphql';

import { Brand } from '../../../common-utils/branding';
import Location from './location-type';
import Organization from './organization-type';
import ParticipantCountry from './participant-country-type';
import ParticipantOrganization from './participant-organisation-type';

@ObjectType()
export default class Participant {

    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Participant ID'
    >;

    @Field({ description: 'The HID ID of the user' })
    hidId: string

    @Field({ description: 'The email of the user' })
    email: string;

    @Field({ description: 'The Name given to the user' })
    name_given: string;

    @Field({ description: 'The name of the family of users to which the user belongs to' })
    name_family: string;

    @Field(() => [ParticipantOrganization], { description: 'Relationship table between participants and organizations', nullable: true })
    participantOrganizations: ParticipantOrganization[];

    @Field(() => [Organization], { nullable:true, description: 'The organizations to which the participant belongs to' })
    organizations: Organization[];

    @Field(() => [ParticipantCountry], { description: 'Relationship table between participants and locations', nullable: true })
    participantCountry: ParticipantCountry[];

    @Field(() => [Location], { nullable: true, description: 'The locations associated with the participant' })
    locations: Location[];
}
