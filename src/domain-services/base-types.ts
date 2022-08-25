import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class BaseType {
  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class BaseTypeWithSoftDelete extends BaseType {
  @Field({ nullable: true })
  deletedAt: Date;
}
