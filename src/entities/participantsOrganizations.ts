import { Field, ID, ObjectType } from 'type-graphql';

import Base from './common/Base';
import Participant from './Participant';
import Organization from './Organization';
import { Brand } from "../utils/branding";

@ObjectType()
export default class participantOrganization extends Base {

    @Field(() => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'participantOrganizations ID'
    >;

    @Field({description: 'indicates when this was last validated on'})
    validated: boolean;

    @Field(() => Participant, {description: 'participant involved in the relationship'})
    participant: Participant;

    @Field(() => Organization, {description: 'Organization involved in the relationship'})
    organization: Organization;
}
 