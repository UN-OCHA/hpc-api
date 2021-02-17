import { Field, ObjectType, Authorized, ID } from 'type-graphql';
import { Column, Entity, In, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import AuthToken from './AuthToken';
import Base from './common/Base';
import participantOrganization from './participantsOrganizations';
import ParticipantCountry from './ParticipantCountry';
import AuthInvite from "./AuthInvite";
import AuthGrantLog from "./AuthGrantLog";
import Organization from './Organization';
import Location from './Location';
import AuthGrantee, { AuthGranteeType } from './AuthGrantee';
import AuthGrant from './AuthGrant';
import { Brand } from './utils/branding';

@Entity()
@ObjectType()
export default class Participant extends Base {

    @PrimaryGeneratedColumn("increment")
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'Participant ID'
    >;

    @Field({ description: 'The HID ID of the user' })
    @Column({ length: 255, unique: true })
    hidId: string

    @Column({length: 255})
    @Field({ description: 'The email of the user' })
    email: string;

    @Column({length: 255})
    @Field({ description: 'The Name given to the user' })
    name_given: string;

    @Field({ description: 'The name of the family of users to which the user belongs to' })
    @Column({length: 255})
    name_family: string;

    @OneToMany(() => participantOrganization, participantOrganization => participantOrganization.participant)
    participantOrganizations: participantOrganization[];

    @Field(_type => [Organization], { nullable:true, description: 'The organizations to which the participant belongs to' })
    organizations: Organization[];

    @OneToMany(() => ParticipantCountry, participantCountry => participantCountry.participant)
    participantCountry: ParticipantCountry[];

    @Field(_type => [Location], { nullable: true, description: 'The locations associated with the participant' })
    locations: Location[];

    @OneToMany(() => AuthToken, authToken => authToken.participantObj)
    authTokens!: AuthToken[];

    @OneToMany(() => AuthInvite, authInvite => authInvite.actor)
    authInvites: AuthInvite[];

    @OneToMany(() => AuthGrantLog, authGrantLog => authGrantLog.actor)
    authGrantLog: AuthGrantLog[]; 

    static assosciations: {
        participantOrganizations: "participant.participantOrganizations" 
    }

    activateInvitesForEmail = async (
        email: string
    ) => {
        const invites = await AuthInvite.find({
            where: {
                email
            },
            relations: ['target', 'actor']
        })
      
        // Activate any invitations
        if (invites.length > 0) {
          const grantee = new AuthGrantee();
          grantee.type = AuthGranteeType.user;
          grantee.granteeId = this.id;
          await grantee.save();
          for (const invite of invites) {
            const target = invite.target;
            /* istanbul ignore if - should not be possible due to sequelize constraints */
            if (!target) {
              throw new Error('missing target');
            }
            const authGrant = new AuthGrant();
            authGrant.grantee = grantee;
            authGrant.target = target;
            authGrant.roles = invite.roles;
            await authGrant.save();
            const authGrantLog = new AuthGrantLog();
            authGrantLog.grantee = grantee;
            authGrantLog.target = target;
            authGrantLog.newRoles = invite.roles;
            authGrantLog.actor = invite.actor;
          }
          await AuthInvite.delete({
            email
          });
        }
      }
}

export type ParticipantId = Participant['id'];
