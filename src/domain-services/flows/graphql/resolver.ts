import Flow, { FlowSearchResult, FlowSortField } from './types';
import { Service } from 'typedi';
import { Arg, Args, Ctx, Query, Resolver } from 'type-graphql';
import { FlowService } from '../flow-service';
import Context from '../../Context';

@Service()
@Resolver(Flow)
export default class FlowResolver {
  constructor(private flowService: FlowService) {}

  @Query(() => FlowSearchResult)
  async searchFlows(
    @Ctx() context: Context,
    @Arg('first', { nullable: false }) first: number,
    @Arg('afterCursor', { nullable: true }) afterCursor: string,
    @Arg('sortField', { nullable: true })
    sortField:
      | 'id'
      | 'amountUSD'
      | 'versionID'
      | 'activeStatus'
      | 'restricted'
      | 'newMoney'
      | 'flowDate'
      | 'decisionDate'
      | 'firstReportedDate'
      | 'budgetYear'
      | 'origAmount'
      | 'origCurrency'
      | 'exchangeRate'
      | 'description'
      | 'notes'
      | 'versionStartDate'
      | 'versionEndDate'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt',
    @Arg('sortOrder', { nullable: true }) sortOrder: 'asc' | 'desc'
  ): Promise<FlowSearchResult> {
    return await this.flowService.search(
      context.models,
      first,
      afterCursor,
      sortField,
      sortOrder
    );
  }
}
