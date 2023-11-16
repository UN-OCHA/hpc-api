import { type Database } from '@unocha/hpc-api-core/src/db';
import { type InstanceDataOfModel } from '@unocha/hpc-api-core/src/db/util/raw-model';

export type FlowEntity = InstanceDataOfModel<Database['flow']>;
