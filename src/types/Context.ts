import { Request } from 'express';
import Participant from '../database/models/Participant';

import { LogContext } from '../lib/loggerWithContext';

export default interface Context {
  req: Request;
  participant?: Participant;
  logger: LogContext;
  authData?: Record<string, any>
}
