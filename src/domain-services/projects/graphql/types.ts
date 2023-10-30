import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export default class Project {
  @Field()
  id: number;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;

  @Field()
  code: string;

  @Field()
  currentPublishedVersionId: number;

  @Field()
  creatorParticipantId: number;

  @Field()
  latestVersionId: number;

  @Field(() => String)
  implementationStatus: ImplementationStatus;

  @Field()
  pdf: string;

  @Field()
  sourceProjectId: number;

  @Field()
  name: string;

  @Field()
  version: number;

  @Field()
  projectVersionCode: string;

  @Field()
  visible: boolean;
}

export type ImplementationStatus =
  | 'Planning'
  | 'Implementing'
  | 'Ended - Completed'
  | 'Ended - Terminated'
  | 'Ended - Not started and abandoned'
  | null;
