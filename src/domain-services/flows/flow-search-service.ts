import { Service } from 'typedi';
import { FlowSearchResult, FlowSortField } from './graphql/types';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { OrganizationService } from '../organizations/organization-service';
import { LocationService } from '../location/location-service';
import { PlanService } from '../plans/plan-service';
import { UsageYearService } from '../usage-years/usage-year-service';
import { CategoryService } from '../categories/category-service';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';

@Service()
export class FlowSearchService {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly locationService: LocationService,
    private readonly planService: PlanService,
    private readonly usageYearService: UsageYearService,
    private readonly categoryService: CategoryService
  ) {}

  async search(
    models: Database,
    limit: number,
    afterCursor?: number,
    beforeCursor?: number,
    sortField?: FlowSortField,
    sortOrder?: 'asc' | 'desc'
  ): Promise<FlowSearchResult> {
    if (beforeCursor && afterCursor) {
      throw new Error('Cannot use before and after cursor at the same time');
    }

    const sortCondition = {
      column: sortField ?? 'id',
      order: sortOrder ?? 'desc',
    };

    const limitComputed = limit + 1; // Fetch one more item to check for hasNextPage

    let condition;
    if (afterCursor) {
      condition = {
        id: {
          [Op.GT]: createBrandedValue(afterCursor),
        },
      };
    } else if (beforeCursor) {
      condition = {
        id: {
          [Op.GT]: createBrandedValue(beforeCursor),
        },
      };
    }
    condition = {
      ...condition,
      activeStatus: true,
    };

    const [flowsIds, countRes] = await Promise.all([
      models.flow.find({
        orderBy: sortCondition,
        limit: limitComputed,
        where: condition,
      }),
      models.flow.count(),
    ]);

    const hasNextPage = flowsIds.length > limit;
    if (hasNextPage) {
      flowsIds.pop(); // Remove the extra item used to check hasNextPage
    }

    const count = countRes[0] as { count: number };

    const flowIdsList = flowsIds.map((flow) => flow.id);

    const organizationsFO: any[] = [];
    const locationsFO: any[] = [];
    const plansFO: any[] = [];
    const usageYearsFO: any[] = [];

    await this.getFlowObjects(
      flowIdsList,
      models,
      organizationsFO,
      locationsFO,
      plansFO,
      usageYearsFO
    );

    const [
      flows,
      categoriesMap,
      organizationsMap,
      locationsMap,
      plansMap,
      usageYearsMap,
    ] = await Promise.all([
      models.flow.find({
        where: {
          id: {
            [Op.IN]: flowIdsList,
          },
        },
      }),
      this.categoryService.getCategoriesForFlows(flowIdsList, models),
      this.organizationService.getOrganizationsForFlows(
        organizationsFO,
        models
      ),
      this.locationService.getLocationsForFlows(locationsFO, models),
      this.planService.getPlansForFlows(plansFO, models),
      this.usageYearService.getUsageYearsForFlows(usageYearsFO, models),
    ]);

    const items = flows.map((flow) => {
      const categories = categoriesMap.get(flow.id) || [];
      const organizations = organizationsMap.get(flow.id) || [];
      const locations = locationsMap.get(flow.id) || [];
      const plans = plansMap.get(flow.id) || [];
      const usageYears = usageYearsMap.get(flow.id) || [];

      return {
        id: flow.id.valueOf(),
        amountUSD: flow.amountUSD.toString(),
        createdAt: flow.createdAt,
        categories,
        organizations,
        locations,
        plans,
        usageYears,
        cursor: flow.id.valueOf(),
      };
    });

    return {
      flows: items,
      hasNextPage: limit <= flows.length,
      hasPreviousPage: afterCursor !== undefined,
      startCursor: flows.length ? flows[0].id.valueOf() : 0,
      endCursor: flows.length ? flows[flows.length - 1].id.valueOf() : 0,
      pageSize: flows.length,
      sortField: sortCondition.column,
      sortOrder: sortCondition.order,
      total: count.count,
    };
  }

  private async getFlowObjects(
    flowIds: FlowId[],
    models: Database,
    organizationsFO: any[],
    locationsFO: any[],
    plansFO: any[],
    usageYearsFO: any[]
  ): Promise<void> {
    const flowObjects = await models.flowObject.find({
      where: {
        flowID: {
          [Op.IN]: flowIds,
        },
      },
    });

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
  }
}
