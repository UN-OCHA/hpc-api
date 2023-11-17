import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class EmergencyService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['emergency']>> {
    const emergency = await models.emergency.get(createBrandedValue(id));

    if (!emergency) {
      throw new Error(`Governing entity with ID ${id} does not exist`);
    }

    return emergency;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<InstanceDataOfModel<Database['emergency']>[]> {
    return await models.emergency.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });
  }
}
