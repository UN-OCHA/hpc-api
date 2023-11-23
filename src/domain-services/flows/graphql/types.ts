import { Field, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';
import { PageInfo, type IItemPaged } from '../../../utils/graphql/pagination';
import { Category } from '../../categories/graphql/types';
import { BaseLocation } from '../../location/graphql/types';
import { Organization } from '../../organizations/graphql/types';
import { BasePlan } from '../../plans/graphql/types';
import { ReportDetail } from '../../report-details/graphql/types';
import { UsageYear } from '../../usage-years/grpahql/types';

@ObjectType()
export class FlowExternalReference {
  @Field({ nullable: false })
  systemID: string;

  @Field({ nullable: false })
  flowID: number;

  @Field({ nullable: false })
  externalRecordID: string;

  @Field({ nullable: false })
  versionID: number;

  @Field({ nullable: false })
  createdAt: string;

  @Field({ nullable: false })
  updatedAt: string;

  @Field({ nullable: false })
  externalRecordDate: string;
}

@ObjectType()
export class FlowParkedParentSource {
  @Field(() => [Number], { nullable: false })
  organization: number[];

  @Field(() => [String], { nullable: false })
  orgName: string[];
}

@ObjectType()
export class BaseFlow extends BaseType {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  versionID: number;

  @Field({ nullable: false })
  amountUSD: string;

  @Field({ nullable: false })
  activeStatus: boolean;

  @Field({ nullable: false })
  restricted: boolean;
}

@ObjectType()
export class Flow extends BaseFlow {
  @Field(() => [Category], { nullable: false })
  categories: Category[];

  @Field(() => [Organization], { nullable: false })
  organizations: Organization[];

  @Field(() => [BasePlan], { nullable: false })
  plans: BasePlan[];

  @Field(() => [BaseLocation], { nullable: false })
  locations: BaseLocation[];

  @Field(() => [UsageYear], { nullable: false })
  usageYears: UsageYear[];

  @Field(() => [Number], { nullable: false })
  childIDs: number[];

  @Field(() => [Number], { nullable: false })
  parentIDs: number[];

  @Field(() => String, { nullable: true })
  origAmount: string | null;

  @Field(() => String, { nullable: true })
  origCurrency: string | null;

  @Field(() => [FlowExternalReference], { nullable: false })
  externalReferences: FlowExternalReference[];

  @Field(() => [ReportDetail], { nullable: false })
  reportDetails: ReportDetail[];

  @Field(() => [FlowParkedParentSource], { nullable: false })
  parkedParentSource: FlowParkedParentSource[];
}

@ObjectType()
export class FlowPaged extends Flow implements IItemPaged {
  @Field(() => String, { nullable: false })
  cursor: string;
}

@ObjectType()
export class FlowSearchResult extends PageInfo<FlowSortField> {
  @Field(() => [FlowPaged], { nullable: false })
  flows: FlowPaged[];
}

@ObjectType()
export class FlowSearchResultNonPaginated {
  @Field(() => [FlowPaged], { nullable: false })
  flows: FlowPaged[];

  @Field(() => Number, { nullable: false })
  flowsCount: number;
}

@ObjectType()
export class FlowSearchTotalAmountResult {
  @Field(() => String, { nullable: false })
  totalAmountUSD: string;

  @Field(() => Number, { nullable: false })
  flowsCount: number;
}

export type FlowSortField =
  | 'id'
  | 'versionID'
  | 'amountUSD'
  | 'updatedAt'
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
  | 'deletedAt';
