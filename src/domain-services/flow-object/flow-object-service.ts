import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import {
  Op,
  type Condition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type OrderBy } from '../../utils/database-types';
import { type UniqueFlowEntity } from '../flows/model';
import { buildSearchFlowsObjectConditions } from '../flows/strategy/impl/utils';
import { type FlowObjectFilterGrouped } from './model';
import { buildWhereConditionsForFlowObjectFilters } from './utils';

// Local types definition to increase readability
type FlowObjectModel = Database['flowObject'];
type FlowObjectInstance = InstanceOfModel<FlowObjectModel>;
export type FlowObjectWhere = Condition<FlowObjectInstance>;
@Service()
export class FlowObjectService {
  // Merge with getFlowsObjectsByFlows
  async getFlowIdsFromFlowObjects(
    models: Database,
    where: FlowObjectWhere
  ): Promise<FlowId[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    // Keep only not duplicated flowIDs
    return [...new Set(flowObjects.map((flowObject) => flowObject.flowID))];
  }

  async getFlowFromFlowObjects(
    models: Database,
    where: FlowObjectWhere
  ): Promise<UniqueFlowEntity[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    // Keep only not duplicated flowIDs
    return [
      ...new Set(
        flowObjects.map((flowObject) => {
          return {
            id: createBrandedValue(flowObject.flowID),
            versionID: flowObject.versionID,
          };
        })
      ),
    ];
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

  async getFlowObjectsByFlowObjectConditions(
    models: Database,
    flowObjectFilterGrouped: FlowObjectFilterGrouped
  ): Promise<FlowObjectInstance[]> {
    const whereClause = buildWhereConditionsForFlowObjectFilters(
      flowObjectFilterGrouped
    );

    return await models.flowObject.find({ where: whereClause });
  }

  async getFlowsObjectsByFlows(
    models: Database,
    whereClauses: FlowObjectWhere,
    orderBy?: OrderBy<FlowObjectModel['_internals']['fields']>
  ): Promise<FlowObjectInstance[]> {
    const distinctColumns = [
      'flowID' as keyof FlowObjectInstance,
      'versionID' as keyof FlowObjectInstance,
    ];

    if (orderBy) {
      distinctColumns.push(orderBy.column as keyof FlowObjectInstance);
      distinctColumns.reverse();
    }

    const flowsObjects: FlowObjectInstance[] = await models.flowObject.find({
      orderBy,
      where: whereClauses,
      distinct: distinctColumns,
    });

    return flowsObjects;
  }

  async progresiveSearch(
    models: Database,
    referenceList: UniqueFlowEntity[],
    batchSize: number,
    offset: number,
    stopOnBatchSize: boolean,
    responseList: FlowObjectInstance[],
    flowObjectsWhere: FlowObjectWhere,
    orderBy?: OrderBy<FlowObjectModel['_internals']['fields']>
  ): Promise<FlowObjectInstance[]> {
    const reducedFlows = referenceList.slice(offset, offset + batchSize);

    const whereConditions = buildSearchFlowsObjectConditions(
      reducedFlows,
      flowObjectsWhere
    );

    const flowObjects = await this.getFlowsObjectsByFlows(
      models,
      whereConditions,
      orderBy
    );

    responseList.push(...flowObjects);

    if (
      (stopOnBatchSize && responseList.length === batchSize) ||
      reducedFlows.length < batchSize
    ) {
      return responseList;
    }

    // Recursive call to get the next batch of flows
    offset += batchSize;

    return this.progresiveSearch(
      models,
      referenceList,
      batchSize,
      offset,
      stopOnBatchSize,
      responseList,
      flowObjectsWhere,
      orderBy
    );
  }
}
