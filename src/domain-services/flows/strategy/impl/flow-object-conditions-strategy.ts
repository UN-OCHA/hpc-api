import { type Database } from '@unocha/hpc-api-core/src/db';
import { type FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { Service } from 'typedi';
import { FlowObjectService } from '../../../flow-object/flow-object-service';
import { type FlowService } from '../../flow-service';
import {
  type FlowSearchStrategy,
  type FlowSearchStrategyResponse,
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
    // Obtain flowObjects conditions
    const flowObjectsConditions: Map<
      string,
      Map<string, number[]>
    > = flowConditions.get('flowObjects') ?? new Map();

    // Obtain flow conditions
    const flowEntityConditions = flowConditions.get('flow') ?? new Map();

    // Obtain where clause for flowObjects
    const flowObjectWhere = this.mapFlowObjectConditionsToWhereClause(
      flowObjectsConditions
    );

    // Obtain flowIDs based on provided flowObject conditions
    const flowIDsFromFilteredFlowObjects: FlowId[] =
      await this.getFlowIDsFromFilteredFlowObjects(models, flowObjectWhere);

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

  private async getFlowIDsFromFilteredFlowObjects(
    models: Database,
    flowObjectWhere: any[]
  ): Promise<FlowId[]> {
    const flowIDsFromFilteredFlowObjects: FlowId[] = [];
    const tempFlowIDs: FlowId[][] = await Promise.all(
      flowObjectWhere.map((whereClause) =>
        this.flowObjectService.getFlowIdsFromFlowObjects(models, whereClause)
      )
    );
    // Flatten array of arrays keeping only values present in all arrays
    const flowIDs = tempFlowIDs.reduce((a, b) =>
      a.filter((c) => b.includes(c))
    );
    flowIDsFromFilteredFlowObjects.push(...flowIDs);

    return flowIDsFromFilteredFlowObjects;
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
  ): any[] {
    const whereClauses = [];
    for (const [objectType, refDirectionMap] of flowObjectConditions) {
      for (const [refDirection, objectIDs] of refDirectionMap) {
        const whereClause = {
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

        whereClauses.push(whereClause);
      }
    }

    return whereClauses;
  }
}
