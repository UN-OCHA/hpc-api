import Context from '../../Context';
import { PlanTagService } from '../plan-tag-service';
import { Service } from 'typedi';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
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
