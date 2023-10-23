import { Service } from 'typedi';
import { FlowSearchResult, FlowSortField } from './graphql/types';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { Brand, createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';

import { dbConnection } from '../../server';
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
      order: sortOrder ?? 'ASC',
    };

    let flows = await models.flow.find({
      orderBy: sortCondition,
      limit: first,
    });
    const count = await dbConnection.raw('SELECT COUNT(*) FROM flow');

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
        const categories: string[] = await this.getFlowCategories(flow, models);

        return {
          node: {
            id: flow.id.valueOf(),
            amountUSD: flow.amountUSD.toString(),
            createdAt: flow.createdAt,
            category: categories[0],
          },
          cursor: flow.id.toString(),
        };
      })
    );

    return {
      edges,
      pageInfo: {
        hasNextPage: count > first,
        hasPreviousPage: afterIndex > 0,
        startCursor: pagedData.length ? pagedData[0].id.toString() : '',
        endCursor: pagedData.length
          ? pagedData[pagedData.length - 1].id.toString()
          : '',
        pageSize: pagedData.length,
        sortField: sortCondition.column,
        sortOrder: sortCondition.order,
      },
      totalCount: count,
    };
  }

  private async getFlowTypeCategory(models: Database): Promise<any> {
    return models.category.find({
      where: { group: 'flowType', name: 'Parked' },
    });
  }

  private async getFlowCategories(
    flow: any,
    models: Database
  ): Promise<string[]> {
    const flowIdBranded = createBrandedValue(flow.id);
    const flowLinks = await models.flowLink.find({
      where: {
        childID: flowIdBranded,
      },
    });

    //const flowTypeCategory = await this.getFlowTypeCategory(models);
    const flowLinksBrandedIds = flowLinks.map((flowLink) =>
      createBrandedValue(flowLink.parentID)
    );

    const categoriesRef = await models.categoryRef.find({
      where: {
        objectID: {
          [Op.IN]: flowLinksBrandedIds,
        },
        versionID: flow.versionID,
        categoryID: createBrandedValue(1051),
      },
    });

    const categories = await models.category.find({
      where: {
        id: {
          [Op.IN]: categoriesRef.map((catRef) => catRef.categoryID),
        },
      },
    });

    return categories.map((cat) => {
      return cat.name;
    });
  }
}
