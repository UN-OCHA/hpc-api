import { Database } from '@unocha/hpc-api-core/src/db';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { Service } from 'typedi';
import { FlowExternalReference } from '../flows/graphql/types';

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

    flowIDs.forEach((flowID) => {
      externalReferencesMap.set(flowID, []);
    });

    externalReferences.forEach((externalReference) => {
      const flowID = externalReference.flowID;
      const externalReferenceMapped =
        this.mapExternalReferenceToExternalReferenceFlows(externalReference);

      if (!externalReferencesMap.has(flowID)) {
        externalReferencesMap.set(flowID, []);
      }

      externalReferencesMap.get(flowID).push(externalReferenceMapped);
    });

    return externalReferencesMap;
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
}
