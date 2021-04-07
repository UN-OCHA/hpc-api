import * as Hapi from '@hapi/hapi';
import { ApolloServer, gql } from 'apollo-server-hapi';
import "reflect-metadata";
import { buildSchema } from 'type-graphql';
import config from '../config';
import { createDbConnetion } from './data-providers/postgres'
import ParticipantResolver from './domain-services/participants/graphql/participant-resolvers';


async function StartServer() {
  const graphqlSchema = await buildSchema({
    resolvers: [ParticipantResolver],
    emitSchemaFile: true,
  });

  const dbConnection = await createDbConnetion();
  
  const apolloServer = new ApolloServer({ 
    schema: graphqlSchema, 
    context: ({ req }) => ({ knex: dbConnection }),
  });

  const server = new Hapi.server({
    port: config.httpPort
  });

  await apolloServer.applyMiddleware({
    app: server,
  });

  await apolloServer.installSubscriptionHandlers(server.listener);

  server.app.config = config;
  server.app.knex = dbConnection;

  await server.start();
  console.log(`🚀 Server ready at http://localhost:4000`)
}

StartServer().catch(error => console.log(error));
