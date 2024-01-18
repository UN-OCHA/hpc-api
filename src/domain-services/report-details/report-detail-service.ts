import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type Category } from '../categories/graphql/types';
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
        const reportDetailsPerFlow = reportDetailsMap.get(flowId)!;

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
    reportDetail: InstanceDataOfModel<Database['reportDetail']>
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

  addChannelToReportDetails(
    reportDetails: ReportDetail[],
    categories: Category[]
  ) {
    for (const reportDetail of reportDetails) {
      const category = categories.find((cat) => cat.group === 'reportChannel');

      if (category) {
        reportDetail.channel = category.name;
      }
    }
    return reportDetails;
  }

  async getUniqueFlowIDsFromReportDetailsByReporterReferenceCode(
    models: Database,
    reporterReferenceCodes: string[]
  ): Promise<UniqueFlowEntity[]> {
    const reportDetails: Array<InstanceDataOfModel<Database['reportDetail']>> =
      await models.reportDetail.find({
        where: {
          refCode: {
            [Op.IN]: reporterReferenceCodes,
          },
        },
        skipValidation: true,
      });

    const flowIDs: UniqueFlowEntity[] = [];

    for (const reportDetail of reportDetails) {
      flowIDs.push(this.mapReportDetailToUniqueFlowEntity(reportDetail));
    }

    return flowIDs;
  }

  async getUniqueFlowIDsFromReportDetailsBySourceID(
    models: Database,
    sourceIDs: string[]
  ): Promise<UniqueFlowEntity[]> {
    const reportDetails: Array<InstanceDataOfModel<Database['reportDetail']>> =
      await models.reportDetail.find({
        where: {
          sourceID: {
            [Op.IN]: sourceIDs,
          },
        },
        skipValidation: true,
      });

    const flowIDs: UniqueFlowEntity[] = [];

    for (const reportDetail of reportDetails) {
      flowIDs.push(this.mapReportDetailToUniqueFlowEntity(reportDetail));
    }

    return flowIDs;
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
