import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { BaseLocation } from './graphql/types';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { LocationId } from '@unocha/hpc-api-core/src/db/models/location';

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

  async getLocationsForFlows(
    locationsFO: InstanceDataOfModel<Database['flowObject']>[],
    models: Database
  ): Promise<Map<number, Set<BaseLocation>>> {
    const locationObjectsIDs: LocationId[] = locationsFO.map((locFO) =>
      createBrandedValue(locFO.objectID)
    );

    const locations: InstanceDataOfModel<Database['location']>[] =
      await models.location.find({
        where: {
          id: {
            [Op.IN]: locationObjectsIDs,
          },
        },
      });

    const locationsMap = new Map<number, Set<BaseLocation>>();

    locationsFO.forEach((locFO) => {
      const flowId = locFO.flowID;
      if (!locationsMap.has(flowId)) {
        locationsMap.set(flowId, new Set<BaseLocation>());
      }
      const location = locations.find((loc) => loc.id === locFO.objectID);

      if (!location) {
        throw new Error(`Location with ID ${locFO.objectID} does not exist`);
      }
      const locationMapped = this.mapLocationsToFlowLocations(location, locFO);
      locationsMap.get(flowId)!.add(locationMapped);
    });
    return locationsMap;
  }

  private mapLocationsToFlowLocations(
    location: InstanceDataOfModel<Database['location']>,
    locationFO: InstanceDataOfModel<Database['flowObject']>
  ) {
    return {
      id: location.id,
      name: location.name,
      direction: locationFO.refDirection,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }
}
