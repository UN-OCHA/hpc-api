import { Service } from 'typedi';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { ProjectService } from '../project-service';
import Project from './types';
import Context from '../../Context';

@Service()
@Resolver(Project)
export default class ProjectsResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => [Project])
  async getProjects(
    @Ctx() context: Context,
    @Arg('autocomplete', { nullable: true }) autocomplete?: string
  ): Promise<Project[]> {
    return await this.projectService.getProjects(context.models, autocomplete);
  }
}
