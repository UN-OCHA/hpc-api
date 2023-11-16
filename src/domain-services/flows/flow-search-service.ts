import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
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
  type SearchFlowsFilters,
} from './graphql/args';
import {
  type FlowPaged,
  type FlowParkedParentSource,
  type FlowSearchResult,
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

    const orderBy = {
      column: sortField ?? 'updatedAt',
      order: sortOrder ?? 'desc',
    };

    const { flowFilters, flowObjectFilters } = filters;

    const cursorCondition = this.buildCursorCondition(
      beforeCursor,
      afterCursor
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
      orderBy,
      limitComputed,
      cursorCondition,
      models
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

    this.mapFlowObjects(
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
        const locations = [...(locationsMap.get(flow.id) ?? [])];
        const plans = plansMap.get(flow.id) ?? [];
        const usageYears = usageYearsMap.get(flow.id) ?? [];
        const externalReferences = externalReferencesMap.get(flow.id) ?? [];
        const reportDetails = reportDetailsMap.get(flow.id) ?? [];

        let parkedParentSource: FlowParkedParentSource[] = [];
        if (flow.activeStatus && flowLink.length > 0) {
          parkedParentSource = await this.getParketParents(
            flow,
            flowLink,
            models
          );
        }

        const childIDs: number[] = flowLinksMap
          .get(flow.id)
          ?.filter(
            (flowLink) => flowLink.parentID === flow.id && flowLink.depth > 0
          )
          .map((flowLink) => flowLink.childID.valueOf()) as number[];

        const parentIDs: number[] = flowLinksMap
          .get(flow.id)
          ?.filter(
            (flowLink) => flowLink.childID === flow.id && flowLink.depth > 0
          )
          .map((flowLink) => flowLink.parentID.valueOf()) as number[];

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
          reportDetails,
          parkedParentSource
        );
      })
    );

    return {
      flows: items,
      hasNextPage: limit <= flows.length,
      hasPreviousPage: afterCursor !== undefined,
      startCursor: flows.length ? flows[0].id.valueOf() : 0,
      endCursor: flows.length ? flows.at(-1)?.id.valueOf() ?? 0 : 0,
      pageSize: flows.length,
      sortField: orderBy.column,
      sortOrder: orderBy.order,
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

    if (
      (!flowFilters &&
        (!flowObjectFilters || flowObjectFilters.length === 0)) ??
      (flowFilters && (!flowObjectFilters ?? flowObjectFilters.length === 0))
    ) {
      const flowConditions = this.prepareFlowConditions(flowFilters);
      conditions = { ...conditions, ...flowConditions };
      return { strategy: this.onlyFlowFiltersStrategy, conditions };
    } else if (!flowFilters && flowObjectFilters.length !== 0) {
      const flowObjectConditions =
        this.prepareFlowObjectConditions(flowObjectFilters);
      conditions = { ...conditions, ...flowObjectConditions };

      return {
        strategy: this.flowObjectFiltersStrategy,
        conditions: this.buildConditionsMap(undefined, flowObjectConditions),
      };
    } else if (flowFilters && flowObjectFilters.length !== 0) {
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

  private mapFlowObjects(
    flowObjects: FlowObject[],
    organizationsFO: any[],
    locationsFO: any[],
    plansFO: any[],
    usageYearsFO: any[]
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

  private buildCursorCondition(beforeCursor: number, afterCursor: number) {
    if (beforeCursor && afterCursor) {
      throw new Error('Cannot use before and after cursor at the same time');
    }

    let cursorCondition;
    if (afterCursor) {
      cursorCondition = {
        id: {
          [Op.GT]: createBrandedValue(afterCursor),
        },
      };
    } else if (beforeCursor) {
      cursorCondition = {
        id: {
          [Op.LT]: createBrandedValue(beforeCursor),
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
    parkedParentSource: FlowParkedParentSource[]
  ): FlowPaged {
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
      origAmount: flow.origAmount ? flow.origAmount.toString() : '',
      origCurrency: flow.origCurrency ? flow.origCurrency.toString() : '',
      externalReferences,
      reportDetails,
      parkedParentSource:
        parkedParentSource.length > 0 ? parkedParentSource : null,
      // Paged item field
      cursor: flow.id.valueOf(),
    };
  }
}
