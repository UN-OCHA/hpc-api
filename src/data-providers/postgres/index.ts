import Knex from 'knex';
import config from '../../../config';

/**
 * Initialize a new Postgres provider
 */
export async function createDbConnetion() {
  const knex = Knex({
    client: 'pg',
    connection: config.db.connection,
    pool: {
      min: config.db.poolMin,
      max: config.db.poolMax,
      idleTimeoutMillis: config.db.poolIdle,
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
