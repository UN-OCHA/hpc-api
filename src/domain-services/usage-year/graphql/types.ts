import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { MaxLength } from 'class-validator';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseType } from '../../base-types';

@ObjectType()
export default class UsageYear extends BaseType {
  @Field(() => ID)
  id: Brand<number, { readonly s: unique symbol }, 'Usage Year ID'>;

  @Field()
  @MaxLength(255)
  year: string;
}
