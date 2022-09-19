import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { groupBy } from 'lodash';
import { Service } from 'typedi';
import Context from '../Context';
import { EmergencyService } from '../emergency/emergency-service';
import { GlobalClusterService } from '../global-cluster/global-cluster-service';
import { GoverningEntityService } from '../governing-entity/governing-entity-service';
import { LocationService } from '../location/location-service';
import { OrganizationService } from '../organization/organization-service';
import { PlanService } from '../plans/plan-service';
import { ProjectService } from '../project/project-service';
import { UsageYearService } from '../usage-year/usage-year-service';

@Service()
export class FlowObjectService {
  constructor(
    private emergencyService: EmergencyService,
    private globalClusterService: GlobalClusterService,
    private governingEntityService: GoverningEntityService,
    private locationService: LocationService,
    private projectService: ProjectService,
    private planService: PlanService,
    private organizationService: OrganizationService,
    private usageYearService: UsageYearService
  ) {}

  async getFlowIdsFromFlowObjects(
    models: Database,
    where: any
  ): Promise<FlowId[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    // Keep only not duplicated flowIDs
    return [...new Set(flowObjects.map((flowObject) => flowObject.flowID))];
  }

  async getFlowObjectByFlowId(models: Database, flowIds: FlowId[]) {
    return await models.flowObject.find({
      where: {
        flowID: {
          [Op.IN]: flowIds,
        },
      },
    });
  }

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
          if (type === 'emergency') {
            return [
              'emergencies',
              await this.emergencyService.findByIds(
                context.models,
                flowObjects.map((fo) => fo.objectID)
              ),
            ];
          }
          if (type === 'globalCluster') {
            return [
              'globalClusters',
              await this.globalClusterService.findByIds(
                context.models,
                flowObjects.map((fo) => fo.objectID)
              ),
            ];
          }
          if (type === 'governingEntity') {
            return [
              'governingEntities',
              await this.governingEntityService.findByIds(
                context.models,
                flowObjects.map((fo) => fo.objectID)
              ),
            ];
          }
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
          if (type === 'project') {
            return [
              'projects',
              await this.projectService.findByIds(
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
