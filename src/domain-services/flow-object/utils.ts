import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type FlowObjectWhere } from './flow-object-service';
import { type FlowObjectFilterGrouped } from './model';

/**
 * Build where conditions for flow object filters as `OR` conditions.
 * (This is done because we cannot have `AND` conditions on different values of the same column
 * or use joiners)
 */
export function buildWhereConditionsForFlowObjectFilters(
  flowObjectFiltersGrouped: FlowObjectFilterGrouped
): FlowObjectWhere {
  const ANDConditions = [];
  for (const [flowObjectType, group] of flowObjectFiltersGrouped.entries()) {
    for (const [direction, ids] of group.entries()) {
      const condition = {
        objectType: flowObjectType,
        refDirection: direction,
        objectID: { [Op.IN]: ids },
      };

      ANDConditions.push(condition);
    }
  }

  return { [Cond.OR]: ANDConditions };
}
