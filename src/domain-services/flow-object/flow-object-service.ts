import { Database } from '@unocha/hpc-api-core/src/db';
import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Service } from 'typedi';

@Service()
export class FlowObjectService {
  async getFlowIdsFromFlowObjects(
    models: Database,
    where: any
  ): Promise<FlowId[]> {
    const flowObjects = await models.flowObject.find({
      where,
    });
    // Keep only not duplicated flowIDs
    return [...new Set(flowObjects.map((flowObject) => flowObject.flowID))];
  }
}