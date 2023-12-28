import { Args, Ctx, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';
import Context from '../../Context';
import { FlowSearchService } from '../flow-search-service';
import { SearchFlowsArgs, SearchFlowsArgsNonPaginated } from './args';
import {
  Flow,
  FlowSearchResult,
  FlowSearchResultNonPaginated,
  FlowSearchTotalAmountResult,
} from './types';

@Service()
@Resolver(Flow)
export default class FlowResolver {
  constructor(private flowSearchService: FlowSearchService) {}

  @Query(() => FlowSearchResult)
  async searchFlows(
    @Ctx() context: Context,
    @Args(() => SearchFlowsArgs, { validate: false })
    args: SearchFlowsArgs
  ): Promise<FlowSearchResult> {
    return await this.flowSearchService.search(
      context.models,
      context.connection,
      args
    );
  }

  @Query(() => FlowSearchTotalAmountResult)
  async searchFlowsTotalAmountUSD(
    @Ctx() context: Context,
    @Args(() => SearchFlowsArgsNonPaginated, { validate: false })
    args: SearchFlowsArgsNonPaginated
  ): Promise<FlowSearchTotalAmountResult> {
    return await this.flowSearchService.searchTotalAmount(
      context.models,
      context.connection,
      args
    );
  }

  @Query(() => FlowSearchResultNonPaginated)
  async searchFlowsBatches(
    @Ctx() context: Context,
    @Args(() => SearchFlowsArgs, { validate: false })
    args: SearchFlowsArgs
  ): Promise<FlowSearchResultNonPaginated> {
    // Set default batch size to 1000
    args.limit = args.limit > 0 ? args.limit : 1000;
    return await this.flowSearchService.searchBatches(
      context.models,
      context.connection,
      args
    );
  }
}
