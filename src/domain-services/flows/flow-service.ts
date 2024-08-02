import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
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
  FlowOrderBy,
  FlowOrderByCond,
  FlowWhere,
  IGetFlowsArgs,
  UniqueFlowEntity,
} from './model';
import {
  buildSearchFlowsConditions,
  mapOrderByToEntityOrderBy,
} from './strategy/impl/utils';

@Service()
export class FlowService {
  constructor(private readonly flowObjectService: FlowObjectService) {}

  async getFlows(args: IGetFlowsArgs): Promise<FlowInstance[]> {
    const { models, orderBy, conditions, limit, offset } = args;

    const distinctColumns = [
      'id' as keyof FlowInstance,
      'versionID' as keyof FlowInstance,
    ];

    if (orderBy) {
      distinctColumns.push(orderBy.column as keyof FlowInstance);
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
    orderBy: FlowOrderBy
  ): Promise<UniqueFlowEntity[]> {
    const entity = orderBy.subEntity ?? orderBy.entity;
    // Get the entity list
    const mappedOrderBy = mapOrderByToEntityOrderBy(orderBy);
    // 'externalReference' is a special case
    // because it does have a direct relation with flow
    // and no direction
    if (entity === 'externalReference') {
      const column = mappedOrderBy.column as keyof InstanceOfModel<
        Database['externalReference']
      >;
      const externalReferences = await database.externalReference.find({
        orderBy: { column, order: orderBy.order },
        distinct: ['flowID', 'versionID'],
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

    // Validate the variable using io-ts

    let flowObjects = [];
    let entityIDsSorted: number[] = [];

    switch (entity) {
      case 'emergency': {
        // Get emergency entities sorted
        const emergencies = await database.emergency.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = emergencies.map((emergency) =>
          emergency.id.valueOf()
        );
        break;
      }
      case 'globalCluster': {
        // Get globalCluster entities sorted
        const globalClusters = await database.globalCluster.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = globalClusters.map((globalCluster) =>
          globalCluster.id.valueOf()
        );
        break;
      }
      case 'governingEntity': {
        // Get governingEntity entities sorted
        const governingEntities = await database.governingEntity.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = governingEntities.map((governingEntity) =>
          governingEntity.id.valueOf()
        );
        break;
      }
      case 'location': {
        // Get location entities sorted
        const locations = await database.location.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = locations.map((location) => location.id.valueOf());
        break;
      }
      case 'organization': {
        // Get organization entities sorted
        const organizations = await database.organization.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = organizations.map((organization) =>
          organization.id.valueOf()
        );
        break;
      }
      case 'plan': {
        // Get plan entities sorted
        const plans = await database.plan.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = plans.map((plan) => plan.id.valueOf());
        break;
      }
      case 'project': {
        // Get project entities sorted
        const projects = await database.project.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = projects.map((project) => project.id.valueOf());
        break;
      }
      case 'usageYear': {
        // Get usageYear entities sorted
        const usageYears = await database.usageYear.find({
          distinct: [mappedOrderBy.column, 'id'],
          orderBy: mappedOrderBy,
        });

        entityIDsSorted = usageYears.map((usageYear) => usageYear.id.valueOf());
        break;
      }
      case 'planVersion': {
        // Get planVersion entities sorted
        // Collect fisrt part of the entity key by the fisrt Case letter
        const entityKey = `${
          entity.split(/[A-Z]/)[0]
        }Id` as keyof InstanceOfModel<Database['planVersion']>;

        const planVersions = await database.planVersion.find({
          distinct: [mappedOrderBy.column, entityKey],
          orderBy: mappedOrderBy,
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

    flowObjects = await database.flowObject.find({
      where: {
        objectType: entityCondKeyFlowObjectType,
        refDirection,
        objectID: {
          [Op.IN]: entityIDsSorted,
        },
      },
      distinct: ['flowID', 'versionID'],
    });

    // Then, we need to filter the results from the flowObject table
    // using the planVersions list as sorted reference
    // this is because we cannot apply the order of a given list
    // to the query directly
    flowObjects = flowObjects
      .map((flowObject) => ({
        ...flowObject,
        sortingKey: entityIDsSorted.indexOf(flowObject.objectID.valueOf()),
      }))
      .sort((a, b) => a.sortingKey - b.sortingKey);

    return this.mapFlowsToUniqueFlowEntities(flowObjects);
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

  async getParketParents(
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
    const parkedCategory = await models.category.findOne({
      where: {
        name: 'Parked',
        group: 'flowType',
      },
    });

    if (!parkedCategory) {
      throw new Error('Parked category not found');
    }

    const categoryRefs = await models.categoryRef.find({
      where: {
        categoryID: parkedCategory.id,
        objectType: 'flow',
      },
      distinct: ['objectID', 'versionID'],
    });

    const flowLinks = await models.flowLink.find({
      where: {
        depth: {
          [Op.GT]: 0,
        },
        parentID: {
          [Op.IN]: categoryRefs.map((categoryRef) =>
            createBrandedValue(categoryRef.objectID)
          ),
        },
      },
      distinct: ['parentID', 'childID'],
    });

    const parentFlowsRef: UniqueFlowEntity[] = flowLinks.map((flowLink) => ({
      id: createBrandedValue(flowLink.parentID),
      versionID: null,
    }));

    // Since this list can be really large in size: ~42k flow links
    // This can cause a performance issue when querying the database
    // and even end up with a error like:
    // could not resize shared memory segment \"/PostgreSQL.2154039724\"
    // to 53727360 bytes: No space left on device

    // We need to do this query by chunks
    const parentFlows = await this.progresiveSearch(
      models,
      parentFlowsRef,
      1000,
      0,
      false, // Stop on batch size
      [],
      { activeStatus: true }
    );

    const flowObjectsWhere =
      buildWhereConditionsForFlowObjectFilters(flowObjectFilters);

    const flowObjects = await this.flowObjectService.getFlowFromFlowObjects(
      models,
      flowObjectsWhere
    );

    // Once we get the flowObjects - we need to keep only those that are present in both lists
    const filteredParentFlows = parentFlows.filter((parentFlow) =>
      flowObjects.some(
        (flowObject) =>
          flowObject.id === parentFlow.id &&
          flowObject.versionID === parentFlow.versionID
      )
    );

    // Once we have the ParentFlows whose status are 'parked'
    // We keep look for the flowLinks of those flows to obtain the child flows
    // that are linked to them
    const childFlowsIDs: FlowId[] = [];
    for (const flowLink of flowLinks) {
      if (
        filteredParentFlows.some(
          (parentFlow) => parentFlow.id === flowLink.parentID
        )
      ) {
        childFlowsIDs.push(flowLink.childID);
      }
    }

    const childFlows = await models.flow.find({
      where: {
        deletedAt: null,
        activeStatus: true,
        id: {
          [Op.IN]: childFlowsIDs,
        },
      },
      distinct: ['id', 'versionID'],
    });

    // Once we have the child flows, we need to filter them
    // using the flowObjectFilters
    // This search needs to be also done by chunks
    return childFlows.map((ref) => ({
      id: createBrandedValue(ref.id),
      versionID: ref.versionID,
    }));
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
