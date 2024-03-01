import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import type Knex from 'knex';
import { Service } from 'typedi';
import { type UniqueFlowEntity } from '../flows/model';

@Service()
export class FlowObjectService {
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

  async getFlowFromFlowObjects(
    models: Database,
    where: any
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
    databaseConnection: Knex,
    flowObjectConditions: any
  ) {
    // 1. Map flowObjectConditions to selectQuery
    let selectQuery = databaseConnection?.queryBuilder();

    // 1.1. Map first element of flowObjectConditions to selectQuery
    // We know there is at least one element in flowObjectConditions
    const firstFlowObjectCondition = flowObjectConditions[0];
    selectQuery = selectQuery
      ?.select('flowID', 'versionID')
      .from('flowObject')
      .where('objectID', firstFlowObjectCondition.objectID)
      .andWhere('objectType', firstFlowObjectCondition.objectType)
      .andWhere('refDirection', firstFlowObjectCondition.direction);

    // 1.2 Map the rest of the elements of flowObjectConditions to selectQuery
    for (let i = 1; i < flowObjectConditions.length; i++) {
      const flowObjectCondition = flowObjectConditions[i];
      selectQuery = selectQuery?.intersect(function () {
        this.select('flowID', 'versionID')
          .from('flowObject')
          .where('objectID', flowObjectCondition.objectID)
          .andWhere('objectType', flowObjectCondition.objectType)
          .andWhere('refDirection', flowObjectCondition.direction);
      });
    }

    return await selectQuery;
  }
}
