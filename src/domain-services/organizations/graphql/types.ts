import { Field, Int, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';

@ObjectType()
export class Organization extends BaseType {
  @Field(() => Int, { nullable: false })
  id: number;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  direction: string;

  @Field({ nullable: true })
  abbreviation: string;

  @Field({ nullable: true })
  url: string;

  @Field(() => Int, { nullable: true })
  parentID: number;

  @Field({ nullable: true })
  nativeName: string;

  @Field({ nullable: true })
  comments: string;

  @Field({ nullable: true })
  collectiveInd: string;

  @Field({ nullable: true })
  active: boolean;

  @Field({ nullable: true })
  newOrganisationId: number;

  @Field({ nullable: true })
  verified: boolean;

  @Field({ nullable: true })
  notes: string;
}
