import { Database } from '@unocha/hpc-api-core/src/db';
import { FlowEntity } from '../model';

export interface FlowSearchStrategyResponse {
  flows: FlowEntity[];
  count: number;
}

export interface FlowSearchStrategy {
  search(
    flowConditions: Map<string, any>,
    orderBy: any,
    limit: number,
    cursorCondition: any,
    models: Database
  ): Promise<FlowSearchStrategyResponse>;
}
