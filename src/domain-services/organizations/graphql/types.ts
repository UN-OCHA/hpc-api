import { Field, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';

@ObjectType()
export class Organization extends BaseType {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: true })
  direction: string;

  @Field({ nullable: true })
  name: string;
}
