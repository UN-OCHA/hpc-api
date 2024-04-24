import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { MaxLength } from 'class-validator';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseTypeWithDirection } from '../../base-types';
import PlanTag from '../../plan-tag/graphql/types';

@ObjectType()
export class PlanCaseload {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  population?: number;

  @Field({
    nullable: true,
    description: 'How many people are affected by the humanitarian crisis',
  })
  affected?: number;

  @Field({ nullable: true })
  inNeed?: number;

  @Field({
    nullable: true,
    description: 'How many people does this plan aim to target',
  })
  targeted?: number;

  @Field({ nullable: true })
  expectedReach?: number;
}

@ObjectType()
export class PlanCluster {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}

@ObjectType()
export class PlanFundingBreakdownCluster {
  @Field()
  amountUSD: number;

  @Field(() => PlanCluster)
  cluster: PlanCluster;
}

@ObjectType()
export class PlanFundingBreakdown {
  @Field(() => [PlanFundingBreakdownCluster], {
    nullable: true,
  })
  byCluster?: PlanFundingBreakdownCluster[];
}

@ObjectType()
export class PlanFunding {
  @Field()
  amountUSD: number;

  @Field(() => PlanFundingBreakdown)
  breakdown: PlanFundingBreakdown;
}

@ObjectType()
export default class Plan {
  @Field(() => ID)
  id: Brand<number, { readonly s: unique symbol }, 'Plan ID'>;

  @Field()
  @MaxLength(255)
  name: string;

  @Field(() => [Number])
  years: number[];

  @Field(() => PlanFunding)
  fundingRequirements: PlanFunding;

  @Field(() => PlanFunding)
  funding: PlanFunding;

  @Field(() => [PlanCluster])
  clusters: PlanCluster[];

  @Field(() => [PlanCaseload])
  caseloads: PlanCaseload[];

  @Field(() => [PlanTag])
  tags: PlanTag[];
}

@ObjectType()
export class BasePlan extends BaseTypeWithDirection {
  @Field(() => Number, { nullable: true })
  id: number;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  startDate: string;

  @Field({ nullable: true })
  endDate: string;

  @Field(() => String, { nullable: true })
  comments: string | null;

  @Field({ nullable: true })
  isForHPCProjects: boolean;

  @Field(() => String, { nullable: true })
  code: string | null;

  @Field(() => String, { nullable: true })
  customLocationCode: string | null;

  @Field(() => Number, { nullable: true })
  currentReportingPeriodId: number | null;

  @Field({ nullable: true })
  currentVersion: boolean;

  @Field({ nullable: true })
  latestVersion: boolean;

  @Field({ nullable: true })
  latestTaggedVersion: boolean;

  @Field(() => Number, { nullable: true })
  lastPublishedReportingPeriodId: number | null;

  @Field(() => String, { nullable: true })
  clusterSelectionType: string | null;
}
