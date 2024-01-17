import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import { type UniqueFlowEntity } from '../../model';
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

    const flowsFromFilteredFlowObjects: UniqueFlowEntity[] = [];
    const tempFlowIDs: UniqueFlowEntity[][] = await Promise.all(
      flowObjectWhere.map((whereClause) =>
        this.flowObjectService.getFlowFromFlowObjects(models, whereClause)
      )
    );

    // Flatten array of arrays keeping only values present in all arrays
    const flowIDs = tempFlowIDs.flat();
    flowsFromFilteredFlowObjects.push(...new Set(flowIDs));

    return { flows: flowsFromFilteredFlowObjects };
  }
}
