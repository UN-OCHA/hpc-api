import { ArgsType, Field, InputType } from 'type-graphql';
import { FlowSortField } from './types';
import { PaginationArgs } from '../../../utils/graphql/pagination';

@InputType()
export class SearchFlowsFilters {
  @Field({ nullable: true })
  activeStatus: boolean;
}

@ArgsType()
export class SearchFlowsArgs extends PaginationArgs<FlowSortField> {
  @Field(() => SearchFlowsFilters, { nullable: true })
  filters: SearchFlowsFilters;
}
