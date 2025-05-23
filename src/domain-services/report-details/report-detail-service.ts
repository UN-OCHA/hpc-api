import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type UniqueFlowEntity } from '../flows/model';
import { type ReportDetail } from './graphql/types';
@Service()
export class ReportDetailService {
  async getReportDetailsForFlows(
    flowIds: FlowId[],
    models: Database
  ): Promise<Map<number, ReportDetail[]>> {
    const reportDetails: Array<InstanceDataOfModel<Database['reportDetail']>> =
      await models.reportDetail.find({
        where: {
          flowID: {
            [Op.IN]: flowIds,
          },
        },
        skipValidation: true,
      });

    const reportDetailsMap = new Map<number, ReportDetail[]>();

    for (const flowId of flowIds) {
      if (!reportDetailsMap.has(flowId)) {
        reportDetailsMap.set(flowId, []);
      }

      const flowsReportingDetails = reportDetails.filter(
        (report) => report.flowID === flowId
      );

      if (flowsReportingDetails && flowsReportingDetails.length > 0) {
        const reportDetailsPerFlow = getOrCreate(
          reportDetailsMap,
          flowId,
          () => []
        );

        for (const reportDetail of flowsReportingDetails) {
          const reportDetailMapped =
            this.mapReportDetailsToFlowReportDetail(reportDetail);
          reportDetailsPerFlow.push(reportDetailMapped);
        }
      }
    }

    return reportDetailsMap;
  }

  private mapReportDetailsToFlowReportDetail(
    reportDetail: InstanceOfModel<Database['reportDetail']>
  ): ReportDetail {
    return {
      id: reportDetail.id,
      flowID: reportDetail.flowID,
      versionID: reportDetail.versionID,
      contactInfo: reportDetail.contactInfo,
      source: reportDetail.source,
      date: reportDetail.date
        ? new Date(reportDetail.date).toISOString()
        : null,
      sourceID: reportDetail.sourceID,
      refCode: reportDetail.refCode,
      verified: reportDetail.verified,
      createdAt: reportDetail.createdAt.toISOString(),
      updatedAt: reportDetail.updatedAt.toISOString(),
      organizationID: reportDetail.organizationID,
      channel: null,
    };
  }

  async getUniqueFlowIDsFromReportDetailsByReporterReferenceCode(
    models: Database,
    reporterRefCode: string
  ): Promise<Set<string>> {
    const reportDetails: Array<InstanceDataOfModel<Database['reportDetail']>> =
      await models.reportDetail.find({
        where: {
          refCode: { [models.Op.ILIKE]: `%${reporterRefCode}%` },
        },
        skipValidation: true,
        distinct: ['flowID'],
      });

    return new Set(
      reportDetails.map((report) => {
        return `${report.flowID}:${report.versionID}`;
      })
    );
  }

  async getUniqueFlowIDsFromReportDetailsBySourceSystemID(
    models: Database,
    sourceSystemID: string
  ): Promise<Set<string>> {
    const reportDetails: Array<InstanceDataOfModel<Database['reportDetail']>> =
      await models.reportDetail.find({
        where: {
          sourceID: sourceSystemID,
        },
        skipValidation: true,
      });

    return new Set(
      reportDetails.map((report) => {
        return `${report.flowID}:${report.versionID}`;
      })
    );
  }

  private mapReportDetailToUniqueFlowEntity(
    reportDetail: InstanceDataOfModel<Database['reportDetail']>
  ): UniqueFlowEntity {
    return {
      id: createBrandedValue(reportDetail.flowID),
      versionID: reportDetail.versionID,
    };
  }
}
