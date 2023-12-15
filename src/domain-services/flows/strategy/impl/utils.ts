import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type FlowCategoryFilters } from '../../graphql/args';

/*
 * Map structure:
 * {
 *   KEY = objectType: string,
 *   VALUE = {
 *         KEY = refDirection: string,
 *         VALUE = [objectID: number]
 *         }
 * }
 */
export function mapFlowObjectConditionsToWhereClause(
  flowObjectConditions: Map<string, Map<string, number[]>>
): any[] {
  const whereClauses: any = [];
  for (const [objectType, refDirectionMap] of flowObjectConditions) {
    for (const [refDirection, objectIDs] of refDirectionMap) {
      const whereClause = {
        objectID: {
          [Op.IN]: objectIDs,
        },
        refDirection: {
          [Op.LIKE]: refDirection,
        },
        objectType: {
          [Op.LIKE]: objectType,
        },
      };

      whereClauses.push(whereClause);
    }
  }

  return whereClauses;
}

export function mapFlowCategoryConditionsToWhereClause(
  flowCategoryConditions: FlowCategoryFilters
) {
  let whereClause = {};

  if (flowCategoryConditions.pending !== undefined) {
    whereClause = {
      group: 'inactiveReason',
      name: 'Pending review',
    };
  }

  if (flowCategoryConditions.categoryFilters?.length > 0) {
    // Map category filters
    // getting Id when possible
    // or name and group otherwise
    const categoryIdFilters: number[] = [];
    const categoryFilters = new Map<string, string[]>();
    for (const categoryFilter of flowCategoryConditions.categoryFilters) {
      if (categoryFilter.id) {
        categoryIdFilters.push(categoryFilter.id);
      } else if (categoryFilter.group && categoryFilter.name) {
        const group = categoryFilter.group;
        const name = categoryFilter.name;

        const groupsNamesFilter =
          (categoryFilters.get(group) as string[]) || [];

        groupsNamesFilter.push(name);
        categoryFilters.set(group, groupsNamesFilter);
      }
    }

    if (categoryIdFilters.length > 0) {
      whereClause = {
        ...whereClause,
        id: {
          [Op.IN]: categoryIdFilters,
        },
      };
    }

    // for each entry of the group name
    // add a condition to the where clause
    // with the names associated to the group
    // both in the same AND clause
    for (const [group, names] of categoryFilters) {
      whereClause = {
        ...whereClause,
        [Cond.AND]: [
          {
            group: {
              [Op.LIKE]: group,
            },
            name: {
              [Op.IN]: names,
            },
          },
        ],
      };
    }
  }

  return whereClause;
}

export function mergeFlowIDsFromFilteredFlowObjectsAndFlowCategories(
  flowIDsFromFilteredFlowObjects: FlowId[],
  flowIDsFromFilteredFlowCategories: FlowId[]
): FlowId[] {
  const isFlowIDsFromFilteredFlowCategoriesIsEmpty =
    !flowIDsFromFilteredFlowCategories?.length;
  const isFlowIDsFromFilteredFlowObjectsIsEmpty =
    !flowIDsFromFilteredFlowObjects?.length;

  if (
    isFlowIDsFromFilteredFlowCategoriesIsEmpty &&
    isFlowIDsFromFilteredFlowObjectsIsEmpty
  ) {
    return [];
  }

  if (
    isFlowIDsFromFilteredFlowCategoriesIsEmpty &&
    !isFlowIDsFromFilteredFlowObjectsIsEmpty
  ) {
    return flowIDsFromFilteredFlowObjects;
  }

  if (
    !isFlowIDsFromFilteredFlowCategoriesIsEmpty &&
    isFlowIDsFromFilteredFlowObjectsIsEmpty
  ) {
    return flowIDsFromFilteredFlowCategories;
  }

  return flowIDsFromFilteredFlowObjects.length >
    flowIDsFromFilteredFlowCategories.length
    ? flowIDsFromFilteredFlowCategories.filter((flowID) =>
        flowIDsFromFilteredFlowObjects.includes(flowID)
      )
    : flowIDsFromFilteredFlowObjects.filter((flowID) =>
        flowIDsFromFilteredFlowCategories.includes(flowID)
      );
}

export function checkAndMapFlowOrderBy(orderBy: any) {
  if (!orderBy) {
    return { column: 'updatedAt', order: 'DESC' };
  }
  let orderByForFlow = { column: orderBy.column, order: orderBy.order };
  if (orderBy.entity !== 'flow') {
    orderByForFlow = { column: 'updatedAt', order: 'DESC' };
  }

  return orderByForFlow;
}
