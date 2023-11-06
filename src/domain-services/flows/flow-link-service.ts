import { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Database } from '@unocha/hpc-api-core/src/db/type';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';

@Service()
export class FlowLinkService {
  async getFlowLinksForFlows(
    flowIds: FlowId[],
    models: Database
  ): Promise<Map<number, any[]>> {
    const flowLinks = await models.flowLink.find({
      where: {
        childID: {
          [Op.IN]: flowIds,
        },
      },
    });

    // Group flowLinks by flow ID for easy mapping
    const flowLinksMap = new Map<number, any[]>();

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
