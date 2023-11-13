import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { Service } from 'typedi';

@Service()
export class FlowLinkService {
  async getFlowLinksForFlows(
    flowIds: FlowId[],
    models: Database
  ): Promise<Map<number, InstanceOfModel<Database['flowLink']>[]>> {
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
      InstanceOfModel<Database['flowLink']>[]
    >();

    // Populate the map with flowLinks for each flow
    flowLinks.forEach((flowLink) => {
      const flowId = flowLink.childID.valueOf();

      if (!flowLinksMap.has(flowId)) {
        flowLinksMap.set(flowId, []);
      }

      const flowLinksForFlow = flowLinksMap.get(flowId)!;

      flowLinksForFlow.push(flowLink);
    });

    return flowLinksMap;
  }
}
