import SoftwareInfo from './types';
import { Service } from 'typedi';
import { Ctx, Query, Resolver } from 'type-graphql';
import { ProjectService } from '../project-service';
import Project from './types';
import Context from '../../Context';

@Service()
@Resolver(Project)
export default class ProjectsResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => [Project])
  async softwareInfo(@Ctx() context: Context): Promise<SoftwareInfo[]> {
    return await this.projectService.getProjects(context.models);
  }
}
