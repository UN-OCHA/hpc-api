import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import type Knex from 'knex';
import { Service } from 'typedi';
import { type SortOrder } from '../../utils/graphql/pagination';
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
  type FlowCategory,
  type FlowObjectFilters,
  type SearchFlowsArgs,
  type SearchFlowsArgsNonPaginated,
  type SearchFlowsFilters,
} from './graphql/args';
import {
  type Flow,
  type FlowParkedParentSource,
  type FlowSearchResult,
  type FlowSearchResultNonPaginated,
  type FlowSearchTotalAmountResult,
  type FlowSortField,
} from './graphql/types';
import {
  type FlowEntity,
  type FlowNestedDirection,
  type FlowOrderBy,
} from './model';
import { type FlowSearchStrategy } from './strategy/flow-search-strategy';
import { FlowObjectFiltersStrategy } from './strategy/impl/flow-object-conditions-strategy-impl';
import { OnlyFlowFiltersStrategy } from './strategy/impl/only-flow-conditions-strategy-impl';
import { SearchFlowByFiltersStrategy } from './strategy/impl/search-flow-by-filters-strategy-impl';

@Service()
export class FlowSearchService {
  constructor(
    private readonly onlyFlowFiltersStrategy: OnlyFlowFiltersStrategy,
    private readonly flowObjectFiltersStrategy: FlowObjectFiltersStrategy,
    private readonly searchFlowByFiltersStrategy: SearchFlowByFiltersStrategy,
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
    const {
      limit,
      nextPageCursor,
      prevPageCursor,
      sortField,
      sortOrder,
      pending: isPendingFlows,
    } = filters;

    const orderBy: FlowOrderBy = this.buildOrderBy(sortField, sortOrder);

    const { flowFilters, flowObjectFilters, flowCategoryFilters } = filters;

    const cursorCondition = this.buildCursorCondition(
      prevPageCursor,
      nextPageCursor,
      orderBy
    );

    // Determine strategy of how to search for flows
    const { strategy, conditions } = this.determineStrategy(
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      isPendingFlows
    );

    // Fetch one more item to check for hasNextPage
    const limitComputed = limit + 1;

    // Obtain flows and its count based on the strategy selected
    const { flows, count } = await strategy.search(
      conditions,
      models,
      orderBy,
      limitComputed,
      cursorCondition,
      isPendingFlows
    );

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

    const items = await Promise.all(
      flows.map(async (flow) => {
        const flowLink = flowLinksMap.get(flow.id) ?? [];

        // Categories Map follows the structure:
        // flowID: { versionID: [categories]}
        // So we need to get the categories for the flow version
        const categories =
          categoriesMap.get(flow.id)!.get(flow.versionID) ?? [];
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

        let parkedParentSource: FlowParkedParentSource | null = null;
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
          parkedParentSource
        );
      })
    );

    // Sort items
    // FIXME: this sorts the page, not the whole result set
    items.sort((a: Flow, b: Flow) => {
      const entityKey = orderBy.entity as keyof Flow;

      const nestedA = a[entityKey];
      const nestedB = b[entityKey];

      if (nestedA && nestedB) {
        if (orderBy.direction) {
          // This means the orderBy came in the format:
          // column: 'nestedEntity.direction.property'
          // So we need to get the entry of the nested entity
          // which its direction matches the orderBy direction
          // and sort by the property using the orderBy order

          // Fisrt, check if the nestedEntity is trusy an Array
          if (!Array.isArray(nestedA)) {
            return 0;
          }
          if (!Array.isArray(nestedB)) {
            return 0;
          }

          // Now we ensure both properties are arrays
          // we can assume that the nestedEntity is one of the following:
          // organizations, locations, plans, usageYears
          const directionEntityA = nestedA as unknown as
            | Organization[]
            | BaseLocation[]
            | BasePlan[]
            | UsageYear[];
          const directionEntityB = nestedB as unknown as
            | Organization[]
            | BaseLocation[]
            | BasePlan[]
            | UsageYear[];

          // Then we find the entry of the nestedEntity that matches the orderBy direction
          const nestedEntityA = directionEntityA.find(
            (nestedEntity: any) => orderBy.direction === nestedEntity.direction
          );
          const nestedEntityB = directionEntityB.find(
            (nestedEntity: any) => orderBy.direction === nestedEntity.direction
          );

          // After, we need to check there is an entry that matches the orderBy direction
          // if not, we return 0
          if (!nestedEntityA) {
            return 0;
          }
          if (!nestedEntityB) {
            return 0;
          }

          // Now we can sort by the property using the orderBy order
          const propertyA =
            nestedEntityA[orderBy.column as keyof typeof nestedEntityA];
          const propertyB =
            nestedEntityB[orderBy.column as keyof typeof nestedEntityB];

          // Finally, we check that the property is defined
          // and if so - we sort by the property using the orderBy order
          if (propertyA && propertyB) {
            if (orderBy.order === 'asc') {
              return propertyA > propertyB ? 1 : -1;
            }
            return propertyA < propertyB ? 1 : -1;
          }
        }
        // Since there is no direction expecified in the orderBy
        // we can assume that the nestedEntity is one of the following:
        // childIDs, parentIDs, externalReferences, reportDetails, parkedParentSource, categories
        // and we can sort by the property using the orderBy order
        const propertyA = nestedA[orderBy.column as keyof typeof nestedA];
        const propertyB = nestedB[orderBy.column as keyof typeof nestedB];

        // Finally, we check that the property is defined
        // and if so - we sort by the property using the orderBy order
        if (propertyA && propertyB) {
          if (orderBy.order === 'asc') {
            return propertyA > propertyB ? 1 : -1;
          }
          return propertyA < propertyB ? 1 : -1;
        }
      }

      return 0;
    });

    const isOrderByForFlows = orderBy.entity === 'flow';
    const firstItem = items[0];
    const prevPageCursorEntity = isOrderByForFlows
      ? firstItem
      : firstItem[orderBy.entity as keyof typeof firstItem];
    const prevPageCursorValue = prevPageCursorEntity
      ? prevPageCursorEntity[
          orderBy.column as keyof typeof prevPageCursorEntity
        ] ?? ''
      : '';

    const lastItem = items.at(-1);
    const nextPageCursorEntity = isOrderByForFlows
      ? lastItem
      : lastItem![orderBy.entity as keyof typeof lastItem];
    const nextPageCursorValue = nextPageCursorEntity
      ? nextPageCursorEntity[
          orderBy.column as keyof typeof nextPageCursorEntity
        ]?.toString() ?? ''
      : '';

    return {
      flows: items,
      hasNextPage: limit <= flows.length,
      hasPreviousPage: nextPageCursor !== undefined,
      prevPageCursor: prevPageCursorValue,
      nextPageCursor: nextPageCursorValue,
      pageSize: flows.length,
      sortField: `${orderBy.entity}.${orderBy.column}` as FlowSortField,
      sortOrder: sortOrder ?? 'desc',
      total: count,
    };
  }

  async searchV2(
    models: Database,
    databaseConnection: Knex,
    filters: SearchFlowsArgs
  ): Promise<FlowSearchResult> {
    const { limit, nextPageCursor, prevPageCursor, sortField, sortOrder } =
      filters;

    const orderBy: FlowOrderBy = this.buildOrderBy(sortField, sortOrder);

    const {
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      pending: isPendingFlows,
    } = filters;

    // Once we've gathered all the filters, we need to determine the strategy
    // to use in order to obtain the flowIDs
    const strategy: FlowSearchStrategy = this.determineStrategyV2(
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      isPendingFlows,
      orderBy
    );

    // Build cursor condition
    const cursorCondition = this.buildCursorCondition(
      prevPageCursor,
      nextPageCursor,
      orderBy
    );

    const { flows, count } = await strategy.searchV2(
      models,
      databaseConnection,
      limit,
      orderBy,
      cursorCondition,
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      isPendingFlows
    );

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

    const items = await Promise.all(
      flows.map(async (flow) => {
        const flowLink = flowLinksMap.get(flow.id) ?? [];

        // Categories Map follows the structure:
        // flowID: { versionID: [categories]}
        // So we need to get the categories for the flow version
        const categories =
          categoriesMap.get(flow.id)!.get(flow.versionID) ?? [];
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

        let parkedParentSource: FlowParkedParentSource | null = null;
        const shouldLookAfterParentSource =
          flow.activeStatus && flowLink.length > 0;
        if (shouldLookAfterParentSource) {
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
          parkedParentSource
        );
      })
    );

    const isOrderByForFlows = orderBy.entity === 'flow';
    const firstItem = items[0];
    const prevPageCursorEntity = isOrderByForFlows
      ? firstItem
      : firstItem[orderBy.entity as keyof typeof firstItem];
    const prevPageCursorValue = prevPageCursorEntity
      ? prevPageCursorEntity[
          orderBy.column as keyof typeof prevPageCursorEntity
        ] ?? ''
      : '';

    const lastItem = items.at(-1);
    const nextPageCursorEntity = isOrderByForFlows
      ? lastItem
      : lastItem![orderBy.entity as keyof typeof lastItem];
    const nextPageCursorValue = nextPageCursorEntity
      ? nextPageCursorEntity[
          orderBy.column as keyof typeof nextPageCursorEntity
        ]?.toString() ?? ''
      : '';

    return {
      flows: items,
      hasNextPage: limit <= flows.length,
      hasPreviousPage: nextPageCursor !== undefined,
      prevPageCursor: prevPageCursorValue,
      nextPageCursor: nextPageCursorValue,
      pageSize: flows.length,
      sortField: `${orderBy.entity}.${orderBy.column}` as FlowSortField,
      sortOrder: sortOrder ?? 'desc',
      total: count,
    };
  }

  determineStrategyV2(
    flowFilters: SearchFlowsFilters,
    flowObjectFilters: FlowObjectFilters[],
    flowCategoryFilters: FlowCategory[],
    isPendingFlows: boolean,
    orderBy: FlowOrderBy
  ) {
    // If there are no filters (flowFilters, flowObjectFilters, flowCategoryFilters or pending)
    // and there is no sortByEntity (orderBy.entity === 'flow')
    // use onlyFlowFiltersStrategy
    // If there are no sortByEntity (orderBy.entity === 'flow')
    // but flowFilters only
    // use onlyFlowFiltersStrategy
    const isOrderByEntityFlow = orderBy.entity === 'flow';
    const isFlowFiltersDefined = flowFilters !== undefined;
    const isFlowObjectFiltersDefined = flowObjectFilters !== undefined;
    const isFlowCategoryFiltersDefined = flowCategoryFilters !== undefined;
    const isFilterByPendingFlowsDefined = isPendingFlows !== undefined;

    const isNoFilterDefined =
      !isFlowFiltersDefined &&
      !isFlowObjectFiltersDefined &&
      !isFlowCategoryFiltersDefined &&
      !isFilterByPendingFlowsDefined;
    const isFlowFiltersOnly =
      isFlowFiltersDefined &&
      !isFlowObjectFiltersDefined &&
      !isFlowCategoryFiltersDefined &&
      !isFilterByPendingFlowsDefined;

    if (isOrderByEntityFlow && (isNoFilterDefined || isFlowFiltersOnly)) {
      // use onlyFlowFiltersStrategy
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
      const struct = orderBy.column.split('.');

      if (struct.length === 2) {
        orderBy.column = struct[1];
        orderBy.entity = struct[0];
      } else if (struct.length === 3) {
        orderBy.column = struct[2];
        orderBy.direction = struct[1] as FlowNestedDirection;
        orderBy.entity = struct[0];
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

  determineStrategy(
    flowFilters: SearchFlowsFilters,
    flowObjectFilters: FlowObjectFilters[],
    flowCategoryFilters: FlowCategory[],
    isFilterByPendingFlows: boolean
  ): { strategy: FlowSearchStrategy; conditions: any } {
    const isFlowFilterDefined = flowFilters !== undefined;
    const isFlowObjectFilterDefined = flowObjectFilters !== undefined;
    const isFlowObjectFiltersNotEmpty =
      isFlowObjectFilterDefined && flowObjectFilters.length !== 0;

    const isFlowCategoryFilterDefined = flowCategoryFilters !== undefined;
    const isFlowCategoryFilterNotEmpty =
      isFlowCategoryFilterDefined && flowCategoryFilters.length !== 0;

    const isFilterByPendingFlowsDefined = isFilterByPendingFlows !== undefined;
    if (
      (!isFlowFilterDefined &&
        (!isFlowObjectFilterDefined || !isFlowObjectFiltersNotEmpty) &&
        !isFlowCategoryFilterNotEmpty &&
        !isFilterByPendingFlowsDefined) ||
      (isFlowFilterDefined &&
        (!isFlowObjectFilterDefined || !isFlowObjectFiltersNotEmpty) &&
        !isFlowCategoryFilterNotEmpty &&
        !isFilterByPendingFlowsDefined)
    ) {
      const flowConditions = this.prepareFlowConditions(flowFilters);
      return {
        strategy: this.onlyFlowFiltersStrategy,
        conditions: flowConditions,
      };
    } else if (
      isFlowObjectFiltersNotEmpty ||
      isFlowCategoryFilterNotEmpty ||
      isFilterByPendingFlowsDefined
    ) {
      const flowConditions = this.prepareFlowConditions(flowFilters);
      const flowObjectConditions =
        this.prepareFlowObjectConditions(flowObjectFilters);

      return {
        strategy: this.flowObjectFiltersStrategy,
        conditions: {
          conditionsMap: this.buildConditionsMap(
            flowConditions,
            flowObjectConditions
          ),
          flowCategoryFilters,
        },
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

  // TODO: refactor this method
  // Move to a proper service and simplify the logic
  // and the queries
  private async getParketParents(
    flow: any,
    flowLink: any[],
    models: Database
  ): Promise<FlowParkedParentSource | null> {
    const flowLinksParentsIDs = flowLink
      .filter(
        (flowLink) =>
          flowLink.parentID !== flow.id && flowLink.childID === flow.id
      )
      .map((flowLink) => flowLink.parentID.valueOf());

    if (flowLinksParentsIDs.length === 0) {
      return null;
    }

    const parkedCategory = await models.category.findOne({
      where: {
        group: 'flowType',
        name: 'Parked',
      },
    });

    const parentFlows: number[] = [];

    for (const flowLinkParentID of flowLinksParentsIDs) {
      const parkedParentCategoryRef = await models.categoryRef.find({
        where: {
          categoryID: parkedCategory?.id,
          versionID: flow.versionID,
          objectID: flowLinkParentID,
          objectType: 'flow',
        },
      });

      if (parkedParentCategoryRef && parkedParentCategoryRef.length > 0) {
        parentFlows.push(flowLinkParentID);
      }
    }

    const parkedParentFlowObjectsOrganizationSource = [];

    for (const parentFlow of parentFlows) {
      const parkedParentOrganizationFlowObject =
        await models.flowObject.findOne({
          where: {
            flowID: createBrandedValue(parentFlow),
            objectType: 'organization',
            refDirection: 'source',
            versionID: flow.versionID,
          },
        });
      parkedParentFlowObjectsOrganizationSource.push(
        parkedParentOrganizationFlowObject
      );
    }

    const parkedParentOrganizations = await models.organization.find({
      where: {
        id: {
          [Op.IN]: parkedParentFlowObjectsOrganizationSource.map((flowObject) =>
            createBrandedValue(flowObject?.objectID)
          ),
        },
      },
    });

    const mappedParkedParentOrganizations: FlowParkedParentSource = {
      organization: [],
      orgName: [],
    };

    for (const parkedParentOrganization of parkedParentOrganizations) {
      mappedParkedParentOrganizations.organization.push(
        parkedParentOrganization.id.valueOf()
      );
      mappedParkedParentOrganizations.orgName.push(
        parkedParentOrganization.name
      );
    }

    return mappedParkedParentOrganizations;
  }

  private buildCursorCondition(
    beforeCursor: string,
    afterCursor: string,
    orderBy: FlowOrderBy
  ) {
    if (beforeCursor && afterCursor) {
      throw new Error('Cannot use before and after cursor at the same time');
    }

    if (!beforeCursor && !afterCursor) {
      return {};
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
    orderBy: FlowOrderBy
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

  async searchTotalAmount(
    models: Database,
    args: SearchFlowsArgsNonPaginated
  ): Promise<FlowSearchTotalAmountResult> {
    const {
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      pending: isPendingFlows,
    } = args;

    const { strategy, conditions } = this.determineStrategy(
      flowFilters,
      flowObjectFilters,
      flowCategoryFilters,
      isPendingFlows
    );

    const { flows, count } = await strategy.search(
      conditions,
      models,
      undefined,
      undefined,
      undefined,
      isPendingFlows
    );

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

    const flows: Flow[] = flowSearchResponse.flows;

    let hasNextPage = flowSearchResponse.hasNextPage;

    let cursor = flowSearchResponse.nextPageCursor;
    let nextArgs: SearchFlowsArgs = { ...args, nextPageCursor: cursor };

    let nextFlowSearchResponse: FlowSearchResult;
    while (hasNextPage) {
      nextFlowSearchResponse = await this.search(models, nextArgs);

      flows.push(...nextFlowSearchResponse.flows);

      hasNextPage = nextFlowSearchResponse.hasNextPage;
      cursor = nextFlowSearchResponse.nextPageCursor;

      // Update the cursor for the next iteration
      nextArgs = { ...args, nextPageCursor: cursor };
    }

    return { flows, flowsCount: flows.length };
  }
}
