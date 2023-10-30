import { Op } from '@unocha/hpc-api-core/src/db/util/conditions';
import { createBrandedValue } from '@unocha/hpc-api-core/src/util/types';
import { ObjectType, Field } from 'type-graphql';

export interface ItemPaged {
  cursor: number;
}

@ObjectType()
export class PageInfo<TSortFields extends string> {
  @Field({ nullable: false })
  hasNextPage: boolean;

  @Field({ nullable: false })
  hasPreviousPage: boolean;

  @Field({ nullable: false })
  startCursor: number;

  @Field({ nullable: false })
  endCursor: number;

  @Field({ nullable: false })
  pageSize: number;

  @Field(() => String, { nullable: false })
  sortField: TSortFields;

  @Field({ nullable: false })
  sortOrder: string;

  @Field({ nullable: false })
  total: number;
}

export function prepareConditionFromCursor(
  sortCondition: { column: string; order: 'asc' | 'desc' },
  afterCursor?: number,
  beforeCursor?: number
): any {
  if (afterCursor && beforeCursor) {
    throw new Error('Cannot use before and after cursor at the same time');
  }

  if (afterCursor || beforeCursor) {
    const isAscending = sortCondition.order === 'asc';
    const cursorValue = afterCursor || beforeCursor;

    let op;
    if (isAscending) {
      op = afterCursor ? Op.GT : Op.LT;
    } else {
      op = beforeCursor ? Op.GT : Op.LT;
    }

    return {
      id: {
        [op]: createBrandedValue(cursorValue),
      },
    };
  }

  return {};
}
