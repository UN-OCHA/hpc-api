import { Field, Int, ObjectType } from 'type-graphql';
import { BaseType } from '../../../utils/graphql/base-types';
import { PageInfo } from '../../../utils/graphql/pagination';
import { Category } from '../../categories/graphql/types';
import { BaseLocation } from '../../location/graphql/types';
import { Organization } from '../../organizations/graphql/types';
import { BasePlan } from '../../plans/graphql/types';
import { ReportDetail } from '../../report-details/graphql/types';
import { UsageYear } from '../../usage-years/graphql/types';

@ObjectType()
export class FlowExternalReference {
  @Field({ nullable: false })
  systemID: string;

  @Field(() => Int, { nullable: false })
  flowID: number;

  @Field({ nullable: false })
  externalRecordID: string;

  @Field(() => Int, { nullable: false })
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

  @Field(() => [String], { nullable: false })
  abbreviation: string[];
}

@ObjectType()
export class BaseFlow extends BaseType {
  @Field(() => Int, { nullable: false })
  id: number;

  @Field(() => Int, { nullable: false })
  versionID: number;

  @Field({ nullable: false })
  amountUSD: string;

  @Field({ nullable: false })
  activeStatus: boolean;

  @Field({ nullable: false })
  restricted: boolean;

  @Field(() => String, { nullable: true })
  flowDate: string | null;

  @Field(() => String, { nullable: true })
  decisionDate: string | null;

  @Field(() => String, { nullable: true })
  firstReportedDate: string | null;

  @Field(() => String, { nullable: true })
  budgetYear: string | null;

  @Field(() => String, { nullable: true })
  exchangeRate: string | null;

  @Field(() => String, { nullable: true })
  origAmount: string | null;

  @Field(() => String, { nullable: true })
  origCurrency: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => String, { nullable: true })
  versionStartDate: string | null;

  @Field(() => String, { nullable: true })
  versionEndDate: string | null;

  @Field(() => Boolean, { nullable: true })
  newMoney: boolean | null;
}

@ObjectType()
export class Flow extends BaseFlow {
  @Field(() => [Category], { nullable: false })
  categories: Category[];

  // Organizations
  @Field(() => [Organization], { nullable: false })
  organizations: Organization[];

  @Field(() => [Organization], { nullable: false })
  sourceOrganizations: Organization[];

  @Field(() => [Organization], { nullable: false })
  destinationOrganizations: Organization[];

  // Plans
  @Field(() => [BasePlan], { nullable: false })
  plans: BasePlan[];

  @Field(() => [BasePlan], { nullable: false })
  sourcePlans: BasePlan[];

  @Field(() => [BasePlan], { nullable: false })
  destinationPlans: BasePlan[];

  // Locations
  @Field(() => [BaseLocation], { nullable: false })
  locations: BaseLocation[];

  @Field(() => [BaseLocation], { nullable: false })
  sourceLocations: BaseLocation[];

  @Field(() => [BaseLocation], { nullable: false })
  destinationLocations: BaseLocation[];

  // UsageYears
  @Field(() => [UsageYear], { nullable: false })
  usageYears: UsageYear[];

  @Field(() => [UsageYear], { nullable: false })
  sourceUsageYears: UsageYear[];

  @Field(() => [UsageYear], { nullable: false })
  destinationUsageYears: UsageYear[];

  // Nested fields
  @Field(() => [Int], { nullable: false })
  childIDs: number[];

  @Field(() => [Number], { nullable: false })
  parentIDs: number[];

  @Field(() => [FlowExternalReference], { nullable: false })
  externalReferences: FlowExternalReference[];

  @Field(() => [ReportDetail], { nullable: false })
  reportDetails: ReportDetail[];

  @Field(() => FlowParkedParentSource, { nullable: true })
  parkedParentSource: FlowParkedParentSource | null;
}

@ObjectType()
export class FlowSearchResult extends PageInfo<FlowSortField> {
  @Field(() => [Flow], { nullable: false })
  flows: Flow[];
}

@ObjectType()
export class FlowSearchResultNonPaginated {
  @Field(() => [Flow], { nullable: false })
  flows: Flow[];

  @Field(() => Number, { nullable: false })
  flowsCount: number;
}

export type FlowSortField =
  | 'flow.id'
  | 'flow.versionID'
  | 'flow.amountUSD'
  | 'flow.updatedAt'
  | 'flow.activeStatus'
  | 'flow.restricted'
  | 'flow.newMoney'
  | 'flow.flowDate'
  | 'flow.decisionDate'
  | 'flow.firstReportedDate'
  | 'flow.budgetYear'
  | 'flow.origAmount'
  | 'flow.origCurrency'
  | 'flow.exchangeRate'
  | 'flow.description'
  | 'flow.notes'
  | 'flow.versionStartDate'
  | 'flow.versionEndDate'
  | 'flow.createdAt'
  | 'flow.deletedAt';

export type FlowShortcutFilter = Array<{ [key: string]: any }> | null;
export type FlowStatusFilter = 'new' | 'updated' | undefined;
