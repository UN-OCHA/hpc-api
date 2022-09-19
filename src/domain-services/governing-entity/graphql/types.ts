import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseType } from '../../base-types';

@ObjectType()
export default class GoverningEntity extends BaseType {
  @Field(() => ID)
  id: Brand<number, { readonly s: unique symbol }, 'Governing Entity ID'>;

  @Field({ nullable: true })
  name?: string;
}
