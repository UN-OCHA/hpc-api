import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import {
  Cond,
  type Condition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
import { type OrderByCond } from '@unocha/hpc-api-core/src/db/util/raw-model';
import type {
  FieldsOfModel,
  InstanceOfModel,
} from '@unocha/hpc-api-core/src/db/util/types';
import { groupObjectsByProperty } from '@unocha/hpc-api-core/src/util';
import { Service } from 'typedi';
import { type UniqueFlowEntity } from '../flows/model';

// Local types definition to increase readability
type FlowObjectModel = Database['flowObject'];
type FlowObjectInstance = InstanceOfModel<FlowObjectModel>;
export type FlowObjectsFieldsDefinition = FieldsOfModel<FlowObjectModel>;
export type FlowObjectOrderByCond = OrderByCond<FlowObjectsFieldsDefinition>;
export type FlowObjectWhere = Condition<FlowObjectInstance>;
@Service()
export class FlowObjectService {
  /**
   * Get flows given flowObjects `OR` conditions and the number of conditions.
   * This will return only flows that match all the conditions.
   */
  async getFlowFromFlowObjects(
    models: Database,
    where: FlowObjectWhere,
    numberOfConditions: number
  ): Promise<UniqueFlowEntity[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    const uniqueFlows: UniqueFlowEntity[] = [];

    // Group by flowID
    const flowIDGroups = groupObjectsByProperty(flowObjects, 'flowID');

    for (const [flowID, flowGroup] of flowIDGroups.entries()) {
      // Group each flowGroup by versionID
      const versionIDGroups = groupObjectsByProperty(flowGroup, 'versionID');

      for (const [versionID, objs] of versionIDGroups.entries()) {
        if (objs.length === numberOfConditions) {
          // Only add the flowID+versionID if all conditions are met
          uniqueFlows.push({ id: flowID, versionID });
        }
      }
    }

    return uniqueFlows;
  }

  async getFlowObjectByFlowId(
    models: Database,
    flowVersions: Array<{ flowID: FlowId; versionID: number }>
  ) {
    if (flowVersions.length === 0) {
      return [];
    }

    return await models.flowObject.find({
      where: {
        [Cond.OR]: flowVersions.map(({ flowID, versionID }) => ({
          flowID,
          versionID,
        })),
      },
    });
  }
}
