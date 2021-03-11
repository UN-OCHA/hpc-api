import { Arg, Ctx, FieldResolver, Query, Resolver, ResolverInterface, Root } from 'type-graphql';

import Plan, { PlanFundingBreakdown, PlanCluster } from '../../entities/Plan';
import Context from '../../types/Context';

const CLUSTERS: PlanCluster[] = [
  {
    id: 1,
    name: 'WASH'
  },
  {
    id: 2,
    name: 'HEALTH'
  }
]

const BREAKDOWN: PlanFundingBreakdown = {
  byCluster: [
    {
      amountUSD: 1000,
      cluster: {
        id: 1,
        name: 'WASH'
      }
    },
    {
      amountUSD: 2000,
      cluster: {
        id: 2,
        name: 'HEALTH'
      }
    }
  ]
}

const PLANS: Plan[] = [
  {
    id: 1 as any,
    name: 'Plan A',
    year: 2020,
    fundingRequirements: {
      amountUSD: 1234567,
      breakdown: BREAKDOWN
    },
    funding: {
      amountUSD: 10000,
      breakdown: BREAKDOWN
    },
    clusters: CLUSTERS,
    caseloads: [
      {
        id: 0,
        name: 'Plan Caseload Estimates',
        population: 40200000,
        inNeed: 4100000,
        targeted: 1500000
      }
    ]
  },

  {
    id: 2 as any,
    name: 'Plan B',
    year: 2020,
    fundingRequirements: {
      amountUSD: 1234567,
      breakdown: {}
    },
    funding: {
      amountUSD: 10000,
      breakdown: {}
    },
    clusters: CLUSTERS,
    caseloads: [
      {
        id: 0,
        name: 'Plan Caseload Estimates',
        population: 40200000,
        affected: 7100000,
        inNeed: 4100000,
        targeted: 1500000,
        expectedReach: 1000000
      }
    ]
  }
]

@Resolver(_of => Plan)
export default class PlanResolver { //implements ResolverInterface<Plan> {
    @Query(_returns => [Plan], {
        description: "Get all the plans",
    })
    async allPlans(
      @Arg('year', { description: "plan years interested in", nullable: true }) year: number | null,
      @Ctx() ctx: Context,
    ) {
      return PLANS.filter(plan => (
        year === null || year === plan.year
      ));
    }
}
