import {
  planModel,
  planVersionModel,
} from '../../data-providers/postgres/models/plans/plan';

const PlansLib = {
  async getAll(db) {
    const [plans, planVersions] = await Promise.all([
      planModel.getAll(db),
      planVersionModel.getAll(db),
    ]);
    return plans.map((plan) => ({
      ...plan,
      ...planVersions.find((planversion) => planversion.planId === plan.id),
    }));
  },
};

export default PlansLib;
