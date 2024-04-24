import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { Service } from 'typedi';

@Service()
export class FlowLinkService {
  async getFlowLinksForFlows(
    flowIds: FlowId[],
    models: Database
  ): Promise<Map<number, Array<InstanceOfModel<Database['flowLink']>>>> {
    const flowLinks = await models.flowLink.find({
      where: {
        childID: {
          [Op.IN]: flowIds,
        },
      },
    });

    // Group flowLinks by flow ID for easy mapping
    const flowLinksMap = new Map<
      number,
      Array<InstanceOfModel<Database['flowLink']>>
    >();

    // Populate the map with flowLinks for each flow
    for (const flowLink of flowLinks) {
      const flowId = flowLink.childID.valueOf();

      const flowLinksForFlow = getOrCreate(flowLinksMap, flowId, () => []);

      flowLinksForFlow.push(flowLink);
    }

    return flowLinksMap;
  }
}
