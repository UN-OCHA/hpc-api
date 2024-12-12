import { Field, ObjectType } from 'type-graphql';
import { BaseTypeWithDirection } from '../../base-types';

@ObjectType()
export class UsageYear extends BaseTypeWithDirection {
  @Field({ nullable: false })
  year: string;
}
