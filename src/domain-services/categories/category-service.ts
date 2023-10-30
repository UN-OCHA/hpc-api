import { Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { FlowCategory } from '../flows/graphql/types';

@Service()
export class CategoryService {
  async getFlowCategory(flow: any, models: Database): Promise<FlowCategory[]> {
    const flowIdBranded = createBrandedValue(flow.id);
    const flowLinks = await models.flowLink.find({
      where: {
        childID: flowIdBranded,
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
        versionID: flow.versionID,
      },
    });

    const categories = await models.category.find({
      where: {
        id: {
          [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      group: cat.group,
    }));
  }
}
