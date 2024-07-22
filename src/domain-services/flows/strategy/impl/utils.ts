import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import {
  FieldDefinition,
  InstanceDataOf,
} from '@unocha/hpc-api-core/src/db/util/model-definition';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import type Knex from 'knex';
import { type OrderBy } from '../../../../utils/database-types';
import { SortOrder } from '../../../../utils/graphql/pagination';
import { type EntityDirection } from '../../../base-types';
import type {
  FlowObjectFilterGrouped,
  FlowObjectType,
} from '../../../flow-object/model';
import type {
  FlowCategory,
  FlowObjectFilters,
  SearchFlowsFilters,
} from '../../graphql/args';
import { FlowSortField, type FlowStatusFilter } from '../../graphql/types';
import type {
  FlowFieldsDefinition,
  FlowOrderBy,
  FlowWhere,
  UniqueFlowEntity,
} from '../../model';

export const mapFlowCategoryConditionsToWhereClause = (
  flowCategoryConditions: FlowCategory[]
) => {
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

        const groupsNamesFilter = categoryFilters.get(group) ?? [];

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
};

export const mergeFlowIDsFromFilteredFlowObjectsAndFlowCategories = (
  flowIDsFromFilteredFlowObjects: FlowId[],
  flowIDsFromFilteredFlowCategories: FlowId[]
): FlowId[] => {
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
};

export const sortingColumnMapping: Map<string, string> = new Map<
  string,
  string
>([
  ['reporterRefCode', 'refCode'],
  ['sourceID', 'sourceID'],
]);

export const mapFlowOrderBy = (
  orderBy?: FlowOrderBy
): OrderBy<FlowFieldsDefinition> => {
  if (!orderBy || orderBy.entity !== 'flow') {
    return defaultFlowOrderBy();
  }

  return {
    column: orderBy.column as keyof InstanceDataOf<FlowFieldsDefinition>,
    order: orderBy.order,
  };
};

export const mapOrderByToEntityOrderBy = <F extends FieldDefinition>(
  orderBy?: FlowOrderBy
): OrderBy<F> => {
  if (!orderBy || orderBy.entity === 'flow') {
    return defaultFlowOrderBy();
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

  return {
    column: columnToSort as keyof InstanceDataOf<F>,
    order: orderBy.order,
    nulls: 'last',
  };
};

export const defaultFlowOrderBy = (): OrderBy<FlowFieldsDefinition> => {
  return {
    column: 'updatedAt' as keyof InstanceDataOf<FlowFieldsDefinition>,
    order: 'desc',
    nulls: 'last',
  };
};

export const buildOrderByReference = (
  refList: UniqueFlowEntity[]
):
  | OrderBy<FlowFieldsDefinition>
  | (OrderBy<FlowFieldsDefinition> & { raw: string }) => {
  if (refList.length === 0) {
    return defaultFlowOrderBy();
  }

  return {
    column: 'id' as keyof InstanceDataOf<FlowFieldsDefinition>,
    order: 'asc',
    raw: `array_position(ARRAY[${refList
      .map((entry) => entry.id)
      .join(',')}], "id")`,
  };
};

export const prepareFlowConditions = (
  flowFilters: SearchFlowsFilters
): FlowWhere => {
  let flowConditions = {};

  if (flowFilters) {
    for (const [key, value] of Object.entries(flowFilters)) {
      if (value !== undefined) {
        flowConditions = { ...flowConditions, [key]: value };
      }
    }
  }

  return flowConditions satisfies FlowWhere;
};

export const mergeUniqueEntities = (
  listA: UniqueFlowEntity[],
  listB: UniqueFlowEntity[]
): UniqueFlowEntity[] => {
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
};

export const intersectUniqueFlowEntities = (
  ...lists: UniqueFlowEntity[][]
): UniqueFlowEntity[] => {
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
};

export const mapUniqueFlowEntitisSetKeyToSetkey = (
  entity: UniqueFlowEntity
): string => {
  return `${entity.id}_${entity.versionID}`;
};

export const mapUniqueFlowEntitisSetKeyToUniqueFlowEntity = (
  set: Set<string>
): UniqueFlowEntity[] => {
  return [...set].map((key) => {
    const [id, versionID] = key.split('_').map(Number);
    return { id: createBrandedValue(id), versionID } satisfies UniqueFlowEntity;
  });
};

export const removeDuplicatesUniqueFlowEntities = (
  entities: UniqueFlowEntity[]
): UniqueFlowEntity[] => {
  const uniqueEntities = new Map<string, UniqueFlowEntity>();

  for (const entity of entities) {
    const key = `${entity.id}_${entity.versionID}`;
    if (!uniqueEntities.has(key)) {
      uniqueEntities.set(key, entity);
    }
  }

  return [...uniqueEntities.values()];
};

// FIXME: to be removed once the new search is implemented
export function applySearchFilters(
  query: Knex.QueryBuilder,
  filters: any
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

  // Check if 'versionID' filter is defined and apply it
  if (filters.versionID !== null && filters.versionID !== undefined) {
    query.andWhere('versionID', filters.versionID, 1);
  }

  return query;
}

// FIXME: to be removed once the new search is implemented
export const prepareFlowStatusConditions = (
  flowConditions: any,
  statusFilter: FlowStatusFilter | null
) => {
  if (statusFilter) {
    if (statusFilter === 'new') {
      // Flows with version 1 are considered new
      flowConditions = { ...flowConditions, versionID: '=' };
    } else if (statusFilter === 'updated') {
      // Flows with version greater than 1 are considered updated
      flowConditions = { ...flowConditions, versionID: '>' };
    }
  }
  return flowConditions;
};

export const buildSearchFlowsConditions = (
  uniqueFlowEntities: UniqueFlowEntity[],
  flowFilters?: SearchFlowsFilters
): FlowWhere => {
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
    } satisfies FlowWhere;
  }

  return {
    [Cond.OR]: whereClauses,
  };
};

export const mapFlowFiltersToFlowObjectFiltersGrouped = (
  flowObjectFilters: FlowObjectFilters[]
): FlowObjectFilterGrouped => {
  const flowObjectFilterGrouped = new Map<
    FlowObjectType,
    Map<EntityDirection, number[]>
  >();

  for (const flowObjectFilter of flowObjectFilters) {
    const objectType = flowObjectFilter.objectType;
    const flowDirection = flowObjectFilter.direction;
    const objectId = flowObjectFilter.objectID;

    // Get the map of flow object IDs for the given object type
    // Or create a new map if it doesn't exist
    const directionWithIDsMap =
      flowObjectFilterGrouped.get(objectType) ??
      new Map<EntityDirection, number[]>();

    // Get the list of flow object IDs for the given direction
    // Or create a new list if it doesn't exist
    const flowObjectIDs = directionWithIDsMap.get(flowDirection) ?? [];
    flowObjectIDs.push(objectId);

    // Update the map with the new list of flow object IDs for the given direction
    directionWithIDsMap.set(flowDirection, flowObjectIDs);

    // Update the map with the new map of direction+ids for the given object type
    flowObjectFilterGrouped.set(objectType, directionWithIDsMap);
  }

  return flowObjectFilterGrouped;
};

export const buildOrderBy = (
  sortField?: FlowSortField | string,
  sortOrder?: SortOrder
) => {
  const orderBy: FlowOrderBy = {
    column: sortField ?? 'updatedAt',
    order: sortOrder ?? ('desc' as SortOrder),
    direction: undefined,
    entity: 'flow',
  };

  // Check if sortField is a nested property
  if (orderBy.column.includes('.')) {
    // OrderBy can came in the format:
    // column: 'organizations.source.name'
    // or in the format:
    // column: 'flow.updatedAt'
    // or in the format:
    // column: 'planVersion.source.name'
    // in this last case, we need to look after the capitalized letter
    // that will indicate the entity
    // and the whole word will be the subEntity
    const struct = orderBy.column.split('.');

    if (struct.length === 2) {
      orderBy.column = struct[1];
      orderBy.entity = struct[0];
    } else if (struct.length === 3) {
      orderBy.column = struct[2];
      orderBy.direction = struct[1] as EntityDirection;

      // We need to look after the '-' character
      // [0] will indicate the entity
      // and [1] will be the subEntity
      const splitted = struct[0].split('-');
      const entity = splitted[0];
      orderBy.entity = entity;

      if (entity === struct[0]) {
        orderBy.subEntity = struct[0];
      }
    }
  }

  return orderBy;
};
