import { Field, ObjectType } from 'type-graphql';
import { ItemPaged, PageInfo } from '../../../utils/graphql/pagination';

@ObjectType()
export class FlowCategoryRef {
  @Field({ nullable: false })
  objectID: number;

  @Field({ nullable: false })
  versionID: number;

  @Field({ nullable: false })
  objectType: string;

  @Field({ nullable: false })
  categoryID: number;

  @Field({ nullable: false })
  createdAt: string;

  @Field({ nullable: false })
  updatedAt: string;
}

@ObjectType()
export class FlowCategory {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  group: string;

  @Field({ nullable: true })
  createdAt: string;

  @Field({ nullable: true })
  updatedAt: string;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  parentID: number;

  @Field({ nullable: true })
  code: string;

  @Field({ nullable: true })
  includeTotals: boolean;

  @Field(() => FlowCategoryRef, { nullable: true })
  categoryRef: FlowCategoryRef;
}

@ObjectType()
export class FlowOrganization {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  refDirection: string;

  @Field({ nullable: false })
  name: string;
}

@ObjectType()
export class FlowLocation {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  name: string;
}

@ObjectType()
export class FlowPlan {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  name: string;
}

@ObjectType()
export class FlowUsageYear {
  @Field({ nullable: false })
  year: string;

  @Field({ nullable: false })
  direction: string;
}

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
export class FlowReportDetail {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  flowID: number;

  @Field({ nullable: false })
  versionID: number;

  @Field({ nullable: false })
  contactInfo: string;

  @Field({ nullable: false })
  source: string;

  @Field({ nullable: false })
  date: string;

  @Field({ nullable: false })
  sourceID: string;

  @Field({ nullable: false })
  refCode: string;

  @Field({ nullable: false })
  verified: boolean;

  @Field({ nullable: false })
  createdAt: string;

  @Field({ nullable: false })
  updatedAt: string;

  @Field({ nullable: false })
  organizationID: number;
}

@ObjectType()
export default class Flow extends ItemPaged {
  // Mandatory fields
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  versionID: number;

  @Field({ nullable: false })
  amountUSD: string;

  @Field({ nullable: false })
  updatedAt: string;

  @Field({ nullable: false })
  activeStatus: boolean;

  @Field({ nullable: false })
  restricted: boolean;

  // Optional fields
  @Field(() => [FlowCategory], { nullable: true })
  categories: FlowCategory[];

  @Field(() => [FlowOrganization], { nullable: true })
  organizations: FlowOrganization[];

  @Field(() => [FlowPlan], { nullable: true })
  plans: FlowPlan[];

  @Field(() => [FlowLocation], { nullable: true })
  locations: FlowLocation[];

  @Field(() => [FlowUsageYear], { nullable: true })
  usageYears: FlowUsageYear[];

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

  @Field(() => [FlowReportDetail], { nullable: true })
  reportDetails: FlowReportDetail[];

  // Missing fields & new Types
  @Field({ nullable: true })
  parkedParentSource: string;
}

@ObjectType()
export class FlowSearchResult extends PageInfo<FlowSortField> {
  @Field(() => [Flow], { nullable: false })
  flows: Flow[];
}

export type FlowSortField =
  | 'id'
  | 'versionID'
  | 'amountUSD'
  | 'updatedAt'
  | 'activeStatus'
  | 'restricted'
  //
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
