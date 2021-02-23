import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

import VersionedModel from './common/VersionedModel';
import ReportingWindowAssignment from './ReportingWindowAssignment';
import ReportingWindowVersion from './ReportingWindowVersion';
import { Brand } from "../utils/branding";

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

@ObjectType()
export default class ReportingWindow extends VersionedModel<REPORTING_WINDOW_DATA> {

    @Field(() => ID)
    id: Brand<
        number,
        { readonly s: unique symbol },
        'reportingWindow ID'
    >;

    @Field({ description: 'The type of the entity to which the reporting window belongs to' })
    belongsToType: belongsToType;

    @Field({ nullable: true, description: 'The ID of the entity to which the window belongs to' })
    belongsToId: number;

    @Field(() => [ReportingWindowAssignment], {description: "assignments that belong to the reporting window"})
    assignments: ReportingWindowAssignment[]; 

    @Field(() => ReportingWindowVersion, { description: 'Instance of the currently active version of the reporting window' })
    versionModelInstance: ReportingWindowVersion;
}
