import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';
import { type FlowExternalReference } from '../flows/graphql/types';
import { type UniqueFlowEntity } from '../flows/model';
import { type SystemID } from '../report-details/graphql/types';

@Service()
export class ExternalReferenceService {
  async getExternalReferencesForFlows(flowIDs: FlowId[], models: Database) {
    const externalReferences = await models.externalReference.find({
      where: {
        flowID: {
          [Op.IN]: flowIDs,
        },
      },
      skipValidation: true,
    });

    const externalReferencesMap = new Map<number, any>();

    for (const flowID of flowIDs) {
      externalReferencesMap.set(flowID, []);
    }

    for (const externalReference of externalReferences) {
      const flowID = externalReference.flowID;
      const externalReferenceMapped =
        this.mapExternalReferenceToExternalReferenceFlows(externalReference);

      if (!externalReferencesMap.has(flowID)) {
        externalReferencesMap.set(flowID, []);
      }

      externalReferencesMap.get(flowID).push(externalReferenceMapped);
    }

    return externalReferencesMap;
  }

  async getUniqueFlowIDsBySystemID(
    models: Database,
    systemID: SystemID
  ): Promise<UniqueFlowEntity[]> {
    const externalRefences: Array<
      InstanceDataOfModel<Database['externalReference']>
    > = await models.externalReference.find({
      where: {
        systemID: systemID,
      },
      skipValidation: true,
    });

    const flowIDs: UniqueFlowEntity[] = [];

    for (const reference of externalRefences) {
      flowIDs.push(this.mapExternalDataToUniqueFlowEntity(reference));
    }

    return flowIDs;
  }

  private mapExternalReferenceToExternalReferenceFlows(
    externalReference: InstanceDataOfModel<Database['externalReference']>
  ): FlowExternalReference {
    return {
      systemID: externalReference.systemID,
      flowID: externalReference.flowID,
      externalRecordID: externalReference.externalRecordID,
      externalRecordDate: externalReference.externalRecordDate.toISOString(),
      createdAt: externalReference.createdAt.toISOString(),
      updatedAt: externalReference.updatedAt.toISOString(),
      versionID: externalReference.versionID ?? 0,
    };
  }

  private mapExternalDataToUniqueFlowEntity(
    external: InstanceDataOfModel<Database['externalReference']>
  ): UniqueFlowEntity {
    return {
      id: createBrandedValue(external.flowID),
      versionID: external.versionID ?? 1,
    };
  }
}
