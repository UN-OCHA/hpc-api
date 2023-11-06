import { Database } from '@unocha/hpc-api-core/src/db';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Service } from 'typedi';
import { ReportDetail } from './graphql/types';
@Service()
export class ReportDetailService {
  async getReportDetailsForFlows(
    flowIds: FlowId[],
    models: Database
  ): Promise<Map<number, ReportDetail[]>> {
    const reportDetails: InstanceDataOfModel<Database['reportDetail']>[] =
      await models.reportDetail.find({
        where: {
          flowID: {
            [Op.IN]: flowIds,
          },
        },
        skipValidation: true,
      });

    const reportDetailsMap = new Map<number, ReportDetail[]>();

    flowIds.forEach((flowId: FlowId) => {
      if (!reportDetailsMap.has(flowId)) {
        reportDetailsMap.set(flowId, []);
      }
      const reportDetail = reportDetails.find(
        (report) => report && flowId === report?.flowID
      );

      if (reportDetail) {
        const reportDetailMapped =
          this.mapReportDetailsToFlowReportDetail(reportDetail);
        reportDetailsMap.get(flowId)?.push(reportDetailMapped);
      }
    });

    return reportDetailsMap;
  }

  private mapReportDetailsToFlowReportDetail(
    reportDetail: InstanceDataOfModel<Database['reportDetail']>
  ): ReportDetail {
    return {
      id: reportDetail.id,
      flowID: reportDetail.flowID,
      versionID: reportDetail.versionID,
      contactInfo: reportDetail.contactInfo,
      source: reportDetail.source,
      date: reportDetail.date,
      sourceID: reportDetail.sourceID,
      refCode: reportDetail.refCode,
      verified: reportDetail.verified,
      createdAt: reportDetail.createdAt.toISOString(),
      updatedAt: reportDetail.updatedAt.toISOString(),
      organizationID: reportDetail.organizationID,
    };
  }
}
