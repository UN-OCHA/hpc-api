import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { GoverningEntityService } from '../governing-entity-service';
import GoverningEntity from './types';

@Service()
@Resolver(GoverningEntity)
export default class GoverningEntityResolver {
  constructor(private fieldClusterService: GoverningEntityService) {}

  @Query(() => GoverningEntity)
  async fieldCluster(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['governingEntity']>> {
    return await this.fieldClusterService.findById(context.models, id);
  }
}
