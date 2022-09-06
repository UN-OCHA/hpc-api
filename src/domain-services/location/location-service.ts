import { Database } from '@unocha/hpc-api-core/src/db/type';
import { Service } from 'typedi';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';

@Service()
export class LocationService {
  async findById(
    models: Database,
    id: number
  ): Promise<InstanceDataOfModel<Database['location']>> {
    const location = await models.location.get(createBrandedValue(id));

    if (!location) {
      throw new Error(`Location with ID ${id} does not exist`);
    }

    return location;
  }

  async findByIds(
    models: Database,
    ids: number[]
  ): Promise<InstanceDataOfModel<Database['location']>[]> {
    return await models.location.find({
      where: {
        id: {
          [models.Op.IN]: ids.map((id) => createBrandedValue(id)),
        },
      },
    });
  }

  async search(
    models: Database,
    name: string
  ): Promise<InstanceDataOfModel<Database['location']>[]> {
    return await models.location.find({
      where: { name: { [models.Op.ILIKE]: `%${name}%` } },
    });
  }
}
