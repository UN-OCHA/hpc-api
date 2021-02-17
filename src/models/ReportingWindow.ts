import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import { Column, Entity, getRepository, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import VersionedModel from './common/VersionedModel';
import ReportingWindowAssignment from './ReportingWindowAssignment';
import ReportingWindowVersion from './ReportingWindowVersion';
import { Brand } from './utils/branding';

export enum belongsToType {
    global = 'global',
    operation = 'operation',
    operationCluster = 'operationCluster',
    plan = 'plan',
    governingEntity = 'governingEntity',
}

registerEnumType(belongsToType, {
    name: 'belongsToType',
    description: 'Belongs To Types',
});

export enum REPORTING_WINDOW_STATE {
    pending = 'pending',
    open = 'open',
    closed = 'closed'
}

export interface REPORTING_WINDOW_DATA {
    name: string;
    belongsTo: {
        type: belongsToType.global
    } | {
        type: belongsToType.operation,
        operation: number;
    },
    state: REPORTING_WINDOW_STATE
}


@Entity({ name: 'reportingWindow' })
@ObjectType()
export default class ReportingWindow extends VersionedModel<REPORTING_WINDOW_DATA> {

    @PrimaryGeneratedColumn("increment")
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'reportingWindow ID'
    >;

    @OneToMany(() => ReportingWindowVersion, reportingWindowVersion => reportingWindowVersion.rootModel )
    versions: ReportingWindowVersion[];

    @Field({ description: 'The type of the entity to which the reporting window belongs to' })
    @Column({ enum: belongsToType, enumName: 'enum_reportingWindow_belongsToType', type: 'enum' })
    belongsToType: belongsToType;

    @Column({ nullable: true })
    @Field({ nullable: true, description: 'The ID of the entity to which the window belongs to' })
    belongsToId: number;

    @OneToMany(() => ReportingWindowAssignment, reportingWindowAssignment => reportingWindowAssignment.reportingWindow )
    @Field(_type => [ReportingWindowAssignment], {description: "assignments that belong to the reporting window"})
    assignments: ReportingWindowAssignment[]; 

    getName() {
        return ReportingWindow.getRepository().metadata.tableName;
    }

    async prepareForSave(data: REPORTING_WINDOW_DATA) {
        this.belongsToId = data.belongsTo.type === 'operation'
        ? data.belongsTo.operation : undefined;
        this.belongsToType = data.belongsTo.type;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    getVersionModelRepo() {
        return getRepository(ReportingWindowVersion);
    }

    getVersionedModelRepo() {
        return getRepository(ReportingWindow);
    }
}
