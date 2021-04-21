import { createModel, TableBaseWithTimeStamps } from '../common/base';

export interface AuthTargetTable extends TableBaseWithTimeStamps {
  targetId: number;
  type: string;
}

export const authTargetModel = createModel<AuthTargetTable>('authTarget');
