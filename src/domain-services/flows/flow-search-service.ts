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
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { OrganizationService } from '../organizations/organization-service';
import { LocationService } from '../location/location-service';
import { PlanService } from '../plans/plan-service';
import { UsageYearService } from '../usage-years/usage-year-service';
import { CategoryService } from '../categories/category-service';
import { prepareConditionFromCursor } from '../../utils/graphql/pagination';

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
    first: number,
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

    let flows;
    const countRes = await models.flow.count();
    const count = countRes[0] as { count: number };

    const hasCursor = afterCursor || beforeCursor;

    if (hasCursor) {
      const condition = prepareConditionFromCursor(
        sortCondition,
        afterCursor,
        beforeCursor
      );

      flows = await models.flow.find({
        orderBy: sortCondition,
        limit: first,
        where: {
          ...condition,
        },
      });
    } else {
      flows = await models.flow.find({
        orderBy: sortCondition,
        limit: first,
      });
    }

    const items = await Promise.all(
      flows.map(async (flow) => {
        const categories: FlowCategory[] =
          await this.categoryService.getFlowCategory(flow, models);

        const organizationsFO: any[] = [];
        const locationsFO: any[] = [];
        const plansFO: any[] = [];
        const usageYearsFO: any[] = [];

        await this.getFlowObjects(
          flow,
          models,
          organizationsFO,
          locationsFO,
          plansFO,
          usageYearsFO
        );

        const organizationsPromise: Promise<FlowOrganization[]> =
          this.organizationService.getFlowObjectOrganizations(
            organizationsFO,
            models
          );

        const locationsPromise: Promise<FlowLocation[]> =
          this.locationService.getFlowObjectLocations(locationsFO, models);

        const plansPromise: Promise<FlowPlan[]> =
          this.planService.getFlowObjectPlans(plansFO, models);

        const usageYearsPromise: Promise<FlowUsageYear[]> =
          this.usageYearService.getFlowObjectUsageYears(usageYearsFO, models);

        const [organizations, locations, plans, usageYears] = await Promise.all(
          [
            organizationsPromise,
            locationsPromise,
            plansPromise,
            usageYearsPromise,
          ]
        );

        return {
          id: flow.id.valueOf(),
          amountUSD: flow.amountUSD.toString(),
          createdAt: flow.createdAt,
          categories: categories,
          organizations: organizations,
          locations: locations,
          plans: plans,
          usageYears: usageYears,
          cursor: flow.id.valueOf(),
        };
      })
    );

    return {
      flows: items,
      hasNextPage: first <= flows.length,
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
    flow: any,
    models: Database,
    organizationsFO: any[],
    locationsFO: any[],
    plansFO: any[],
    usageYearsFO: any[]
  ): Promise<void> {
    const flowIdBranded = createBrandedValue(flow.id);
    const flowObjects = await models.flowObject.find({
      where: {
        flowID: flowIdBranded,
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
