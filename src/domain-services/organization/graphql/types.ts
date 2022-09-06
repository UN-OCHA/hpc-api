import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { MaxLength } from 'class-validator';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseTypeWithSoftDelete } from '../../base-types';

@ObjectType()
export default class Organization extends BaseTypeWithSoftDelete {
  @Field(() => ID)
  id: Brand<number, { readonly s: unique symbol }, 'Organization ID'>;

  @Field()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @MaxLength(255)
  abbreviation?: string;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  parentID?: number;

  @Field({ nullable: true })
  @MaxLength(255)
  nativeName?: string;

  @Field({ nullable: true })
  comments?: string;

  @Field()
  collectiveInd: boolean;

  @Field()
  active: boolean;

  @Field()
  verified: boolean;

  @Field({ nullable: true })
  newOrganizationID?: number;

  @Field({ nullable: true })
  notes?: string;
}
