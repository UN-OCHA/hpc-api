import { knex } from 'knex';

type ConnectionConfig = {
  host: string;
  port: number;
  user: string;
  database: string;
};

/**
 * Initialize a new Postgres provider
 */
export async function createDbConnection(connection: ConnectionConfig) {
  const knexInstance = knex({
    client: 'pg',
    connection,
    pool: { min: 0, max: 10, idleTimeoutMillis: 500 },
    debug: false,
  });

  // Verify the connection before proceeding
  try {
    await knexInstance.raw('SELECT now()');

    return knexInstance;
  } catch (error) {
    console.error(error);
    throw new Error(
      'Unable to connect to Postgres via Knex. Ensure a valid connection.'
    );
  }
}
