import { type Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import type Knex from 'knex';
import { Service } from 'typedi';
import { CategoryService } from '../categories/category-service';
import type {
  FlowObject,
  FlowObjectFilterGrouped,
  FlowObjectType,
} from '../flow-object/model';
import { buildJoinQueryForFlowObjectFilters } from '../flow-object/utils';
import { type FlowParkedParentSource } from './graphql/types';
import type {
  FlowInstance,
  FlowOrderBy,
  FlowOrderByCond,
  FlowWhere,
  IGetFlowsArgs,
  IGetUniqueFlowsArgs,
  UniqueFlowEntity,
} from './model';
import { mapOrderByToEntityOrderBy } from './strategy/impl/utils';

@Service()
export class FlowService {
  constructor(private readonly categoryService: CategoryService) {}

  async getFlows(args: IGetFlowsArgs) {
    const { models, conditions, offset, orderBy, limit } = args;

    if (!models) {
      throw new Error('Models not available');
    }

    return await models.flow.find({
      orderBy,
      limit,
      where: conditions,
      offset,
    });
  }

  async getFlowsAsUniqueFlowEntity(
    args: IGetUniqueFlowsArgs
  ): Promise<UniqueFlowEntity[]> {
    const { models, orderBy, conditions, whereClauses } = args;

    const flows = await models.flow.find({
      orderBy,
      where: { ...conditions, ...whereClauses },
      distinct: [orderBy.column, 'id', 'versionID'],
    });

    const mapFlowsToUniqueFlowEntities = flows.map((flow) => ({
      id: flow.id,
      versionID: flow.versionID,
    }));

    return mapFlowsToUniqueFlowEntities;
  }

  async getFlowsRaw(
    models: Database,
    whereClauses: FlowWhere,
    orderBy: FlowOrderByCond
  ): Promise<FlowInstance[]> {
    const flows: FlowInstance[] = await models.flow.find({
      orderBy,
      where: whereClauses,
      distinct: [orderBy?.column, 'id', 'versionID'],
    });

    return flows;
  }

  async getFlowsCount(models: Database, conditions: FlowWhere) {
    return await models.flow.count({
      where: conditions,
    });
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
        orderBy: { column, order: orderBy.order, nulls: 'last' },
        distinct: ['flowID', 'versionID'],
      });

      const uniqueFlowEntities: UniqueFlowEntity[] = externalReferences.map(
        (externalReference) =>
          ({
            id: externalReference.flowID,
            versionID: externalReference.versionID ?? 1, // Default to 1 if versionID
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

    return this.processFlowIDs(flowObjects);
  }

  private processFlowIDs(flowObjects: FlowObject[]) {
    const mapFlowsToUniqueFlowEntities = flowObjects.map((flowObject) => ({
      id: flowObject.flowID,
      versionID: flowObject.versionID,
    }));

    return mapFlowsToUniqueFlowEntities;
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
    databaseConnection: Knex,
    flowObjectFilters: FlowObjectFilterGrouped
  ): Promise<UniqueFlowEntity[]> {
    const parkedCategory = await this.categoryService.findCategories(models, {
      name: 'Parked',
      group: 'flowType',
    });

    if (parkedCategory.length === 0) {
      throw new Error('Pending category not found');
    }
    if (parkedCategory.length > 1) {
      throw new Error('Multiple pending categories found');
    }

    const pendingCategoryID = parkedCategory[0].id;

    let query = databaseConnection
      .queryBuilder()
      .select('fChild.id', 'fChild.versionID')
      .from('categoryRef as cr')
      .where('cr.categoryID', pendingCategoryID)
      .andWhere('cr.objectType', 'flow')
      // Flow link join + where
      .innerJoin('flowLink as fl', function () {
        this.on('fl.parentID', '=', 'cr.objectID');
      })
      .where('fl.depth', '>', 0)
      // Flow parent join + where
      .innerJoin('flow as fParent', function () {
        this.on('cr.objectID', '=', 'fParent.id').andOn(
          'cr.versionID',
          '=',
          'fParent.versionID'
        );
      })
      .where('fParent.deletedAt', null)
      .andWhere('fParent.activeStatus', true)
      // Flow child join + where
      .innerJoin('flow as fChild', function () {
        this.on('fl.childID', '=', 'fChild.id');
      })
      .where('fChild.deletedAt', null)
      .andWhere('fChild.activeStatus', true);
    // Flow object join + where
    query = buildJoinQueryForFlowObjectFilters(
      query,
      flowObjectFilters,
      'fParent'
    );

    const childsOfParkedParents = await query;
    const mappedChildsOfParkedParents = childsOfParkedParents.map((child) => ({
      id: child.id,
      versionID: child.versionID,
    }));
    return mappedChildsOfParkedParents;
  }
}
