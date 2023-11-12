import { Database } from '@unocha/hpc-api-core/src/db';
import { FlowSearchResult } from '../graphql/types';
import { InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';
import { InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';

export interface FlowSearchStrategyResponse {
  flows: InstanceDataOfModel<Database['flow']>[];
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
