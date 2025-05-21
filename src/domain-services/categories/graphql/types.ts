import type { CategoryId } from '@unocha/hpc-api-core/src/db/models/category';
import { Field, ID, Int, ObjectType } from 'type-graphql';
import { BaseType } from '../../base-types';

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
  @Field(() => ID, { nullable: true })
  id: CategoryId | null;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  group: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => Int, { nullable: true })
  parentID: number | null;

  @Field({ nullable: true })
  code: string;

  @Field(() => CategoryRef, { nullable: true })
  categoryRef: CategoryRef;

  @Field({ nullable: false })
  versionID: number;
}
