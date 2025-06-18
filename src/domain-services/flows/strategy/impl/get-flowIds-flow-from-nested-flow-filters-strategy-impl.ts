import { Service } from 'typedi';
import { ExternalReferenceService } from '../../../external-reference/external-reference-service';
import { LegacyService } from '../../../legacy/legacy-service';
import { ReportDetailService } from '../../../report-details/report-detail-service';
import { FlowService } from '../../flow-service';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { intersectSets, parseFlowIdVersionSet } from './utils';

@Service()
export class GetFlowIdsFromNestedFlowFiltersStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(
    private readonly reportDetailService: ReportDetailService,
    private readonly legacyService: LegacyService,
    private readonly externalRefenceService: ExternalReferenceService,
    private readonly flowService: FlowService
  ) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { models, nestedFlowFilters } = args;

    let flowsReporterReferenceCode = new Set<string>();
    let flowsSourceSystemId = new Set<string>();
    let flowsSystemId = new Set<string>();
    const flowsLegacyId = new Set<string>();

    // Get the flowIDs using 'reporterReferenceCode'
    if (nestedFlowFilters?.reporterRefCode) {
      flowsReporterReferenceCode =
        await this.reportDetailService.getUniqueFlowIDsFromReportDetailsByReporterReferenceCode(
          models,
          nestedFlowFilters.reporterRefCode
        );
    }

    // Get the flowIDs using 'sourceSystemID' from 'reportDetail'
    if (nestedFlowFilters?.sourceSystemID) {
      flowsSourceSystemId =
        await this.reportDetailService.getUniqueFlowIDsFromReportDetailsBySourceSystemID(
          models,
          nestedFlowFilters.sourceSystemID
        );
    }

    // Get the flowIDs using 'systemID' from 'externalRefecence'
    if (nestedFlowFilters?.systemID) {
      flowsSystemId =
        await this.externalRefenceService.getUniqueFlowIDsBySystemID(
          models,
          nestedFlowFilters.systemID
        );
    }

    // Get the flowIDs using 'legacyID'
    if (nestedFlowFilters?.legacyID) {
      const flowID = await this.legacyService.getFlowIdFromLegacyId(
        models,
        nestedFlowFilters.legacyID
      );

      if (flowID) {
        flowsLegacyId.add(`${flowID}:1`);
      }
    }

    // Intersect the flowIDs from the nestedFlowFilters
    const flowIDsFromNestedFlowFilters = intersectSets(
      flowsReporterReferenceCode,
      flowsSourceSystemId,
      flowsSystemId,
      flowsLegacyId
    );

    if (flowIDsFromNestedFlowFilters.size === 0) {
      return { flows: [] };
    }
    // Once gathered and disjoined the flowIDs from the nestedFlowFilters
    // Look after this uniqueFlows in the flow table
    const flows = await this.flowService.progresiveSearch(
      models,
      parseFlowIdVersionSet(flowIDsFromNestedFlowFilters),
      1000,
      0,
      false, // Stop when we have the limit
      []
    );

    return { flows };
  }
}
