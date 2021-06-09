import { BaseType } from '../../base-types';
import { MaxLength } from 'class-validator';
import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql';

export enum LocationStatus {
  active = 'active',
  expired = 'expired',
}

registerEnumType(LocationStatus, {
  name: 'LocationStatus',
});

@ObjectType()
export default class Location extends BaseType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  @MaxLength(255)
  externalId?: string;

  @Field({ nullable: true })
  @MaxLength(255)
  name?: string;

  @Field(() => Int)
  adminLevel: number; // Accidentally optional

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field(() => Int, { nullable: true })
  parentId?: number;

  @Field({ nullable: true })
  @MaxLength(3)
  iso3?: string;

  @Field({ nullable: true })
  pcode?: string;

  @Field(() => LocationStatus)
  status?: LocationStatus; // Accidentally optional

  @Field(() => Int, { nullable: true })
  validOn?: number;

  @Field({ defaultValue: true })
  itosSync: boolean; // Accidentally optional
}
