import { type Database } from '@unocha/hpc-api-core/src/db';
import { type CategoryId } from '@unocha/hpc-api-core/src/db/models/category';
import {
  Op,
  type Condition,
} from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
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

    // Search categoriesRef with categoriesID IN and categoriesIdsFromShortcutFilterIN
    // and categoriesIdsFromShortcutFilterNOTIN
    const where: Condition<InstanceOfModel<Database['categoryRef']>> = {
      objectType: 'flow',
    };

    if (categoriesIdsFromShortcutFilterNOTIN.length > 0) {
      where['categoryID'] = {
        [Op.NOT_IN]: categoriesIdsFromShortcutFilterNOTIN,
      };
    }

    const categoriesIDsIN = [
      ...categoriesIds,
      ...categoriesIdsFromShortcutFilterIN,
    ];

    if (categoriesIDsIN.length > 0) {
      where['categoryID'] = { [Op.IN]: categoriesIds };
    }

    const categoriesRef = await models.categoryRef.find({
      where,
      distinct: ['objectID', 'versionID'],
    });

    // Map categoryRef to UniqueFlowEntity (flowId and versionID)
    const flowIDsFromCategoryRef: UniqueFlowEntity[] = categoriesRef.map(
      (catRef) => ({
        id: createBrandedValue(catRef.objectID),
        versionID: catRef.versionID,
      })
    );

    // Since the list of UniqueFlowEntities can be really large ~370k entries
    // we need to do it using chunks

    // NOTE: this call is ajusted in size to obtain the best performance
    // If greater than 100, there is no increase in performance
    // With 100 the average time is ~16s
    // ie: 10000 takes ~3 min
    // 5000 takes ~2 min
    // and lower than 100, the performance decreases too
    // ie: 50 takes ~20 secs
    // 10 takes ~30 secs
    const flowObjectsModels = await this.flowService.progresiveSearch(
      models,
      flowIDsFromCategoryRef,
      100,
      0,
      false, // Not stop when reaching limit
      []
    );

    const mapFlows: UniqueFlowEntity[] = flowObjectsModels.map(
      (flow) =>
        ({
          id: flow.id,
          versionID: flow.versionID,
        }) satisfies UniqueFlowEntity
    );

    return { flows: mapFlows };
  }
}
