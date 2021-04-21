import { DbModels } from '../../data-providers/postgres/models';

const PlansLib = {
  async getAll(models: DbModels) {
    const [plans, planVersions] = await Promise.all([
      models.plans.plan.getAll(),
      models.plans.planVersion.getAll(),
    ]);
    return plans.map((plan) => ({
      ...plan,
      ...planVersions.find((planversion) => planversion.planId === plan.id),
    }));
  },
};

export default PlansLib;
