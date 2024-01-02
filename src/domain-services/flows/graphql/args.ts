import { ArgsType, Field, InputType } from 'type-graphql';
import { PaginationArgs } from '../../../utils/graphql/pagination';
import { type FlowSortField } from './types';

@InputType()
export class SearchFlowsFilters {
  @Field(() => [Number], { nullable: true })
  id: number[] | null;

  @Field(() => Boolean, { nullable: true })
  activeStatus: boolean | null;

  @Field(() => String, { nullable: true })
  status: 'commitment' | 'paid' | 'pledged' | null;

  @Field(() => String, { nullable: true })
  type: 'carryover' | 'parked' | 'pass_through' | 'standard' | null;

  @Field(() => Number, { nullable: true })
  amountUSD: number | null;

  @Field(() => Number, { name: 'reporterRefCode', nullable: true })
  reporterReferenceCode: number | null;

  @Field(() => Number, { name: 'sourceSystemID', nullable: true })
  sourceSystemId: number | null;

  @Field(() => Number, { name: 'legacyID', nullable: true })
  legacyId: number | null;

  @Field(() => Boolean, { nullable: true })
  restricted: boolean | null;

  constructor() {}
}

@InputType()
export class FlowCategoryFilters {
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

  @Field({ name: 'includeChildrenOfParkedFlows', nullable: true })
  shouldIncludeChildrenOfParkedFlows: boolean;

  @Field(() => [FlowCategory], { nullable: true })
  flowCategoryFilters: FlowCategory[];

  @Field(() => Boolean, { nullable: true })
  pending: boolean;

  @Field(() => Boolean, { nullable: true })
  commitment: boolean;

  @Field(() => Boolean, { nullable: true })
  paid: boolean;

  @Field(() => Boolean, { nullable: true })
  pledged: boolean;

  @Field(() => Boolean, { nullable: true })
  carryover: boolean;

  @Field(() => Boolean, { nullable: true })
  parked: boolean;

  @Field(() => Boolean, { nullable: true })
  pass_through: boolean;

  @Field(() => Boolean, { nullable: true })
  standard: boolean;
}

@ArgsType()
export class SearchFlowsArgsNonPaginated {
  @Field(() => SearchFlowsFilters, { nullable: true })
  flowFilters: SearchFlowsFilters;

  @Field(() => [FlowObjectFilters], { nullable: true })
  flowObjectFilters: FlowObjectFilters[];

  @Field({ name: 'includeChildrenOfParkedFlows', nullable: true })
  shouldIncludeChildrenOfParkedFlows: boolean;

  @Field(() => [FlowCategory], { nullable: true })
  flowCategoryFilters: FlowCategory[];

  @Field(() => Boolean, { nullable: true })
  pending: boolean;

  @Field(() => Boolean, { nullable: true })
  commitment: boolean;

  @Field(() => Boolean, { nullable: true })
  paid: boolean;

  @Field(() => Boolean, { nullable: true })
  pledged: boolean;

  @Field(() => Boolean, { nullable: true })
  carryover: boolean;

  @Field(() => Boolean, { nullable: true })
  parked: boolean;

  @Field(() => Boolean, { nullable: true })
  pass_through: boolean;

  @Field(() => Boolean, { nullable: true })
  standard: boolean;
}
