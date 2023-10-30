import { Field, ObjectType } from 'type-graphql';
import { ItemPaged, PageInfo } from '../../../utils/graphql/pagination';

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
export default class Flow implements ItemPaged {
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

  @Field({ nullable: false })
  cursor: number;
}

@ObjectType()
export class FlowSearchResult extends PageInfo<FlowSortField> {
  @Field(() => [Flow], { nullable: false })
  flows: Flow[];
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
