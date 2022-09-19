import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { EmergencyService } from '../emergency-service';
import Emergency from './types';

@Service()
@Resolver(Emergency)
export default class EmergencyResolver {
  constructor(private fieldClusterService: EmergencyService) {}

  @Query(() => Emergency)
  async fieldCluster(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['emergency']>> {
    return await this.fieldClusterService.findById(context.models, id);
  }
}
