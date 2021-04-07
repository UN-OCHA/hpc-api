import { Arg, Ctx, FieldResolver, Query, Resolver, ResolverInterface, Root } from 'type-graphql';
import ParticipantLib from '../participant-lib';
import Participant from '../types/participant-type';


@Resolver(_of => Participant)
export default class ParticipantResolver implements ResolverInterface<Participant> {
    @Query(_returns => [Participant], {
        description: "Get all the participants",
    })
    async allParticipants(context) {
            return ParticipantLib.getAll(context.knex)
    }

    @FieldResolver()
    async organizations(@Root() participant: Participant) {
        return participant.participantOrganizations.map(participantOrganization => participantOrganization.organization);
    }
}
