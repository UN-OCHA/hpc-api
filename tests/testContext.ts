import v4Models, { type Database } from '@unocha/hpc-api-core/src/db';
import { type ApolloServer } from 'apollo-server-hapi';
import type Knex from 'knex';
import { createDbConnetion } from './utils/connection';
import createApolloTestServer from './utils/server';

interface IContext {
  models?: Database;
  conn: Knex;
  transactions: Record<string, Knex.Transaction>;
  apolloTestServer: ApolloServer;
}

export default class ContextProvider implements IContext {
  private static _instance: ContextProvider;

  models?: Database;
  conn: Knex;
  transactions: Record<string, Knex.Transaction>;
  apolloTestServer: ApolloServer;

  private constructor() {
    this.models = {} as Database;
    this.transactions = {};
    this.conn = {} as Knex;
    this.apolloTestServer = {} as ApolloServer;
  }

  public static get Instance(): ContextProvider {
    if (this._instance) {
      return this._instance;
    }
    this._instance = new ContextProvider();
    return this._instance;
  }

  public async setUpContext(): Promise<void> {
    const connection = await this.createDbTestConection();
    this.conn = connection;
    this.models = v4Models(this.conn);
    this.apolloTestServer = await createApolloTestServer(
      this.conn,
      this.models
    );
  }

  private async createDbTestConection(): Promise<Knex<any, unknown[]>> {
    return await createDbConnetion({
      db: {
        poolMin: 1,
        poolMax: 1,
        poolIdle: 1,
        connection: {
          host: 'localhost',
          port: 5432,
          user: 'postgres',
          password: '',
          database: 'hpc',
        },
      },
    });
  }
}
