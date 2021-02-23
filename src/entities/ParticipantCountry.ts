import { Field, ID, ObjectType } from 'type-graphql';

import Base from './common/Base';
import Participant from './Participant';
import Location from './Location';
import { Brand } from "../utils/branding";

@ObjectType()
export default class participantOrganization extends Base {
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'ParticipantCountry ID'
    >;

    @Field({description: 'indicates when this was last validated on'})
    validated: boolean;

    @Field(() => Participant, {description: 'participant involved in the relationship'})
    participant: Participant;

    @Field(() => Location, { description: 'location involved in the relationship' })
    location: Location;
}
