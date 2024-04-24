import { type Database } from '@unocha/hpc-api-core/src/db';
import {
  Op,
  prepareCondition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import type Knex from 'knex';
import { Service } from 'typedi';
import { FlowObjectType, type FlowObject } from '../flow-object/model';
import { type FlowParkedParentSource } from './graphql/types';
import {
  type FlowEntity,
  type FlowOrderBy,
  type GetFlowsArgs,
  type UniqueFlowEntity,
} from './model';
import {
  applySearchFilters,
  mapFlowOrderBy,
  removeDuplicatesUniqueFlowEntities,
} from './strategy/impl/utils';

@Service()
export class FlowService {
  constructor() {}

  async getFlows(args: GetFlowsArgs) {
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
    args: GetFlowsArgs
  ): Promise<UniqueFlowEntity[]> {
    const { databaseConnection, orderBy, conditions, whereClauses } = args;

    let query = databaseConnection!
      .queryBuilder()
      .distinct('id', 'versionID', orderBy.column) // Include orderBy.column in the distinct selection
      .from('flow')
      .whereNull('deletedAt');
    if (orderBy.raw) {
      query = query.orderByRaw(orderBy.raw);
    } else if (orderBy.entity !== 'flow') {
      query = query.orderBy('id', orderBy.order);
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

  async getFlowsRaw(args: GetFlowsArgs): Promise<FlowEntity[]> {
    const {
      databaseConnection,
      orderBy,
      offset,
      limit,
      conditions,
      whereClauses,
    } = args;

    let query = databaseConnection!
      .queryBuilder()
      .select('*')
      .from('flow')
      .whereNull('deletedAt');
    if (orderBy.raw) {
      query = query.orderByRaw(orderBy.raw);
    } else if (orderBy.entity !== 'flow') {
      query = query.orderBy('id', orderBy.order);
    } else {
      query = query.orderBy(orderBy.column, orderBy.order);
    }

    if (conditions) {
      query = applySearchFilters(query, conditions);
    }
    if (whereClauses) {
      query = query.andWhere(prepareCondition(whereClauses));
    }

    // Because this list can be really large (+330K entries), we need to split it in chunks
    // Using limit and offset as cursors
    const databaseParsingLimit = 10_000;
    if (limit && offset) {
      query = query.limit(databaseParsingLimit + offset).offset(offset);
    } else if (limit) {
      query = query.limit(limit + databaseParsingLimit);
    }

    const flows: FlowEntity[] = await query;

    return flows;
  }

  async getFlowsCount(databaseConnection: Knex, conditions: any) {
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
    const mappedOrderBy = mapFlowOrderBy(orderBy);

    // 'externalReference' is a special case
    // because it does have a direct relation with flow
    // and no direction
    if (entity === 'externalReference') {
      const entityList = await dbConnection
        .queryBuilder()
        .select('flowID', 'versionID')
        .from('externalReference')
        .orderBy(mappedOrderBy.column, mappedOrderBy.order)
        .orderBy('flowID', orderBy.order);

      return this.processFlowIDs(entityList);
    }

    // Get the flowIDs from the entity list
    // using the flow-object relation if the entity is a flow-object
    const entityCondKey = orderBy.entity as unknown;

    const refDirection = orderBy.direction ?? 'source';

    // Validate the variable using io-ts
    const result = FlowObjectType.decode(entityCondKey);

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
        .orderBy(mappedOrderBy.column, mappedOrderBy.order);
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
        .orderBy(mappedOrderBy.column, mappedOrderBy.order);
    }

    const flowIDs = await joinQuery;
    return this.processFlowIDs(flowIDs);
  }

  private processFlowIDs(flowObjecst: FlowObject[]) {
    const mapFlowsToUniqueFlowEntities = flowObjecst.map((flowObject) => ({
      id: flowObject.flowID,
      versionID: flowObject.versionID,
    }));

    return removeDuplicatesUniqueFlowEntities(mapFlowsToUniqueFlowEntities);
  }

  async getParketParents(
    flow: FlowEntity,
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
            createBrandedValue((flowObject as FlowObject)?.objectID)
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
}
