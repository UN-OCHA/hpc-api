import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type FlowObjectWhere } from './flow-object-service';
import { type FlowObjectFilterGrouped } from './model';

/**
 *  This alg iterates over the flowObjectFilters and creates a join for each flowObjectType
 *  and refDirection allowing to filter the flowObjects by the flowObjectType and refDirection
 * inclusively for each
 * @param flowObjectFiltersGrouped
 * @returns FlowObjectWhere
 */
export function buildWhereConditionsForFlowObjectFilters(
  flowObjectFiltersGrouped: FlowObjectFilterGrouped
): FlowObjectWhere {
  const ANDConditions = [];
  for (const [flowObjectType, group] of flowObjectFiltersGrouped.entries()) {
    for (const [direction, ids] of group.entries()) {
      const condition = {
        [Cond.AND]: [
          {
            objectType: flowObjectType,
            refDirection: direction,
            objectID: { [Op.IN]: ids },
          },
        ],
      };

      ANDConditions.push(condition);
    }
  }

  return { [Cond.AND]: ANDConditions };
}
