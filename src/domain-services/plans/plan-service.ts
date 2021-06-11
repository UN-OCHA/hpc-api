import {
  PlanVersionTable,
  PlanYearTable,
} from '../../data-providers/postgres/models/plans/plan';
import { YearTable } from '../../data-providers/postgres/models/year';
import { Service } from 'typedi';
import { DbModels } from '../../data-providers/postgres/models';

@Service()
export class PlanService {
  async findById(models: DbModels, id: number) {
    const plan = await models.plans.plan.getOne(id);

    if (plan[0] === undefined) {
      throw new Error(`Plan with ID ${id} does not exist`);
    }

    const planId = plan[0].id;

    const latestPlanVersion = (await models.plans.planVersion.table().where({
      planId: planId,
      latestVersion: true,
    })) as any as PlanVersionTable[];

    return {
      id: planId,
      name: latestPlanVersion[0].name,
    };
  }

  async findPlanYears(models: DbModels, planId: number) {
    const planYears = (await models.plans.planYear.table().where({
      planId,
    })) as any as PlanYearTable[];

    const years = (await models.usageYear.table().whereIn(
      'id',
      planYears.map((py) => py.usageYearId)
    )) as any as YearTable[];

    return years.map((y) => y.year);
  }
}
