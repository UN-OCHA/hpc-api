import { Args, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { FlowSearchService } from '../flow-search-service';
import { SearchFlowsArgs, SearchFlowsArgsNonPaginated } from './args';
import {
  FlowPaged,
  FlowSearchResult,
  FlowSearchTotalAmountResult,
} from './types';

@Service()
@Resolver(FlowPaged)
export default class FlowResolver {
  constructor(private flowSearchService: FlowSearchService) {}

  @Query(() => FlowSearchResult)
  async searchFlows(
    @Ctx() context: Context,
    @Args(() => SearchFlowsArgs, { validate: false })
    args: SearchFlowsArgs
  ): Promise<FlowSearchResult> {
    return await this.flowSearchService.search(context.models, args);
  }

  @Query(() => FlowSearchTotalAmountResult)
  async searchFlowsTotalAmountUSD(
    @Ctx() context: Context,
    @Args(() => SearchFlowsArgsNonPaginated, { validate: false })
    args: SearchFlowsArgsNonPaginated
  ): Promise<FlowSearchTotalAmountResult> {
    return await this.flowSearchService.searchTotalAmount(context.models, args);
  }
}
