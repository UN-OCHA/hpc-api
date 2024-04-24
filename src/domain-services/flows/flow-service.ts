import { type Database } from '@unocha/hpc-api-core/src/db';
import { FLOW_OBJECT_TYPE_TYPE } from '@unocha/hpc-api-core/src/db/models/flowObjectType';
import {
  Op,
  prepareCondition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
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
import {
  applySearchFilters,
  mapOrderByToEntityOrderBy,
} from './strategy/impl/utils';

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
    const { databaseConnection, orderBy, conditions, whereClauses } = args;

    let query = databaseConnection!
      .queryBuilder()
      .distinct('id', 'versionID', orderBy.column) // Include orderBy.column in the distinct selection
      .from('flow')
      .whereNull('deletedAt');
    if (orderBy.raw) {
      query = query.orderByRaw(orderBy.raw);
    } else {
      query = query.orderBy(orderBy.column, orderBy.order);
    }

    if (conditions) {
      query = applySearchFilters(query, conditions);
    }
    if (whereClauses) {
      query = query.andWhere(prepareCondition(whereClauses));
    }

    const flows = await query;
    const mapFlowsToUniqueFlowEntities = flows.map((flow) => ({
      id: flow.id,
      versionID: flow.versionID,
    }));

    return mapFlowsToUniqueFlowEntities;
  }

  async getFlowsRaw(
    databaseConnection: Knex,
    whereClauses: FlowWhere,
    orderBy: FlowOrderByCond | null
  ): Promise<FlowInstance[]> {
    let query = databaseConnection!
      .queryBuilder()
      .select('*')
      .from('flow')
      .whereNull('deletedAt');

    if (orderBy?.raw) {
      query = query.orderByRaw(orderBy.raw);
    } else if (orderBy?.order) {
      query = query.orderBy(orderBy.column, orderBy.order);
    }

    if (whereClauses) {
      query = query.andWhere(prepareCondition(whereClauses));
    }

    const flows: FlowInstance[] = await query;

    return flows;
  }

  async getFlowsCount(databaseConnection: Knex, conditions: FlowWhere) {
    // Since this is the only place where we need to use the count method
    // Instead of implementing on the models, we can use the queryBuilder directly
    // Why use the count method? Because it's faster than fetching all the data
    // and since we are filtering and paginating it makes no sense to fetch all the data
    // just to do the count - this approach is faster and more efficient
    const query = databaseConnection
      .queryBuilder()
      .count('*')
      .from('flow')
      .where(prepareCondition(conditions));

    const [{ count }] = await query;

    return Number(count);
  }

  async getFlowIDsFromEntity(
    dbConnection: Knex,
    orderBy: FlowOrderBy
  ): Promise<UniqueFlowEntity[]> {
    const entity = orderBy.subEntity ?? orderBy.entity;
    // Get the entity list
    const mappedOrderBy = mapOrderByToEntityOrderBy(orderBy);
    const orderByRaw = `"${mappedOrderBy.column}" ${mappedOrderBy.order} nulls last`;

    // 'externalReference' is a special case
    // because it does have a direct relation with flow
    // and no direction
    if (entity === 'externalReference') {
      const entityList = await dbConnection
        .queryBuilder()
        .distinct('flowID', 'versionID', mappedOrderBy.column)
        .from('externalReference')
        .orderByRaw(orderByRaw);

      return this.processFlowIDs(entityList);
    }

    // Get the flowIDs from the entity list
    // using the flow-object relation if the entity is a flow-object
    const entityCondKey = orderBy.entity as unknown;

    const refDirection = orderBy.direction ?? 'source';

    // Validate the variable using io-ts
    const result = FLOW_OBJECT_TYPE_TYPE.decode(entityCondKey);
    const entityCondKeyFlowObjectType = entityCondKey as FlowObjectType;

    let joinQuery = dbConnection
      .queryBuilder()
      .distinct('flowObject.flowID', 'flowObject.versionID')
      .from('flowObject');

    if (result._tag === 'Right') {
      joinQuery = joinQuery
        .join(entity, 'flowObject.objectID', `${entity}.id`)
        .select(`${entity}.${mappedOrderBy.column}`) // This is needed since we must select the column to order by
        .where('flowObject.objectType', entityCondKeyFlowObjectType)
        .andWhere('flowObject.refDirection', refDirection)
        .orderByRaw(orderByRaw);
    } else {
      // Collect fisrt part of the entity key by the fisrt Case letter
      const entityKey = entity.slice(0, entity.search(/[A-Z]/));
      joinQuery = joinQuery
        .join(
          orderBy.entity,
          'flowObject.objectID',
          `${orderBy.entity}.${entityKey}Id`
        )
        .select(`${orderBy.entity}.${mappedOrderBy.column}`) // This is needed since we must select the column to order by
        .where('flowObject.objectType', entityKey)
        .andWhere('flowObject.refDirection', refDirection)
        .orderByRaw(orderByRaw);
    }

    const flowIDs = await joinQuery;
    return this.processFlowIDs(flowIDs);
  }

  private processFlowIDs(flowObjecst: FlowObject[]) {
    const mapFlowsToUniqueFlowEntities = flowObjecst.map((flowObject) => ({
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
