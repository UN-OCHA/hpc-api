import { type Database } from '@unocha/hpc-api-core/src/db';
import { type CategoryId } from '@unocha/hpc-api-core/src/db/models/category';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { CategoryService } from '../../../categories/category-service';
import { type FlowCategory } from '../../graphql/args';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { mapFlowCategoryConditionsToWhereClause } from './utils';

@Service()
export class GetFlowIdsFromCategoryConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(private readonly categoryService: CategoryService) {}

  async search(
    models: Database,
    _flowObjectsConditions: Map<string, Map<string, number[]>>,
    flowCategoryConditions: FlowCategory[],
    filterByPendingFlows: boolean | undefined
  ): Promise<FlowIdSearchStrategyResponse> {
    const whereClause = mapFlowCategoryConditionsToWhereClause(
      filterByPendingFlows,
      flowCategoryConditions
    );

    const categories = await this.categoryService.findCategories(
      models,
      whereClause
    );

    const categoriesIds: CategoryId[] = categories.map(
      (category) => category.id
    );

    const categoryRefs = await this.categoryService.findCategoryRefs(models, {
      categoryID: {
        [Op.IN]: categoriesIds,
      },
      objectType: 'flow',
    });

    // Map category refs to flow IDs
    // keep only unique values
    // and return the list of flow IDs
    const flowIds = [
      ...new Set(categoryRefs.map((categoryRef) => categoryRef.objectID)),
    ].map((flowId) => createBrandedValue(flowId));

    return { flowIDs: flowIds };
  }

  generateWhereClause(
    flowIds: FlowId[],
    _conditions: any,
    filterByPendingFlows: boolean
  ) {
    const operation = filterByPendingFlows === true ? Op.IN : Op.NOT_IN;
    return {
      id: {
        [operation]: flowIds,
      },
    };
  }
}
