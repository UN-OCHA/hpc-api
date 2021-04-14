import { objectType, floatArg, extendType } from 'nexus';
import PlansLib from '../plans-lib';

/**
 * Types
 */

export const Plan = objectType({
  name: 'Plan',
  definition(t) {
    t.nonNull.list.nonNull.field('caseloads', { type: PlanCaseload });
    t.nonNull.list.nonNull.field('clusters', { type: PlanCluster });
    t.nonNull.field('funding', { type: PlanFunding });
    t.nonNull.field('fundingRequirements', { type: PlanFunding });
    t.nonNull.id('id');
    t.nonNull.string('name');
    t.nonNull.float('year');
  },
});
export const PlanCaseload = objectType({
  name: 'PlanCaseload',
  definition(t) {
    t.float('affected', {
      description: 'How many people are affected by the humanitarian crisis',
    });
    t.float('expectedReach');
    t.nonNull.id('id');
    t.float('inNeed');
    t.nonNull.string('name');
    t.float('population');
    t.float('targeted', {
      description: 'How many people does this plan aim to target',
    });
  },
});
export const PlanCluster = objectType({
  name: 'PlanCluster',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.string('name');
  },
});
export const PlanFunding = objectType({
  name: 'PlanFunding',
  definition(t) {
    t.nonNull.float('amountUSD');
    t.nonNull.field('breakdown', { type: PlanFundingBreakdown });
  },
});
export const PlanFundingBreakdown = objectType({
  name: 'PlanFundingBreakdown',
  definition(t) {
    t.list.nonNull.field('byCluster', { type: PlanFundingBreakdownCluster });
  },
});
export const PlanFundingBreakdownCluster = objectType({
  name: 'PlanFundingBreakdownCluster',
  definition(t) {
    t.nonNull.float('amountUSD');
    t.nonNull.field('cluster', { type: PlanCluster });
  },
});

/**
 * Queries
 */

export const PlanQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('allPlans', {
      type: Plan,
      description: 'Get all the plans',
      args: {
        year: floatArg({ description: 'plan years interested in' }),
      },
      async resolve(_root, _args, ctx) {
        const res = await PlansLib.getAll(ctx.knex);
        return res;
      },
    });
  },
});
