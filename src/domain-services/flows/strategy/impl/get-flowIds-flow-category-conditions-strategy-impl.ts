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

  // TODO: rewrite
  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const {
      models,
      flowCategoryConditions,
      shortcutFilters,
      databaseConnection,
    } = args;

    let categoriesIds: CategoryId[] = [];

    let whereClause = null;
    if (flowCategoryConditions) {
      whereClause = mapFlowCategoryConditionsToWhereClause(
        flowCategoryConditions
      );
    }
    if (whereClause) {
      const categories = await this.categoryService.findCategories(
        models,
        whereClause
      );

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

    // FIXME: rewrite this query with model find
    let joinQuery = databaseConnection!
      .queryBuilder()
      .distinct('flow.id', 'flow.versionID')
      .from('flow')
      .where('flow.deletedAt', null)
      .join('categoryRef', function () {
        this.on('flow.id', '=', 'categoryRef.objectID').andOn(
          'flow.versionID',
          '=',
          'categoryRef.versionID'
        );
      });

    if (categoriesIds.length > 0) {
      joinQuery = joinQuery.andWhere(function () {
        this.where('categoryRef.categoryID', 'IN', categoriesIds).andWhere(
          'categoryRef.objectType',
          'flow'
        );
      });
    }

    if (categoriesIdsFromShortcutFilterIN.length > 0) {
      joinQuery = joinQuery.andWhere(function () {
        this.where(
          'categoryRef.categoryID',
          'IN',
          categoriesIdsFromShortcutFilterIN
        ).andWhere('categoryRef.objectType', 'flow');
      });
    }

    if (categoriesIdsFromShortcutFilterNOTIN.length > 0) {
      joinQuery = joinQuery.andWhere(function () {
        this.where(
          'categoryRef.categoryID',
          'NOT IN',
          categoriesIdsFromShortcutFilterNOTIN
        ).andWhere('categoryRef.objectType', 'flow');
      });
    }

    const flows = await joinQuery;

    const mapFlows: UniqueFlowEntity[] = flows.map(
      (flow) =>
        ({
          id: flow.id,
          versionID: flow.versionID,
        }) satisfies UniqueFlowEntity
    );

    return { flows: mapFlows };
  }
}
