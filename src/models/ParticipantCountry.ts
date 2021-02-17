import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import Base from './common/Base';
import Participant from './Participant';
import Location from './Location';
import { Brand } from "./utils/branding";

@Entity({ name: 'participantCountry' })
export default class participantOrganization extends Base {
    @PrimaryGeneratedColumn("increment")
    id: Brand<
        number,
        { readonly s: unique symbol },
        'ParticipantCountry ID'
    >;
    
    @Column({default: true})
    validated: boolean;

    @ManyToOne(() => Participant, participant => participant.participantCountry)
    participant: Participant;

    @ManyToOne(() => Location, location => location.locationParticipants)
    location: Location;
}
