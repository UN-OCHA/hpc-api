import { createModel, TableBaseWithTimeStamps } from './common/base';

export interface ParticipantTable extends TableBaseWithTimeStamps {
  id: number;
  hidId: string;
  email: string;
  name: string;
}

export const participantModel = createModel<ParticipantTable>('participant');
