import { Field, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';

@ObjectType()
export class CategoryRef extends BaseType {
  @Field({ nullable: false })
  objectID: number;

  @Field({ nullable: false })
  versionID: number;

  @Field({ nullable: false })
  objectType: string;

  @Field({ nullable: false })
  categoryID: number;
}

@ObjectType()
export class Category extends BaseType {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  group: string;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  parentID: number;

  @Field({ nullable: true })
  code: string;

  @Field({ nullable: true })
  includeTotals: boolean;

  @Field(() => CategoryRef, { nullable: true })
  categoryRef: CategoryRef;
}
