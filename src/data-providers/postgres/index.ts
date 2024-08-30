import { knex } from 'knex';
import { CONFIG } from '../../../config';

/**
 * Initialize a new Postgres provider
 */
export async function createDbConnection() {
  const knexInstance = knex({
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
    await knexInstance.raw('SELECT now()');

    return knexInstance;
  } catch {
    throw new Error(
      'Unable to connect to Postgres via Knex. Ensure a valid connection.'
    );
  }
}

export default { createDbConnection };
