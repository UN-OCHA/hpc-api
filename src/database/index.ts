import {createConnection} from "typeorm";

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

export const connection = createConnection({
    type: "postgres", 
    host: process.env.DEV_DB_HOST,
    port:  5432,
    username: "postgres", 
    password: null, 
    database: "hpc",
    entities: [
        AuthGrant,
        AuthGrantee,
        AuthGrantLog,
        AuthInvite,
        AuthTarget,
        AuthToken,
        FileRecord,
        Location,
        Organization,
        Participant,
        ParticipantCountry,
        ParticipantOrganizations,
        ReportingWindow,
        ReportingWindowVersion, 
        ReportingWindowAssignment,
        ReportingWindowAssignmentVersion,
    ],
    synchronize: false,
    logging: false
});