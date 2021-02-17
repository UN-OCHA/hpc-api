import { Field } from "type-graphql";

export class BaseForm {
  @Field({ description: 'Id of the entity' })
  id: number;

  @Field({ description: 'The version of the entity' })
  version: number;
}