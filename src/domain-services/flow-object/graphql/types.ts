import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseType } from '../../base-types';

@ObjectType()
export default class FlowObject extends BaseType {
  @Field(() => ID)
  objectID: Brand<number, { readonly s: unique symbol }, 'Object ID'>;

  @Field(() => ID)
  flowID: Brand<number, { readonly s: unique symbol }, 'Flow ID'>;

  @Field()
  objectType: string;

  @Field()
  refDirection: string;

  @Field({ nullable: true })
  behaviour: string;

  @Field({ nullable: true })
  objectDetail: string;
}
