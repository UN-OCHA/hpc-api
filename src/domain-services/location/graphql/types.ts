import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { MaxLength } from 'class-validator';
import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';

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
  id: Brand<number, { readonly s: unique symbol }, 'Location ID'>;

  @Field({ nullable: true })
  @MaxLength(255)
  externalId?: string;

  @Field({ nullable: true })
  @MaxLength(255)
  name?: string;

  @Field(() => Number)
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

  @Field(() => Number, { nullable: true })
  validOn?: number;

  @Field({ defaultValue: true })
  itosSync: boolean; // Accidentally optional
}

@ObjectType()
export class BaseLocation extends BaseType {
  @Field(() => Int, { nullable: true })
  id: number;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field({ nullable: true })
  direction: string;

  @Field({ nullable: true })
  externalId?: string;

  @Field(() => Number)
  adminLevel: number | null; // Accidentally optional

  @Field(() => Number, { nullable: true })
  latitude: number | null;

  @Field(() => Number, { nullable: true })
  longitude: number | null;

  @Field(() => Int, { nullable: true })
  parentId: number | null;

  @Field(() => String, { nullable: true })
  iso3: string | null;

  @Field(() => String, { nullable: true })
  pcode: string | null;

  @Field(() => String)
  status: string | null; // Accidentally optional

  @Field(() => Number, { nullable: true })
  validOn: string | number | null;

  @Field({ defaultValue: true })
  itosSync: boolean; // Accidentally optional
}
