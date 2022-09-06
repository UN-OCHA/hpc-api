import { Database } from '@unocha/hpc-api-core/src/db/type';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { groupBy } from 'lodash';
import { Service } from 'typedi';
import Context from '../Context';
import { LocationService } from '../location/location-service';
import { OrganizationService } from '../organization/organization-service';
import { PlanService } from '../plans/plan-service';
import { UsageYearService } from '../usage-year/usage-year-service';

@Service()
export class FlowObjectService {
  constructor(
    private locationService: LocationService,
    private planService: PlanService,
    private organizationService: OrganizationService,
    private usageYearService: UsageYearService
  ) {}

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
          if (type === 'organization' || type === 'anonymizedOrganization') {
            return [
              `${type}s`,
              await this.organizationService.findByIds(
                context.models,
                flowObjects.map((fo) => fo.objectID)
              ),
            ];
          }
          if (type === 'usageYear') {
            return [
              'usageYears',
              await this.usageYearService.findByIds(
                context.models,
                flowObjects.map((fo) => fo.objectID)
              ),
            ];
          }
          if (type === 'plan') {
            return [
              'plans',
              await this.planService.findByIds(
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
