import { type LocationId } from '@unocha/hpc-api-core/src/db/models/location';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type BaseLocation } from './graphql/types';

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
    locationsFO: Array<InstanceDataOfModel<Database['flowObject']>>,
    models: Database
  ): Promise<Map<number, BaseLocation[]>> {
    const locationObjectsIDs: LocationId[] = locationsFO.map((locFO) =>
      createBrandedValue(locFO.objectID)
    );

    const locations: Array<InstanceDataOfModel<Database['location']>> =
      await models.location.find({
        where: {
          id: {
            [Op.IN]: locationObjectsIDs,
          },
        },
      });

    const locationsMap = new Map<number, BaseLocation[]>();

    for (const locFO of locationsFO) {
      const flowId = locFO.flowID;
      if (!locationsMap.has(flowId)) {
        locationsMap.set(flowId, []);
      }
      const location = locations.find((loc) => loc.id === locFO.objectID);

      if (location) {
        const locationsPerFlow = locationsMap.get(flowId)!;
        if (
          !locationsPerFlow.some(
            (loc) =>
              loc.id === location.id && loc.direction === locFO.refDirection
          )
        ) {
          const locationMapped = this.mapLocationsToFlowLocations(
            location,
            locFO
          );
          locationsPerFlow.push(locationMapped);
        }
      }
    }
    return locationsMap;
  }

  private mapLocationsToFlowLocations(
    location: InstanceDataOfModel<Database['location']>,
    locationFO: InstanceDataOfModel<Database['flowObject']>
  ): BaseLocation {
    return {
      id: location.id,
      name: location.name,
      direction: locationFO.refDirection,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
      adminLevel: location.adminLevel,
      latitude: location.latitude,
      longitude: location.longitude,
      parentId: location.parentId,
      iso3: location.iso3,
      status: location.status,
      validOn: location.validOn,
      itosSync: location.itosSync,
      pcode: location.pcode,
    };
  }
}
