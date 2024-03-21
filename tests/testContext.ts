import v4Models, { type Database } from '@unocha/hpc-api-core/src/db';
import { type ApolloServer } from 'apollo-server-hapi';
import type Knex from 'knex';
import { createDbConnection } from './utils/connection';
import createApolloTestServer from './utils/server';

interface IContext {
  models: Database;
  conn: Knex;
  apolloTestServer: ApolloServer;
}

export default class ContextProvider implements IContext {
  private static _instance: ContextProvider;

  models: Database;
  conn: Knex;
  apolloTestServer: ApolloServer;

  private constructor() {
    this.models = {} as Database;
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
    const connection = await this.createDbTestConnection();
    this.conn = connection;
    this.models = v4Models(this.conn);
    this.apolloTestServer = await createApolloTestServer(
      this.conn,
      this.models
    );
  }

  private async createDbTestConnection(): Promise<Knex<any, unknown[]>> {
    return await createDbConnection({
      host: 'localhost',
      port: 6432,
      user: 'postgres',
      database: 'hpc-test',
    });
  }
}
