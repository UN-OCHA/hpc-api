import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { ProjectService } from '../project-service';
import Project from './types';

@Service()
@Resolver(Project)
export default class ProjectResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => Project)
  async project(
    @Arg('id') id: number,
    @Ctx() context: Context
  ): Promise<InstanceDataOfModel<Database['project']>> {
    return await this.projectService.findById(context.models, id);
  }
}
