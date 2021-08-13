import Knex from 'knex';
import { CONFIG } from '../../../config';

/**
 * Initialize a new Postgres provider
 */
export async function createDbConnetion() {
  const knex = Knex({
    client: 'pg',
    connection: CONFIG.db.connection,
    pool: {
      min: CONFIG.db.poolMin,
      max: CONFIG.db.poolMax,
      idleTimeoutMillis: CONFIG.db.poolIdle,
    },
    acquireConnectionTimeout: 2000,
  });

  // Verify the connection before proceeding
  try {
    await knex.raw('SELECT now()');

    return knex;
  } catch (error) {
    throw new Error(
      'Unable to connect to Postgres via Knex. Ensure a valid connection.'
    );
  }
}

export default { createDbConnetion };
