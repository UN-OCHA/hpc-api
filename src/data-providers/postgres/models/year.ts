import { createModel, TableBaseWithTimeStamps } from './common/base';

export interface YearTable extends TableBaseWithTimeStamps {
  year: number;
}

export const yearModel = createModel<YearTable>('usageYear');
