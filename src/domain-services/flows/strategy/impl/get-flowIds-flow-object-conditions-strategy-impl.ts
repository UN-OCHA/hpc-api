import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import { type UniqueFlowEntity } from '../../model';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';

@Service()
export class GetFlowIdsFromObjectConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(private readonly flowObjectService: FlowObjectService) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { flowObjectsConditions, databaseConnection } = args;

    // 1. Obtain flowIDs from flowObjects
    const flowsFromFilteredFlowObjects: UniqueFlowEntity[] = [];
    const flowObjects =
      await this.flowObjectService.getFlowObjectsByFlowObjectConditions(
        databaseConnection,
        flowObjectsConditions
      );

    // 1.1. Check if flowObjects is undefined
    if (!flowObjects) {
      return { flows: [] };
    }

    // 2. Map flowObjects to UniqueFlowEntity and store in flowsFromFilteredFlowObjects
    for (const flowObject of flowObjects) {
      flowsFromFilteredFlowObjects.push({
        id: flowObject.flowID,
        versionID: flowObject.versionID,
      });
    }

    return { flows: flowsFromFilteredFlowObjects };
  }
}
