import { Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import Project from './graphql/types';

@Service()
export class ProjectService {
  public async getProjects(models: Database): Promise<Project[]> {
    const projects = await models.project.find();

    return projects.map((project) => {
      return {
        id: project.id.valueOf(),
        createdAt: project.createdAt.toString(),
        updatedAt: project.updatedAt.toString(),
        code: project.code ?? '',
        currentPublishedVersionId: project.currentPublishedVersionId
          ? project.currentPublishedVersionId.valueOf()
          : 0,
        creatorParticipantId: project.creatorParticipantId
          ? project.creatorParticipantId.valueOf()
          : 0,
        latestVersionId: project.latestVersionId
          ? project.latestVersionId.valueOf()
          : 0,
        implementationStatus: project.implementationStatus,
        pdf: 'null', // TODO: implement
        sourceProjectId: project.sourceProjectId
          ? project.sourceProjectId.valueOf()
          : 0,
        name: 'placeholder',
        version: 0,
        projectVersionCode: 'project version code placeholder',
        visible: true,
      };
    });
  }
}
