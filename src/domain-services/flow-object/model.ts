import { Database } from '@unocha/hpc-api-core/src/db';
import { InstanceOfModel } from '@unocha/hpc-api-core/src/db/util/types';

export type FlowObject = InstanceOfModel<Database['flowObject']>;
