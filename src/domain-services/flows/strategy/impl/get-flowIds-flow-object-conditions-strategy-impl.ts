import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import { FlowService } from '../../flow-service';
import { type UniqueFlowEntity } from '../../model';
import {
  type FlowIDSearchStrategy,
  type FlowIdSearchStrategyArgs,
  type FlowIdSearchStrategyResponse,
} from '../flowID-search-strategy';
import { buildSearchFlowsConditions, defaultFlowOrderBy } from './utils';

@Service()
export class GetFlowIdsFromObjectConditionsStrategyImpl
  implements FlowIDSearchStrategy
{
  constructor(
    private readonly flowObjectService: FlowObjectService,
    private readonly flowService: FlowService
  ) {}

  async search(
    args: FlowIdSearchStrategyArgs
  ): Promise<FlowIdSearchStrategyResponse> {
    const { flowObjectsConditions, databaseConnection } = args;

    // 1. Obtain flowIDs from flowObjects
    const flowsFromFilteredFlowObjects: UniqueFlowEntity[] = [];
    const flowObjects =
      await this.flowObjectService.getFlowObjectsByFlowObjectConditions(
        databaseConnection,
        flowObjectsConditions
      );

    // 1.1. Check if flowObjects is undefined
    if (!flowObjects) {
      return { flows: [] };
    }

    // 2. Map flowObjects to UniqueFlowEntity and store in flowsFromFilteredFlowObjects
    for (const flowObject of flowObjects) {
      flowsFromFilteredFlowObjects.push({
        id: flowObject.flowID,
        versionID: flowObject.versionID,
      });
    }

    // 3. Once we have the flowIDs
    // Search in the Flow table for the flowIDs and versionIDs
    // To verify that the flows are not deleted
    const uniqueFlowsNotDeleted: UniqueFlowEntity[] = [];
    // TEMP fix
    for (let i = 0; i < flowsFromFilteredFlowObjects.length; i += 1000) {
      const getFlowArgs = {
        databaseConnection,
        orderBy: defaultFlowOrderBy(),
        whereClauses: buildSearchFlowsConditions(
          flowsFromFilteredFlowObjects.slice(i, i + 1000)
        ),
      };
      const uniqueFlowsNotDeletedSlice =
        await this.flowService.getFlowsAsUniqueFlowEntity(getFlowArgs);
      uniqueFlowsNotDeleted.push(...uniqueFlowsNotDeletedSlice);
    }

    return { flows: uniqueFlowsNotDeleted };
  }
}
