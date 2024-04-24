import { type Database } from '@unocha/hpc-api-core/src/db';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import type { InstanceDataOf } from '@unocha/hpc-api-core/src/db/util/model-definition';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { type OrderBy } from '../../../../utils/database-types';
import { type SortOrder } from '../../../../utils/graphql/pagination';
import { type EntityDirection } from '../../../base-types';
import { type FlowObjectWhere } from '../../../flow-object/flow-object-service';
import type {
  FlowObjectFilterGrouped,
  FlowObjectType,
} from '../../../flow-object/model';
import type {
  FlowCategory,
  FlowObjectFilters,
  SearchFlowsFilters,
} from '../../graphql/args';
import type { FlowSortField, FlowStatusFilter } from '../../graphql/types';
import type {
  FlowFieldsDefinition,
  FlowInstance,
  FlowOrderByCond,
  FlowOrderByWithSubEntity,
  FlowWhere,
  UniqueFlowEntity,
} from '../../model';

export const sortingColumnMapping: Map<string, string> = new Map<
  string,
  string
>([
  ['reporterRefCode', 'refCode'],
  ['sourceID', 'sourceID'],
]);

export const defaultSearchFlowFilter: FlowWhere = {
  deletedAt: null,
};

type FlowOrderByCommon = {
  order: SortOrder;
  direction?: EntityDirection;
};

export type FlowOrderBy = FlowOrderByCommon &
  (
    | {
        column: keyof FlowInstance;
        entity: 'flow';
      }
    | {
        column: keyof InstanceOfModel<Database['externalReference']>;
        entity: 'externalReference';
      }
    | {
        column: keyof InstanceOfModel<Database['emergency']>;
        entity: 'emergency';
      }
    | {
        entity: 'globalCluster';
        column: keyof InstanceOfModel<Database['globalCluster']>;
      }
    | {
        entity: 'governingEntity';
        column: keyof InstanceOfModel<Database['governingEntity']>;
      }
    | {
        entity: 'location';
        column: keyof InstanceOfModel<Database['location']>;
      }
    | {
        entity: 'organization';
        column: keyof InstanceOfModel<Database['organization']>;
      }
    | {
        entity: 'plan';
        column: keyof InstanceOfModel<Database['plan']>;
      }
    | {
        entity: 'usageYear';
        column: keyof InstanceOfModel<Database['usageYear']>;
      }
    | {
        entity: 'planVersion';
        column: keyof InstanceOfModel<Database['planVersion']>;
      }
    | {
        entity: 'project';
        column: keyof InstanceOfModel<Database['project']>;
      }
  );

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

export const mapFlowOrderBy = (
  orderBy?: FlowOrderByWithSubEntity
): OrderBy<FlowFieldsDefinition> => {
  if (!orderBy || orderBy.entity !== 'flow') {
    return defaultFlowOrderBy();
  }

  return {
    column: orderBy.column as keyof InstanceDataOf<FlowFieldsDefinition>,
    order: orderBy.order,
  };
};

export const defaultFlowOrderBy = (): FlowOrderByCond => {
  return {
    column: 'updatedAt',
    order: 'desc',
  } satisfies FlowOrderByCond;
};

export const prepareFlowConditions = (
  flowFilters: SearchFlowsFilters
): FlowWhere => {
  let flowConditions: FlowWhere = { ...defaultSearchFlowFilter };

  if (flowFilters) {
    for (const [key, value] of Object.entries(flowFilters)) {
      if (value !== undefined) {
        if (key === 'id') {
          const brandedIDs = value.map((id: number) => createBrandedValue(id));
          flowConditions[key] = { [Op.IN]: brandedIDs };
        } else {
          const typedKey = key as keyof FlowWhere;
          flowConditions = { ...flowConditions, [typedKey]: value };
        }
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

export const prepareFlowStatusConditions = (
  flowConditions: FlowWhere,
  statusFilter: FlowStatusFilter | null
): FlowWhere => {
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
};

export const buildSearchFlowsConditions = (
  uniqueFlowEntities: UniqueFlowEntity[],
  flowFilters?: FlowWhere
): FlowWhere => {
  const whereClauses = uniqueFlowEntities.map((flow) => ({
    [Cond.AND]: [
      { id: flow.id },
      flow.versionID ? { versionID: flow.versionID } : {},
    ],
  }));

  if (flowFilters) {
    return {
      [Cond.AND]: [
        { deletedAt: null },
        { [Cond.OR]: whereClauses },
        flowFilters,
      ],
    } satisfies FlowWhere;
  }

  return {
    [Cond.OR]: whereClauses,
  };
};

export const buildSearchFlowsObjectConditions = (
  uniqueFlowEntities: UniqueFlowEntity[],
  flowObjectsWhere?: FlowObjectWhere
): FlowObjectWhere => {
  const whereClauses = uniqueFlowEntities.map((flow) => ({
    [Cond.AND]: [
      { flowID: flow.id },
      flow.versionID ? { versionID: flow.versionID } : {},
    ],
  }));

  if (flowObjectsWhere && Object.entries(flowObjectsWhere).length > 0) {
    return {
      [Cond.AND]: [flowObjectsWhere, ...whereClauses],
    } satisfies FlowObjectWhere;
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
): FlowOrderByWithSubEntity => {
  const orderBy: FlowOrderByWithSubEntity = {
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
