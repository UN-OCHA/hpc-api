import { ArgsType, Field, InputType } from 'type-graphql';
import { PaginationArgs } from '../../../utils/graphql/pagination';
import { type FlowSortField } from './types';

@InputType()
export class SearchFlowsFilters {
  @Field(() => [Number], { nullable: true })
  id: number[];

  @Field({ nullable: true })
  activeStatus: boolean;

  @Field({ nullable: true })
  status: 'commitment' | 'paid' | 'pledged';

  @Field({ nullable: true })
  type: 'carryover' | 'parked' | 'pass_through' | 'standard';

  @Field({ nullable: true })
  amountUSD: number;

  @Field({ name: 'reporterRefCode', nullable: true })
  reporterReferenceCode: number;

  @Field({ name: 'sourceSystemID', nullable: true })
  sourceSystemId: number;

  @Field({ name: 'legacyID', nullable: true })
  legacyId: number;
}

@InputType()
export class FlowCategoryFilters {
  @Field({ nullable: true })
  pending: boolean;

  @Field(() => [FlowCategory], { nullable: true })
  categoryFilters: FlowCategory[];
}

@InputType()
export class FlowObjectFilters {
  @Field({ nullable: false })
  objectID: number;

  @Field({ nullable: false })
  direction: 'source' | 'destination';

  @Field({ nullable: false })
  objectType:
    | 'location'
    | 'organization'
    | 'plan'
    | 'usageYear'
    | 'category'
    | 'project'
    | 'globalCluster'
    | 'emergency';
}

@InputType()
export class FlowCategory {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: true })
  group: string;

  @Field({ nullable: true })
  name: string;
}

@ArgsType()
export class SearchFlowsArgs extends PaginationArgs<FlowSortField> {
  @Field(() => SearchFlowsFilters, { nullable: true })
  flowFilters: SearchFlowsFilters;

  @Field(() => [FlowObjectFilters], { nullable: true })
  flowObjectFilters: FlowObjectFilters[];

  @Field({ nullable: true })
  includeChildrenOfParkedFlows: boolean;

  @Field({ nullable: true })
  flowCategoryFilters: FlowCategoryFilters;
}

@ArgsType()
export class SearchFlowsArgsNonPaginated {
  @Field(() => SearchFlowsFilters, { nullable: true })
  flowFilters: SearchFlowsFilters;

  @Field(() => [FlowObjectFilters], { nullable: true })
  flowObjectFilters: FlowObjectFilters[];

  @Field({ nullable: true })
  includeChildrenOfParkedFlows: boolean;

  @Field({ nullable: true })
  flowCategoryFilters: FlowCategoryFilters;
}
