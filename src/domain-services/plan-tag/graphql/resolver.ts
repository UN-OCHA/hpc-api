import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { PlanTagService } from '../plan-tag-service';
import PlanTag from './types';

@Service()
@Resolver(PlanTag)
export default class PlanTagResolver {
  constructor(private planTagService: PlanTagService) {}

  @Query(() => PlanTag)
  async planTag(@Arg('id') id: number, @Ctx() context: Context) {
    return await this.planTagService.findById(context.models, id);
  }
}
