import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import { Column, Entity, getRepository, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import VersionedModel from './common/VersionedModel';
import ReportingWindow from './ReportingWindow';
import ReportingWindowAssignmentVersion from './ReportingWindowAssignmentVersion';
import { Brand } from './utils/branding';

export enum AssigneeType {
    operation = 'operation',
    operationCluster = 'operationCluster'
}

registerEnumType(AssigneeType, {
    name: 'AssigneeType',
    description: 'Assignee Types',
});

export type REPORTING_WINDOW_ASSIGNMENT_STATE = null | {
    type: 'raw' | 'clean',
    finalized: boolean;
    data: string;
    files?: { name: string; data: {
        fileHash: string;
    }}[]
}

export interface REPORTING_WINDOW_ASSIGNMENT_DATA {
    reportingWindowId: number;
    assignee: {
        type: AssigneeType.operation,
        operation: number;
    } | {
        type: AssigneeType.operationCluster,
        cluster: number;
    };
    task: {
        type: 'form',
        form: number;
        formName: string;
        formVersion: number;
        state: REPORTING_WINDOW_ASSIGNMENT_STATE
    };
}


@Entity({ name: 'reportingWindowAssignment' })
@ObjectType()
export default class ReportingWindowAssignment extends VersionedModel<REPORTING_WINDOW_ASSIGNMENT_DATA> {

    @PrimaryGeneratedColumn("increment")
    @Field(_type => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'reportingWindowAssignment ID'
    >;

    @OneToMany(() => ReportingWindowAssignmentVersion, reportingWindowVersion => reportingWindowVersion.rootModel )
    versions: ReportingWindowAssignmentVersion[]

    @Field({ description: 'The type of assignee for the reporting window assignment' })
    @Column({ enum: AssigneeType, enumName: 'enum_reportingWindowAssignment_assigneeType', type: 'enum' })
    assigneeType: AssigneeType;

    @Column()
    @Field({ description: 'The ID of the assignee to which the assignment belongs to' })
    assigneeId: number;

    @Column()
    @Field({ description: 'assignee operation' })
    assigneeOperation: number;

    @Column()
    reportingWindowId: number;

    @Field(_type => ReportingWindow, { description: "reporting window to which the assignment belongs to" })
    @ManyToOne(() => ReportingWindow, reportingWindow => reportingWindow.assignments )
    @JoinColumn({ name: 'reportingWindowId' })
    reportingWindow: ReportingWindow;

    getName() {
        return ReportingWindowAssignment.getRepository().metadata.tableName;
    }

    async prepareForSave(data: REPORTING_WINDOW_ASSIGNMENT_DATA) {

        let assigneeOperation: number;
        let assigneeId: number;
        if (data.assignee.type === 'operation') {
          assigneeOperation = data.assignee.operation;
          assigneeId = data.assignee.operation;
        } else if (data.assignee.type === 'operationCluster') {
          // to be replaced with logic for operation cluster
          throw new Error('Unsupported assignee type');
        } else {
          throw new Error('Unknown assignee type');
        }

        this.reportingWindowId = data.reportingWindowId;
        this.assigneeOperation = assigneeOperation;
        this.assigneeType = data.assignee.type;
        this.assigneeId = assigneeId;
    }

    getVersionModelRepo() {
        return getRepository(ReportingWindowAssignmentVersion);
    }

    getVersionedModelRepo() {
        return getRepository(ReportingWindowAssignment);
    }
}
