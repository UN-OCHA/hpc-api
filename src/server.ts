import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import {
  ApolloServer,
  ApolloServerPluginStopHapiServer,
} from 'apollo-server-hapi';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { Knex } from 'knex';
import { join } from 'path';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';

import config from '../config';
import { createDbConnetion } from './data-providers/postgres';
import dbModels from './data-providers/postgres/models';

declare module '@hapi/hapi' {
  interface ServerApplicationState {
    config: typeof config;
    knex: Knex;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ServerOptionsApp extends ServerApplicationState {
    /**
     * This needs to be an interface rather than a type to successfully
     * overwrite / extend the Hapi type definitions.
     */
  }
}

async function startServer() {
  const schema = await buildSchema({
    resolvers: [join(__dirname, 'domain-services/**/resolver.{ts,js}')],
    container: Container, // Register the 3rd party IOC container
  });

  const dbConnection = await createDbConnetion();

  const hapiServer = Hapi.server({
    port: CONFIG.httpPort,
    app: {
      config: CONFIG,
      knex: dbConnection,
    },
  });

  const apolloServer = new ApolloServer({
    schema,
    context: () => ({
      knex: dbConnection,
      models: dbModels(dbConnection),
    }),
    plugins: [
      ApolloServerPluginStopHapiServer({ hapiServer }),
      /**
       * Don't use sandbox explorer hosted on https://studio.apollographql.com
       * but use local sandbox instead. Even though GraphQL playground is
       * retired, it is much more useful for local development
       * https://github.com/graphql/graphql-playground/issues/1143
       */
      ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });

  await apolloServer.start();
  await apolloServer.applyMiddleware({
    app: hapiServer,
    path: '/v4/graphql',
  });

  await hapiServer.start();
  console.log(`🚀 Server ready at http://localhost:${config.httpPort}`);
}

startServer().catch((error) => console.log(error));
