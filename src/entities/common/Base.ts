import { Field, ID } from 'type-graphql';

export default abstract class Base {
    @Field(_type => ID)
    id: number;
    createdAt: Date;
    updatedAt: Date;
}