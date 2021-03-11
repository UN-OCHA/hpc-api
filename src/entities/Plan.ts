import { Field, ObjectType, ID } from 'type-graphql';

import { Brand } from "../utils/branding";

@ObjectType()
export class PlanCaseload {

  @Field(_type => ID)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true})
  population?: number;

  @Field({ nullable: true, description: 'How many people are affected by the humanitarian crisis' })
  affected?: number;

  @Field({ nullable: true })
  inNeed?: number;

  @Field({ nullable: true, description: 'How many people does this plan aim to target' })
  targeted?: number;

  @Field({ nullable: true })
  expectedReach?: number;

}

@ObjectType()
export class PlanCluster {

  @Field(_type => ID)
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
    nullable: true
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

  @Field(_type => ID)
  id: Brand<
      number,
      { readonly s: unique symbol },
      'Plan ID'
  >;

  @Field()
  name: string

  @Field()
  year: number;

  @Field(() => PlanFunding)
  fundingRequirements: PlanFunding;

  @Field(() => PlanFunding)
  funding: PlanFunding;

  @Field(() => [PlanCluster])
  clusters: PlanCluster[];

  @Field(() => [PlanCaseload])
  caseloads: PlanCaseload[];
}
