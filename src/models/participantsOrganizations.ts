import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import Base from './common/Base';
import Participant from './Participant';
import Organization from './Organization';
import { Brand } from "./utils/branding";

@Entity({ name: 'participantOrganization' })
export default class participantOrganization extends Base {

    @PrimaryGeneratedColumn("increment")
    id: Brand<
        number,
        { readonly s: unique symbol },
        'participantOrganizations ID'
    >;

    @Column({default: true})
    validated: boolean;

    @ManyToOne(() => Participant, participant => participant.participantOrganizations)
    participant: Participant;

    @ManyToOne(() => Organization, organization => organization.organizationParticipants)
    organization: Organization;
}
 