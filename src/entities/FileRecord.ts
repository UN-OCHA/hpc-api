import { Field, ObjectType } from "type-graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export default class FileRecord {

    @Field({ description: "Namespace to which the file belongs to" })
    namespace: string;

    @Field({ description: "Hash of the file" })
    hash: string;

    @Field({ description: "type of the file", nullable: true })
    fileType: string;

    @Field(() => GraphQLJSONObject, { description: "metadata of the file", nullable: true })
    metadata: Record<string, any>;

    @Field({ description: "date at which the file was created at" })
    createdAt: Date;

    @Field({ description: "date at which the file was last updated at" })
    updatedAt: Date;
}
