import { ApolloServerPlugin, GraphQLRequestContext } from 'apollo-server-plugin-base'

const isInstrospectionQuery = (requestContext: GraphQLRequestContext) =>
    requestContext.request.operationName === "IntrospectionQuery"

const plugin: ApolloServerPlugin = {
    requestDidStart: (requestContext) => {
        !isInstrospectionQuery(requestContext) && requestContext.logger.info("starting request");
        return {
            didEncounterErrors: (requestContext) => {
                !isInstrospectionQuery(requestContext) && requestContext.logger.error(`error occured while processing request: ${requestContext.errors}`) ;
            },
            willSendResponse: (requestContext) => {
                !isInstrospectionQuery(requestContext) && requestContext.logger.info("sending response for request"); 
            }      
        }
    },
}; 

export default plugin;