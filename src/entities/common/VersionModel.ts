import { Field } from "type-graphql";
import Participant from "../Participant";

export default abstract class VersionModel<Data> {

    @Field()
    root: number;

    @Field()
    modifiedBy: number;

    @Field(() => Participant)
    modifiedByParticipant: Participant;

    @Field()
    version: number;

    @Field()
    isLatest: boolean;

    data: Data;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}