import { Knex } from 'knex';

import {
  planModel,
  planVersionModel,
} from '../../data-providers/postgres/models/plans/plan';

const PlansLib = {
  async getAll(db: Knex) {
    const [plans, planVersions] = await Promise.all([
      planModel(db).getAll(),
      planVersionModel(db).getAll(),
    ]);
    return plans.map((plan) => ({
      ...plan,
      ...planVersions.find((planversion) => planversion.planId === plan.id),
    }));
  },
};

export default PlansLib;
