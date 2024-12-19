import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { Service } from 'typedi';

@Service()
export class LegacyService {
  async getFlowIdFromLegacyId(
    models: Database,
    legacyId: number
  ): Promise<FlowId | null> {
    const legacyEntry = await models.legacy.findOne({
      where: {
        legacyID: legacyId,
        objectType: 'flow',
      },
    });

    if (legacyEntry) {
      return createBrandedValue(legacyEntry.objectID);
    }
    return null;
  }
}
