import { ApolloServer, ExpressContext } from 'apollo-server-express';
import * as bodyParser from 'body-parser';
import * as express from 'express'
import { graphqlUploadExpress } from 'graphql-upload';
import { OpenAPI, useSofa } from 'sofa-api';
import { buildSchema } from 'type-graphql';
import * as swaggerUI from 'swagger-ui-express';
import 'reflect-metadata';

import Participant from './database/models/Participant';

//Resolvers
import ParticipantResolver from './features/Participant/resolver';
import ReportingWindowResolver from './features/ReportingWindow/resolver';

import Context from './types/Context';
import logEventsPlugin from './plugins/logEvents';
  
import { extractToken, getParticipantFromToken, getFlattenedAuthRequirements, actionIsPermitted } from './utils/auth';
import { createRootContextFromContext } from './utils/logging'

import './database';
import setupLogger from './lib/logging';
import AuthRequirements from 'types/AuthRequirements';
class App {
  public app: express.Application;
  private graphqlSchema: ApolloServer['schema'];
  private apolloServer!: ApolloServer;

  constructor() {
    setupLogger();
    this.app = express();
    (async () => {
      this.graphqlSchema = await this.buildGraphQLSchema()
      this.setupGraphQL();
      this.setupREST();
    })();
  }

  private async setupGraphQL() {
    this.apolloServer = new ApolloServer({
      schema: this.graphqlSchema,
      uploads: false,
      context: async ({ req, connection }: { req: express.Request, connection: ExpressContext['connection'] }): Promise<Context> => {
        const token = extractToken(req);
        let participant: Participant | undefined = undefined;
        if (token) {
          participant = await getParticipantFromToken(token);
        }
        const logger = await createRootContextFromContext(req, participant);
        console.log("connection: ", connection);
        return {
          req,
          participant,
          logger
        };
      },
      plugins: [
        logEventsPlugin
      ]
    });
    this.app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 10 }));
    this.apolloServer.applyMiddleware({ app: this.app, path: '/graphql' });
  }

  private buildGraphQLSchema() {
    return buildSchema({
      resolvers: [ParticipantResolver, ReportingWindowResolver],
      emitSchemaFile: true,
      validate: true,
      authChecker: async ({ context, root, info, args }: { context: Context; root: any; info: any; args: any }, permissions: AuthRequirements[]) => {
        // console.log("info.fieldNodes: ", JSON.stringify(info.fieldNodes));
        // console.log("info.parentType.getFields(): ", JSON.stringify(info.parentType.getFields()));
        if (context.participant) {
          const authRequirements = await getFlattenedAuthRequirements(permissions, context, args);
          const permssionsRequired = authRequirements.flatMap(authRequirement => authRequirement.condition);
          console.log("permissionsRequired: ", JSON.stringify(permssionsRequired));
          const dataRelatedToPermission = authRequirements.flatMap(authRequirement => authRequirement.data);
          context.authData = dataRelatedToPermission;
          return await actionIsPermitted(context, permssionsRequired);
        }
        return false;
      },
    });
  }

  private setupREST() {
    const openAPI = OpenAPI({
      schema: this.graphqlSchema,
      info: {
        title: 'HPC Service V3',
        version: '3.0.0'
      }
    });
    this.app.use('/rest/', bodyParser.json());
    this.app.use('/rest/', bodyParser.urlencoded({ extended: false }));
    this.app.use('/rest', useSofa({ schema: this.graphqlSchema, basePath: '/rest', onRoute(info) {
      openAPI.addRoute(info, {
        basePath: '/rest'
      })
    } }));
    this.app.use('/rest/api-docs', swaggerUI.serve, swaggerUI.setup(openAPI.get()))
    openAPI.save('./swagger.yml');
  }
}
export default new App().app;
