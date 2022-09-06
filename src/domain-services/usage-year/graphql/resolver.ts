import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { UsageYearService } from '../usage-year-service';
import UsageYear from './types';

@Service()
@Resolver(UsageYear)
export default class UsageYearResolver {
  constructor(private usageYearService: UsageYearService) {}

  @Query(() => UsageYear)
  async usageYear(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['usageYear']>> {
    return await this.usageYearService.findById(context.models, id);
  }
}
