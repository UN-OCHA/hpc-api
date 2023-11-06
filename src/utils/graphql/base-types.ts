import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class BaseType {
  @Field(() => String, { nullable: false })
  createdAt: string;

  @Field(() => String, { nullable: false })
  updatedAt: string;
}

@ObjectType()
export class BaseTypeWithSoftDelete extends BaseType {
  @Field({ nullable: true })
  deletedAt: Date;
}
