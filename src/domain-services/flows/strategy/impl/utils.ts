import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import type Knex from 'knex';
import { type OrderBy } from '../../../../utils/database-types';
import { type FlowCategory, type SearchFlowsFilters } from '../../graphql/args';
import { type FlowStatusFilter } from '../../graphql/types';
import { type UniqueFlowEntity } from '../../model';

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

    // For each entry of the group name
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

  return null;
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

export const sortingColumnMapping: Map<string, string> = new Map<
  string,
  string
>([
  ['reporterRefCode', 'refCode'],
  ['sourceID', 'sourceID'],
]);

export function mapFlowOrderBy(orderBy: any): OrderBy {
  if (!orderBy) {
    return defaultFlowOrderBy();
  }

  if (orderBy.entity === 'flow') {
    return { column: orderBy.column, order: orderBy.order };
  }

  let columnToSort: string;
  if (sortingColumnMapping.has(orderBy.column)) {
    // I don't like this but the compiler is complaining
    // that columnToSort might be undefined if I don't do this
    // but it's already checked that the column exists in the map
    columnToSort = sortingColumnMapping.get(orderBy.column) ?? 'updatedAt';
  } else {
    columnToSort = orderBy.column;
  }

  return { column: columnToSort, order: orderBy.order };
}

export function defaultFlowOrderBy(): OrderBy {
  return { column: 'updatedAt', order: 'DESC' };
}

export function buildOrderByReference(refList: UniqueFlowEntity[]): OrderBy {
  if (refList.length === 0) {
    return defaultFlowOrderBy();
  }

  return {
    column: 'id',
    raw: `array_position(ARRAY[${refList
      .map((entry) => entry.id)
      .join(',')}], "id")`,
  };
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

export function mergeUniqueEntities(
  listA: UniqueFlowEntity[],
  listB: UniqueFlowEntity[]
): UniqueFlowEntity[] {
  if (listA.length === 0) {
    return listB;
  }

  if (listB.length === 0) {
    return listA;
  }

  // Convert the lists into a set for efficient lookup
  const entityMapListA = new Set(listA.map(mapUniqueFlowEntitisSetKeyToSetkey));

  const entityMapListB = new Set(listB.map(mapUniqueFlowEntitisSetKeyToSetkey));

  for (const key of entityMapListB) {
    if (!entityMapListA.has(key)) {
      entityMapListA.add(key);
    }
  }

  // Convert the keys back to UniqueFlowEntity objects
  return mapUniqueFlowEntitisSetKeyToUniqueFlowEntity(entityMapListA);
}

export function intersectUniqueFlowEntities(
  ...lists: UniqueFlowEntity[][]
): UniqueFlowEntity[] {
  // If any of the lists is empty, remove it
  lists = lists.filter((list) => list.length > 0);

  if (lists.length === 0) {
    return [];
  }

  if (lists.length === 1) {
    return lists[0];
  }

  // Convert the first list into a set for efficient lookup
  const initialSet = new Set(lists[0].map(mapUniqueFlowEntitisSetKeyToSetkey));

  // Intersect the remaining lists with the initial set
  for (let i = 1; i < lists.length; i++) {
    const currentSet = new Set(
      lists[i].map(mapUniqueFlowEntitisSetKeyToSetkey)
    );
    for (const key of initialSet) {
      if (!currentSet.has(key)) {
        initialSet.delete(key);
      }
    }
  }

  // Convert the keys back to UniqueFlowEntity objects
  return mapUniqueFlowEntitisSetKeyToUniqueFlowEntity(initialSet);
}

export function mapUniqueFlowEntitisSetKeyToSetkey(
  entity: UniqueFlowEntity
): string {
  return `${entity.id}_${entity.versionID}`;
}

export function mapUniqueFlowEntitisSetKeyToUniqueFlowEntity(
  set: Set<string>
): UniqueFlowEntity[] {
  return [...set].map((key) => {
    const [id, versionID] = key.split('_').map(Number);
    return { id, versionID } as UniqueFlowEntity;
  });
}

export function removeDuplicatesUniqueFlowEntities(
  entities: UniqueFlowEntity[]
): UniqueFlowEntity[] {
  const uniqueEntities = new Map<string, UniqueFlowEntity>();

  for (const entity of entities) {
    const key = `${entity.id}_${entity.versionID}`;
    if (!uniqueEntities.has(key)) {
      uniqueEntities.set(key, entity);
    }
  }

  return [...uniqueEntities.values()];
}

export function applySearchFilters(
  query: Knex.QueryBuilder,
  filters: SearchFlowsFilters
): Knex.QueryBuilder {
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

export function prepareFlowStatusConditions(
  flowConditions: any,
  statusFilter: FlowStatusFilter | null
) {
  if (statusFilter) {
    if (statusFilter === 'new') {
      // Flows with version 1 are considered new
      flowConditions = { ...flowConditions, versionID: 1 };
    } else if (statusFilter === 'updated') {
      // Flows with version greater than 1 are considered updated
      flowConditions = { ...flowConditions, versionID: { [Op.GT]: 1 } };
    }
  }
  return flowConditions;
}

export function buildSearchFlowsConditions(
  uniqueFlowEntities: UniqueFlowEntity[],
  flowFilters?: SearchFlowsFilters
): any {
  const whereClauses = uniqueFlowEntities.map((flow) => ({
    [Cond.AND]: [{ id: flow.id }, { versionID: flow.versionID }],
  }));

  if (flowFilters) {
    const flowConditions = prepareFlowConditions(flowFilters);
    return {
      [Cond.AND]: [
        { deletedAt: null },
        flowConditions,
        { [Cond.OR]: whereClauses },
      ],
    };
  }

  return {
    [Cond.OR]: whereClauses,
  };
}
