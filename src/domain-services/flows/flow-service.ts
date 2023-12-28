import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import type Knex from 'knex';
import { Service } from 'typedi';
import { type FlowObjectType } from '../flow-object/model';
import { type FlowOrderBy } from './model';
import { mapFlowOrderBy } from './strategy/impl/utils';

@Service()
export class FlowService {
  constructor() {}

  async getFlows(
    models: Database,
    conditions: any,
    orderBy?: any,
    limit?: number,
    rawOrderBy?: string
  ) {
    return await models.flow.find({
      orderBy,
      limit,
      where: conditions,
      orderByRaw: rawOrderBy,
    });
  }

  async getFlowsCount(models: Database, conditions: any) {
    return await models.flow.count({ where: conditions });
  }

  async getFlowIDsFromEntity(
    models: Database,
    dbConnection: Knex,
    orderBy: FlowOrderBy,
    limit: number
  ): Promise<FlowId[]> {
    const entity = orderBy.subEntity ?? orderBy.entity;

    // Get the entity list
    const mappedOrderBy = mapFlowOrderBy(orderBy);
    const entityList = await dbConnection
      .queryBuilder()
      .select(orderBy.subEntity ? `${orderBy.subEntity}Id` : 'id')
      .from(entity)
      .orderBy(mappedOrderBy.column, mappedOrderBy.order);

    const entityIDs = entityList.map((entity) => entity.id);
    // Get the flowIDs from the entity list
    // using the flow-object relation
    const entityCondKey = orderBy.entity as unknown as FlowObjectType;

    const query = dbConnection
      .queryBuilder()
      .select('flowID')
      .from('flowObject')
      .whereIn('objectID', entityIDs)
      .andWhere('objectType', entityCondKey)
      .andWhere('refDirection', orderBy.direction!)
      .orderByRaw(`array_position(ARRAY[${entityIDs.join(',')}], "objectID")`)
      .orderBy('flowID', orderBy.order)
      .limit(limit);

    const flowIDs = await query;
    return flowIDs.map((flowID) => flowID.flowID);
  }
}
