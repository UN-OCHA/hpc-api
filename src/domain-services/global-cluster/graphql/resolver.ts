import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { GlobalClusterService } from '../global-cluster-service';
import GlobalCluster from './types';

@Service()
@Resolver(GlobalCluster)
export default class GlobalClusterResolver {
  constructor(private globalClusterService: GlobalClusterService) {}

  @Query(() => GlobalCluster)
  async globalCluster(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['globalCluster']>> {
    return await this.globalClusterService.findById(context.models, id);
  }
}
