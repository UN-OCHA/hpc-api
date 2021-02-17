import { Arg, Ctx, FieldResolver, Query, Resolver, ResolverInterface, Root } from 'type-graphql';

import Participant from '../../models/Participant';
import Context from '../../types/Context';

@Resolver(_of => Participant)
export default class ParticipantResolver implements ResolverInterface<Participant> {
    @Query(_returns => [Participant], {
        description: "Get all the participants",
    })
    async allParticipants(
        @Arg('email', { description: "email of the participant to filter by", nullable: true }) email: string,
        @Ctx() ctx: Context
    ) {
        let query = Participant.createQueryBuilder('participant')
        .innerJoinAndSelect(`participant.participantOrganizations`, 'participantOrganizations')
        .innerJoinAndSelect('participantOrganizations.organization','organizations');
        if (email) {
            query = query.where(`email = '${email}'`);
        } else {
            query = query.where("email IS NOT NULL")
        }
        return query.getMany();
    }

    @FieldResolver()
    async organizations(@Root() participant: Participant) {
        return participant.participantOrganizations.map(participantOrganization => participantOrganization.organization);
    }
}