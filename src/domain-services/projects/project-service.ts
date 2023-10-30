import { Database } from '@unocha/hpc-api-core/src/db';
import { Service } from 'typedi';
import Project, { Pdf, mapPdfModelToType } from './graphql/types';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

@Service()
export class ProjectService {
  public async getProjects(
    models: Database,
    autocomplete?: string
  ): Promise<Project[]> {
    let whereClause = {};
    let limitClause;
    if (autocomplete) {
      whereClause = {
        name: {
          [Op.LIKE]: `%${autocomplete}%`,
        },
      };
    } else {
      limitClause = 100;
    }

    const findOptions = {
      where: whereClause,
      order: [['name', 'ASC']],
      limit: limitClause,
    };
    const projectsVersion = await models.projectVersion.find(findOptions);

    const projects: Project[] = [];
    await Promise.all(
      projectsVersion.map(async (projectVersion) => {
        console.log(JSON.stringify(projectVersion, null, 2));
        const projectDB = await models.project.findOne({
          where: {
            id: projectVersion.projectId,
          },
        });

        if (projectDB) {
          const pdf: Pdf | null = mapPdfModelToType(projectDB.pdf);

          const project: Project = {
            id: projectDB.id.valueOf(),
            createdAt: projectDB.createdAt.toString(),
            updatedAt: projectDB.updatedAt.toString(),
            code: projectDB.code ?? '',
            currentPublishedVersionId: projectDB.currentPublishedVersionId
              ? projectDB.currentPublishedVersionId.valueOf()
              : 0,
            creatorParticipantId: projectDB.creatorParticipantId
              ? projectDB.creatorParticipantId.valueOf()
              : 0,
            latestVersionId: projectDB.latestVersionId
              ? projectDB.latestVersionId.valueOf()
              : 0,
            implementationStatus: projectDB.implementationStatus,
            pdf: pdf,
            sourceProjectId: projectVersion.id.valueOf(),
            name: projectVersion.name,
            version: projectVersion.version,
            projectVersionCode: projectVersion.code,
            visible: projectDB.currentPublishedVersionId ? true : false,
          };

          projects.push(project);
        }
      })
    );

    return projects;
  }
}
