import Context from '../../Context';
import { PlanService } from '../plan-service';
import { Service } from 'typedi';
import { Arg, Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import Plan from './types';

@Service()
@Resolver(Plan)
export default class PlanResolver {
  constructor(private planService: PlanService) {}

  @Query(() => Plan)
  async plan(@Arg('id') id: number, @Ctx() context: Context) {
    return await this.planService.findById(context.models, id);
  }

  @FieldResolver()
  async years(@Root() plan: Plan, @Ctx() context: Context) {
    return await this.planService.findPlanYears(context.models, plan.id);
  }
}
