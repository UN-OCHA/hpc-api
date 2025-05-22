import type { CategoryId } from '@unocha/hpc-api-core/src/db/models/category';
import type { FlowId } from '@unocha/hpc-api-core/src/db/models/flow';
import { ArgsType, Field, ID, InputType, Int } from 'type-graphql';
import { PaginationArgs } from '../../../utils/graphql/pagination';
import { FlowObjectType } from '../../flow-object/model';
import { type SystemID } from '../../report-details/graphql/types';
import { type FlowSortField, type FlowStatusFilter } from './types';

@InputType()
export class SearchFlowsFilters {
  @Field(() => [ID], { nullable: true })
  id: FlowId[] | null;

  @Field(() => Boolean, { nullable: true })
  activeStatus: boolean | null;

  @Field(() => Int, { nullable: true })
  amountUSD: number | null;

  @Field(() => Boolean, { nullable: true })
  restricted: boolean | null;
}

@InputType()
export class NestedFlowFilters {
  @Field(() => String, { nullable: true })
  reporterRefCode: string | null;

  @Field(() => String, { nullable: true })
  sourceSystemID: string | null;

  @Field(() => Number, { nullable: true })
  legacyID: number | null;

  @Field(() => String, { nullable: true })
  systemID: SystemID | null;
}

@InputType()
export class FlowCategoryFilters {
  @Field(() => [FlowCategory], { nullable: true })
  categoryFilters: FlowCategory[];
}

@InputType()
export class FlowObjectFilters {
  @Field(() => Number, { nullable: false })
  objectID: number;

  @Field({ nullable: false })
  direction: 'source' | 'destination';

  @Field(() => String, { nullable: false })
  objectType: FlowObjectType;

  @Field({ nullable: true, defaultValue: false })
  inclusive: boolean;
}

@InputType()
export class FlowCategory {
  @Field(() => ID, { nullable: true })
  id: CategoryId | null;

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

  @Field(() => NestedFlowFilters, { nullable: true })
  nestedFlowFilters: NestedFlowFilters;

  @Field({ nullable: true })
  includeChildrenOfParkedFlows: boolean;

  @Field(() => [FlowCategory], { nullable: true })
  flowCategoryFilters: FlowCategory[];

  @Field(() => Boolean, { nullable: true })
  pending: boolean;

  @Field(() => Boolean, { nullable: true })
  commitment: boolean;

  @Field(() => Boolean, { nullable: true })
  paid: boolean;

  @Field(() => Boolean, { nullable: true })
  pledge: boolean;

  @Field(() => Boolean, { nullable: true })
  carryover: boolean;

  @Field(() => Boolean, { nullable: true })
  parked: boolean;

  @Field(() => Boolean, { nullable: true })
  pass_through: boolean;

  @Field(() => Boolean, { nullable: true })
  standard: boolean;

  @Field(() => String, { nullable: true })
  status: FlowStatusFilter | null;
}

@ArgsType()
export class SearchFlowsArgsNonPaginated {
  @Field(() => SearchFlowsFilters, { nullable: true })
  flowFilters: SearchFlowsFilters;

  @Field(() => [FlowObjectFilters], { nullable: true })
  flowObjectFilters: FlowObjectFilters[];

  @Field(() => NestedFlowFilters, { nullable: true })
  nestedFlowFilters: NestedFlowFilters;

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
  pledge: boolean;

  @Field(() => Boolean, { nullable: true })
  carryover: boolean;

  @Field(() => Boolean, { nullable: true })
  parked: boolean;

  @Field(() => Boolean, { nullable: true })
  pass_through: boolean;

  @Field(() => Boolean, { nullable: true })
  standard: boolean;

  @Field(() => String, { nullable: true })
  status: FlowStatusFilter | null;
}
