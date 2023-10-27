import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class FlowCategory {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: false })
  group: string;
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
export default class Flow {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: false })
  amountUSD: string;

  @Field({ nullable: false })
  createdAt: Date;

  @Field(() => [FlowCategory], { nullable: false })
  categories: FlowCategory[];

  @Field(() => [FlowOrganization], { nullable: false })
  organizations: FlowOrganization[];

  @Field(() => [FlowLocation], { nullable: false })
  locations: FlowLocation[];

  @Field(() => [FlowPlan], { nullable: false })
  plans: FlowPlan[];

  @Field(() => [FlowUsageYear], { nullable: false })
  usageYears: FlowUsageYear[];
}

@ObjectType()
export class FlowEdge {
  @Field({ nullable: false })
  node: Flow;

  @Field({ nullable: false })
  cursor: string;
}

@ObjectType()
export class PageInfo {
  @Field({ nullable: false })
  hasNextPage: boolean;

  @Field({ nullable: false })
  hasPreviousPage: boolean;

  @Field({ nullable: false })
  startCursor: string;

  @Field({ nullable: false })
  endCursor: string;

  @Field({ nullable: false })
  pageSize: number;

  @Field({ nullable: false })
  sortField:
    | 'id'
    | 'amountUSD'
    | 'versionID'
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
    | 'updatedAt'
    | 'deletedAt';

  @Field({ nullable: false })
  sortOrder: string;
}
@ObjectType()
export class FlowSearchResult {
  @Field(() => [FlowEdge], { nullable: false })
  edges: FlowEdge[];

  @Field(() => PageInfo, { nullable: false })
  pageInfo: PageInfo;

  @Field({ nullable: false })
  totalCount: number;
}

export type FlowSortField =
  | 'id'
  | 'amountUSD'
  | 'versionID'
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
  | 'updatedAt'
  | 'deletedAt';
