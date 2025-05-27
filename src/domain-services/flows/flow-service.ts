import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { splitIntoChunks } from '@unocha/hpc-api-core/src/util';
import { PG_MAX_QUERY_PARAMS } from '@unocha/hpc-api-core/src/util/consts';
import {
  createBrandedValue,
  getTableColumns,
} from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowObjectService } from '../flow-object/flow-object-service';
import type {
  FlowObject,
  FlowObjectFilterGrouped,
  FlowObjectType,
} from '../flow-object/model';
import { buildWhereConditionsForFlowObjectFilters } from '../flow-object/utils';
import { type FlowParkedParentSource } from './graphql/types';
import type {
  FlowInstance,
  FlowOrderByCond,
  FlowOrderByWithSubEntity,
  FlowWhere,
  IGetFlowsArgs,
  UniqueFlowEntity,
} from './model';
import { buildSearchFlowsConditions } from './strategy/impl/utils';
@Service()
export class FlowService {
  constructor(private readonly flowObjectService: FlowObjectService) {}

  async getFlows(args: IGetFlowsArgs): Promise<FlowInstance[]> {
    const { models, orderBy, conditions, limit, offset } = args;

    const distinctColumns: Array<keyof FlowInstance> = ['id', 'versionID'];

    if (orderBy) {
      distinctColumns.push(orderBy.column);
      distinctColumns.reverse();
    }

    const flows: FlowInstance[] = await models.flow.find({
      orderBy,
      where: conditions,
      distinct: distinctColumns,
      limit,
      offset,
    });

    return flows;
  }

  async getFlowIDsFromEntity(
    database: Database,
    orderBy: FlowOrderByWithSubEntity
  ): Promise<UniqueFlowEntity[]> {
    const entity = orderBy.subEntity ?? orderBy.entity;
    let columns: string[] = [];

    // Get the entity list
    // 'externalReference' is a special case
    // because it does have a direct relation with flow
    // and no direction
    if (entity === 'externalReference') {
      columns = getTableColumns(database.externalReference);
      if (!columns.includes(orderBy.column)) {
        throw new Error(
          `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
        );
      }

      const column = orderBy.column as keyof InstanceOfModel<
        Database['externalReference']
      >;
      const distinctColumns: Array<
        keyof InstanceOfModel<Database['externalReference']>
      > = [column, 'flowID', 'versionID'];

      const externalReferences = await database.externalReference.find({
        orderBy: { column, order: orderBy.order },
        distinct: distinctColumns,
      });

      const uniqueFlowEntities: UniqueFlowEntity[] = externalReferences.map(
        (externalReference) =>
          ({
            id: externalReference.flowID,
            versionID: externalReference.versionID,
          }) satisfies UniqueFlowEntity
      );

      return uniqueFlowEntities;
    }

    const refDirection = orderBy.direction ?? 'source';

    let entityIDsSorted: number[] = [];

    switch (entity) {
      case 'emergency': {
        columns = getTableColumns(database.emergency);
        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }

        // Get emergency entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['emergency']
        >;

        const orderByEmergency = { column, order: orderBy.order };

        const emergencies = await database.emergency.find({
          distinct: [column, 'id'],
          orderBy: orderByEmergency,
        });

        entityIDsSorted = emergencies.map((emergency) =>
          emergency.id.valueOf()
        );
        break;
      }
      case 'globalCluster': {
        columns = getTableColumns(database.globalCluster);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get globalCluster entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['globalCluster']
        >;
        const orderByGlobalCluster = { column, order: orderBy.order };

        const globalClusters = await database.globalCluster.find({
          distinct: [column, 'id'],
          orderBy: orderByGlobalCluster,
        });

        entityIDsSorted = globalClusters.map((globalCluster) =>
          globalCluster.id.valueOf()
        );
        break;
      }
      case 'governingEntity': {
        columns = getTableColumns(database.governingEntity);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get governingEntity entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['governingEntity']
        >;
        const orderByGoverningEntity = { column, order: orderBy.order };

        const governingEntities = await database.governingEntity.find({
          distinct: [column, 'id'],
          orderBy: orderByGoverningEntity,
        });

        entityIDsSorted = governingEntities.map((governingEntity) =>
          governingEntity.id.valueOf()
        );
        break;
      }
      case 'location': {
        columns = getTableColumns(database.location);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get location entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['location']
        >;
        const orderByLocation = { column, order: orderBy.order };

        const locations = await database.location.find({
          distinct: [column, 'id'],
          orderBy: orderByLocation,
        });

        entityIDsSorted = locations.map((location) => location.id.valueOf());
        break;
      }
      case 'organization': {
        columns = getTableColumns(database.organization);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get organization entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['organization']
        >;
        const orderByOrganization = { column, order: orderBy.order };

        const organizations = await database.organization.find({
          distinct: [column, 'id'],
          orderBy: orderByOrganization,
        });

        entityIDsSorted = organizations.map((organization) =>
          organization.id.valueOf()
        );
        break;
      }
      case 'plan': {
        columns = getTableColumns(database.plan);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get plan entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['plan']
        >;
        const orderByPlan = { column, order: orderBy.order };

        const plans = await database.plan.find({
          distinct: [column, 'id'],
          orderBy: orderByPlan,
        });

        entityIDsSorted = plans.map((plan) => plan.id.valueOf());
        break;
      }
      case 'project': {
        columns = getTableColumns(database.project);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get project entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['project']
        >;
        const orderByProject = { column, order: orderBy.order };

        const projects = await database.project.find({
          distinct: [column, 'id'],
          orderBy: orderByProject,
        });

        entityIDsSorted = projects.map((project) => project.id.valueOf());
        break;
      }
      case 'usageYear': {
        columns = getTableColumns(database.usageYear);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get usageYear entities sorted
        const column = orderBy.column as keyof InstanceOfModel<
          Database['usageYear']
        >;
        const orderByUsageYear = { column, order: orderBy.order };

        const usageYears = await database.usageYear.find({
          distinct: [column, 'id'],
          orderBy: orderByUsageYear,
        });

        entityIDsSorted = usageYears.map((usageYear) => usageYear.id.valueOf());
        break;
      }
      case 'planVersion': {
        columns = getTableColumns(database.planVersion);

        if (!columns.includes(orderBy.column)) {
          throw new Error(
            `Invalid column ${orderBy.column} to sort by in ${orderBy.entity}`
          );
        }
        // Get planVersion entities sorted
        // Collect fisrt part of the entity key by the fisrt Case letter
        const entityKey = `${
          entity.split(/[A-Z]/)[0]
        }Id` as keyof InstanceOfModel<Database['planVersion']>;

        const column = orderBy.column as keyof InstanceOfModel<
          Database['planVersion']
        >;
        const orderByPlanVersion = { column, order: orderBy.order };

        const planVersions = await database.planVersion.find({
          distinct: [column, entityKey],
          orderBy: orderByPlanVersion,
        });

        entityIDsSorted = planVersions.map((planVersion) =>
          planVersion.planId.valueOf()
        );
        break;
      }
      default: {
        throw new Error(`Invalid entity ${orderBy.entity} to sort by`);
      }
    }

    // After getting the sorted entityID list
    // we can now get the flowObjects
    const entityCondKey = orderBy.entity as unknown;
    const entityCondKeyFlowObjectType = entityCondKey as FlowObjectType;

    // Order map
    const orderMap = new Map<number, number>();
    for (const [index, entityID] of entityIDsSorted.entries()) {
      orderMap.set(entityID, index);
    }

    // Instead of doing a single query that may end up on a 'Memory Error'
    // we will do a progressive search
    // by chunks of PG_MAX_QUERY_PARAMS - 2 => ( (2 ** 16 - 1) - 2 = 65533 )
    const flowObjects = (
      await Promise.all(
        splitIntoChunks(entityIDsSorted, PG_MAX_QUERY_PARAMS - 2).map(
          (entityIds) =>
            database.flowObject.find({
              where: {
                objectType: entityCondKeyFlowObjectType,
                refDirection,
                objectID: {
                  [Op.IN]: entityIds,
                },
              },
              distinct: ['flowID', 'versionID'],
            })
        )
      )
    ).flat();

    // Then, we need to filter the results from the flowObject table
    // using the planVersions list as sorted reference
    // this is because we cannot apply the order of a given list
    // to the query directly
    const sortedFlowObjects = flowObjects
      .map((flowObject) => ({
        ...flowObject,
        sortingKey: orderMap.get(flowObject.objectID),
      }))
      .toSorted((a, b) => (a.sortingKey ?? 0) - (b.sortingKey ?? 0));
    return this.mapFlowsToUniqueFlowEntities(sortedFlowObjects);
  }

  private mapFlowsToUniqueFlowEntities(
    flowObjects: FlowObject[]
  ): UniqueFlowEntity[] {
    return flowObjects.map(
      (flowObject) =>
        ({
          id: flowObject.flowID,
          versionID: flowObject.versionID,
        }) satisfies UniqueFlowEntity
    );
  }

  async getParkedParents(
    flow: FlowInstance,
    flowLinkArray: Array<InstanceOfModel<Database['flowLink']>>,
    models: Database
  ): Promise<FlowParkedParentSource | null> {
    const flowLinksParentsIDs = flowLinkArray
      .filter(
        (flowLink) =>
          flowLink.parentID !== flow.id && flowLink.childID === flow.id
      )
      .map((flowLink) => flowLink.parentID.valueOf());

    if (flowLinksParentsIDs.length === 0) {
      return null;
    }
    const parkedCategory = await models.category.findOne({
      where: {
        group: 'flowType',
        name: 'Parked',
      },
    });

    const parentFlows: number[] = [];

    for (const flowLinkParentID of flowLinksParentsIDs) {
      const parkedParentCategoryRef = await models.categoryRef.find({
        where: {
          categoryID: parkedCategory?.id,
          versionID: flow.versionID,
          objectID: flowLinkParentID,
          objectType: 'flow',
        },
      });

      if (parkedParentCategoryRef && parkedParentCategoryRef.length > 0) {
        parentFlows.push(flowLinkParentID);
      }
    }

    const parkedParentFlowObjectsOrganizationSource: FlowObject[] = [];

    for (const parentFlow of parentFlows) {
      const parkedParentOrganizationFlowObject =
        await models.flowObject.findOne({
          where: {
            flowID: createBrandedValue(parentFlow),
            objectType: 'organization',
            refDirection: 'source',
            versionID: flow.versionID,
          },
        });

      if (parkedParentOrganizationFlowObject) {
        parkedParentFlowObjectsOrganizationSource.push(
          parkedParentOrganizationFlowObject
        );
      }
    }

    const parkedParentOrganizations = await models.organization.find({
      where: {
        id: {
          [Op.IN]: parkedParentFlowObjectsOrganizationSource.map((flowObject) =>
            createBrandedValue(flowObject?.objectID)
          ),
        },
      },
    });

    const mappedParkedParentOrganizations: FlowParkedParentSource = {
      organization: [],
      orgName: [],
      abbreviation: [],
    };

    for (const parkedParentOrganization of parkedParentOrganizations) {
      mappedParkedParentOrganizations.organization.push(
        parkedParentOrganization.id.valueOf()
      );
      mappedParkedParentOrganizations.orgName.push(
        parkedParentOrganization.name
      );
      mappedParkedParentOrganizations.abbreviation.push(
        parkedParentOrganization.abbreviation ?? ''
      );
    }

    return mappedParkedParentOrganizations;
  }

  async getParkedParentFlowsByFlowObjectFilter(
    models: Database,
    flowObjectFilters: FlowObjectFilterGrouped
  ): Promise<UniqueFlowEntity[]> {
    // 1. Retrieve the parked category
    const parkedCategory = await models.category.findOne({
      where: {
        name: 'Parked',
        group: 'flowType',
      },
    });
    if (!parkedCategory) {
      throw new Error('Parked category not found');
    }

    // 2. Get all category references for parked flows
    const categoryRefs = await models.categoryRef.find({
      where: {
        categoryID: parkedCategory.id,
        objectType: 'flow',
      },
      distinct: ['objectID', 'versionID'],
    });

    // Build list of parent IDs from categoryRefs
    const parentIDs: FlowId[] = categoryRefs.map((ref) =>
      createBrandedValue(ref.objectID)
    );

    // 3. Retrieve flow links where the parent is among those references and depth > 0
    const flowLinks = await models.flowLink.find({
      where: {
        depth: { [Op.GT]: 0 },
        parentID: { [Op.IN]: parentIDs },
      },
      distinct: ['parentID', 'childID'],
    });

    // Create a reference list of parent flows from the flow links
    const parentFlowsRef: UniqueFlowEntity[] = flowLinks.map((flowLink) => ({
      id: flowLink.parentID,
      versionID: null,
    }));

    // 4. Query parent flows progressively in chunks
    const parentFlows = await this.progresiveSearch(
      models,
      parentFlowsRef,
      PG_MAX_QUERY_PARAMS - 2, // Use a batch size of PG_MAX_QUERY_PARAMS - 2 to avoid hitting the limit
      0,
      false, // Do not stop on batch size
      [],
      { activeStatus: true }
    );

    // 5. Retrieve flow objects using the flow object filters
    const flowObjectsWhere =
      buildWhereConditionsForFlowObjectFilters(flowObjectFilters);
    const flowObjects = await this.flowObjectService.getFlowFromFlowObjects(
      models,
      flowObjectsWhere
    );

    // 6. Build a Set for flowObjects for fast lookup (using a composite key of id and versionID)
    const flowObjectsSet = new Set(
      flowObjects.map(
        (flowObject) => `${flowObject.id}|${flowObject.versionID}`
      )
    );

    // 7. Filter parent flows that are present in the flowObjects list
    const filteredParentFlows = parentFlows.filter((parentFlow) => {
      const key = `${parentFlow.id}|${parentFlow.versionID}`;
      return flowObjectsSet.has(key);
    });

    // 8. Build a Set of filtered parent flow IDs for quick membership checking
    const filteredParentFlowIds = new Set(
      filteredParentFlows.map((flow) => flow.id)
    );

    // 9. Extract child flow IDs from flowLinks where the parent is in the filtered set
    const childFlowsIDsSet = new Set<FlowId>();
    for (const flowLink of flowLinks) {
      if (filteredParentFlowIds.has(flowLink.parentID)) {
        childFlowsIDsSet.add(flowLink.childID);
      }
    }

    // 10. Retrieve child flows
    const childFlows = await models.flow.find({
      where: {
        activeStatus: true,
        id: { [Op.IN]: childFlowsIDsSet },
      },
      distinct: ['id', 'versionID'],
    });

    // 11. Map child flows to UniqueFlowEntity and return the result
    const result = childFlows.map((ref) => ({
      id: ref.id,
      versionID: ref.versionID,
    }));

    return result;
  }

  /**
   * This method progressively search the flows
   * accumulating the results in the flowResponse
   * until the limit is reached or there are no more flows
   * in the sortedFlows
   *
   * Since this is a recursive, the exit condition is when
   * the flowResponse length is equal to the limit
   * or the reducedFlows length is less than the limit after doing the search
   *
   * @param models
   * @param sortedFlows
   * @param limit
   * @param offset
   * @param orderBy
   * @param flowResponse
   * @returns list of flows
   */
  async progresiveSearch(
    models: Database,
    referenceFlowList: UniqueFlowEntity[],
    batchSize: number,
    offset: number,
    stopOnBatchSize: boolean,
    flowResponse: FlowInstance[],
    flowWhere?: FlowWhere,
    orderBy?: FlowOrderByCond
  ): Promise<FlowInstance[]> {
    const reducedFlows = referenceFlowList.slice(offset, offset + batchSize);

    const conditions = buildSearchFlowsConditions(reducedFlows, flowWhere);

    const flows = await this.getFlows({ models, conditions, orderBy });

    flowResponse.push(...flows);

    if (
      (stopOnBatchSize && flowResponse.length === batchSize) ||
      reducedFlows.length < batchSize
    ) {
      return flowResponse;
    }

    // Recursive call
    offset += batchSize;
    return await this.progresiveSearch(
      models,
      referenceFlowList,
      batchSize,
      offset,
      stopOnBatchSize,
      flowResponse,
      flowWhere,
      orderBy
    );
  }
}
