import { FlowPaged, FlowSearchResult, FlowSortField } from './types';
import { Service } from 'typedi';
import { Arg, Args, Ctx, Query, Resolver } from 'type-graphql';
import { FlowSearchService } from '../flow-search-service';
import Context from '../../Context';
import { SearchFlowsArgs } from './args';

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
}
