import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { intersectSets, parseFlowIdVersionSet } from './utils';

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

    let intersectedFlows: Set<string> = new Set<string>();

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

        const uniqueFlowObjectsEntities: Set<string> = new Set<string>(
          flowObjectsFound.map(
            (flowObject) => `${flowObject.flowID}:${flowObject.versionID}`
          )
        );

        intersectedFlows = intersectSets(
          intersectedFlows,
          uniqueFlowObjectsEntities
        );
      }
    }

    return { flows: parseFlowIdVersionSet(intersectedFlows) };
  }
}
