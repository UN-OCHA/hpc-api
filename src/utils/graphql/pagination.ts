import { ArgsType, Field, ObjectType } from 'type-graphql';

export type SortOrder = 'asc' | 'desc';

export interface IItemPaged {
  cursor: string;
}

@ObjectType()
export class PageInfo<TSortFields extends string> {
  @Field({ nullable: false })
  hasNextPage: boolean;

  @Field({ nullable: false })
  hasPreviousPage: boolean;

  @Field(() => Number, { nullable: false })
  prevPageCursor: number;

  @Field(() => Number, { nullable: false })
  nextPageCursor: number;

  @Field({ nullable: false })
  pageSize: number;

  @Field(() => String, { nullable: false })
  sortField: TSortFields;

  @Field({ nullable: false })
  sortOrder: string;

  @Field({ nullable: false })
  total: number;
}

@ArgsType()
export class PaginationArgs<TSortFields extends string> {
  @Field({ nullable: false })
  limit: number;

  @Field(() => Number, { nullable: true })
  nextPageCursor: number;

  @Field(() => Number, { nullable: true })
  prevPageCursor: number;

  @Field(() => String, { nullable: true })
  sortField: TSortFields;

  @Field(() => String, { nullable: true, defaultValue: 'desc' })
  sortOrder: SortOrder;
}
