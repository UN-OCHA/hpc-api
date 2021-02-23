import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

import VersionedModel from './common/VersionedModel';
import ReportingWindow from './ReportingWindow';
import ReportingWindowAssignmentVersion from './ReportingWindowAssignmentVersion';
import { Brand } from "../utils/branding";

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

@ObjectType()
export default class ReportingWindowAssignment extends VersionedModel<REPORTING_WINDOW_ASSIGNMENT_DATA> {

    @Field(() => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'reportingWindowAssignment ID'
    >;

    @Field({ description: 'The type of assignee for the reporting window assignment' })
    assigneeType: AssigneeType;

    @Field({ description: 'The ID of the assignee to which the assignment belongs to' })
    assigneeId: number;

    @Field({ description: 'assignee operation' })
    assigneeOperation: number;

    @Field({ description: 'ID of the reporting window the assignment belongs to' })
    reportingWindowId: number;

    @Field(() => ReportingWindow, { description: "reporting window to which the assignment belongs to" })
    reportingWindow: ReportingWindow;

    @Field(() => ReportingWindowAssignmentVersion, { description: 'Instance of the currently active version of the reporting window assignment' })
    versionModelInstance: ReportingWindowAssignmentVersion
}
