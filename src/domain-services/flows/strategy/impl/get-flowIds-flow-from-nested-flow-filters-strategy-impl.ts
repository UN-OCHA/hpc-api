import { Service } from 'typedi';
import { LegacyService } from '../../../legacy/legacy-service';
import { ReportDetailService } from '../../../report-details/report-detail-service';
import { type UniqueFlowEntity } from '../../model';
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
    private readonly legacyService: LegacyService
  ) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { models, nestedFlowFilters } = args;

    let flowsReporterReferenceCode: UniqueFlowEntity[] = [];
    let flowsSourceSystemId: UniqueFlowEntity[] = [];
    const flowsLegacyId: UniqueFlowEntity[] = [];

    // Get the flowIDs using 'reporterReferenceCode'
    if (nestedFlowFilters?.reporterRefCode) {
      flowsReporterReferenceCode =
        await this.reportDetailService.getUniqueFlowIDsFromReportDetailsByReporterReferenceCode(
          models,
          nestedFlowFilters.reporterRefCode
        );
    }

    // Get the flowIDs using 'sourceSystemID'
    if (nestedFlowFilters?.sourceSystemID) {
      flowsSourceSystemId =
        await this.reportDetailService.getUniqueFlowIDsFromReportDetailsBySourceID(
          models,
          nestedFlowFilters.sourceSystemID
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
        flowsLegacyId
      );

    return { flows: flowIDsFromNestedFlowFilters };
  }
}
