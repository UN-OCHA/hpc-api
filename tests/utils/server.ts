import * as Hapi from '@hapi/hapi';
import { type Database } from '@unocha/hpc-api-core/src/db';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import {
  ApolloServer,
  ApolloServerPluginStopHapiServer,
} from 'apollo-server-hapi';
import type Knex from 'knex';
import PlatformPath from 'node:path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { CONFIG } from '../../config';
import { getTokenFromRequest } from '../../src/common-libs/auth';

export default async function createApolloTestServer(
  connection: Knex,
  models: Database,
  auth?: boolean
) {
  const schema = await buildSchema({
    resolvers: [
      PlatformPath.join(
        __dirname,
        '../../src/domain-services/**/resolver.{ts,js}'
      ),
    ],
    container: Container, // Register the 3rd party IOC container
  });

  const hapiServer = Hapi.server({
    port: CONFIG.httpPort,
    app: {
      config: CONFIG,
      connection,
    },
  });

  const apolloServerConfig = {
    connection,
    models,
    config: CONFIG,
  };

  return new ApolloServer({
    schema,
    context: ({ request }: { request: Hapi.Request }) => ({
      ...apolloServerConfig,
      token: auth ? getTokenFromRequest(request) : undefined,
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
}
