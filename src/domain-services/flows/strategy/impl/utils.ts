import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import {
  type FlowCategory,
  type FlowObjectFilters,
  type SearchFlowsFilters,
} from '../../graphql/args';
import { UniqueFlowEntity } from '../../model';
import Knex from 'knex';

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
  flowCategoryConditions: FlowCategory[]
) {
  if (flowCategoryConditions.length > 0) {
    let whereClause = {};
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
    return whereClause;
  }

  return undefined;
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

export function mergeUniqueEntities(
  listA: UniqueFlowEntity[],
  listB: UniqueFlowEntity[]
): UniqueFlowEntity[] {
  const entityMap = new Map<string, UniqueFlowEntity>();

  for (const entity of listA.concat(listB)) {
    const key = `${entity.id}_${entity.versionID}`;
    if (!entityMap.has(key)) {
      entityMap.set(key, entity);
    }
  }

  return Array.from(entityMap.values());
}

export function intersectUniqueFlowEntities(
  ...lists: UniqueFlowEntity[][]
): UniqueFlowEntity[] {
  // If any of the lists is empty, remove it
  lists = lists.filter((list) => list.length > 0);

  if (lists.length === 0) return [];

  if (lists.length === 1) return lists[0];

  // Helper function to create a string key for comparison
  const createKey = (entity: UniqueFlowEntity) =>
    `${entity.id}_${entity.versionID}`;

  // Convert the first list into a set for efficient lookup
  const initialSet = new Set(lists[0].map(createKey));

  // Intersect the remaining lists with the initial set
  for (let i = 1; i < lists.length; i++) {
    const currentSet = new Set(lists[i].map(createKey));
    for (let key of initialSet) {
      if (!currentSet.has(key)) {
        initialSet.delete(key);
      }
    }
  }

  // Convert the keys back to UniqueFlowEntity objects
  return Array.from(initialSet).map((key) => {
    const [id, versionID] = key.split('_').map(Number);
    return { id, versionID } as UniqueFlowEntity;
  });
}

export function sortEntitiesByReferenceList(
  entities: UniqueFlowEntity[],
  referenceList: UniqueFlowEntity[]
): UniqueFlowEntity[] {
  // Create a map for quick lookup of index positions in referenceList
  const indexMap = new Map<string, number>();
  referenceList.forEach((entity, index) => {
    const key = `${entity.id}_${entity.versionID}`;
    indexMap.set(key, index);
  });

  // Sort the entities array based on the order in referenceList
  return entities.sort((a, b) => {
    const keyA = `${a.id}_${a.versionID}`;
    const keyB = `${b.id}_${b.versionID}`;
    const indexA = indexMap.get(keyA);
    const indexB = indexMap.get(keyB);

    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    } else if (indexA !== undefined) {
      return -1; // Prefer elements found in referenceList
    } else {
      return 1;
    }
  });
}

export function removeDuplicatesUniqueFlowEntities(
  entities: UniqueFlowEntity[]
): UniqueFlowEntity[] {
  const uniqueEntities = new Map<string, UniqueFlowEntity>();

  entities.forEach((entity) => {
    const key = `${entity.id}_${entity.versionID}`;
    if (!uniqueEntities.has(key)) {
      uniqueEntities.set(key, entity);
    }
  });

  return Array.from(uniqueEntities.values());
}

export function applySearchFilters(query: Knex.QueryBuilder, filters: SearchFlowsFilters): Knex.QueryBuilder {
  // Check if 'id' filter is defined and apply it
  if (filters.id !== null && filters.id !== undefined) {
    query.whereIn('id', filters.id);
  }

  // Check if 'activeStatus' filter is defined and apply it
  if (filters.activeStatus !== null && filters.activeStatus !== undefined) {
    query.andWhere('activeStatus', filters.activeStatus);
  }

  // Check if 'amountUSD' filter is defined and apply it
  if (filters.amountUSD !== null && filters.amountUSD !== undefined) {
    query.andWhere('amountUSD', filters.amountUSD);
  }

  // Check if 'restricted' filter is defined and apply it
  if (filters.restricted !== null && filters.restricted !== undefined) {
    query.andWhere('restricted', filters.restricted);
  }

  return query;
}