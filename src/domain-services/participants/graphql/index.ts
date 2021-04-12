import { extendType, objectType } from 'nexus';
import ParticipantLib from '../participant-lib';

/**
 * Types
 */

export const Location = objectType({
  name: 'Location',
  definition(t) {
    t.nonNull.float('adminLevel', {
      description: 'The admin level of the location',
    });
    t.nonNull.string('externalId', { description: 'external ID' });
    t.nonNull.id('id');
    t.nonNull.string('iso3', { description: 'ISO3' });
    t.nonNull.boolean('itosSync', { description: 'itosSync' });
    t.nonNull.float('latitude', { description: 'latitude of the location' });
    t.nonNull.list.nonNull.field('locationParticipants', {
      type: ParticipantCountry,
      description: 'Relationship table between participants and locations',
    });
    t.nonNull.float('longitude', { description: 'longitude of the location' });
    t.nonNull.string('name', { description: 'The name of the location' });
    t.nonNull.field('participants', {
      type: Participant,
      description: 'Participants in the location',
    });
    t.nonNull.string('pcode', { description: 'PCODE' });
    t.nonNull.string('status', { description: 'status' });
    t.nonNull.float('validOn', { description: 'validon' });
  },
});

export const Organization = objectType({
  name: 'Organization',
  definition(t) {
    t.nonNull.string('abbreviation', {
      description: 'The abbrevation given to the organization',
    });
    t.nonNull.boolean('active', { description: 'Is the organization active' });
    t.list.nonNull.field('children', {
      type: Organization,
      description: 'The children of the organization',
    });
    t.nonNull.boolean('collectiveInd', { description: 'The collectiveind?' });
    t.string('comments', {
      description: 'The comments made on the organization',
    });
    t.nonNull.id('id');
    t.nonNull.string('name', { description: 'Name of the organization' });
    t.string('nativeName', {
      description: 'The native name given to the organization',
    });
    t.field('newOrganization', {
      type: Organization,
      description: 'New organization?',
    });
    t.string('notes', { description: 'The notes on the organization' });
    t.nonNull.list.nonNull.field('organizationParticipants', {
      type: ParticipantOrganization,
      description: 'relationship table between participants and organizations',
    });
    t.field('parent', {
      type: Organization,
      description: 'The parent organization',
    });
    t.nonNull.list.nonNull.field('participants', {
      type: Participant,
      description: 'the participants associated with the organization',
    });
    t.string('url', { description: 'The URL of the organization' });
    t.nonNull.boolean('verified', {
      description: 'Is the organization verified',
    });
  },
});

export const Participant = objectType({
  name: 'Participant',
  definition(t) {
    t.string('email', { description: 'The email of the user' });
    t.string('hidId', { description: 'The HID ID of the user' });
    t.nonNull.id('id');
    t.list.nonNull.field('locations', {
      type: Location,
      description: 'The locations associated with the participant',
    });
    t.nonNull.string('name_family', {
      description:
        'The name of the family of users to which the user belongs to',
    });
    t.nonNull.string('name_given', {
      description: 'The Name given to the user',
    });
    t.list.nonNull.field('organizations', {
      type: Organization,
      description: 'The organizations to which the participant belongs to',
    });
    t.list.nonNull.field('participantCountry', {
      type: ParticipantCountry,
      description: 'Relationship table between participants and locations',
    });
    t.list.nonNull.field('participantOrganizations', {
      type: ParticipantOrganization,
      description: 'Relationship table between participants and organizations',
    });
  },
});

export const ParticipantCountry = objectType({
  name: 'ParticipantCountry',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.field('location', {
      type: Location,
      description: 'location involved in the relationship',
    });
    t.nonNull.field('participant', {
      type: Participant,
      description: 'participant involved in the relationship',
    });
    t.nonNull.boolean('validated', {
      description: 'indicates when this was last validated on',
    });
  },
});
export const ParticipantOrganization = objectType({
  name: 'ParticipantOrganization',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.field('organization', {
      type: Organization,
      description: 'Organization involved in the relationship',
    });
    t.nonNull.field('participant', {
      type: Participant,
      description: 'participant involved in the relationship',
    });
    t.nonNull.boolean('validated', {
      description: 'indicates when this was last validated on',
    });
  },
});

/**
 * Queries
 */

export const Query = objectType({
  name: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('allParticipants', {
      type: Participant,
      description: 'Get all the participants',
      async resolve(_root, _args, ctx) {
        const res = await ParticipantLib.getAll(ctx.knex);
        console.log(res);
        return res;
      },
    });
  },
});
