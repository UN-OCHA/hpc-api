import { type Database } from '@unocha/hpc-api-core/src/db';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';
import { type SortOrder } from '../../utils/graphql/pagination';
export type FlowEntity = InstanceDataOfModel<Database['flow']>;

export type FlowOrderBy = {
  column: string;
  order: SortOrder;
  entity: string;
  direction: FlowNestedDirection | undefined;
};

export type FlowNestedDirection = 'source' | 'destination';
