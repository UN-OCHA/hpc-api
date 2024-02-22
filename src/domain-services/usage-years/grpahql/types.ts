import { Field, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';

@ObjectType()
export class UsageYear extends BaseType {
  @Field({ nullable: false })
  year: string;

  @Field({ nullable: false })
  direction: string;
}
