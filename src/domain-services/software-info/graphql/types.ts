import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export default class SoftwareInfo {
  @Field({ nullable: false })
  title: string;

  @Field({ nullable: false })
  status: string;

  @Field({ nullable: false })
  version: string;
}
