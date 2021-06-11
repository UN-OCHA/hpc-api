import 'reflect-metadata';
import * as Hapi from '@hapi/hapi';
import { ApolloServer } from 'apollo-server-hapi';
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

  const apolloServer = new ApolloServer({
    schema,
    context: () => ({
      knex: dbConnection,
      models: dbModels(dbConnection),
    }),
  });

  const server = Hapi.server({
    port: config.httpPort,
    app: {
      config,
      knex: dbConnection,
    },
  });

  server.route({
    method: 'GET',
    path: '/v4',
    handler: () => {
      return 'Hello World!';
    },
  });

  await apolloServer.applyMiddleware({
    app: server,
    path: '/v4/graphql',
  });

  await apolloServer.installSubscriptionHandlers(server.listener);

  await server.start();
  console.log(`🚀 Server ready at http://localhost:${config.httpPort}`);
}

startServer().catch((error) => console.log(error));
