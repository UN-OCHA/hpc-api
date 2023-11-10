import { Database } from '@unocha/hpc-api-core/src/db';
import { Ctx } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../../Context';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { CategoryService } from '../../../categories/category-service';
import { ExternalReferenceService } from '../../../external-reference/external-reference-service';
import { LocationService } from '../../../location/location-service';
import { OrganizationService } from '../../../organizations/organization-service';
import { PlanService } from '../../../plans/plan-service';
import { ReportDetailService } from '../../../report-details/report-detail-service';
import { UsageYearService } from '../../../usage-years/usage-year-service';
import { FlowLinkService } from '../../flow-link-service';
import { FlowService } from '../../flow-service';
import { FlowParkedParentSource, FlowSearchResult } from '../../graphql/types';
import { FlowSearchStrategy } from '../flow-search-strategy';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';

@Service()
export class OnlyFlowFiltersStrategy implements FlowSearchStrategy {


  constructor(
    private readonly organizationService: OrganizationService,
    private readonly locationService: LocationService,
    private readonly planService: PlanService,
    private readonly usageYearService: UsageYearService,
    private readonly categoryService: CategoryService,
    private readonly flowLinkService: FlowLinkService,
    private readonly externalReferenceService: ExternalReferenceService,
    private readonly reportDetailService: ReportDetailService,
    private readonly flowService: FlowService) {
  }

  async search(flowConditions: Map<string, any>, orderBy: any, limit: number, cursorCondition: any, models: Database): Promise<FlowSearchResult> {

    // Fetch one more item to check for hasNextPage 
    const limitComputed = limit + 1;

    // Build conditions object
    const conditions: any = { ...cursorCondition };

    if (flowConditions.size > 0) {
      flowConditions.forEach((value, key) => {
        conditions[key] = value;
      });
    }

    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(
        models,
        conditions,
        orderBy,
        limitComputed
      ),
      this.flowService.getFlowsCount(models, conditions),
    ]);

    const hasNextPage = flows.length > limit;
    if (hasNextPage) {
      flows.pop(); // Remove the extra item used to check hasNextPage
    }

    const count = countRes[0] as { count: number };

    const flowIds: FlowId[] = flows.map((flow) => flow.id);

    const organizationsFO: any[] = [];
    const locationsFO: any[] = [];
    const plansFO: any[] = [];
    const usageYearsFO: any[] = [];

    const [externalReferencesMap] = await Promise.all([
      this.externalReferenceService.getExternalReferencesForFlows(
        flowIds,
        models
      ),
      this.getFlowObjects(
        flowIds,
        models,
        organizationsFO,
        locationsFO,
        plansFO,
        usageYearsFO
      ),
    ]);

    const flowLinksMap = await this.flowLinkService.getFlowLinksForFlows(
      flowIds,
      models
    );

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

    const items = flows.map((flow) => {
      const flowLink = flowLinksMap.get(flow.id) || [];
      const categories = categoriesMap.get(flow.id) || [];
      const organizations = organizationsMap.get(flow.id) || [];
      const locations = [...(locationsMap.get(flow.id) || [])];
      const plans = plansMap.get(flow.id) || [];
      const usageYears = usageYearsMap.get(flow.id) || [];
      const externalReferences = externalReferencesMap.get(flow.id) || [];
      const reportDetails = reportDetailsMap.get(flow.id) || [];

      const parkedParentSource: FlowParkedParentSource[] = [];
      if (flow.activeStatus && flowLink.length > 0) {
        this.getParketParents(flow, flowLink, models, parkedParentSource);
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
        parkedParentSource,
        // Paged item field
        cursor: flow.id.valueOf(),
      };
    });

    return {
      flows: items,
      hasNextPage: limit <= flows.length,
      hasPreviousPage: false,// TODO: cursorCondition['id'].GT !== undefined,
      startCursor: flows.length ? flows[0].id.valueOf() : 0,
      endCursor: flows.length ? flows[flows.length - 1].id.valueOf() : 0,
      pageSize: flows.length,
      sortField: orderBy.column,
      sortOrder: orderBy.order,
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

  private async getParketParents(
    flow: any,
    flowLink: any[],
    models: Database,
    parkedParentSource: FlowParkedParentSource[]
  ): Promise<any> {
    const flowLinksDepth0 = flowLink.filter((flowLink) => flowLink.depth === 0);

    const flowLinksParent = flowLinksDepth0.filter(
      (flowLink) => flowLink.parentID === flow.id
    );

    const parentFlowIds = flowLinksParent.map((flowLink) =>
      flowLink.parentID.valueOf()
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

    const parentFlows = flowLinksParent.filter((flowLink) => {
      return categoryRef.some(
        (categoryRef) =>
          categoryRef.objectID.valueOf() === flowLink.parentID.valueOf()
      );
    });
  }

}