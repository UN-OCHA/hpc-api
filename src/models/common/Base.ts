import { Field, ID } from 'type-graphql';
import {BaseEntity, BeforeInsert, BeforeUpdate, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { validateOrReject } from 'class-validator';

export default abstract class Base extends BaseEntity {
    @PrimaryGeneratedColumn()
    @Field(_type => ID)
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    private validateOnSave() {
        return validateOrReject(this);
    }
}