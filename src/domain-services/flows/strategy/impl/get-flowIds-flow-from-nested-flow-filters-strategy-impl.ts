import { Service } from 'typedi';
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
  constructor(private readonly reportDetailService: ReportDetailService) {}

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

    // TODO: Get the flowIDs using 'legacyID'
    // TODO: create model for that
    // if(nestedFlowFilters?.legacyId) {
    //   flowsLegacyId = await this.flowService.getFlowIDsFromSourceSystemID(
    //     models,
    //     databaseConnection,
    //     nestedFlowFilters.sourceSystemId
    //   );
    // }

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