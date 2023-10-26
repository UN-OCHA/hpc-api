import * as t from 'io-ts';
import Knex from 'knex';

const CONFIG = t.type({
  db: t.type({
    poolMin: t.number,
    poolMax: t.number,
    connection: t.type({
      host: t.string,
      port: t.number,
      user: t.string,
      password: t.string,
      database: t.string,
    }),
    poolIdle: t.number,
  }),
});

/**
 * Initialize a new Postgres provider
 */
export async function createDbConnetion(config: t.TypeOf<typeof CONFIG>) {
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
  } catch {
    throw new Error(
      'Unable to connect to Postgres via Knex. Ensure a valid connection.'
    );
  }
}

export default { createDbConnetion };
