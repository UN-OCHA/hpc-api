import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { groupBy } from 'lodash';
import { Service } from 'typedi';
import Context from '../Context';
import { LocationService } from '../location/location-service';

@Service()
export class FlowObjectService {
  constructor(private locationService: LocationService) {}

  async findByFlowId(
    models: Database,
    flowId: number
  ): Promise<InstanceDataOfModel<Database['flowObject']>[]> {
    return await models.flowObject.find({
      where: {
        flowID: createBrandedValue(flowId),
      },
    });
  }

  async groupByObjectType(
    context: Context,
    flowObjects: InstanceDataOfModel<Database['flowObject']>[]
  ) {
    const typedObjects = await Promise.all(
      Object.entries(groupBy(flowObjects, 'objectType')).map(
        async ([type, flowObjects]) => {
          if (type === 'location') {
            return [
              'locations',
              await this.locationService.findByIds(
                context.models,
                flowObjects.map((fo) => fo.objectID)
              ),
            ];
          }

          return [];
        }
      )
    );
    return Object.fromEntries(typedObjects);
  }
}
