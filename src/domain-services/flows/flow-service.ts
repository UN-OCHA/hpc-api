import { type Database } from '@unocha/hpc-api-core/src/db/type';
import type Knex from 'knex';
import { Service } from 'typedi';
import { FlowObjectType } from '../flow-object/model';
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
    const { databaseConnection, orderBy, conditions } = args;

    let query = databaseConnection!
      .queryBuilder()
      .distinct('id', 'versionID', orderBy.column) // Include orderBy.column in the distinct selection
      .select('id', 'versionID')
      .from('flow')
      .whereNull('deletedAt')
      .orderBy(orderBy.column, orderBy.order);

    if (conditions) {
      query = applySearchFilters(query, conditions);
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
    limit?: number
  ): Promise<UniqueFlowEntity[]> {
    const entity = orderBy.subEntity ?? orderBy.entity;

    // Get the entity list
    const mappedOrderBy = mapFlowOrderBy(orderBy);

    let mapFlowsToUniqueFlowEntities;

    // Get the flowIDs from the entity list
    // using the flow-object relation if the entity is a flow-object
    const entityCondKey = orderBy.entity as unknown;

    // Validate the variable using io-ts
    const result = FlowObjectType.decode(entityCondKey);

    if (result._tag === 'Right') {
      const entityList = await dbConnection
        .queryBuilder()
        .select('id')
        .from(entity)
        .orderBy(mappedOrderBy.column, mappedOrderBy.order)
        .orderBy('id', mappedOrderBy.order);

      const entityIDs = entityList.map((entity) => entity.id);
      const entityCondKeyFlowObjectType = entityCondKey as FlowObjectType;
      let query = dbConnection
        .queryBuilder()
        .select('flowID', 'versionID')
        .from('flowObject')
        .whereIn('objectID', entityIDs)
        .andWhere('objectType', entityCondKeyFlowObjectType);

      if (orderBy.direction) {
        query = query.orderBy('refDirection', orderBy.direction);
      }
      query = query
        .orderByRaw(`array_position(ARRAY[${entityIDs.join(',')}], "objectID")`)
        .orderBy('flowID', orderBy.order);

      if (limit) {
        query.limit(limit);
      }

      const flowIDs = await query;

      mapFlowsToUniqueFlowEntities = flowIDs.map((flowID) => ({
        id: flowID.flowID,
        versionID: flowID.versionID,
      }));
    } else {
      const entityList = await dbConnection
        .queryBuilder()
        .select(`${orderBy.subEntity}Id`, 'flowID', 'versionID')
        .from(entity)
        .orderBy(mappedOrderBy.column, mappedOrderBy.order)
        .orderBy('id', mappedOrderBy.order);

      mapFlowsToUniqueFlowEntities = entityList.map((entity) => ({
        id: entity.flowID,
        versionID: entity.versionID,
      }));
    }

    return removeDuplicatesUniqueFlowEntities(mapFlowsToUniqueFlowEntities);
  }
}
