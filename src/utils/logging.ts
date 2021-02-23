import { Request } from 'express';

import { createRootContext } from "../lib/loggerWithContext";
import Participant from '../database/models/Participant';

/**
 * Create a fresh context for an Graphql Context
 */
export const createRootContextFromContext = async (req: Request, participant?: Participant) => {
  const currentTimeStamp = new Date();
  return createRootContext({
    hpc: {
      req: {
        method: req.method,
        path: req.path,
        userId: participant?.id,
        userEmail: participant?.email,
        time: currentTimeStamp,
      }
    }
  })
};