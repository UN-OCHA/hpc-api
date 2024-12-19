import { Service } from 'typedi';
import { ExternalReferenceService } from '../../../external-reference/external-reference-service';
import { LegacyService } from '../../../legacy/legacy-service';
import { ReportDetailService } from '../../../report-details/report-detail-service';
import { FlowService } from '../../flow-service';
import type { UniqueFlowEntity } from '../../model';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { intersectUniqueFlowEntities } from './utils';

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

    let flowsReporterReferenceCode: UniqueFlowEntity[] = [];
    let flowsSourceSystemId: UniqueFlowEntity[] = [];
    let flowsSystemId: UniqueFlowEntity[] = [];
    const flowsLegacyId: UniqueFlowEntity[] = [];

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
        flowsLegacyId.push({
          id: flowID,
          versionID: 1,
        });
      }
    }

    // Intersect the flowIDs from the nestedFlowFilters
    const flowIDsFromNestedFlowFilters: UniqueFlowEntity[] =
      intersectUniqueFlowEntities(
        flowsReporterReferenceCode,
        flowsSourceSystemId,
        flowsSystemId,
        flowsLegacyId
      );

    if (flowIDsFromNestedFlowFilters.length === 0) {
      return { flows: [] };
    }
    // Once gathered and disjoined the flowIDs from the nestedFlowFilters
    // Look after this uniqueFlows in the flow table
    const flows = await this.flowService.progresiveSearch(
      models,
      flowIDsFromNestedFlowFilters,
      1000,
      0,
      false, // Stop when we have the limit
      []
    );

    return { flows };
  }
}
