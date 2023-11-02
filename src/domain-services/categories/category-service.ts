import { Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowCategory } from '../flows/graphql/types';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';

@Service()
export class CategoryService {
  async getCategoriesForFlows(
    flowsIds: FlowId[],
    models: Database
  ): Promise<Map<number, FlowCategory[]>> {
    const flowLinks = await models.flowLink.find({
      where: {
        childID: {
          [Op.IN]: flowsIds,
        },
      },
    });

    const flowLinksBrandedIds = flowLinks.map((flowLink) =>
      createBrandedValue(flowLink.parentID)
    );

    const categoriesRef = await models.categoryRef.find({
      where: {
        objectID: {
          [Op.IN]: flowLinksBrandedIds,
        },
      },
    });

    const categories = await models.category.find({
      where: {
        id: {
          [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
        },
      },
    });

    // Group categories by flow ID for easy mapping
    const categoriesMap = new Map<number, FlowCategory[]>();

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

      categoriesForFlow.push(this.mapCategoryToFlowCategory(category));
    });

    return categoriesMap;
  }

  private mapCategoryToFlowCategory = (
    category: InstanceDataOfModel<Database['category']>
  ): FlowCategory => ({
    id: category.id,
    name: category.name,
    group: category.group,
  });
}
