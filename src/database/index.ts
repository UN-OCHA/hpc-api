import * as Knex from 'knex';

import AuthGrant from '../models/AuthGrant';
import AuthGrantee from '../models/AuthGrantee';
import AuthGrantLog from '../models/AuthGrantLog';
import AuthInvite from '../models/AuthInvite';
import AuthTarget from '../models/AuthTarget';
import AuthToken from '../models/AuthToken';
import FileRecord from '../models/FileRecord';
import Location from '../models/Location';
import Organization from '../models/Organization';
import Participant from '../models/Participant';
import ParticipantCountry from '../models/ParticipantCountry';
import ParticipantOrganizations from '../models/participantsOrganizations';
import ReportingWindow from '../models/ReportingWindow';
import ReportingWindowVersion from '../models/ReportingWindowVersion';
import ReportingWindowAssignment from '../models/ReportingWindowAssignment';
import ReportingWindowAssignmentVersion from '../models/ReportingWindowAssignmentVersion';

export const knex = require('knex')({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      user : 'your_database_user',
      password : 'your_database_password',
      database : 'myapp_test'
    }
});