import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Service } from 'typedi';
import { type Category } from './graphql/types';

@Service()
export class CategoryService {
  async getCategoriesForFlows(
    flowWithVersion: Map<FlowId, number[]>,
    models: Database
  ): Promise<Map<number, Map<number, Category[]>>> {
    // Group of flowIDs and its versions
    // Structure:
    // flowID: {
    //   versionID: [categories]
    // }
    const flowVersionCategoryMap = new Map<number, Map<number, Category[]>>();

    const flowIDs: FlowId[] = [];
    for (const flowID of flowWithVersion.keys()) {
      flowIDs.push(flowID);
    }

    const categoriesRef: Array<InstanceDataOfModel<Database['categoryRef']>> =
      await models.categoryRef.find({
        where: {
          objectID: {
            [Op.IN]: flowIDs,
          },
          objectType: 'flow',
        },
      });

    const categories: Array<InstanceDataOfModel<Database['category']>> =
      await models.category.find({
        where: {
          id: {
            [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
          },
        },
      });

    // Populate the map with categories for each flow
    for (const catRef of categoriesRef) {
      const flowId = catRef.objectID.valueOf();

      if (!flowVersionCategoryMap.has(flowId)) {
        flowVersionCategoryMap.set(flowId, new Map());
      }

      // Here the key is the versionID of the flow
      const flowVersionMap = flowVersionCategoryMap.get(flowId)!;

      const flowVersion = catRef.versionID;
      if (!flowVersionMap.has(flowVersion)) {
        flowVersionMap.set(flowVersion, []);
      }

      const categoriesPerFlowVersion = flowVersionMap.get(flowVersion)!;

      const category = categories.find((cat) => cat.id === catRef.categoryID);

      if (
        category &&
        !categoriesPerFlowVersion.some(
          (cat) => cat.id === category.id.valueOf()
        )
      ) {
        const mappedCategory = this.mapCategoryToFlowCategory(category, catRef);
        categoriesPerFlowVersion.push(mappedCategory);
      }
    }

    return flowVersionCategoryMap;
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
      parentID: category.parentID ? category.parentID.valueOf() : null,
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
      versionID: categoryRef.versionID,
    };
  }

  async findCategories(models: Database, where: any) {
    const category = await models.category.find({
      where,
    });

    return category;
  }

  async findCategoryRefs(models: Database, where: any) {
    const categoryRef = await models.categoryRef.find({
      where,
    });

    return categoryRef;
  }
}
