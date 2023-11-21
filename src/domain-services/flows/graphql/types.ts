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
  @Field(() => [Category], { nullable: true })
  categories: Category[];

  @Field(() => [Organization], { nullable: true })
  organizations: Organization[];

  @Field(() => [BasePlan], { nullable: true })
  plans: BasePlan[];

  @Field(() => [BaseLocation], { nullable: true })
  locations: BaseLocation[];

  @Field(() => [UsageYear], { nullable: true })
  usageYears: UsageYear[];

  @Field(() => [Number], { nullable: true })
  childIDs: number[];

  @Field(() => [Number], { nullable: true })
  parentIDs: number[];

  @Field({ nullable: true })
  origAmount: string;

  @Field({ nullable: true })
  origCurrency: string;

  @Field(() => [FlowExternalReference], { nullable: true })
  externalReferences: FlowExternalReference[];

  @Field(() => [ReportDetail], { nullable: true })
  reportDetails: ReportDetail[];

  @Field(() => [FlowParkedParentSource], { nullable: true })
  parkedParentSource: FlowParkedParentSource[] | null;
}

@ObjectType()
export class FlowPaged extends Flow implements IItemPaged {
  @Field({ nullable: false })
  cursor: number;
}

@ObjectType()
export class FlowSearchResult extends PageInfo<FlowSortField> {
  @Field(() => [FlowPaged], { nullable: false })
  flows: FlowPaged[];
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
