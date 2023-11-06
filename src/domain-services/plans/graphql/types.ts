import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { MaxLength } from 'class-validator';
import { Field, ID, Int, ObjectType } from 'type-graphql';
import PlanTag from '../../plan-tag/graphql/types';
import { BaseType } from '../../../utils/graphql/base-types';

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

  @Field(() => [Int])
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
export class BasePlan extends BaseType {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  direction: string;
}
