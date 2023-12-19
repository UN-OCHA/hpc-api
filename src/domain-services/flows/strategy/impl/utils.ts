import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import {
  type FlowCategory,
  type FlowObjectFilters,
  type SearchFlowsFilters,
} from '../../graphql/args';

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
  filterByPendingFlows: boolean | undefined,
  flowCategoryConditions: FlowCategory[]
) {
  let whereClause = {};

  if (filterByPendingFlows !== undefined) {
    whereClause = {
      group: 'inactiveReason',
      name: 'Pending review',
    };
  }

  if (flowCategoryConditions.length > 0) {
    // Map category filters
    // getting Id when possible
    // or name and group otherwise
    const categoryIdFilters: number[] = [];
    const categoryFilters = new Map<string, string[]>();
    for (const categoryFilter of flowCategoryConditions) {
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

export function mapFlowOrderBy(orderBy: any) {
  if (!orderBy) {
    return { column: 'updatedAt', order: 'DESC' };
  }
  let orderByForFlow = { column: orderBy.column, order: orderBy.order };
  if (orderBy.entity !== 'flow') {
    orderByForFlow = { column: 'updatedAt', order: 'DESC' };
  }

  return orderByForFlow;
}

export function prepareFlowConditions(flowFilters: SearchFlowsFilters): any {
  let flowConditions = {};

  if (flowFilters) {
    for (const [key, value] of Object.entries(flowFilters)) {
      if (value !== undefined) {
        if (Array.isArray(value) && value.length !== 0) {
          flowConditions = { ...flowConditions, [key]: { [Op.IN]: value } };
        } else {
          flowConditions = { ...flowConditions, [key]: value };
        }
      }
    }
  }

  return flowConditions;
}

export function mapCountResultToCountObject(countRes: any[]) {
  // Map count result query to count object
  const countObject = countRes[0] as { count: number };

  return countObject;
}

export function mapFlowObjectConditions(
  flowObjectFilters: FlowObjectFilters[] = []
): Map<string, Map<string, number[]>> {
  const flowObjectsConditions: Map<string, Map<string, number[]>> = new Map<
    string,
    Map<string, number[]>
  >();

  for (const flowObjectFilter of flowObjectFilters) {
    const { objectType, direction, objectID } = flowObjectFilter;

    if (!flowObjectsConditions.has(objectType)) {
      flowObjectsConditions.set(objectType, new Map<string, number[]>());
    }

    const refDirectionMap = flowObjectsConditions.get(objectType);
    if (!refDirectionMap!.has(direction)) {
      refDirectionMap!.set(direction, []);
    }

    const objectIDsArray = refDirectionMap!.get(direction);

    if (objectIDsArray!.includes(objectID)) {
      throw new Error(
        `Duplicate flow object filter: ${objectType} ${direction} ${objectID}`
      );
    }

    objectIDsArray!.push(objectID);
  }

  return flowObjectsConditions;
}
