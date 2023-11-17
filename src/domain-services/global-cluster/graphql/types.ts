import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseType } from '../../base-types';

@ObjectType()
export default class GlobalCluster extends BaseType {
  @Field(() => ID)
  id: Brand<number, { readonly s: unique symbol }, 'Global cluster ID'>;

  @Field({ nullable: true })
  name?: string;
}
