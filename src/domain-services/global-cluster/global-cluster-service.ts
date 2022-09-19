import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class GlobalClusterService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['globalCluster']>> {
    const globalCluster = await models.globalCluster.get(
      createBrandedValue(id)
    );

    if (!globalCluster) {
      throw new Error(`Global cluster with ID ${id} does not exist`);
    }

    return globalCluster;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<InstanceDataOfModel<Database['globalCluster']>[]> {
    return await models.globalCluster.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });
  }
}
