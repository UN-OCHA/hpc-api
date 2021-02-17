import { Field, ObjectType } from "type-graphql";
import { GraphQLJSONObject } from 'graphql-type-json';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { FileStorageNamespace } from "../types/FileStorageNamespace";

@ObjectType()
@Entity({ name: "fileRecord" })
@Index(['namespace', 'hash'], { unique: true })
export default class FileRecord extends BaseEntity {

    @Field({ description: "Namespace to which the file belongs to" })
    @PrimaryColumn({ length: 255, nullable: false })
    namespace: string;

    @Field({ description: "Hash of the file" })
    @PrimaryColumn({ length: 255, nullable: false })
    hash: string;

    @Field({ description: "type of the file", nullable: true })
    @Column({ nullable: true })
    fileType: string;

    @Field(() => GraphQLJSONObject, { description: "metadata of the file", nullable: true })
    @Column({ nullable: true, type: 'jsonb' })
    metadata: Record<string, any>;

    @Field({ description: "date at which the file was created at" })
    @CreateDateColumn()
    createdAt: Date;

    @Field({ description: "date at which the file was last updated at" })
    @UpdateDateColumn()
    updatedAt: Date;

    static listFilesInNamespace(namespace: FileStorageNamespace) {
        return FileRecord.find({
            where: {
                namespace: JSON.stringify(namespace)
            }
        });
    }
}
