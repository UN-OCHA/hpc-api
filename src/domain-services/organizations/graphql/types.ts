import { Field, ObjectType } from 'type-graphql';
import { BaseTypeWithDirection } from '../../base-types';

@ObjectType()
export class Organization extends BaseTypeWithDirection {
  @Field(() => Number, { nullable: false })
  id: number;

  @Field({ nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  abbreviation: string | null;

  @Field(() => String, { nullable: true })
  url: string | null;

  @Field(() => Number, { nullable: true })
  parentID: number | null;

  @Field(() => String, { nullable: true })
  nativeName: string | null;

  @Field(() => String, { nullable: true })
  comments: string | null;

  @Field({ nullable: true })
  collectiveInd: boolean;

  @Field({ nullable: true })
  active: boolean;

  @Field(() => Number, { nullable: true })
  newOrganizationId: number | null;

  @Field({ nullable: true })
  verified: boolean;

  @Field(() => String, { nullable: true })
  notes: string | null;
}
