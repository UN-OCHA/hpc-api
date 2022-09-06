import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { OrganizationService } from '../organization-service';
import Organization from './types';

@Service()
@Resolver(Organization)
export default class OrganizationResolver {
  constructor(private organizationService: OrganizationService) {}

  @Query(() => Organization)
  async organization(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['organization']>> {
    return await this.organizationService.findById(context.models, id);
  }
}
