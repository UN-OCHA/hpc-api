import Flow, { FlowSearchResult, FlowSortField } from './types';
import { Service } from 'typedi';
import { Arg, Args, Ctx, Query, Resolver } from 'type-graphql';
import { FlowSearchService } from '../flow-search-service';
import Context from '../../Context';
import { SearchFlowsFilters } from './args';
import { PaginationArgs } from '../../../utils/graphql/pagination';

@Service()
@Resolver(Flow)
export default class FlowResolver {
  constructor(private flowSearchService: FlowSearchService) {}

  @Query(() => FlowSearchResult)
  async searchFlows(
    @Ctx() context: Context,
    @Args(() => PaginationArgs, { validate: false })
    pagination: PaginationArgs<FlowSortField>,
    @Arg('activeStatus', { nullable: true }) activeStatus: boolean
  ): Promise<FlowSearchResult> {
    const { limit, sortOrder, sortField, afterCursor, beforeCursor } =
      pagination;
    const filters: SearchFlowsFilters = {
      activeStatus,
    };
    return await this.flowSearchService.search(
      context.models,
      limit,
      sortOrder,
      sortField,
      afterCursor,
      beforeCursor,
      filters
    );
  }
}
