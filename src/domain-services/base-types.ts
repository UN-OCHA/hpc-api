import { Field, ObjectType } from 'type-graphql';

export type EntityDirection = 'source' | 'destination';
@ObjectType()
export class BaseType {
  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@ObjectType()
export class BaseTypeWithDirection extends BaseType {
  @Field()
  direction: EntityDirection;
}

@ObjectType()
export class BaseTypeWithSoftDelete extends BaseType {
  @Field(() => String, { nullable: true })
  deletedAt: string | null;
}
