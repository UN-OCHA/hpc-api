import { Service } from 'typedi';
import { DbModels } from '../../data-providers/postgres/models';
import { LocationTable } from '../../data-providers/postgres/models/location';

@Service()
export class LocationService {
  async findById(
    models: DbModels,
    id: number
  ): Promise<LocationTable | undefined> {
    const location = await models.location.getOne(id);

    if (location[0] === undefined) {
      throw new Error(`Location with ID ${id} does not exist`);
    }

    return location[0];
  }

  async search(models: DbModels, name: string): Promise<LocationTable[]> {
    return await models.location.getAllILike('name', name);
  }
}
