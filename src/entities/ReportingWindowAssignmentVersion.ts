import { Field, ObjectType } from 'type-graphql';
import VersionModel from './common/VersionModel';
import ReportingWindowAssignment, { REPORTING_WINDOW_ASSIGNMENT_DATA } from './ReportingWindowAssignment';

@ObjectType()
export default class ReportingWindowAssignmentVersion extends VersionModel<REPORTING_WINDOW_ASSIGNMENT_DATA> {
    
    @Field(() => ReportingWindowAssignment, { nullable: true })
    rootInst?: ReportingWindowAssignment
}