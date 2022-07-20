import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import PlanTag, { AddPlanTagInput } from '../../plan-tag/graphql/types';
import { PlanTagService } from '../../plan-tag/plan-tag-service';
import { PlanService } from '../plan-service';
import Plan from './types';

@Service()
@Resolver(Plan)
export default class PlanResolver {
  constructor(
    private planService: PlanService,
    private planTagService: PlanTagService
  ) {}

  @Query(() => Plan)
  async plan(@Arg('id') id: number, @Ctx() context: Context) {
    return await this.planService.findById(context.models, id);
  }

  @FieldResolver()
  async years(@Root() plan: Plan, @Ctx() context: Context) {
    return await this.planService.findPlanYears(context.models, plan.id);
  }

  @FieldResolver()
  async tags(@Root() plan: Plan, @Ctx() context: Context) {
    return await this.planTagService.findByPlanId(context.models, plan.id);
  }

  @Mutation(() => PlanTag)
  async publishPlan(
    @Arg('data') planTagInput: AddPlanTagInput,
    @Ctx() context: Context
  ) {
    return await this.planTagService.createPlanTag(
      context.models,
      planTagInput
    );
  }
}
