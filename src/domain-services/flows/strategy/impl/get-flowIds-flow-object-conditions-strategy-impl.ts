import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { splitIntoChunks } from '@unocha/hpc-api-core/src/util';
import { PG_MAX_QUERY_PARAMS } from '@unocha/hpc-api-core/src/util/consts';
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
    const { flowObjectFilterGrouped, models, candidates } = args;

    if (!flowObjectFilterGrouped) {
      return { flows: [] };
    }
    let flowCandidates = candidates ?? new Set<FlowId>();
    let intersectedFlows = new Set<string>();

    for (const [flowObjectType, group] of flowObjectFilterGrouped.entries()) {
      for (const [direction, ids] of group.entries()) {
        const condition = {
          objectType: flowObjectType,
          refDirection: direction,
          objectID: { [Op.IN]: ids },
        };

        const flowObjectsFound = (
          await Promise.all(
            splitIntoChunks([...flowCandidates], PG_MAX_QUERY_PARAMS - 10).map(
              (entityIds) =>
                models.flowObject.find({
                  where: { ...condition, flowID: { [Op.IN]: entityIds } },
                  distinct: ['flowID', 'versionID'],
                })
            )
          )
        ).flat();

        const uniqueFlowObjectsEntities = new Set<string>(
          flowObjectsFound.map(
            (flowObject) => `${flowObject.flowID}:${flowObject.versionID}`
          )
        );
        flowCandidates = intersectSets(
          flowCandidates,
          new Set(flowObjectsFound.map((flowObject) => flowObject.flowID))
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
