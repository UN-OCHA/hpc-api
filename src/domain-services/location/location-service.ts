import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowLocation } from '../flows/graphql/types';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

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

  async search(
    models: Database,
    name: string
  ): Promise<Array<InstanceDataOfModel<Database['location']>>> {
    return await models.location.find({
      where: { name: { [models.Op.ILIKE]: `%${name}%` } },
    });
  }

  async getFlowObjectLocations(
    locationsFO: any[],
    models: Database
  ): Promise<FlowLocation[]> {
    const locations = await models.location.find({
      where: {
        id: {
          [Op.IN]: locationsFO.map((locFO) => locFO.objectID),
        },
      },
    });

    return locations.map((loc) => ({
      id: loc.id.valueOf(),
      name: loc.name!,
    }));
  }
}
