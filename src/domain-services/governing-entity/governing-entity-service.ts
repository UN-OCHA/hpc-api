import { GoverningEntityId } from '@unocha/hpc-api-core/src/db/models/governingEntity';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class GoverningEntityService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['governingEntity']>> {
    const governingEntity = await models.governingEntity.get(
      createBrandedValue(id)
    );

    if (!governingEntity) {
      throw new Error(`Governing entity with ID ${id} does not exist`);
    }

    return governingEntity;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<{ id: GoverningEntityId; name?: string | null }[]> {
    const governingEntities = await models.governingEntity.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });

    const currentGoverningEntityVersions =
      await models.governingEntityVersion.find({
        where: {
          governingEntityId: {
            [models.Op.IN]: governingEntities.map((p) => p.id),
          },
          currentVersion: true,
        },
      });

    return currentGoverningEntityVersions.map((gev) => ({
      id: gev.governingEntityId,
      name: gev.name,
    }));
  }
}
