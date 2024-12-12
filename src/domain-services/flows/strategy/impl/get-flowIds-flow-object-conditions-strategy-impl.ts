import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { type UniqueFlowEntity } from '../../model';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { intersectUniqueFlowEntities } from './utils';

@Service()
export class GetFlowIdsFromObjectConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor() {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { flowObjectFilterGrouped, models } = args;

    if (!flowObjectFilterGrouped) {
      return { flows: [] };
    }

    let intersectedFlows: UniqueFlowEntity[] = [];

    for (const [flowObjectType, group] of flowObjectFilterGrouped.entries()) {
      for (const [direction, ids] of group.entries()) {
        const condition = {
          objectType: flowObjectType,
          refDirection: direction,
          objectID: { [Op.IN]: ids },
        };
        const flowObjectsFound = await models.flowObject.find({
          where: condition,
        });

        const uniqueFlowObjectsEntities: UniqueFlowEntity[] =
          flowObjectsFound.map(
            (flowObject) =>
              ({
                id: flowObject.flowID,
                versionID: flowObject.versionID,
              }) satisfies UniqueFlowEntity
          );

        intersectedFlows = intersectUniqueFlowEntities(
          intersectedFlows,
          uniqueFlowObjectsEntities
        );
      }
    }

    return { flows: intersectedFlows };
  }
}
