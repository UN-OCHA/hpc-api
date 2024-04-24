import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import type Knex from 'knex';
import { Service } from 'typedi';
import { type SortOrder } from '../../utils/graphql/pagination';
import { CategoryService } from '../categories/category-service';
import { type Category } from '../categories/graphql/types';
import { type ShortcutCategoryFilter } from '../categories/model';
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
import { type ReportDetail } from '../report-details/graphql/types';
import { ReportDetailService } from '../report-details/report-detail-service';
import { type UsageYear } from '../usage-years/graphql/types';
import { UsageYearService } from '../usage-years/usage-year-service';
import { FlowService } from './flow-service';
import type {
  FlowCategory,
  FlowObjectFilters,
  NestedFlowFilters,
  SearchFlowsArgs,
  SearchFlowsFilters,
} from './graphql/args';
import type {
  Flow,
  FlowParkedParentSource,
  FlowSearchResult,
  FlowSearchResultNonPaginated,
  FlowShortcutFilter,
  FlowSortField,
  FlowStatusFilter,
} from './graphql/types';
import type { FlowEntity, FlowNestedDirection, FlowOrderBy } from './model';
import { type FlowSearchStrategy } from './strategy/flow-search-strategy';
import { OnlyFlowFiltersStrategy } from './strategy/impl/only-flow-conditions-strategy-impl';
import { SearchFlowByFiltersStrategy } from './strategy/impl/search-flow-by-filters-strategy-impl';

@Service()
export class FlowSearchService {
  constructor(
    // Strategies
    private readonly onlyFlowFiltersStrategy: OnlyFlowFiltersStrategy,
    private readonly searchFlowByFiltersStrategy: SearchFlowByFiltersStrategy,
    // Services
    private readonly organizationService: OrganizationService,
    private readonly locationService: LocationService,
    private readonly planService: PlanService,
    private readonly usageYearService: UsageYearService,
    private readonly categoryService: CategoryService,
    private readonly flowLinkService: FlowLinkService,
    private readonly externalReferenceService: ExternalReferenceService,
    private readonly reportDetailService: ReportDetailService,
    private readonly flowObjectService: FlowObjectService,
    private readonly flowService: FlowService
  ) {}

  async search(
    models: Database,
    databaseConnection: Knex,
    filters: SearchFlowsArgs
  ): Promise<FlowSearchResult> {
    const {
      limit,
      nextPageCursor,
      prevPageCursor,
      sortField,
      sortOrder,
      shouldIncludeChildrenOfParkedFlows,
      nestedFlowFilters,
      status,
    } = filters;

    const orderBy: FlowOrderBy = this.buildOrderBy(sortField, sortOrder);

    const {
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      pending: isPendingFlows,
      commitment: isCommitmentFlows,
      paid: isPaidFlows,
      pledge: isPledgedFlows,
      carryover: isCarryoverFlows,
      parked: isParkedFlows,
      pass_through: isPassThroughFlows,
      standard: isStandardFlows,
    } = filters;

    // Returns an object like
    // { name: 'Pending review',
    // operation: 'IN'} []
    const shortcutFilter: ShortcutCategoryFilter[] | null =
      this.mapShortcutFilters(
        isPendingFlows,
        isCommitmentFlows,
        isPaidFlows,
        isPledgedFlows,
        isCarryoverFlows,
        isParkedFlows,
        isPassThroughFlows,
        isStandardFlows
      );

    // Once we've gathered all the filters, we need to determine the strategy
    // to use in order to obtain the flowIDs
    const strategy: FlowSearchStrategy = this.determineStrategy(
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      nestedFlowFilters,
      shortcutFilter,
      status,
      orderBy
    );

    const offset = nextPageCursor ?? prevPageCursor ?? 0;

    // We add 1 to the limit to check if there is a next page
    const searchLimit = limit + 1;

    const { flows, count } = await strategy.search({
      models,
      databaseConnection,
      limit: searchLimit,
      orderBy,
      offset,
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      nestedFlowFilters,
      // Shortcuts for categories
      shortcutFilter,
      statusFilter: status,
    });

    // Remove the extra item used to check hasNextPage
    const hasNextPage = flows.length > limit;
    if (hasNextPage) {
      flows.pop();
    }

    const flowIds: FlowId[] = [];
    const flowWithVersion: Map<FlowId, number[]> = new Map<FlowId, number[]>();

    // Obtain flow IDs and flow version IDs
    for (const flow of flows) {
      flowIds.push(flow.id);
      if (!flowWithVersion.has(flow.id)) {
        flowWithVersion.set(flow.id, []);
      }
      const flowVersionIDs = flowWithVersion.get(flow.id)!;
      flowVersionIDs.push(flow.versionID);
    }

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
      this.categoryService.getCategoriesForFlows(flowWithVersion, models),
      this.organizationService.getOrganizationsForFlows(
        organizationsFO,
        models
      ),
      this.locationService.getLocationsForFlows(locationsFO, models),
      this.planService.getPlansForFlows(plansFO, models),
      this.usageYearService.getUsageYearsForFlows(usageYearsFO, models),
      this.reportDetailService.getReportDetailsForFlows(flowIds, models),
    ]);

    const promises = flows.map(async (flow) => {
      const flowLink = flowLinksMap.get(flow.id) ?? [];

      // Categories Map follows the structure:
      // flowID: { versionID: [categories]}
      // So we need to get the categories for the flow version
      const categories = categoriesMap.get(flow.id);
      const categoriesByVersion = categories?.get(flow.versionID) ?? [];
      const organizations = organizationsMap.get(flow.id) ?? [];
      const locations = locationsMap.get(flow.id) ?? [];
      const plans = plansMap.get(flow.id) ?? [];
      const usageYears = usageYearsMap.get(flow.id) ?? [];
      const externalReferences = externalReferencesMap.get(flow.id) ?? [];
      const reportDetails = reportDetailsMap.get(flow.id) ?? [];

      let reportDetailsWithChannel: ReportDetail[] = [];
      if (reportDetails.length > 0) {
        reportDetailsWithChannel =
          await this.categoryService.addChannelToReportDetails(
            models,
            reportDetails
          );
      }

      let parkedParentSource: FlowParkedParentSource | null = null;
      const shouldLookAfterParentSource =
        flowLink.length > 0 && shouldIncludeChildrenOfParkedFlows;

      if (shouldLookAfterParentSource) {
        parkedParentSource = await this.flowService.getParketParents(
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

      const parsedFlow: Flow = this.buildFlowDTO(
        flow,
        categoriesByVersion,
        organizations,
        locations,
        plans,
        usageYears,
        childIDs,
        parentIDs,
        externalReferences,
        reportDetailsWithChannel,
        parkedParentSource
      );

      return parsedFlow;
    });
    const items = await Promise.all(promises);

    return {
      flows: items,
      hasNextPage: hasNextPage,
      hasPreviousPage: nextPageCursor !== undefined,
      prevPageCursor: nextPageCursor ? nextPageCursor - limit : 0,
      nextPageCursor: hasNextPage
        ? nextPageCursor
          ? nextPageCursor + limit
          : limit
        : 0,
      pageSize: flows.length,
      sortField: `${orderBy.entity}.${orderBy.column}` as FlowSortField,
      sortOrder: sortOrder ?? 'desc',
      total: count,
    };
  }

  /**
   * This method returns the shortcut filter defined with the operation
   * IN if is true or NOT IN if is false
   *
   * @param isPendingFlows
   * @param isCommitmentFlows
   * @param isPaidFlows
   * @param isPledgedFlows
   * @param isCarryoverFlows
   * @param isParkedFlows
   * @param isPassThroughFlows
   * @param isStandardFlows
   * @returns [{ category: String, operation: Op.IN | Op.NOT_IN}]
   */
  mapShortcutFilters(
    isPendingFlows: boolean,
    isCommitmentFlows: boolean,
    isPaidFlows: boolean,
    isPledgedFlows: boolean,
    isCarryoverFlows: boolean,
    isParkedFlows: boolean,
    isPassThroughFlows: boolean,
    isStandardFlows: boolean
  ): ShortcutCategoryFilter[] | null {
    const filters = [
      { flag: isPendingFlows, category: 'Pending', id: 45 },
      { flag: isCommitmentFlows, category: 'Commitment', id: 47 },
      { flag: isPaidFlows, category: 'Paid', id: 48 },
      { flag: isPledgedFlows, category: 'Pledge', id: 46 },
      { flag: isCarryoverFlows, category: 'Carryover', id: 137 },
      { flag: isParkedFlows, category: 'Parked', id: 1252 },
      { flag: isPassThroughFlows, category: 'Pass Through', id: 136 },
      { flag: isStandardFlows, category: 'Standard', id: 133 },
    ];

    const shortcutFilters: ShortcutCategoryFilter[] = filters
      .filter((filter) => filter.flag !== undefined)
      .map((filter) => ({
        category: filter.category,
        operation: filter.flag ? Op.IN : Op.NOT_IN,
        id: filter.id,
      }));

    return shortcutFilters.length > 0 ? shortcutFilters : null;
  }

  determineStrategy(
    flowFilters: SearchFlowsFilters,
    flowObjectFilters: FlowObjectFilters[],
    flowCategoryFilters: FlowCategory[],
    nestedFlowFilters: NestedFlowFilters,
    shortcutFilter: FlowShortcutFilter,
    status?: FlowStatusFilter | null,
    orderBy?: FlowOrderBy
  ) {
    // If there are no filters (flowFilters, flowObjectFilters, flowCategoryFilters, nestedFlowFilters or shortcutFilter)
    // and there is no sortByEntity (orderBy.entity === 'flow')
    // use onlyFlowFiltersStrategy
    // If there are no sortByEntity (orderBy.entity === 'flow')
    // but flowFilters only or flowStatusFilter only
    // use onlyFlowFiltersStrategy
    const isOrderByEntityFlow =
      orderBy === undefined || orderBy?.entity === 'flow';
    const isFlowFiltersDefined = flowFilters !== undefined;
    const isFlowObjectFiltersDefined = flowObjectFilters !== undefined;
    const isFlowCategoryFiltersDefined = flowCategoryFilters !== undefined;
    const isNestedFlowFiltersDefined = nestedFlowFilters !== undefined;
    // Shortcuts fot categories
    const isFilterByShortcutsDefined = shortcutFilter !== null;
    const isFilterByFlowStatusDefined = status !== undefined;

    const isNoFilterDefined =
      !isFlowFiltersDefined &&
      !isFlowObjectFiltersDefined &&
      !isFlowCategoryFiltersDefined &&
      !isFilterByShortcutsDefined &&
      !isNestedFlowFiltersDefined &&
      !isFilterByFlowStatusDefined;

    const isFlowFiltersOnly =
      (isFlowFiltersDefined || isFilterByFlowStatusDefined) &&
      !isFlowObjectFiltersDefined &&
      !isFlowCategoryFiltersDefined &&
      !isFilterByShortcutsDefined &&
      !isNestedFlowFiltersDefined;

    if (isOrderByEntityFlow && (isNoFilterDefined || isFlowFiltersOnly)) {
      // Use onlyFlowFiltersStrategy
      return this.onlyFlowFiltersStrategy;
    }

    // Otherwise, use flowObjectFiltersStrategy
    return this.searchFlowByFiltersStrategy;
  }

  buildOrderBy(sortField?: FlowSortField, sortOrder?: SortOrder) {
    const orderBy: FlowOrderBy = {
      column: sortField ?? 'updatedAt',
      order: sortOrder ?? ('desc' as SortOrder),
      direction: undefined,
      entity: 'flow',
    };

    // Check if sortField is a nested property
    if (orderBy.column.includes('.')) {
      // OrderBy can came in the format:
      // column: 'organizations.source.name'
      // or in the format:
      // column: 'flow.updatedAt'
      // or in the format:
      // column: 'planVersion.source.name'
      // in this last case, we need to look after the capitalized letter
      // that will indicate the entity
      // and the whole word will be the subEntity
      const struct = orderBy.column.split('.');

      if (struct.length === 2) {
        orderBy.column = struct[1];
        orderBy.entity = struct[0];
      } else if (struct.length === 3) {
        orderBy.column = struct[2];
        orderBy.direction = struct[1] as FlowNestedDirection;

        // We need to look after the '-' character
        // [0] will indicate the entity
        // and [1] will be the subEntity
        const splitted = struct[0].split('-');
        const entity = splitted[0];
        orderBy.entity = entity;

        if (entity === struct[0]) {
          orderBy.subEntity = struct[0];
        }
      }
    }

    return orderBy;
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
    flowObjectFilters: FlowObjectFilters[] = []
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
    parkedParentSource: FlowParkedParentSource | null
  ): Flow {
    return {
      // Mandatory fields
      id: flow.id.valueOf(),
      versionID: flow.versionID,
      amountUSD: flow.amountUSD.toString(),
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
      activeStatus: flow.activeStatus,
      restricted: flow.restricted,
      flowDate: flow.flowDate ? flow.flowDate.toISOString() : null,
      decisionDate: flow.decisionDate ? flow.decisionDate.toISOString() : null,
      firstReportedDate: flow.firstReportedDate
        ? flow.firstReportedDate.toISOString()
        : null,
      budgetYear: flow.budgetYear,
      exchangeRate: flow.exchangeRate ? flow.exchangeRate.toString() : null,
      origAmount: flow.origAmount ? flow.origAmount.toString() : null,
      origCurrency: flow.origCurrency ? flow.origCurrency.toString() : null,
      description: flow.description,
      notes: flow.notes,
      versionStartDate: flow.versionStartDate
        ? flow.versionStartDate.toISOString()
        : null,
      versionEndDate: flow.versionEndDate
        ? flow.versionEndDate.toISOString()
        : null,
      newMoney: flow.newMoney,

      // Optional fields
      categories,
      organizations,
      locations,
      plans,
      usageYears,
      childIDs,
      parentIDs,

      externalReferences,
      reportDetails,
      parkedParentSource,

      // Separate nested fields by source and destination
      // Source
      sourceUsageYears: this.mapNestedPropertyByDirection(usageYears, 'source'),
      sourceLocations: this.mapNestedPropertyByDirection(locations, 'source'),
      sourcePlans: this.mapNestedPropertyByDirection(plans, 'source'),
      sourceOrganizations: this.mapNestedPropertyByDirection(
        organizations,
        'source'
      ),
      // Destination
      destinationUsageYears: this.mapNestedPropertyByDirection(
        usageYears,
        'destination'
      ),
      destinationLocations: this.mapNestedPropertyByDirection(
        locations,
        'destination'
      ),
      destinationPlans: this.mapNestedPropertyByDirection(plans, 'destination'),
      destinationOrganizations: this.mapNestedPropertyByDirection(
        organizations,
        'destination'
      ),
    };
  }

  private mapNestedPropertyByDirection(
    nestedProperty: any[],
    direction: string
  ) {
    return nestedProperty.filter(
      (nestedProperty) => nestedProperty.direction === direction
    );
  }

  async searchBatches(
    models: Database,
    databaseConnection: Knex,
    args: SearchFlowsArgs
  ): Promise<FlowSearchResultNonPaginated> {
    // We need to check if the user sent a 'usageYear' FlowObjectFilter
    // If not - we need to add it to the filters (both source and destination since 2021 and after)
    const { flowObjectFilters } = args;
    if (flowObjectFilters) {
      const usageYearFilter = flowObjectFilters.find(
        (filter) => filter.objectType === 'usageYear'
      );

      if (!usageYearFilter) {
        // Find the flowObjectFilters since 2021 until currentYear
        let startYear = 2021;
        const currentYear = new Date().getFullYear();

        const usageYearsArrayFilter: string[] = [];
        while (startYear <= currentYear) {
          usageYearsArrayFilter.push(startYear.toString());
          startYear++;
        }
        const usageYears = await models.usageYear.find({
          where: {
            year: {
              [Op.IN]: usageYearsArrayFilter,
            },
          },
        });

        for (const usageYear of usageYears) {
          // Map the usageYear filters to the flowObjectFilters
          const sourceUsageYearFilter: FlowObjectFilters = {
            objectType: 'usageYear',
            direction: 'source',
            objectID: usageYear.id.valueOf(),
            inclusive: true,
          };

          const destinationUsageYearFilter: FlowObjectFilters = {
            objectType: 'usageYear',
            direction: 'destination',
            objectID: usageYear.id.valueOf(),
            inclusive: true,
          };

          flowObjectFilters.push(
            sourceUsageYearFilter,
            destinationUsageYearFilter
          );
        }
      }
    }

    args.flowObjectFilters = flowObjectFilters;
    // Default limit to increase performance
    args.limit = 5000;
    // Do the first search
    const flowSearchResponse = await this.search(
      models,
      databaseConnection,
      args
    );

    const flows: Flow[] = flowSearchResponse.flows;

    let hasNextPage = flowSearchResponse.hasNextPage;

    let cursor = flowSearchResponse.nextPageCursor;
    let nextArgs: SearchFlowsArgs = { ...args, nextPageCursor: cursor };

    let nextFlowSearchResponse: FlowSearchResult;
    while (hasNextPage) {
      nextFlowSearchResponse = await this.search(
        models,
        databaseConnection,
        nextArgs
      );
      flows.push(...nextFlowSearchResponse.flows);

      hasNextPage = nextFlowSearchResponse.hasNextPage;
      cursor = nextFlowSearchResponse.nextPageCursor;

      // Update the cursor for the next iteration
      nextArgs = { ...args, nextPageCursor: cursor };
    }

    return { flows, flowsCount: flows.length };
  }
}
