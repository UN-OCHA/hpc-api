import * as t from 'io-ts';
import { knex } from 'knex';

const CONFIG = t.type({
  host: t.string,
  port: t.number,
  user: t.string,
  database: t.string,
});

/**
 * Initialize a new Postgres provider
 */
export async function createDbConnection(connection: t.TypeOf<typeof CONFIG>) {
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
    console.log(error);
    throw new Error(
      'Unable to connect to Postgres via Knex. Ensure a valid connection.'
    );
  }
}
