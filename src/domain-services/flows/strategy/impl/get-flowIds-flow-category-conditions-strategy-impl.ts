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

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const {
      models,
      flowCategoryConditions,
      shortcutFilter,
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

    if (shortcutFilter) {
      for (const shortcut of shortcutFilter) {
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

    let joinQuery = databaseConnection!
      .queryBuilder()
      .distinct('flow.id', 'flow.versionID')
      .from('flow')
      .join('categoryRef', function () {
        this.on('flow.id', '=', 'categoryRef.objectID').andOn(
          'flow.versionID',
          '=',
          'categoryRef.versionID'
        );
      });

    if (categoriesIds.length > 0) {
      joinQuery = joinQuery.andWhere(function () {
        this.where('categoryRef.categoryID', 'IN', categoriesIds)
          .andWhere('categoryRef.objectType', 'flow')
          .andWhere('flow.deletedAt', null);
      });
    }

    if (categoriesIdsFromShortcutFilterIN.length > 0) {
      joinQuery = joinQuery.andWhere(function () {
        this.where(
          'categoryRef.categoryID',
          'IN',
          categoriesIdsFromShortcutFilterIN
        )
          .andWhere('categoryRef.objectType', 'flow')
          .andWhere('flow.deletedAt', null);
      });
    }

    if (categoriesIdsFromShortcutFilterNOTIN.length > 0) {
      joinQuery = joinQuery.andWhere(function () {
        this.where(
          'categoryRef.categoryID',
          'NOT IN',
          categoriesIdsFromShortcutFilterNOTIN
        )
          .andWhere('categoryRef.objectType', 'flow')
          .andWhere('flow.deletedAt', null);
      });
    }

    const flows = await joinQuery;

    const mapFlows: UniqueFlowEntity[] = flows.map(
      (flow) =>
        ({
          id: flow.id,
          versionID: flow.versionID,
        }) as UniqueFlowEntity
    );

    return { flows: mapFlows };
  }
}
