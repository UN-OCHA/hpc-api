import { Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import Project, { Pdf, mapPdfModelToType } from './graphql/types';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';

@Service()
export class ProjectService {
  public async getProjects(models: Database): Promise<Project[]> {
    const projects = await models.project.find();

    return await Promise.all(
      projects.map(async (project) => {
        let projectVersion = null;

        if (project.sourceProjectId) {
          const projectVersionIdBranded = createBrandedValue(
            project.sourceProjectId?.valueOf()
          );

          projectVersion = await models.projectVersion.findOne({
            where: {
              id: projectVersionIdBranded,
            },
          });
        }

        const pdf: Pdf | null = mapPdfModelToType(project.pdf);

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
          pdf: pdf,
          sourceProjectId: project.sourceProjectId
            ? project.sourceProjectId.valueOf()
            : 0,
          name: projectVersion ? projectVersion.name : 'none',
          version: projectVersion ? projectVersion.version : 0,
          projectVersionCode: projectVersion ? projectVersion.code : 'none',
          visible: project.currentPublishedVersionId ? true : false,
        };
      })
    );
  }
}
