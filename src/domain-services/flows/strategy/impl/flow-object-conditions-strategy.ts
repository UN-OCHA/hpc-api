import { Database } from '@unocha/hpc-api-core/src/db';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import { FlowService } from '../../flow-service';
import {
  FlowSearchStrategy,
  FlowSearchStrategyResponse,
} from '../flow-search-strategy';

@Service()
export class FlowObjectFiltersStrategy implements FlowSearchStrategy {
  constructor(
    private readonly flowService: FlowService,
    private readonly flowObjectService: FlowObjectService
  ) {}

  async search(
    flowConditions: Map<string, any>,
    orderBy: any,
    limit: number,
    cursorCondition: any,
    models: Database
  ): Promise<FlowSearchStrategyResponse> {
    const flowObjectsConditions: Map<
      string,
      Map<string, number[]>
    > = flowConditions.get('flowObjects');
    const flowEntityConditions = flowConditions.get('flow');

    const flowObjectWhere = this.mapFlowObjectConditionsToWhereClause(
      flowObjectsConditions
    );

    // Obtain flowIDs based on provided flowObject conditions
    const flowIDsFromFilteredFlowObjects =
      await this.flowObjectService.getFlowIdsFromFlowObjects(
        models,
        flowObjectWhere
      );

    // Combine conditions from flowObjects FlowIDs and flow conditions
    const mergedFlowConditions = {
      ...flowEntityConditions,
      id: {
        [Op.IN]: flowIDsFromFilteredFlowObjects,
      },
    };

    const conditions = { ...cursorCondition, ...mergedFlowConditions };

    // Obtain flows and flowCount based on flowIDs from filtered flowObjects
    // and flow conditions
    const [flows, countRes] = await Promise.all([
      this.flowService.getFlows(models, conditions, orderBy, limit),
      this.flowService.getFlowsCount(models, mergedFlowConditions),
    ]);

    // Map count result query to count object
    const countObject = countRes[0] as { count: number };

    return { flows, count: countObject.count };
  }

  /*
   * Map structure:
   * {
   *   KEY = objectType: string,
   *   VALUE = {
   *         KEY = refDirection: string,
   *         VALUE = [objectID: number]
   *         }
   * }
   */
  private mapFlowObjectConditionsToWhereClause(
    flowObjectConditions: Map<string, Map<string, number[]>>
  ): any {
    let flowObjectWhere: any = {};
    for (const [objectType, refDirectionMap] of flowObjectConditions) {
      for (const [refDirection, objectIDs] of refDirectionMap) {
        flowObjectWhere = {
          ...flowObjectWhere,
          objectID: {
            [Op.IN]: objectIDs,
          },
          refDirection: {
            [Op.LIKE]: refDirection,
          },
          objectType: {
            [Op.LIKE]: objectType,
          },
        };
      }
    }

    return flowObjectWhere;
  }
}
