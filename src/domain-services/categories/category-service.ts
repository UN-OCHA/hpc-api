import { Database } from '@unocha/hpc-api-core/src/db';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { Category } from './graphql/types';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

// TODO: add proper type for flowLinks
@Service()
export class CategoryService {
  async getCategoriesForFlows(
    flowLinks: Map<number, InstanceDataOfModel<Database['flowLink']>[]>,
    models: Database
  ): Promise<Map<number, Category[]>> {
    const flowLinksBrandedIds = [];
    for (const flowLink of flowLinks.keys()) {
      flowLinksBrandedIds.push(createBrandedValue(flowLink));
    }

    // Group categories by flow ID for easy mapping
    const categoriesMap = new Map<number, Category[]>();

    if (flowLinksBrandedIds.length === 0) {
      return categoriesMap;
    }

    const categoriesRef: InstanceDataOfModel<Database['categoryRef']>[] =
      await models.categoryRef.find({
        where: {
          objectID: {
            [Op.IN]: flowLinksBrandedIds,
          },
        },
      });

    const categories: InstanceDataOfModel<Database['category']>[] =
      await models.category.find({
        where: {
          id: {
            [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
          },
        },
      });

    // Populate the map with categories for each flow
    categoriesRef.forEach((catRef) => {
      const flowId = catRef.objectID.valueOf();

      if (!categoriesMap.has(flowId)) {
        categoriesMap.set(flowId, []);
      }

      const categoriesForFlow = categoriesMap.get(flowId)!;

      const category = categories.find((cat) => cat.id === catRef.categoryID);

      if (!category) {
        throw new Error(`Category with ID ${catRef.categoryID} does not exist`);
      }

      categoriesForFlow.push(this.mapCategoryToFlowCategory(category, catRef));
    });

    return categoriesMap;
  }

  private mapCategoryToFlowCategory(
    category: InstanceDataOfModel<Database['category']>,
    categoryRef: InstanceDataOfModel<Database['categoryRef']>
  ): Category {
    return {
      id: category.id,
      name: category.name,
      group: category.group,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      description: category.description ?? '',
      parentID: category.parentID ? category.parentID.valueOf() : 0,
      code: category.code ?? '',
      includeTotals: category.includeTotals ?? false,
      categoryRef: {
        objectID: categoryRef.objectID.valueOf(),
        versionID: categoryRef.versionID,
        objectType: categoryRef.objectType,
        categoryID: category.id.valueOf(),
        createdAt: categoryRef.createdAt.toISOString(),
        updatedAt: categoryRef.updatedAt.toISOString(),
      },
    };
  }
}
