import { Field, ID, ObjectType } from 'type-graphql';
import { Brand } from '../../../common-utils/branding';
import participantOrganization from './participant-organisation-type';
import Participant from './participant-type';

@ObjectType()
export default class Organization {

    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Organization ID'
    >;

    @Field({ description: "Name of the organization" })
    name: string;

    @Field({ nullable: true, description: "The native name given to the organization" })
    nativeName: string;

    @Field({ description: "The abbrevation given to the organization" })
    abbreviation: string;

    @Field({ nullable: true, description: "The URL of the organization" })
    url: string;

    @Field({ nullable: true, description: "The comments made on the organization" })
    comments: string;

    @Field({ description: "Is the organization verified" })
    verified: boolean;

    @Field({ nullable: true, description: "The notes on the organization" })
    notes: string;

    @Field({ description: "Is the organization active" })
    active: boolean;

    @Field({ description: "The collectiveind?" })
    collectiveInd: boolean;

    @Field(_type => Organization, { nullable: true, description: "New organization?" })
    newOrganization: Organization;

    @Field(_type => [Organization], { nullable: true, description: "The children of the organization" })
    children: Organization[];

    @Field(_type => Organization, { nullable: true, description: "The parent organization" })
    parent: Organization;

    @Field(() => [participantOrganization], { description: 'relationship table between participants and organizations' })
    organizationParticipants: participantOrganization[];

    @Field(_type => [Participant], {description: 'the participants associated with the organization'})
    participants: Participant[];

    public static categories() {
      // to be implemented
    }
}
