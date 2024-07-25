import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
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

    const externalReferencesMap = new Map<number, FlowExternalReference[]>();

    // First we add all flowIDs to the map
    // Since there might be flows without external references
    // thus we want to keep them in the map
    for (const flowID of flowIDs) {
      externalReferencesMap.set(flowID, []);
    }

    // Then we add the external references to the map
    // Grouping them by flowID
    for (const externalReference of externalReferences) {
      const flowID = externalReference.flowID;
      const externalReferenceMapped =
        this.mapExternalReferenceToExternalReferenceFlows(externalReference);

      const references = externalReferencesMap.get(flowID);
      // Logicless check to avoid TS error
      // This should never happen since we added all flowIDs to the map
      if (references) {
        references.push(externalReferenceMapped);
      }
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
    externalReference: InstanceOfModel<Database['externalReference']>
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
      versionID: external.versionID,
    };
  }
}
