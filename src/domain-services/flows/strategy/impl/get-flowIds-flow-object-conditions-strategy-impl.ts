import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { mapFlowObjectConditionsToWhereClause } from './utils';

@Service()
export class GetFlowIdsFromObjectConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(private readonly flowObjectService: FlowObjectService) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { models, flowObjectsConditions } = args;
    const flowObjectWhere = mapFlowObjectConditionsToWhereClause(
      flowObjectsConditions!
    );

    const flowIDsFromFilteredFlowObjects: FlowId[] = [];
    const tempFlowIDs: FlowId[][] = await Promise.all(
      flowObjectWhere.map((whereClause) =>
        this.flowObjectService.getFlowIdsFromFlowObjects(models, whereClause)
      )
    );

    // Flatten array of arrays keeping only values present in all arrays
    const flowIDs = tempFlowIDs.flat();
    flowIDsFromFilteredFlowObjects.push(...new Set(flowIDs));

    return { flowIDs: flowIDsFromFilteredFlowObjects };
  }

  generateWhereClause(flowIds: FlowId[]) {
    return {
      id: {
        [Op.IN]: flowIds,
      },
    };
  }
}
