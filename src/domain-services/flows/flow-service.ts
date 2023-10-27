import { Service } from 'typedi';
import {
  FlowCategory,
  FlowLocation,
  FlowOrganization,
  FlowPlan,
  FlowSearchResult,
  FlowSortField,
  FlowUsageYear,
} from './graphql/types';
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
        const flowIdBranded = createBrandedValue(flow.id);

        const categories: FlowCategory[] = await this.getFlowCategories(
          flow,
          models
        );

        const flowObjects = await models.flowObject.find({
          where: {
            flowID: flowIdBranded,
          },
        });

        const organizationsFO: any[] = [];
        const locationsFO: any[] = [];
        const plansFO: any[] = [];
        const usageYearsFO: any[] = [];

        flowObjects.forEach((flowObject) => {
          if (flowObject.objectType === 'organization') {
            organizationsFO.push(flowObject);
          } else if (flowObject.objectType === 'location') {
            locationsFO.push(flowObject);
          } else if (flowObject.objectType === 'plan') {
            plansFO.push(flowObject);
          } else if (flowObject.objectType === 'usageYear') {
            usageYearsFO.push(flowObject);
          }
        });

        const organizations: FlowOrganization[] = await this.getOrganizations(
          organizationsFO,
          models
        );

        const locations: FlowLocation[] = await this.getLocations(
          locationsFO,
          models
        );

        const plans = await this.getPlans(plansFO, models);

        const usageYears = await this.getUsageYears(usageYearsFO, models);

        return {
          node: {
            id: flow.id.valueOf(),
            amountUSD: flow.amountUSD.toString(),
            createdAt: flow.createdAt,
            categories: categories,
            organizations: organizations,
            locations: locations,
            plans: plans,
            usageYears: usageYears,
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

  private async getOrganizations(
    organizationsFO: any[],
    models: Database
  ): Promise<FlowOrganization[]> {
    const organizations = await models.organization.find({
      where: {
        id: {
          [Op.IN]: organizationsFO.map((orgFO) => orgFO.objectID),
        },
      },
    });

    return organizations.map((org) => ({
      id: org.id,
      refDirection: organizationsFO.find((orgFO) => orgFO.objectID === org.id)
        .refDirection,
      name: org.name,
    }));
  }

  private async getLocations(
    locationsFO: any[],
    models: Database
  ): Promise<FlowLocation[]> {
    const locations = await models.location.find({
      where: {
        id: {
          [Op.IN]: locationsFO.map((locFO) => locFO.objectID),
        },
      },
    });

    return locations.map((loc) => ({
      id: loc.id.valueOf(),
      name: loc.name!,
    }));
  }

  private async getPlans(
    plansFO: any[],
    models: Database
  ): Promise<FlowPlan[]> {
    const plans = await models.plan.find({
      where: {
        id: {
          [Op.IN]: plansFO.map((planFO) => planFO.objectID),
        },
      },
    });

    const flowPlans: FlowPlan[] = [];

    for (const plan of plans) {
      const planVersion = await models.planVersion.find({
        where: {
          planId: plan.id,
          currentVersion: true,
        },
      });

      flowPlans.push({
        id: plan.id.valueOf(),
        name: planVersion[0].name,
      });
    }

    return flowPlans;
  }

  private async getUsageYears(
    usageYearsFO: any[],
    models: Database
  ): Promise<FlowUsageYear[]> {
    const usageYears = await models.usageYear.find({
      where: {
        id: {
          [Op.IN]: usageYearsFO.map((usageYearFO) => usageYearFO.objectID),
        },
      },
    });

    return usageYears.map((usageYear) => ({
      year: usageYear.year,
      direction: usageYearsFO.find(
        (usageYearFO) => usageYearFO.objectID === usageYear.id
      ).refDirection,
    }));
  }
    
}
