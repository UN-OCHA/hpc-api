import { type CategoryId } from '@unocha/hpc-api-core/src/db/models/category';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { CategoryService } from '../../../categories/category-service';
import { type UniqueFlowEntity } from '../../model';
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
  constructor(private readonly categoryService: CategoryService) {}

  private readonly categoryIDsMap: Map<string, number> = new Map<
    string,
    number
  >([
    ['Pending', 45],
    ['Pledge', 46],
    ['Commitment', 47],
    ['Paid', 48],
    ['Standard', 133],
    ['Pass through', 136],
    ['Carryover', 137],
    ['Parked', 1252],
  ]);

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const {
      models,
      flowCategoryConditions,
      shortcutFilter,
      databaseConnection,
    } = args;

    const categoriesIds: CategoryId[] = [];

    const whereClause = mapFlowCategoryConditionsToWhereClause(
      flowCategoryConditions!
    );

    if (whereClause) {
      const categories = await this.categoryService.findCategories(
        models,
        whereClause
      );

      categories.map((category) => category.id);
    }

    // Add category IDs from shortcut filter
    // to the list of category IDs IN or NOT_IN
    const categoriesIdsFromShortcutFilterIN: CategoryId[] = [];
    const categoriesIdsFromShortcutFilterNOTIN: CategoryId[] = [];

    if (shortcutFilter) {
      for (const shortcut of shortcutFilter) {
        const shortcutCategoryID = this.categoryIDsMap.get(shortcut.category);
        if (shortcutCategoryID) {
          if (shortcut.operation === Op.IN) {
            categoriesIdsFromShortcutFilterIN.push(
              createBrandedValue(shortcutCategoryID)
            );
          } else {
            categoriesIdsFromShortcutFilterNOTIN.push(
              createBrandedValue(shortcutCategoryID)
            );
          }
        }
      }
    }

    let query = databaseConnection!
      .queryBuilder()
      .distinct('objectID', 'versionID')
      .select('objectID', 'versionID')
      .from('categoryRef');

    if (categoriesIds.length > 0) {
      query = query
        .orWhere('categoryID', 'IN', categoriesIds)
        .andWhere('objectType', 'flow');
    }

    if (categoriesIdsFromShortcutFilterIN.length > 0) {
      query = query
        .orWhere('categoryID', 'IN', categoriesIdsFromShortcutFilterIN)
        .andWhere('objectType', 'flow');
    }

    if (categoriesIdsFromShortcutFilterNOTIN.length > 0) {
      query = query
        .orWhere('categoryID', 'NOT IN', categoriesIdsFromShortcutFilterNOTIN)
        .andWhere('objectType', 'flow');
    }

    const flows = await query;
    const mapFlows: UniqueFlowEntity[] = flows.map(
      (flow) =>
        ({
          id: flow.objectID,
          versionID: flow.versionID,
        }) as UniqueFlowEntity
    );

    return { flows: mapFlows };
  }
}
