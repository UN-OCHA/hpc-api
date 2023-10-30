import Flow, { FlowSearchResult } from './types';
import { Service } from 'typedi';
import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { FlowSearchService } from '../flow-search-service';
import Context from '../../Context';

@Service()
@Resolver(Flow)
export default class FlowResolver {
  constructor(private flowSearchService: FlowSearchService) {}

  @Query(() => FlowSearchResult)
  async searchFlows(
    @Ctx() context: Context,
    @Arg('first', { nullable: false }) first: number,
    @Arg('afterCursor', { nullable: true }) afterCursor: number,
    @Arg('beforeCursor', { nullable: true }) beforeCursor: number,
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
    return await this.flowSearchService.search(
      context.models,
      first,
      afterCursor,
      beforeCursor,
      sortField,
      sortOrder
    );
  }
}
