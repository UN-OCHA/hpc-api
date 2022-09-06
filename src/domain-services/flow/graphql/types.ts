import { Brand } from '@unocha/hpc-api-core/src/util/types';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseTypeWithSoftDelete } from '../../base-types';
import FlowObject from '../../flow-object/graphql/types';

@ObjectType()
export class FlowObjectsGroupedByType {
  @Field(() => [FlowObject])
  location: FlowObject[];
}

@ObjectType()
export class FlowObjectsGroupedByRefDirection {
  @Field()
  source: FlowObjectsGroupedByType;

  @Field()
  destination: FlowObjectsGroupedByType;
}

@ObjectType()
export class Flow extends BaseTypeWithSoftDelete {
  @Field(() => ID)
  id: Brand<number, { readonly s: unique symbol }, 'Flow ID'>;

  @Field(() => ID)
  versionID: number;

  @Field()
  amountUSD: number;

  @Field({ nullable: true })
  flowDate: Date;

  @Field({ nullable: true })
  decisionDate: Date;

  @Field({ nullable: true })
  firstReportedDate: Date;

  @Field({ nullable: true })
  budgetYear: number;

  @Field({ nullable: true })
  origAmount: number;

  @Field({ nullable: true })
  origCurrency: string;

  @Field({ nullable: true })
  exchangeRate: number;

  @Field()
  activeStatus: boolean;

  @Field()
  newMoney: boolean;

  @Field()
  restricted: boolean;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  notes: string;

  @Field({ nullable: true })
  versionStartDate: Date;

  @Field({ nullable: true })
  versionEndDate: Date;

  @Field({ nullable: true })
  createdBy: string;

  @Field({ nullable: true })
  lastUpdatedBy: string;

  @Field()
  flowObjects: FlowObjectsGroupedByRefDirection;
}
