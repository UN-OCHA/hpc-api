import { Field, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';

@ObjectType()
export class ReportDetail extends BaseType {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  flowID: number;

  @Field({ nullable: false })
  versionID: number;

  @Field(() => String, { nullable: true })
  contactInfo: string | null;

  @Field({ nullable: false })
  source: string;

  @Field(() => String, { nullable: true })
  date: string | null;

  @Field(() => String, { nullable: true })
  sourceID: string | null;

  @Field(() => String, { nullable: true })
  refCode: string | null;

  @Field({ nullable: false })
  verified: boolean;

  @Field(() => Number, { nullable: true })
  organizationID: number | null;
}
