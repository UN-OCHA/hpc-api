import type { PlanId } from '@unocha/hpc-api-core/src/db/models/plan';
import type { PlanReportingPeriodId } from '@unocha/hpc-api-core/src/db/models/planReportingPeriod';
import type { PlanTagId } from '@unocha/hpc-api-core/src/db/models/planTag';
import { IsEnum, MaxLength } from 'class-validator';
import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from 'type-graphql';

export enum RevisionState {
  projectsOnly = 'projectsOnly',
  none = 'none',
  planDataAndProjects = 'planDataAndProjects',
  planDataOnly = 'planDataOnly',
}
registerEnumType(RevisionState, {
  name: 'RevisionState',
});

export enum PlanTagType {
  major = 'major',
  minor = 'minor',
  custom = 'custom',
}
registerEnumType(PlanTagType, {
  name: 'Type',
});

@ObjectType()
export default class PlanTag {
  @Field(() => ID)
  id: PlanTagId;

  @Field()
  planId: number;

  @Field()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @MaxLength(50)
  type: PlanTagType;

  @Field()
  public: boolean;

  @Field({ nullable: true })
  @MaxLength(255)
  comments: string;

  @Field({ nullable: true })
  @IsEnum(RevisionState)
  revisionState: RevisionState;
}

@InputType({ description: 'New plan tag data' })
export class AddPlanTagInput implements Partial<PlanTag> {
  @Field(() => ID)
  planId: PlanId;

  @Field()
  @MaxLength(50)
  type: PlanTagType;

  @Field()
  major: boolean;

  @Field({ nullable: true })
  @MaxLength(255)
  comments: string;

  @Field({ nullable: true })
  @IsEnum(RevisionState)
  revisionState: RevisionState;

  @Field(() => [ID], { nullable: true })
  reportingPeriodIds: PlanReportingPeriodId[];

  @Field()
  publishMeasurements: boolean;
}
