import config from '../../knexfile';
import * as knex from 'knex';

import { IAuthGrant, ICreateAuthGrant, IUpdateAuthGrant } from './models/AuthGrant';
import { IAuthGrantLog, ICreateAuthGrantLog, IUpdateAuthGrantLog } from './models/AuthGrantLog';
import { IAuthGrantee, ICreateAuthGrantee, IUpdateAuthGrantee } from './models/AuthGrantee';
import { IAuthInvite, ICreateAuthInvite, IUpdateAuthInvite } from './models/AuthInvite';
import { IAuthTarget, ICreateAuthTarget, IUpddateAuthTarget } from './models/AuthTarget';
import { IAuthToken, ICreateAuthToken, IUpdateAuthToken } from './models/AuthToken';
import { IFileRecord, ICreateFileRecord, IUpdateFileRecord } from './models/FileRecord';
import { ILocation, ICreateLocation, IUpdateLocation } from './models/Location';
import { IOrganization, ICreateOrganization, IUpdateOrganization } from './models/Organization';
import { IParticipant, ICreateParticipant, IUpdateParticipant } from './models/Participant';
import { IParticipantLocation, ICreateParticipantLocation, IUpdateParticipantLocation } from './models/ParticipantCountry';
import { IParticipantOrganization, ICreateParticipantOrganization, IUpdateParticipantOrganization } from './models/ParticipantsOrganizations';
import { IReportingWindow, ICreateReportingWindow, IUpdateReportingWindow } from './models/ReportingWindow';
import { IReportingWindowAssignment, ICreateReportingWindowAssignment, IUpdateReportingWindowAssignment } from './models/ReportingWindowAssignment';

const environment = process.env.NODE_ENV || 'development';
const configuration = config[environment];
export default knex(configuration);

declare module 'knex/types/tables' {
  interface Tables {
    authGrant: knex.CompositeTableType<IAuthGrant, ICreateAuthGrant, IUpdateAuthGrant>;
    authGrantLog: knex.CompositeTableType<IAuthGrantLog, ICreateAuthGrantLog, IUpdateAuthGrantLog>;
    authGrantee: knex.CompositeTableType<IAuthGrantee, ICreateAuthGrantee, IUpdateAuthGrantee>;
    authInvite: knex.CompositeTableType<IAuthInvite, ICreateAuthInvite, IUpdateAuthInvite>;
    authTarget: knex.CompositeTableType<IAuthTarget, ICreateAuthTarget, IUpddateAuthTarget>;
    authToken: knex.CompositeTableType<IAuthToken, ICreateAuthToken, IUpdateAuthToken>;
    fileRecord: knex.CompositeTableType<IFileRecord, ICreateFileRecord, IUpdateFileRecord>;
    location: knex.CompositeTableType<ILocation, ICreateLocation, IUpdateLocation>;
    organization: knex.CompositeTableType<IOrganization, ICreateOrganization, IUpdateOrganization>;
    participant: knex.CompositeTableType<IParticipant, ICreateParticipant, IUpdateParticipant>;
    participantCountry: knex.CompositeTableType<IParticipantLocation, ICreateParticipantLocation, IUpdateParticipantLocation>;
    participantOrganization: knex.CompositeTableType<IParticipantOrganization, ICreateParticipantOrganization, IUpdateParticipantOrganization>;
    reportingWindow: knex.CompositeTableType<IReportingWindow, ICreateReportingWindow, IUpdateReportingWindow>;
    reportingWindowAssignment: knex.CompositeTableType<IReportingWindowAssignment, ICreateReportingWindowAssignment, IUpdateReportingWindowAssignment>;
  }
}