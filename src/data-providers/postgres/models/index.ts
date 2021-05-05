import { Knex } from 'knex';

import * as auth from './auth';
import * as location from './location';
import * as participant from './participant';
import * as plans from './plans/plan';
import * as year from './year';

export const models = (db: Knex) => {
  return {
    auth: {
      grant: auth.authGrantModel(db),
      grantee: auth.authGranteeModel(db),
      gGrantLog: auth.authGrantLogModel(db),
      invite: auth.authInviteModel(db),
      target: auth.authTargetModel(db),
      token: auth.authTokenModel(db),
    },
    participant: participant.participantModel(db),
    plans: {
      plan: plans.planModel(db),
      planVersion: plans.planVersionModel(db),
      planYear: plans.planYearModel(db),
    },
    location: location.locationModel(db),
    usageYear: year.yearModel(db),
  };
};

export type DbModels = ReturnType<typeof models>;

export default models;
