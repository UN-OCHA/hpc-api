import { Service } from 'typedi';
import { FlowCategory, FlowSearchResult, FlowSortField } from './graphql/types';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { Brand, createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';

@Service()
export class FlowService {
  async search(
    models: Database,
    first: number,
    afterCursor: string,
    sortField: FlowSortField,
    sortOrder: 'asc' | 'desc'
  ): Promise<FlowSearchResult> {
    let afterIndex = 0;

    const sortCondition = {
      column: sortField ?? 'id',
      order: sortOrder ?? 'DESC',
    };

    let flows = await models.flow.find({
      orderBy: sortCondition,
      limit: first,
    });
    const countRes = await models.flow.count();
    const count = countRes[0] as { count: number };

    if (afterCursor) {
      const after = flows.findIndex(
        (flow) => flow.id.toString() === afterCursor
      );
      if (after < 0) {
        throw new Error('Cursor not found');
      }
      afterIndex = after + 1;
    }

    const pagedData = flows.slice(afterIndex, afterIndex + first);
    const edges = await Promise.all(
      pagedData.map(async (flow) => {
        const categories: FlowCategory[] = await this.getFlowCategories(flow, models);

        return {
          node: {
            id: flow.id.valueOf(),
            amountUSD: flow.amountUSD.toString(),
            createdAt: flow.createdAt,
            categories: categories,
          },
          cursor: flow.id.toString(),
        };
      })
    );

    return {
      edges,
      pageInfo: {
        hasNextPage: count.count > afterIndex,
        hasPreviousPage: afterIndex > 0,
        startCursor: pagedData.length ? pagedData[0].id.toString() : '',
        endCursor: pagedData.length
          ? pagedData[pagedData.length - 1].id.toString()
          : '',
        pageSize: pagedData.length,
        sortField: sortCondition.column,
        sortOrder: sortCondition.order,
      },
      totalCount: count.count,
    };
  }

  private async getFlowCategories(
    flow: any,
    models: Database
  ): Promise<FlowCategory[]> {
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
