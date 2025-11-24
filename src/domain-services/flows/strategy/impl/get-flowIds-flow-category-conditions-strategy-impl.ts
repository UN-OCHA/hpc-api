import { type Database } from '@unocha/hpc-api-core/src/db';
import { type CategoryId } from '@unocha/hpc-api-core/src/db/models/category';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import {
  Op,
  type Condition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowService } from '../../flow-service';
import type { UniqueFlowEntity } from '../../model';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { mapFlowCategoryConditionsToWhereClause } from './utils';

@Service()
export class GetFlowIdsFromCategoryConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(private readonly flowService: FlowService) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { models, flowCategoryConditions, shortcutFilters } = args;

    let categoriesIds: CategoryId[] = [];

    let whereClause = null;
    if (flowCategoryConditions) {
      whereClause = mapFlowCategoryConditionsToWhereClause(
        flowCategoryConditions
      );
    }
    if (whereClause) {
      const categories = await models.category.find({
        where: whereClause,
      });

      categoriesIds = categories.map((category) => category.id);
    }

    // Add category IDs from shortcut filter
    // to the list of category IDs IN or NOT_IN
    const categoriesIdsFromShortcutFilterIN: CategoryId[] = [];
    const categoriesIdsFromShortcutFilterNOTIN: CategoryId[] = [];

    if (shortcutFilters) {
      for (const shortcut of shortcutFilters) {
        if (shortcut.operation === Op.IN) {
          categoriesIdsFromShortcutFilterIN.push(
            createBrandedValue(shortcut.id)
          );
        } else {
          categoriesIdsFromShortcutFilterNOTIN.push(
            createBrandedValue(shortcut.id)
          );
        }
      }
    }

    // Search categoryRef rows for the relevant categories, then post-process
    // so multiple IN filters are treated with AND semantics. We fetch rows
    // (not distinct) so we can count which categories each flow has, then
    // only keep flows that contain all required IN categories and none of the
    // forbidden NOT_IN categories.
    const where: Condition<InstanceOfModel<Database['categoryRef']>> = {
      objectType: 'flow',
    };

    const categoriesIDsIN = [
      ...categoriesIds,
      ...categoriesIdsFromShortcutFilterIN,
    ];
    const categoriesIDsNOTIN = categoriesIdsFromShortcutFilterNOTIN;

    // To limit the rows fetched, request refs whose categoryID is in the
    // union of required IN and forbidden NOT_IN (if any). If there are no
    // constraints, the where will only include objectType and return all refs
    const fetchCategoryIDs = [
      ...new Set([...categoriesIDsIN, ...categoriesIDsNOTIN]),
    ];

    if (fetchCategoryIDs.length > 0) {
      // Use the raw values from DB for the IN filter. We'll stringify for
      // comparisons when grouping below.
      where['categoryID'] = { [Op.IN]: fetchCategoryIDs };
    }

    // Fetch all matching categoryRef rows so we can
    // determine which categories each flow has.
    const categoriesRef = await models.categoryRef.find({ where });

    // Group refs by flow (objectID + versionID) and collect the set of
    // categoryIDs attached to each flow.
    const flowMap = new Map<
      string,
      { id: FlowId; versionID: number; categorySet: Set<string> }
    >();

    for (const catRef of categoriesRef) {
      getOrCreate(flowMap, `${catRef.objectID}::${catRef.versionID}`, () => ({
        id: createBrandedValue(catRef.objectID),
        versionID: catRef.versionID,
        categorySet: new Set<string>(),
      })).categorySet.add(String(catRef.categoryID));
    }

    const requiredSet = new Set(categoriesIDsIN.map(String));
    const forbiddenSet = new Set(categoriesIDsNOTIN.map(String));

    const flowIDsFromCategoryRef: UniqueFlowEntity[] = [];

    for (const entry of flowMap.values()) {
      // Exclude flows that contain any forbidden category
      let hasForbidden = false;
      for (const f of forbiddenSet) {
        if (entry.categorySet.has(f)) {
          hasForbidden = true;
          break;
        }
      }
      if (hasForbidden) {
        continue;
      }

      // Ensure the flow contains all required categories (AND semantics).
      let hasAllRequired = true;
      for (const r of requiredSet) {
        if (!entry.categorySet.has(r)) {
          hasAllRequired = false;
          break;
        }
      }
      if (!hasAllRequired) {
        continue;
      }

      flowIDsFromCategoryRef.push({ id: entry.id, versionID: entry.versionID });
    }
    return { flows: flowIDsFromCategoryRef };
  }
}
