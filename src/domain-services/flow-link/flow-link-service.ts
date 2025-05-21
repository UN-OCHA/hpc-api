import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { type Database } from '@unocha/hpc-api-core/src/db/type';
import { Cond, Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { type InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { getOrCreate } from '@unocha/hpc-api-core/src/util';
import { Service } from 'typedi';

@Service()
export class FlowLinkService {
  async getFlowLinksForFlows(
    flowIds: FlowId[],
    models: Database
  ): Promise<Map<FlowId, Array<InstanceOfModel<Database['flowLink']>>>> {
    // Fetch all flow links in one go
    const flowLinks = await models.flowLink.find({
      where: {
        [Cond.AND]: [
          {
            [Cond.OR]: [
              {
                parentID: {
                  [Op.IN]: flowIds,
                },
              },
              {
                childID: {
                  [Op.IN]: flowIds,
                },
              },
            ],
          },
          {
            depth: { [Op.GTE]: 1 },
          },
        ],
      },
    });

    // Initialize the map with empty arrays for each flowId
    const flowLinksMap = new Map<
      FlowId,
      Array<InstanceOfModel<Database['flowLink']>>
    >();

    // Group flow links by `parentID` and `childID` in one pass
    for (const link of flowLinks) {
      const childFlowLink = getOrCreate(flowLinksMap, link.childID, () => []);
      const parentFlowLink = getOrCreate(flowLinksMap, link.parentID, () => []);
      childFlowLink.push(link);
      parentFlowLink.push(link);
    }

    return flowLinksMap;
  }
}
