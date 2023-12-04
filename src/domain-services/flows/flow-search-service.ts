import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { CategoryService } from '../categories/category-service';
import { type Category } from '../categories/graphql/types';
import { ExternalReferenceService } from '../external-reference/external-reference-service';
import { FlowLinkService } from '../flow-link/flow-link-service';
import { FlowObjectService } from '../flow-object/flow-object-service';
import { type FlowObject } from '../flow-object/model';
import { type BaseLocation } from '../location/graphql/types';
import { LocationService } from '../location/location-service';
import { type Organization } from '../organizations/graphql/types';
import { OrganizationService } from '../organizations/organization-service';
import { type BasePlan } from '../plans/graphql/types';
import { PlanService } from '../plans/plan-service';
import { ReportDetailService } from '../report-details/report-detail-service';
import { type UsageYear } from '../usage-years/grpahql/types';
import { UsageYearService } from '../usage-years/usage-year-service';
import {
  type FlowObjectFilters,
  type SearchFlowsArgs,
  type SearchFlowsArgsNonPaginated,
  type SearchFlowsFilters,
} from './graphql/args';
import {
  type FlowPaged,
  type FlowParkedParentSource,
  type FlowSearchResult,
  type FlowSearchResultNonPaginated,
  type FlowSearchTotalAmountResult,
  type FlowSortField,
} from './graphql/types';
import { type FlowEntity } from './model';
import { type FlowSearchStrategy } from './strategy/flow-search-strategy';
import { FlowObjectFiltersStrategy } from './strategy/impl/flow-object-conditions-strategy';
import { OnlyFlowFiltersStrategy } from './strategy/impl/only-flow-conditions-strategy';

@Service()
export class FlowSearchService {
  constructor(
    private readonly onlyFlowFiltersStrategy: OnlyFlowFiltersStrategy,
    private readonly flowObjectFiltersStrategy: FlowObjectFiltersStrategy,
    private readonly organizationService: OrganizationService,
    private readonly locationService: LocationService,
    private readonly planService: PlanService,
    private readonly usageYearService: UsageYearService,
    private readonly categoryService: CategoryService,
    private readonly flowLinkService: FlowLinkService,
    private readonly externalReferenceService: ExternalReferenceService,
    private readonly reportDetailService: ReportDetailService,
    private readonly flowObjectService: FlowObjectService
  ) {}

  async search(
    models: Database,
    filters: SearchFlowsArgs
  ): Promise<FlowSearchResult> {
    const { limit, afterCursor, beforeCursor, sortField, sortOrder } = filters;

    const orderBy:
      | { column: FlowSortField; order: 'asc' | 'desc' }
      | Array<{ column: FlowSortField; order: 'asc' | 'desc' }> = {
      column: sortField ?? 'updatedAt',
      order: sortOrder ?? 'desc',
    };

    const { flowFilters, flowObjectFilters } = filters;

    const cursorCondition = this.buildCursorCondition(
      beforeCursor,
      afterCursor,
      orderBy
    );

    // Determine strategy of how to search for flows
    const { strategy, conditions } = this.determineStrategy(
      flowFilters,
      flowObjectFilters
    );

    // Fetch one more item to check for hasNextPage
    const limitComputed = limit + 1;

    // Obtain flows and its count based on the strategy selected
    const { flows, count } = await strategy.search(
      conditions,
      models,
      orderBy,
      limitComputed,
      cursorCondition
    );

    // Remove the extra item used to check hasNextPage
    const hasNextPage = flows.length > limit;
    if (hasNextPage) {
      flows.pop();
    }

    const flowIds: FlowId[] = flows.map((flow) => flow.id);

    // Obtain external references and flow objects in parallel
    const [externalReferencesMap, flowObjects] = await Promise.all([
      this.externalReferenceService.getExternalReferencesForFlows(
        flowIds,
        models
      ),
      this.flowObjectService.getFlowObjectByFlowId(models, flowIds),
    ]);

    // Map flow objects to their respective arrays
    const organizationsFO: FlowObject[] = [];
    const locationsFO: FlowObject[] = [];
    const plansFO: FlowObject[] = [];
    const usageYearsFO: FlowObject[] = [];

    this.groupByFlowObjectType(
      flowObjects,
      organizationsFO,
      locationsFO,
      plansFO,
      usageYearsFO
    );

    // Obtain flow links
    const flowLinksMap = await this.flowLinkService.getFlowLinksForFlows(
      flowIds,
      models
    );

    // Perform all nested queries in parallel
    const [
      categoriesMap,
      organizationsMap,
      locationsMap,
      plansMap,
      usageYearsMap,
      reportDetailsMap,
    ] = await Promise.all([
      this.categoryService.getCategoriesForFlows(flowLinksMap, models),
      this.organizationService.getOrganizationsForFlows(
        organizationsFO,
        models
      ),
      this.locationService.getLocationsForFlows(locationsFO, models),
      this.planService.getPlansForFlows(plansFO, models),
      this.usageYearService.getUsageYearsForFlows(usageYearsFO, models),
      this.reportDetailService.getReportDetailsForFlows(flowIds, models),
    ]);

    const items = await Promise.all(
      flows.map(async (flow) => {
        const flowLink = flowLinksMap.get(flow.id) ?? [];
        const categories = categoriesMap.get(flow.id) ?? [];
        const organizations = organizationsMap.get(flow.id) ?? [];
        const locations = locationsMap.get(flow.id) ?? [];
        const plans = plansMap.get(flow.id) ?? [];
        const usageYears = usageYearsMap.get(flow.id) ?? [];
        const externalReferences = externalReferencesMap.get(flow.id) ?? [];
        const reportDetails = reportDetailsMap.get(flow.id) ?? [];

        const reportDetailsWithChannel =
          this.reportDetailService.addChannelToReportDetails(
            reportDetails,
            categories
          );

        let parkedParentSource: FlowParkedParentSource[] = [];
        if (flow.activeStatus && flowLink.length > 0) {
          parkedParentSource = await this.getParketParents(
            flow,
            flowLink,
            models
          );
        }

        const childIDs: number[] =
          (flowLinksMap
            .get(flow.id)
            ?.filter(
              (flowLink) => flowLink.parentID === flow.id && flowLink.depth > 0
            )
            .map((flowLink) => flowLink.childID.valueOf()) as number[]) ?? [];

        const parentIDs: number[] =
          (flowLinksMap
            .get(flow.id)
            ?.filter(
              (flowLink) => flowLink.childID === flow.id && flowLink.depth > 0
            )
            .map((flowLink) => flowLink.parentID.valueOf()) as number[]) ?? [];

        return this.buildFlowDTO(
          flow,
          categories,
          organizations,
          locations,
          plans,
          usageYears,
          childIDs,
          parentIDs,
          externalReferences,
          reportDetailsWithChannel,
          parkedParentSource,
          sortField
        );
      })
    );

    return {
      flows: items,
      hasNextPage: limit <= flows.length,
      hasPreviousPage: afterCursor !== undefined,
      startCursor: flows.length ? items[0].cursor : '',
      endCursor: flows.length ? items.at(-1)?.cursor ?? '' : '',
      pageSize: flows.length,
      sortField: sortField ?? 'updatedAt',
      sortOrder: sortOrder ?? 'desc',
      total: count,
    };
  }

  prepareFlowConditions(flowFilters: SearchFlowsFilters): any {
    let flowConditions = {};

    if (flowFilters) {
      for (const [key, value] of Object.entries(flowFilters)) {
        if (value !== undefined) {
          if (Array.isArray(value) && value.length !== 0) {
            flowConditions = { ...flowConditions, [key]: { [Op.IN]: value } };
          } else {
            flowConditions = { ...flowConditions, [key]: value };
          }
        }
      }
    }

    return flowConditions;
  }

  prepareFlowObjectConditions(
    flowObjectFilters: FlowObjectFilters[]
  ): Map<string, Map<string, number[]>> {
    const flowObjectsConditions: Map<string, Map<string, number[]>> = new Map<
      string,
      Map<string, number[]>
    >();

    for (const flowObjectFilter of flowObjectFilters) {
      const { objectType, direction, objectID } = flowObjectFilter;

      if (!flowObjectsConditions.has(objectType)) {
        flowObjectsConditions.set(objectType, new Map<string, number[]>());
      }

      const refDirectionMap = flowObjectsConditions.get(objectType);
      if (!refDirectionMap!.has(direction)) {
        refDirectionMap!.set(direction, []);
      }

      const objectIDsArray = refDirectionMap!.get(direction);

      if (objectIDsArray!.includes(objectID)) {
        throw new Error(
          `Duplicate flow object filter: ${objectType} ${direction} ${objectID}`
        );
      }

      objectIDsArray!.push(objectID);
    }

    return flowObjectsConditions;
  }

  determineStrategy(
    flowFilters: SearchFlowsFilters,
    flowObjectFilters: FlowObjectFilters[]
  ): { strategy: FlowSearchStrategy; conditions: any } {
    let conditions = {};

    const isFlowFilterDefined = flowFilters !== undefined;
    const isFlowObjectFilterDefined = flowObjectFilters !== undefined;
    const isFlowObjectFiltersNotEmpty =
      isFlowObjectFilterDefined && flowObjectFilters.length !== 0;

    if (
      (!isFlowFilterDefined &&
        (!isFlowObjectFilterDefined || !isFlowObjectFiltersNotEmpty)) ||
      (isFlowFilterDefined &&
        (!isFlowObjectFilterDefined || !isFlowObjectFiltersNotEmpty))
    ) {
      const flowConditions = this.prepareFlowConditions(flowFilters);
      conditions = { ...conditions, ...flowConditions };
      return { strategy: this.onlyFlowFiltersStrategy, conditions };
    } else if (!isFlowFilterDefined && isFlowObjectFiltersNotEmpty) {
      const flowObjectConditions =
        this.prepareFlowObjectConditions(flowObjectFilters);
      conditions = { ...conditions, ...flowObjectConditions };

      return {
        strategy: this.flowObjectFiltersStrategy,
        conditions: this.buildConditionsMap(undefined, flowObjectConditions),
      };
    } else if (isFlowFilterDefined && isFlowObjectFiltersNotEmpty) {
      const flowConditions = this.prepareFlowConditions(flowFilters);
      const flowObjectConditions =
        this.prepareFlowObjectConditions(flowObjectFilters);
      conditions = {
        ...conditions,
        ...flowConditions,
        ...flowObjectConditions,
      };

      return {
        strategy: this.flowObjectFiltersStrategy,
        conditions: this.buildConditionsMap(
          flowConditions,
          flowObjectConditions
        ),
      };
    }

    throw new Error('Invalid combination of flowFilters and flowObjectFilters');
  }

  private buildConditionsMap(flowConditions: any, flowObjectConditions: any) {
    const conditionsMap = new Map();
    conditionsMap.set('flowObjects', flowObjectConditions);
    conditionsMap.set('flow', flowConditions);
    return conditionsMap;
  }

  private groupByFlowObjectType(
    flowObjects: FlowObject[],
    organizationsFO: FlowObject[],
    locationsFO: FlowObject[],
    plansFO: FlowObject[],
    usageYearsFO: FlowObject[]
  ) {
    for (const flowObject of flowObjects) {
      if (flowObject.objectType === 'organization') {
        organizationsFO.push(flowObject);
      } else if (flowObject.objectType === 'location') {
        locationsFO.push(flowObject);
      } else if (flowObject.objectType === 'plan') {
        plansFO.push(flowObject);
      } else if (flowObject.objectType === 'usageYear') {
        usageYearsFO.push(flowObject);
      }
    }
  }

  private async getParketParents(
    flow: any,
    flowLink: any[],
    models: Database
  ): Promise<any> {
    const flowLinksDepth0 = flowLink.filter((flowLink) => flowLink.depth === 0);

    const flowLinksParent = flowLinksDepth0.filter(
      (flowLink) => flowLink.parentID === flow.id
    );

    const categories = await models.category.find({
      where: {
        group: 'flowType',
        name: 'parked',
      },
    });

    const categoriesIDs = categories.map((category) => category.id);

    const categoryRef = await models.categoryRef.find({
      where: {
        categoryID: {
          [Op.IN]: categoriesIDs,
        },
        versionID: flow.versionID,
      },
    });

    const parentFlows = flowLinksParent
      .filter((flowLink) => {
        return categoryRef.some(
          (categoryRef) =>
            categoryRef.objectID.valueOf() === flowLink.parentID.valueOf()
        );
      })
      .map((flowLink) => {
        return flowLink.parentID.valueOf();
      });

    return parentFlows;
  }

  private buildCursorCondition(
    beforeCursor: string,
    afterCursor: string,
    orderBy:
      | { column: FlowSortField; order: 'asc' | 'desc' }
      | Array<{ column: FlowSortField; order: 'asc' | 'desc' }>
  ) {
    if (beforeCursor && afterCursor) {
      throw new Error('Cannot use before and after cursor at the same time');
    }

    if (!beforeCursor && !afterCursor) {
      return {};
    }

    if (Array.isArray(orderBy)) {
      // Build iterations of cursor conditions
      const cursorConditions = orderBy.map((orderBy) => {
        return this.buildCursorConditionForSingleOrderBy(
          beforeCursor,
          afterCursor,
          orderBy
        );
      });

      // Combine cursor conditions
      return { [Cond.AND]: cursorConditions };
    }

    return this.buildCursorConditionForSingleOrderBy(
      beforeCursor,
      afterCursor,
      orderBy
    );
  }

  private buildCursorConditionForSingleOrderBy(
    beforeCursor: string,
    afterCursor: string,
    orderBy: { column: FlowSortField; order: 'asc' | 'desc' }
  ) {
    let cursorCondition;

    const comparisonOperator =
      (afterCursor && orderBy.order === 'asc') ||
      (beforeCursor && orderBy.order === 'desc')
        ? Op.GT
        : Op.LT;

    const cursorValue = afterCursor || beforeCursor;

    if (cursorValue) {
      cursorCondition = {
        [orderBy.column]: {
          [comparisonOperator]: cursorValue,
        },
      };
    }

    return cursorCondition;
  }

  private buildFlowDTO(
    flow: FlowEntity,
    categories: Category[],
    organizations: Organization[],
    locations: BaseLocation[],
    plans: BasePlan[],
    usageYears: UsageYear[],
    childIDs: number[],
    parentIDs: number[],
    externalReferences: any[],
    reportDetails: any[],
    parkedParentSource: FlowParkedParentSource[],
    sortColumn?: FlowSortField
  ): FlowPaged {
    let cursor: string | number | Date = sortColumn
      ? flow.id.valueOf()
      : flow[sortColumn ?? 'updatedAt'];

    if (cursor instanceof Date) {
      cursor = cursor.toISOString();
    } else if (typeof cursor === 'number') {
      cursor = cursor.toString();
    }

    return {
      // Mandatory fields
      id: flow.id.valueOf(),
      versionID: flow.versionID,
      amountUSD: flow.amountUSD.toString(),
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
      activeStatus: flow.activeStatus,
      restricted: flow.restricted,
      // Optional fields
      categories,
      organizations,
      locations,
      plans,
      usageYears,
      childIDs,
      parentIDs,
      origAmount: flow.origAmount ? flow.origAmount.toString() : null,
      origCurrency: flow.origCurrency ? flow.origCurrency.toString() : null,
      externalReferences,
      reportDetails,
      parkedParentSource,
      // Paged item field
      cursor,
    };
  }

  async searchTotalAmount(
    models: Database,
    args: SearchFlowsArgsNonPaginated
  ): Promise<FlowSearchTotalAmountResult> {
    const { flowFilters, flowObjectFilters } = args;

    const { strategy, conditions } = this.determineStrategy(
      flowFilters,
      flowObjectFilters
    );

    const { flows, count } = await strategy.search(conditions, models);

    const flowsAmountUSD: Array<string | number> = flows.map(
      (flow) => flow.amountUSD
    );

    const totalAmount = flowsAmountUSD.reduce((a, b) => +a + +b, 0);

    return {
      totalAmountUSD: totalAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      flowsCount: count,
    };
  }

  async searchBatches(
    models: Database,
    args: SearchFlowsArgs
  ): Promise<FlowSearchResultNonPaginated> {
    const flowSearchResponse = await this.search(models, args);

    const flows: FlowPaged[] = flowSearchResponse.flows;

    let hasNextPage = flowSearchResponse.hasNextPage;

    let cursor = flowSearchResponse.endCursor;
    let nextArgs: SearchFlowsArgs = { ...args, afterCursor: cursor };

    let nextFlowSearchResponse: FlowSearchResult;
    while (hasNextPage) {
      nextFlowSearchResponse = await this.search(models, nextArgs);

      flows.push(...nextFlowSearchResponse.flows);

      hasNextPage = nextFlowSearchResponse.hasNextPage;
      cursor = nextFlowSearchResponse.endCursor;

      // Update the cursor for the next iteration
      nextArgs = { ...args, afterCursor: cursor };
    }

    return { flows, flowsCount: flows.length };
  }
}
