import { ApolloError } from 'apollo-server-express'

export type ErrorResponse =
  | string
  | {
    message: string;
    [id: string]: any;
  }

export class ExtendableError extends ApolloError {
  constructor(message: string){
      super(message); 
  }
}