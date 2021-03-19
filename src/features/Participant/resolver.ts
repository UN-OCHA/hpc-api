import { Arg, Ctx, FieldResolver, Query, Resolver, ResolverInterface, Root } from 'type-graphql';

import Participant from '../../entities/Participant';
import ParticipantModel, { IParticipant } from '../../database/models/Participant';
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
        const whereObj: Partial<IParticipant> = {};
        if (email) {
            whereObj['email'] = email;
        }
        let participants = await ParticipantModel.findAllParticipants(whereObj);
        return participants;
    }

    @FieldResolver()
    async organizations(@Root() participant: Participant) {
        return participant.participantOrganizations.map(participantOrganization => participantOrganization.organization);
    }
}