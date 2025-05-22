import { type EXTERNAL_DATA_SYSTEM_ID } from '@unocha/hpc-api-core/src/db/models/externalData';
import type { ReportDetailId } from '@unocha/hpc-api-core/src/db/models/reportDetail';
import type * as t from 'io-ts';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseType } from '../../base-types';

@ObjectType()
export class ReportDetail extends BaseType {
  @Field(() => ID, { nullable: false })
  id: ReportDetailId;

  @Field({ nullable: false })
  flowID: number;

  @Field(() => Number, { nullable: false })
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

  @Field(() => String, { nullable: true })
  channel: string | null;
}

export type SystemID = t.TypeOf<typeof EXTERNAL_DATA_SYSTEM_ID>;
