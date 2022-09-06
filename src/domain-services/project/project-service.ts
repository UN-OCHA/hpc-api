import { ProjectId } from '@unocha/hpc-api-core/src/db/models/project';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class ProjectService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['project']>> {
    const project = await models.project.get(createBrandedValue(id));

    if (!project) {
      throw new Error(`Project with ID ${id} does not exist`);
    }

    return project;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<{ id: ProjectId; name?: string | null }[]> {
    const projects = await models.project.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });

    const currentProjectVersions = await models.projectVersion.find({
      where: {
        projectId: {
          [models.Op.IN]: projects.map((p) =>
            createBrandedValue(p.currentPublishedVersionId)
          ),
        },
      },
    });

    return currentProjectVersions.map((pv) => ({
      id: pv.projectId,
      name: pv.name,
    }));
  }
}
