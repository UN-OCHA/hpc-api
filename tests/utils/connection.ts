import * as t from 'io-ts';
import Knex from 'knex';

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
  const knex = Knex({
    client: 'pg',
    connection,
    pool: { min: 0, max: 10, idleTimeoutMillis: 500 },
    debug: false,
  });

  // Verify the connection before proceeding
  try {
    await knex.raw('SELECT now()');

    return knex;
  } catch (error) {
    console.error(error);
    throw new Error(
      'Unable to connect to Postgres via Knex. Ensure a valid connection.'
    );
  }
}
