import type Knex from 'knex';
import { type EntityDirection } from '../base-types';
import { type FlowObjectFilterGrouped } from './model';

/**
 *  This alg iterates over the flowObjectFilters and creates a join for each flowObjectType
 *  and refDirection allowing to filter the flowObjects by the flowObjectType and refDirection
 * inclusivelly for each
 * By a given direction, if not specified, it will add al directions
 * @param queryBuilder
 * @param flowObjectFiltersGrouped
 * @returns queryBuilder
 */
export function buildJoinQueryForFlowObjectFilters(
  queryBuilder: Knex.QueryBuilder,
  flowObjectFiltersGrouped: FlowObjectFilterGrouped,
  onClause: string,
  queryDirection?: EntityDirection
): Knex.QueryBuilder {
  for (const [flowObjectType, group] of flowObjectFiltersGrouped.entries()) {
    for (const [direction, ids] of group.entries()) {
      if (!queryDirection || (queryDirection && queryDirection === direction)) {
        const groupingAlias = `${flowObjectType}_${direction}`;
        queryBuilder = queryBuilder
          .innerJoin(`flowObject as ${groupingAlias}`, function () {
            this.on(`${onClause}.id`, '=', `${groupingAlias}.flowID`).andOn(
              `${onClause}.versionID`,
              '=',
              `${groupingAlias}.versionID`
            );
          })
          .where(function () {
            this.whereIn(`${groupingAlias}.objectID`, ids)
              .andWhere(`${groupingAlias}.objectType`, flowObjectType)
              .andWhere(`${groupingAlias}.refDirection`, direction);
          });
      }
    }
  }

  return queryBuilder;
}
