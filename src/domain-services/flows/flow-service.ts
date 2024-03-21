import { type Database } from '@unocha/hpc-api-core/src/db/type';
import type Knex from 'knex';
import { Service } from 'typedi';
import { FlowObjectType, type FlowObject } from '../flow-object/model';
import {
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

    return await models!.flow.find({
      orderBy,
      limit,
      where: conditions,
      offset,
    });
  }

  async getFlowsAsUniqueFlowEntity(
    args: GetFlowsArgs
  ): Promise<UniqueFlowEntity[]> {
    const { databaseConnection, orderBy, conditions, offset, limit } = args;

    let query = databaseConnection!
      .queryBuilder()
      .distinct('id', 'versionID', orderBy.column) // Include orderBy.column in the distinct selection
      .from('flow')
      .whereNull('deletedAt')
      .orderBy(orderBy.column, orderBy.order);

    if (conditions) {
      query = applySearchFilters(query, conditions);
    }

    // Because this list can be really large (+330K entries), we need to split it in chunks
    // Using limit and offset as cursors
    const databaseParsingLimit = 10_000;
    if (limit && offset) {
      query = query.limit(databaseParsingLimit + offset).offset(offset);
    } else if (limit) {
      query = query.limit(limit + databaseParsingLimit);
    }

    const flows = await query;

    const mapFlowsToUniqueFlowEntities = flows.map((flow) => ({
      id: flow.id,
      versionID: flow.versionID,
    }));

    return mapFlowsToUniqueFlowEntities;
  }

  async getFlowsCount(models: Database, conditions: any) {
    return await models.flow.count({ where: conditions });
  }

  async getFlowIDsFromEntity(
    models: Database,
    dbConnection: Knex,
    orderBy: FlowOrderBy,
    limit?: number,
    offset?: number
  ): Promise<UniqueFlowEntity[]> {
    const entity = orderBy.subEntity ?? orderBy.entity;

    // Get the entity list
    const mappedOrderBy = mapFlowOrderBy(orderBy);

    // externalReference is a special case
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

    // Validate the variable using io-ts
    const result = FlowObjectType.decode(entityCondKey);

    // Define list of entities
    let entityIDsList: number[] = [];

    if (result._tag === 'Right') {
      const entityList = await dbConnection
        .queryBuilder()
        .select('id')
        .from(entity)
        .orderBy(mappedOrderBy.column, mappedOrderBy.order);

      entityIDsList = entityList.map((entity) => entity.id);
    } else {
      // Collect fisrt part of the entity key by the fisrt Case letter
      const entityKey = entity.slice(0, entity.search(/[A-Z]/));

      // First get the enity list
      const planVersionList = await dbConnection
        .queryBuilder()
        .select(`${entityKey}Id`)
        .from(orderBy.entity)
        .orderBy(mappedOrderBy.column, mappedOrderBy.order);

      entityIDsList = planVersionList.map((plan) => plan.planId);
    }

    // Because this list can be really large (+160K entries), we need to split it in chunks
    // Using limit and offset as cursors
    const databaseParsingLimit = 10_000;
    if (limit && offset) {
      entityIDsList = entityIDsList.slice(
        offset,
        offset + databaseParsingLimit
      );
    } else if (limit) {
      entityIDsList = entityIDsList.slice(0, limit + databaseParsingLimit);
    }

    const entityCondKeyFlowObjectType = entityCondKey as FlowObjectType;
    let query = dbConnection
      .queryBuilder()
      .select('flowID', 'versionID')
      .from('flowObject')
      .whereIn('objectID', entityIDsList)
      .andWhere('objectType', entityCondKeyFlowObjectType);

    if (orderBy.direction) {
      query = query.andWhere('refDirection', orderBy.direction);
    }
    query = query
      .orderByRaw(
        `array_position(ARRAY[${entityIDsList.join(',')}], "objectID")`
      )
      .orderBy('flowID', orderBy.order);

    if (limit) {
      query.limit(limit);
    }
    if (offset) {
      query.offset(offset);
    }

    const flowIDs = await query;

    return this.processFlowIDs(flowIDs);
  }

  private processFlowIDs(flowObjecst: FlowObject[]) {
    const mapFlowsToUniqueFlowEntities = flowObjecst.map((flowObject) => ({
      id: flowObject.flowID,
      versionID: flowObject.versionID,
    }));

    return removeDuplicatesUniqueFlowEntities(mapFlowsToUniqueFlowEntities);
  }
}
