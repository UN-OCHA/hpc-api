import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import { FlowService } from '../../flow-service';
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
  constructor(
    private readonly flowObjectService: FlowObjectService,
    private readonly flowService: FlowService
  ) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { flowObjectFilterGrouped, models } = args;

    if (!flowObjectFilterGrouped) {
      return { flows: [] };
    }

    const flowObjects =
      await this.flowObjectService.getFlowObjectsByFlowObjectConditions(
        models,
        flowObjectFilterGrouped
      );

    const uniqueFlowObjectsEntities: UniqueFlowEntity[] = flowObjects.map(
      (flowObject) => ({
        id: flowObject.flowID,
        versionID: flowObject.versionID,
      })
    );

    return { flows: uniqueFlowObjectsEntities };
  }
}
