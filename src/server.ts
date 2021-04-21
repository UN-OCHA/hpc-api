import * as Hapi from '@hapi/hapi';
import { ApolloServer } from 'apollo-server-hapi';
import { Knex } from 'knex';
import { makeSchema } from 'nexus';
import { join } from 'path';

import config from '../config';
import { createDbConnetion } from './data-providers/postgres';
import * as types from './graphql-types';

declare module '@hapi/hapi' {
  interface ServerApplicationState {
    config: typeof config;
    knex: Knex;
  }
}

async function StartServer() {
  const schema = makeSchema({
    types,
    outputs: {
      typegen: join(__dirname, '..', 'nexus-typegen.ts'),
      schema: join(__dirname, '..', 'schema.graphql'),
    },
    // contextType: {
    //   module: join(__dirname, "./context.ts"),
    //   export: "Context",
    // },
  });

  const dbConnection = await createDbConnetion();

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({ knex: dbConnection }),
  });

  const server = Hapi.server({
    port: config.httpPort,
  });

  server.route({
    method: 'GET',
    path: '/v4',
    handler: (request, h) => {
      return 'Hello World!';
    },
  });

  await apolloServer.applyMiddleware({
    app: server,
    path: '/v4/graphql',
  });

  await apolloServer.installSubscriptionHandlers(server.listener);

  server.app.config = config;
  server.app.knex = dbConnection;

  await server.start();
  console.log(`🚀 Server ready at http://localhost:4000`);
}

StartServer().catch((error) => console.log(error));
